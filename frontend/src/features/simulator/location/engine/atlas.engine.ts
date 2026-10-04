import { Engine } from "@/features/simulator/scanner/engine/scanner.engine";
import { LOC_COMPONENTS, LOC_SYSTEM_GROUPS, LOC_CATEGORIES, locByKey, locByGroup, groupByKey, type LocComponent, type LocView, type SystemGroup } from "../data/location.data";

export interface AtlasEngineContext { vehicleId: string; focus?: string | null; seed?: number; settings?: { difficulty?: "Easy" | "Medium" | "Hard" }; components?: LocComponent[]; }

/**
 * LocationAtlasEngine — framework-free reconstruction of the authentic Location
 * tool (P5.1). Zero React/Next/DOM imports. Component-location atlas over a single
 * vehicle: browse (filter/search/favourite/select/view), deterministic Training
 * (target + difficulty + hints + scoring), and Quiz (timed, first-try scoring),
 * emitting SessionResult on completion.
 *
 * Learner prose stays out of the engine — verdict is emitted as a content id.
 */

export type AtlasMode = "browse" | "train" | "quiz";
export type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";

export interface AtlasState {
  mode: AtlasMode;
  view: LocView;
  selected: string | null;
  cat: string;
  sys: string | null;
  search: string;
  favs: string[];
  recent: string[];
  zoom: number;
  outlines: boolean;
  dimOthers: boolean;
  // training
  difficulty: Difficulty;
  tTarget: string | null;
  tScore: number;
  tAttempts: number;
  tHints: number;
  tVerdict: "ok" | "no" | null;
  tReveal: boolean;
  tLog: { ok: boolean; ref: string }[];
  tDone: number;
  // quiz
  qList: string[];
  qIdx: number;
  qScore: number;
  qTries: number;
  qElapsed: number;
  qDone: boolean;
  finished: boolean;
}

const HINT_MAX = 3;
export const TASK_SET = 8; // tasks per training/quiz run

export class LocationAtlasEngine extends Engine<AtlasState> {
  private state: AtlasState;
  private order: string[]; // deterministic task order
  private locComponents: LocComponent[];

  constructor(private ctx: AtlasEngineContext) {
    super();
    this.locComponents = ctx.components ?? LOC_COMPONENTS;
    this.order = this.locComponents.map((c) => c.key);
    const focus = ctx.focus && this.locByKey(ctx.focus) ? ctx.focus : this.locComponents[0].key;
    this.state = {
      mode: "browse",
      view: locByKey(focus)!.view,
      selected: focus,
      cat: "all",
      sys: null,
      search: "",
      favs: ["R7", "L3"],
      recent: [focus],
      zoom: 1,
      outlines: true,
      dimOthers: true,
      difficulty: this.diffFor((ctx.settings?.difficulty as "Easy" | "Medium" | "Hard" | undefined) ?? "Medium"),
      tTarget: null,
      tScore: 0,
      tAttempts: 0,
      tHints: 0,
      tVerdict: null,
      tReveal: false,
      tLog: [],
      tDone: 0,
      qList: [],
      qIdx: 0,
      qScore: 0,
      qTries: 0,
      qElapsed: 0,
      qDone: false,
      finished: false,
    };
  }

  private diffFor(d: "Easy" | "Medium" | "Hard"): Difficulty {
    return d === "Easy" ? "Easy" : d === "Hard" ? "Hard" : "Medium";
  }
  getState() {
    return this.state;
  }

  private locByKey(key: string): LocComponent | undefined {
    return this.locComponents.find((c) => c.key === key) ?? locByKey(key);
  }

  private locByGroup(sys: string): LocComponent[] {
    // Filter overridden components that belong to the system group
    const base = locByGroup(sys);
    const overrideKeys = new Set(this.locComponents.map((c) => c.key));
    // If override has components for this system, use them; otherwise use base
    const overridden = this.locComponents.filter((c) => (c.systems ?? []).includes(sys) || base.some((b) => b.key === c.key));
    return overridden.length ? overridden : base;
  }

