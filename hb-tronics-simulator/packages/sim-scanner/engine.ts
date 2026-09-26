import { Engine, LocalClockSource, Rng, StepMachine, clampScore, type InputSource, type EngineContext } from "@sim/core";
import { PARAMS, TREE, NODES, ASSISTANT_TURNS, TRAINING_STEPS, TRAINING_CORRECT, type Pid } from "@/data/scanner";
import { getRepositories } from "@/data/repositories";
import type { Scenario } from "@/data/schema/scenario";

export interface LiveSample {
  id: string;
  value: number;
  history: number[];
  status: "ok" | "warn" | "fault";
}

export interface ScanLogLine {
  ecu: string;
  name: string;
  status: string;
  dtc: number;
}

export interface ScannerState {
  livePlay: boolean;
  live: Record<string, LiveSample>;
  volts: number;
  tick: number;
  // diagnostic tree
  treeStep: number;
  treeMeasured: boolean;
  treeStates: { done: boolean; verdict: "pending" | "pass" | "fail" }[];
  // Class-C descriptor, not prose: UI resolves kind (+ stepId for recheck hint).
  treeFeedback: { ok: boolean; kind: "recheck" | "correct" | "confirmed"; stepId?: string } | null;
  treeFinished: boolean;
  // full scan
  scanning: boolean;
  scanIdx: number;
  scanLog: ScanLogLine[];
  scanDone: boolean;
  // ADAS
  adasRunning: boolean;
  adasProg: number;
  adasDone: boolean[];
  // training scenario 12
  tStep: number;
  tDone: boolean[]; // steps marked complete
  tHints: number; // hints used (each −5 pts)
  tAnswer: number | null;
  tScore: { accuracy: number; process: number; time: number } | null;
  // Class-C descriptor, not prose: UI resolves content.scanner.training.result.<correct|wrong>.
  tFeedback: { correct: boolean } | null;
  // Diagnostic Assistant — Socratic dialogue. aiLog stores each answered turn as a
  // user echo (the chosen option id) + the assistant reply (resolved by turn). The
  // UI resolves content.scanner.assist.* prose (no prose in the engine).
  aiTurn: number;
  aiLog: { role: "user" | "ai"; turn: number; optId?: string }[];
}

const HIST = 48;

export class ScannerEngine extends Engine<ScannerState> {
  private state: ScannerState;
  // Engines are driven by the InputSource seam, not raw Clocks (10 §8.1, F4).
  // LocalClockSource is the local driver today; a RemoteChannelSource can be
  // swapped in without touching this engine.
  private live: InputSource = new LocalClockSource();
  private scanSource: InputSource = new LocalClockSource();
  private adasSource: InputSource = new LocalClockSource();
  private rng: Rng;
  private machine: StepMachine;
  // Data-driven scenario definitions loaded via the repository (10 §7.1).
  private treeScenario: Scenario;
  private trainingScenario: Scenario;

  constructor(ctx: EngineContext) {
    super();
    const repo = getRepositories().scenarios;
    this.treeScenario = repo.byId("scanner-P2118")!;
    this.trainingScenario = repo.byId("scanner-scenario-12")!;
    this.rng = new Rng(ctx.seed ?? 0x5a17);
    this.machine = new StepMachine(TREE.map((s) => ({ ok: s.ok, terminal: s.terminal })));
    const live: Record<string, LiveSample> = {};
    for (const p of PARAMS) {
      live[p.id] = { id: p.id, value: p.base, history: Array(HIST).fill(p.base), status: this.pidStatus(p, p.base) };
    }
    this.state = {
      livePlay: true,
      live,
      volts: 13.9,
      tick: 0,
      treeStep: 0,
      treeMeasured: false,
      treeStates: TREE.map(() => ({ done: false, verdict: "pending" as const })),
      treeFeedback: null,
      treeFinished: false,
      scanning: false,
      scanIdx: 0,
      scanLog: [],
      scanDone: false,
      adasRunning: false,
      adasProg: 0,
      adasDone: [true, true, false, false, false, false],
      tStep: 0,
      tDone: TRAINING_STEPS.map(() => false),
      tHints: 0,
      tAnswer: null,
      tScore: null,
      tFeedback: null,
      aiTurn: 0,
      aiLog: [],
    };
  }

