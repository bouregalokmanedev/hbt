import { Engine, type EngineContext } from "@sim/core";
import {
  SCH_COMPONENTS, SCH_WIRES, SCH_TRACES, SCH_TASKS, SCH_EXAM, SCH_LAYERS, SCH_DEFAULT_LAYERS,
  schByKey, wiresFor, traceById, type SchComponent, type SchWire, type SchTrace,
} from "@/data/schematic/workspace";

/**
 * SchematicWorkspaceEngine — framework-free reconstruction of the authentic
 * Schematic tool (P6.1). Zero React/Next/DOM imports. Single-sheet R16 wiring
 * workspace over the E1-hub netlist (57 components / 133 rows / 111 ECU pins):
 * Study / Trace / Training / Practice / Exam mode states, an authored guided-trace
 * state machine, deterministic training + practice + exam logic, layer visibility,
 * search/filter/selection domain state, and SessionResult emission on completion.
 *
 * Learner prose stays out of the engine — feedback/verdict are emitted as flags /
 * content ids resolved by the UI (EN/AR/FR). Everything here is Class-B canonical.
 */

export type WorkspaceMode = "study" | "trace" | "training" | "practice" | "exam";
export type WorkspaceView = "schematic" | "circuit";

export interface SearchHit { kind: string; key: string; wireIdx: number | null }
export interface PracticeQuestion { targetKey: string; targetPin: string; options: string[]; answer: string }

export interface WorkspaceState {
  mode: WorkspaceMode;
  view: WorkspaceView;
  sel: string | null;
  selWire: number | null;
  hover: string | null;
  filter: string;
  query: string;
  layers: Record<string, boolean>;
  recent: string[];
  // trace
  trace: string;
  traceStep: number;
  tracePlaying: boolean;
  traceDone: boolean;
  // shared training/practice accuracy (source parity: scorePct = round(100*taskCorrect/max(1,attempts)))
  attempts: number;
  taskCorrect: number;
  // training
  taskIdx: number;
  taskDone: number;
  feedback: { ok: boolean } | null;
  revealed: boolean;
  // practice
  practiceAnswered: number;
  practiceCorrect: number;
  // exam
  examIdx: number;
  examAnswers: Record<number, string>;
  examSubmitted: boolean;
  // overlays (domain flags for the future UI)
  showSearch: boolean;
  showLayers: boolean;
  showConnector: string | null;
  showVehicle: boolean;
  drawer: boolean;
  finished: boolean;
}

const NA_LAYERS = new Set(["lin", "flexray", "wirenum", "circuit"]);
const RUN = SCH_TASKS.length; // 8 — items per training/practice run (source progress denominator)

export class SchematicWorkspaceEngine extends Engine<WorkspaceState> {
  private state: WorkspaceState;

  constructor(ctx: EngineContext) {
    super();
    // Deep-link: focus INJ/COIL auto-enters the matching guided trace (source componentDidUpdate).
    const focusTrace = ctx.focus === "INJ" ? "inj" : ctx.focus === "COIL" ? "ign" : null;
    this.state = {
      mode: focusTrace ? "trace" : "study",
      view: "schematic",
      sel: null,
      selWire: null,
      hover: null,
      filter: "",
      query: "",
      layers: { ...SCH_DEFAULT_LAYERS },
      recent: [],
      trace: focusTrace ?? SCH_TRACES[0].id,
      traceStep: 0,
      tracePlaying: !!focusTrace,
      traceDone: false,
      attempts: 0,
      taskCorrect: 0,
      taskIdx: 0,
      taskDone: 0,
      feedback: null,
      revealed: false,
      practiceAnswered: 0,
      practiceCorrect: 0,
      examIdx: 0,
      examAnswers: {},
      examSubmitted: false,
      showSearch: false,
      showLayers: false,
      showConnector: null,
      showVehicle: false,
      drawer: false,
      finished: false,
    };
  }