  componentsList(): LocComponent[] {
    return this.locComponents;
  }

  private set(patch: Partial<AtlasState>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  // ---- registries ----
  components(): LocComponent[] {
    return this.locComponents;
  }
  /** The authentic 58 presented system groups (fuse-gated buckets of raw circuits). */
  systems(): SystemGroup[] {
    return LOC_SYSTEM_GROUPS;
  }
  /** The currently-selected system group (by key), or null. */
  system(): SystemGroup | undefined {
    return this.state.sys ? groupByKey(this.state.sys) : undefined;
  }
  categories() {
    return LOC_CATEGORIES;
  }
  component(key: string | null): LocComponent | undefined {
    return key ? this.locByKey(key) : undefined;
  }

  /**
   * Filtered component list = category ∩ system ∩ search (ref/name/oem/circuit).
   * When a system group is selected, the list narrows to that group's members
   * (fuses + relays + control units), matching the source's system membership.
   */
  filtered(): LocComponent[] {
    const { cat, sys, search } = this.state;
    const q = search.trim().toLowerCase();
    const base = sys ? this.locByGroup(sys) : this.locComponents;
    return base.filter((c) => {
      if (!sys && cat !== "all" && cat !== "systems" && c.cat !== cat) return false;
      if (q && !(`${c.ref} ${c.name} ${c.oem ?? ""} ${(c.systems ?? []).join(" ")}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }

  // ---- browse ----
  setMode(mode: AtlasMode) {
    this.set({ mode, tVerdict: null, finished: false });
    if (mode === "train") this.startTraining();
    if (mode === "quiz") this.startQuiz();
  }
  setView(view: LocView) {
    this.set({ view });
  }
  setDifficulty(difficulty: Difficulty) {
    this.set({ difficulty });
  }
  setCategory(cat: string) {
    // "Vehicle systems" category → the Systems trace view (authentic behaviour).
    if (cat === "systems") {
      const first = LOC_SYSTEM_GROUPS[0]?.key ?? null;
      this.set({ cat: "systems", sys: this.state.sys ?? first, view: "system", selected: null, zoom: 1, search: "" });
      return;
    }
    this.set({ cat, sys: null });
  }
  /** Select a presented system group (by key) → Systems trace view. */
  setSystem(sys: string | null) {
    this.set({ sys, cat: "systems", view: "system", selected: null, zoom: 1, search: "" });
  }
  setSearch(search: string) {
    this.set({ search });
  }
  setZoom(zoom: number) {
    this.set({ zoom: Math.max(0.5, Math.min(3, zoom)) });
  }
  toggleOutlines() {
    this.set({ outlines: !this.state.outlines });
  }
  toggleDimOthers() {
    this.set({ dimOthers: !this.state.dimOthers });
  }
  toggleFavourite(key: string) {
    const favs = this.state.favs.includes(key) ? this.state.favs.filter((k) => k !== key) : [...this.state.favs, key];
    this.set({ favs });
  }

  /** Browse select — or answer, in a task mode. Records recent (last 4). */
  select(key: string) {
    const it = this.locByKey(key);
    if (!it) return;
    if (this.state.mode === "train" && this.state.tTarget) return this.answerTraining(key);
    if (this.state.mode === "quiz" && !this.state.qDone) return this.answerQuiz(key);
    this.set({ selected: key, view: it.view, zoom: 1, recent: [key, ...this.state.recent.filter((k) => k !== key)].slice(0, 4) });
  }

  /** "Practise this" — jump into Training targeting the given component. */
  practise(key: string) {
    if (!this.locByKey(key)) return;
    this.set({ mode: "train", tScore: 0, tAttempts: 0, tHints: 0, tVerdict: null, tReveal: false, tLog: [], tDone: 0, finished: false, tTarget: key, view: this.locByKey(key)!.view });
  }

  // ---- training (authentic scoring: pts = max(2, 10 - hints*2)) ----
  private startTraining() {
    this.set({ tTarget: this.order[0], tScore: 0, tAttempts: 0, tHints: 0, tVerdict: null, tReveal: false, tLog: [], tDone: 0, finished: false });
  }
  private nextTrainingTask() {
    const done = this.state.tDone + 1;
    if (done >= TASK_SET) {
      this.finish("training");
      return;
    }
    this.set({ tDone: done, tTarget: this.order[done % this.order.length], tHints: 0, tReveal: false, tVerdict: null });
  }
  answerTraining(key: string) {
    const target = this.state.tTarget;
    if (!target) return;
    const it = this.locByKey(target)!;
    if (key === target) {
      const pts = Math.max(2, 10 - this.state.tHints * 2);
      this.set({ tScore: this.state.tScore + pts, tVerdict: "ok", tReveal: true, selected: key, tLog: [{ ok: true, ref: it.ref }, ...this.state.tLog].slice(0, 12) });
      this.nextTrainingTask();
    } else {
      const w = this.locByKey(key);
      this.set({ tAttempts: this.state.tAttempts + 1, tVerdict: "no", tHints: Math.min(HINT_MAX, this.state.tHints + 1), tLog: [{ ok: false, ref: w ? w.ref : key }, ...this.state.tLog].slice(0, 12) });
    }
  }
  useHint() {
    if (this.state.difficulty === "Hard" || this.state.difficulty === "Expert") return;
    this.set({ tHints: Math.min(HINT_MAX, this.state.tHints + 1) });
  }
  skipTask() {
    if (this.state.mode === "train") this.nextTrainingTask();
  }

  // ---- quiz (authentic: first try 10, retry fewer) ----
  private startQuiz() {
    this.set({ qList: this.order.slice(0, TASK_SET), qIdx: 0, qScore: 0, qTries: 0, qElapsed: 0, qDone: false, finished: false });
  }
  answerQuiz(key: string) {
    const target = this.state.qList[this.state.qIdx];
    if (!target || this.state.qDone) return;
    if (key === target) {
      const pts = this.state.qTries === 0 ? 10 : Math.max(2, 6 - this.state.qTries * 2);
      const nextIdx = this.state.qIdx + 1;
      const last = nextIdx >= this.state.qList.length;
      this.set({ qScore: this.state.qScore + pts, qIdx: last ? this.state.qIdx : nextIdx, qTries: 0, selected: key, qDone: last });
      if (last) this.finish("quiz");
    } else {
      this.set({ qTries: this.state.qTries + 1 });
    }
  }
  tickQuiz() {
    if (this.state.mode === "quiz" && !this.state.qDone) this.set({ qElapsed: this.state.qElapsed + 1 });
  }

  // ---- completion → SessionResult ----
  private finish(which: "training" | "quiz") {
    const score = which === "training" ? this.state.tScore : this.state.qScore;
    const max = TASK_SET * 10;
    const outcome: "pass" | "fault" = score >= max * 0.6 ? "pass" : "fault";
    this.set({ finished: true, qDone: which === "quiz" ? true : this.state.qDone });
    this.complete({
      tool: "location",
      scenarioId: `location-${which}`,
      score,
      outcome,
      verdict: `content:location.verdict.${which}.${outcome === "pass" ? "pass" : "retry"}`,
      steps: this.order.slice(0, TASK_SET).map((key) => ({ label: this.locByKey(key)!.ref, ok: true })),
      attempts: Math.max(1, which === "training" ? this.state.tAttempts : this.state.qTries),
      hintsUsed: which === "training" ? this.state.tHints : 0,
      durationSeconds: which === "quiz" ? this.state.qElapsed : undefined,
      at: 0,
    });
  }
}