  getState() {
    return this.state;
  }

  private pidStatus(p: Pid, v: number): "ok" | "warn" | "fault" {
    if (p.fault) return "fault";
    const span = p.max - p.min;
    if (v < p.min + span * 0.05 || v > p.max - span * 0.05) return "warn";
    return "ok";
  }

  private tickLive() {
    const live = { ...this.state.live };
    for (const p of PARAMS) {
      const cur = live[p.id];
      // random-walk toward base
      const drift = (p.base - cur.value) * 0.15;
      const next = Math.max(p.min, Math.min(p.max, cur.value + drift + this.rng.noise(p.step)));
      const history = [...cur.history.slice(1), next];
      live[p.id] = { id: p.id, value: next, history, status: this.pidStatus(p, next) };
    }
    const volts = Math.max(11, Math.min(14.8, this.state.volts + this.rng.noise(0.08)));
    this.state = { ...this.state, live, volts, tick: this.state.tick + 1 };
    this.emit();
  }

  // ---- live data intents ----
  startLive() {
    this.live.subscribe(() => {
      if (this.state.livePlay) this.tickLive();
    });
    this.live.start(420);
  }
  toggleLive() {
    this.state = { ...this.state, livePlay: !this.state.livePlay };
    this.emit();
  }
  pid(id: string): Pid {
    return PARAMS.find((p) => p.id === id)!;
  }
  formatted(id: string): string {
    const p = this.pid(id);
    return this.state.live[id].value.toFixed(p.decimals);
  }

  // ---- diagnostic tree intents ----
  treeMeasure() {
    this.machine.measure(this.state.treeStep);
    this.state = { ...this.state, treeMeasured: true };
    this.emit();
  }
  treeVerdict(pass: boolean) {
    const i = this.state.treeStep;
    const correct = this.machine.judge(i, pass);
    if (!correct) {
      this.state = {
        ...this.state,
        treeFeedback: { ok: false, kind: "recheck", stepId: TREE[i].id },
      };
      this.emit();
      return;
    }
    const treeStates = [...this.state.treeStates];
    treeStates[i] = { done: true, verdict: TREE[i].ok ? "pass" : "fail" };
    const finished = this.machine.finished;
    this.state = {
      ...this.state,
      treeStates,
      treeStep: finished ? i : i + 1,
      treeMeasured: false,
      treeFinished: finished,
      treeFeedback: { ok: true, kind: TREE[i].ok ? "correct" : "confirmed" },
    };
    this.emit();
    if (finished) {
      const sc = this.treeScenario;
      const score = clampScore(sc.rubric.startScore - this.machine.attempts * (sc.rubric.penaltyPerAttempt ?? 8));
      this.complete({
        tool: "scanner",
        scenarioId: sc.id,
        score,
        outcome: "fault",
        verdict: sc.verdict ?? "content:scanner.tree.verdict",
        steps: TREE.map((s, idx) => ({ label: `content:scanner.tree.${s.id}.label`, ok: this.state.treeStates[idx]?.done ?? false })),
        at: 0,
      });
    }
  }

  // ---- full system scan (21 ECUs, ~200 ms each) ----
  startScan() {
    if (this.state.scanning) return;
    this.state = { ...this.state, scanning: true, scanIdx: 0, scanLog: [], scanDone: false };
    this.emit();
    this.scanSource.subscribe(() => {
      const idx = this.state.scanIdx;
      if (idx >= NODES.length) {
        this.scanSource.stop();
        this.state = { ...this.state, scanning: false, scanDone: true };
        this.emit();
        return;
      }
      const n = NODES[idx];
      const line: ScanLogLine = { ecu: n.id, name: n.name, status: n.status, dtc: n.dtc };
      this.state = { ...this.state, scanIdx: idx + 1, scanLog: [...this.state.scanLog, line] };
      this.emit();
    });
    this.scanSource.start(200);
  }