  getState() {
    return this.state;
  }
  private set(patch: Partial<WorkspaceState>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  // ---- registries ----
  components(): SchComponent[] {
    return SCH_COMPONENTS;
  }
  wires(): SchWire[] {
    return SCH_WIRES;
  }
  component(key: string | null): SchComponent | undefined {
    return key ? schByKey(key) : undefined;
  }
  traces(): SchTrace[] {
    return SCH_TRACES;
  }
  trace(): SchTrace {
    return traceById(this.state.trace) ?? SCH_TRACES[0];
  }

  /** Source accuracy readout (shared training + practice + exam attempts). */
  accuracyPct(): number {
    return this.state.attempts ? Math.round((100 * this.state.taskCorrect) / Math.max(1, this.state.attempts)) : 0;
  }

  // ---- mode / view ----
  setMode(mode: WorkspaceMode) {
    this.set({ mode, sel: null, selWire: null, feedback: null, revealed: false, tracePlaying: mode === "trace" });
    if (mode === "trace") this.set({ traceStep: 0, traceDone: false });
  }
  setView(view: WorkspaceView) {
    this.set({ view });
  }

  // ---- selection / browse ----
  private recordRecent(key: string) {
    return [key, ...this.state.recent.filter((k) => k !== key)].slice(0, 6);
  }
  /** Canvas pick — dispatches to the active mode (source `pick`). */
  select(key: string) {
    if (!schByKey(key)) return;
    if (this.state.mode === "training" && !this.state.revealed) return this.answerTraining(key);
    if (this.state.mode === "exam") return this.answerExam(key);
    this.set({ sel: key, selWire: null, recent: this.recordRecent(key) });
  }
  selectWire(idx: number) {
    if (idx < 0 || idx >= SCH_WIRES.length) return;
    // toggle off if re-selected (source behaviour)
    this.set({ selWire: this.state.selWire === idx ? null : idx });
  }
  clearSelection() {
    this.set({ sel: null, selWire: null });
  }
  setHover(key: string | null) {
    this.set({ hover: key });
  }
  /** Pin-table rows for the current selection (E1 → all 133). */
  selectedWires(): { wire: SchWire; idx: number }[] {
    if (!this.state.sel) return [];
    if (this.state.sel === "E1") return SCH_WIRES.map((wire, idx) => ({ wire, idx }));
    return SCH_WIRES.map((wire, idx) => ({ wire, idx })).filter(({ wire }) => wire.target === this.state.sel);
  }
  inspectWire(idx: number): (SchWire & { targetLabel: string }) | null {
    const w = SCH_WIRES[idx];
    return w ? { ...w, targetLabel: schByKey(w.target)?.name ?? w.target } : null;
  }

  // ---- filter / search ----
  setFilter(filter: string) {
    this.set({ filter });
  }
  filteredComponents(): SchComponent[] {
    const f = this.state.filter.trim().toLowerCase();
    return f ? SCH_COMPONENTS.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(f)) : SCH_COMPONENTS;
  }
  setQuery(query: string) {
    this.set({ query });
  }
  /** Search the pin table only (components + wires), ≤40 hits — Class-B refs, no prose. */
  search(): SearchHit[] {
    const q = this.state.query.trim().toLowerCase();
    if (!q) return [];
    const out: SearchHit[] = [];
    for (const c of SCH_COMPONENTS) if (`${c.code} ${c.name}`.toLowerCase().includes(q)) out.push({ kind: "component", key: c.key, wireIdx: null });
    SCH_WIRES.forEach((w, i) => {
      const t = schByKey(w.target);
      const hay = `${w.ecuPin} ${w.ecuColour} ${t ? t.code + " " + t.name : w.target} pin ${w.targetPin}`.toLowerCase();
      if (hay.includes(q)) out.push({ kind: "wire", key: w.target, wireIdx: i });
    });
    return out.slice(0, 40);
  }

  // ---- layers ----
  toggleLayer(key: string) {
    if (NA_LAYERS.has(key)) return; // no-data layers are inert (source)
    this.set({ layers: { ...this.state.layers, [key]: !this.state.layers[key] } });
  }
  layerOn(key: string): boolean {
    return !NA_LAYERS.has(key) && !!this.state.layers[key];
  }
  layersOnCount(): number {
    return SCH_LAYERS.filter((l) => !l.na && this.state.layers[l.key]).length;
  }

  // ---- trace state machine (authored steps; NOT graph traversal) ----
  setTrace(id: string) {
    if (!traceById(id)) return;
    this.set({ trace: id, traceStep: 0, tracePlaying: true, traceDone: false, mode: "trace" });
  }
  tracePlay() {
    this.set({ tracePlaying: true });
  }
  tracePause() {
    this.set({ tracePlaying: false });
  }
  traceReset() {
    this.set({ traceStep: 0, traceDone: false });
  }
  /** The component key expected at the current trace step (E1 steps ride the y=1135 rail). */
  traceExpected(): string {
    const t = this.trace();
    return t.steps[this.state.traceStep]?.cmp ?? t.steps[t.steps.length - 1].cmp;
  }
  /** Auto/step advance. Marks done when the last step is passed. */
  traceAdvance() {
    const t = this.trace();
    const next = this.state.traceStep + 1;
    if (next >= t.steps.length) this.set({ traceStep: t.steps.length - 1, traceDone: true, tracePlaying: false });
    else this.set({ traceStep: next });
  }
  /** Interactive guided trace: correct pick advances, wrong pick flags feedback. */
  answerTrace(key: string) {
    if (this.state.mode !== "trace") return;
    if (key === this.traceExpected()) {
      this.set({ sel: key, feedback: { ok: true } });
      this.traceAdvance();
    } else {
      this.set({ feedback: { ok: false } });
    }
  }
  traceProgress(): number {
    const t = this.trace();
    return Math.round(((this.state.traceStep + (this.state.traceDone ? 1 : 0)) / t.steps.length) * 100);
  }