  // ---- ADAS calibration run (0→100 at 90 ms) ----
  runAdas() {
    if (this.state.adasRunning) return;
    this.state = { ...this.state, adasRunning: true, adasProg: 0, adasDone: [true, true, false, false, false, false] };
    this.emit();
    this.adasSource.subscribe(() => {
      const prog = Math.min(100, this.state.adasProg + 3);
      // unlock checklist items at thresholds
      const done = this.state.adasDone.map((d, i) => d || prog >= (i + 1) * (100 / 6));
      const running = prog < 100;
      this.state = { ...this.state, adasProg: prog, adasDone: done, adasRunning: running };
      this.emit();
      if (!running) this.adasSource.stop();
    });
    this.adasSource.start(90);
  }

  // ---- training scenario 12 ----
  /** Mark the current step complete and advance (source: "Mark step complete"). */
  trainingCompleteStep() {
    const done = [...this.state.tDone];
    done[this.state.tStep] = true;
    const next = Math.min(this.state.tStep + 1, TRAINING_STEPS.length - 1);
    this.state = { ...this.state, tDone: done, tStep: next };
    this.emit();
  }
  trainingGoStep(i: number) {
    if (i >= 0 && i < TRAINING_STEPS.length) { this.state = { ...this.state, tStep: i }; this.emit(); }
  }
  trainingNext() { this.trainingGoStep(this.state.tStep + 1); }
  trainingPrev() { this.trainingGoStep(this.state.tStep - 1); }
  /** Reveal a hint for the current step; each hint costs 5 rubric points (source). */
  useTrainingHint() {
    this.state = { ...this.state, tHints: this.state.tHints + 1 };
    this.emit();
  }
  submitTraining(answer: number) {
    if (this.state.tAnswer != null) return; // single attempt
    const correct = answer === TRAINING_CORRECT;
    const sc = this.trainingScenario;
    const w = sc.rubric.weights ?? { accuracy: 92, process: 88, time: 76 };
    const penalty = this.state.tHints * 5; // each hint costs 5 pts
    const clamp = (v: number) => Math.max(0, v - penalty);
    this.state = {
      ...this.state,
      tAnswer: answer,
      tScore: correct
        ? { accuracy: clamp(w.accuracy), process: clamp(w.process), time: w.time }
        : { accuracy: clamp(40), process: clamp(55), time: 76 },
      tFeedback: { correct },
    };
    this.emit();
    this.complete({
      tool: "scanner",
      scenarioId: sc.id,
      score: correct ? w.accuracy : 40,
      outcome: "fault",
      verdict: correct ? sc.verdict ?? "content:scanner.training.verdict.correct" : "content:scanner.training.verdict.wrong",
      steps: TRAINING_STEPS.map((s) => ({ label: `content:scanner.training.step.${s.id}.label`, ok: correct })),
      at: 0,
    });
  }

  // ---- Diagnostic Assistant (deterministic Socratic dialogue) ----
  /** Answer the current turn with a chosen reply option; advances to the next turn. */
  aiAsk(optId?: string) {
    const turn = this.state.aiTurn;
    if (turn >= ASSISTANT_TURNS.length) return;
    const chosen = optId ?? ASSISTANT_TURNS[turn].opts[0];
    // Log the user's chosen option + the assistant reply; UI resolves prose from content.
    this.state = {
      ...this.state,
      aiTurn: turn + 1,
      aiLog: [...this.state.aiLog, { role: "user", turn, optId: chosen }, { role: "ai", turn }],
    };
    this.emit();
  }

  dispose() {
    this.live.stop();
    this.scanSource.stop();
    this.adasSource.stop();
    super.dispose();
  }
}