  // ---- training (fixed 8 tasks; accuracy scoring; unlimited retries) ----
  private task() {
    return SCH_TASKS[this.state.taskIdx % SCH_TASKS.length];
  }
  trainingTarget(): string {
    return this.task().answer;
  }
  answerTraining(key: string) {
    const t = this.task();
    const ok = key === t.answer;
    this.set({
      sel: key,
      attempts: this.state.attempts + 1,
      taskCorrect: this.state.taskCorrect + (ok ? 1 : 0),
      taskDone: this.state.taskDone + (ok ? 1 : 0),
      feedback: { ok },
    });
    if (ok && this.state.taskDone >= RUN) this.finish("training");
  }
  nextTask() {
    this.set({ taskIdx: (this.state.taskIdx + 1) % SCH_TASKS.length, feedback: null, revealed: false, sel: null });
  }
  reveal() {
    const t = this.state.mode === "training" ? this.task() : this.state.mode === "exam" ? SCH_EXAM[this.state.examIdx] : null;
    if (!t) return;
    this.set({ revealed: true, sel: t.answer, feedback: { ok: true } });
  }

  // ---- practice (deterministic pin-table MCQ derived from taskIdx) ----
  practiceQuestion(): PracticeQuestion {
    const len = SCH_WIRES.length;
    const pIdx = this.state.taskIdx % len;
    const pw = SCH_WIRES[(pIdx * 7) % len];
    const wrong = [SCH_WIRES[(pIdx * 13 + 3) % len].ecuPin, SCH_WIRES[(pIdx * 29 + 11) % len].ecuPin, SCH_WIRES[(pIdx * 41 + 7) % len].ecuPin].filter((x) => x !== pw.ecuPin);
    const options = [pw.ecuPin, ...wrong].slice(0, 4).sort();
    return { targetKey: pw.target, targetPin: pw.targetPin, options, answer: pw.ecuPin };
  }
  answerPractice(pin: string) {
    const q = this.practiceQuestion();
    const ok = pin === q.answer;
    this.set({
      attempts: this.state.attempts + 1,
      taskCorrect: this.state.taskCorrect + (ok ? 1 : 0),
      practiceAnswered: this.state.practiceAnswered + 1,
      practiceCorrect: this.state.practiceCorrect + (ok ? 1 : 0),
      feedback: { ok },
    });
    if (this.state.practiceAnswered >= RUN) this.finish("practice");
  }

  // ---- exam (6 fixed questions; masked labels; submit → score) ----
  examQuestion() {
    return SCH_EXAM[this.state.examIdx];
  }
  answerExam(key: string) {
    if (this.state.examSubmitted) return;
    this.set({
      examAnswers: { ...this.state.examAnswers, [this.state.examIdx]: key },
      attempts: this.state.attempts + 1,
      sel: key,
    });
  }
  nextExam() {
    if (this.state.examIdx < SCH_EXAM.length - 1) this.set({ examIdx: this.state.examIdx + 1, sel: null });
  }
  examCorrect(): number {
    return SCH_EXAM.filter((q, i) => this.state.examAnswers[i] === q.answer).length;
  }
  submitExam() {
    if (this.state.examSubmitted) return;
    this.set({ examSubmitted: true });
    this.finish("exam");
  }
  restartExam() {
    this.set({ examIdx: 0, examAnswers: {}, examSubmitted: false, sel: null, finished: false });
  }

  // ---- overlay flags (domain state consumed by the future UI) ----
  openSearch() {
    this.set({ showSearch: true });
  }
  closeSearch() {
    this.set({ showSearch: false, query: "" });
  }
  toggleLayersPanel() {
    this.set({ showLayers: !this.state.showLayers });
  }
  openConnector(code: string) {
    this.set({ showConnector: code });
  }
  closeConnector() {
    this.set({ showConnector: null });
  }
  openVehicle() {
    this.set({ showVehicle: true });
  }
  closeVehicle() {
    this.set({ showVehicle: false });
  }
  toggleDrawer() {
    this.set({ drawer: !this.state.drawer });
  }

  // ---- completion → SessionResult ----
  private finish(which: "training" | "practice" | "exam") {
    let score: number;
    let steps: { label: string; ok: boolean }[];
    if (which === "training") {
      score = this.accuracyPct();
      steps = SCH_TASKS.map((t) => ({ label: schByKey(t.answer)!.code, ok: true }));
    } else if (which === "practice") {
      score = Math.round((100 * this.state.practiceCorrect) / RUN);
      steps = Array.from({ length: RUN }, (_, i) => ({ label: `Q${i + 1}`, ok: i < this.state.practiceCorrect }));
    } else {
      const correct = this.examCorrect();
      score = Math.round((100 * correct) / SCH_EXAM.length);
      steps = SCH_EXAM.map((q, i) => ({ label: schByKey(q.answer)!.code, ok: this.state.examAnswers[i] === q.answer }));
    }
    const outcome: "pass" | "fault" = score >= 60 ? "pass" : "fault";
    this.set({ finished: true });
    this.complete({
      tool: "schematic",
      scenarioId: `schematic-${which}`,
      score,
      outcome,
      verdict: `content:schematic.verdict.${which}.${outcome === "pass" ? "pass" : "retry"}`,
      steps,
      at: 0,
    });
  }
}
