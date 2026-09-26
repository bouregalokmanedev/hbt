import { Engine, LocalClockSource, Rng, type InputSource, type EngineContext, type SessionResult } from "@sim/core";
import {
  MM_PROCEDURES,
  mmProcedureByRef,
  type MeterProcedureComponent,
  type MeterProcedureStep,
  type MeterMode,
  type ProbeTarget,
} from "@/data/multimeter/procedures";

/**
 * MeterProcedureEngine — framework-free reconstruction of the authentic Multimeter
 * measurement model (P3.2). Zero React/DOM imports. Reproduces the original tool's
 * exact logic: rotary mode selection, drag-drop probe placement (accepted here as
 * semantic `placeProbe(lead,target)` actions), seated/mode/pair validation with
 * OHM polarity-agnostic pairing, deterministic per-component fault injection, the
 * structured LCD reading, the Yes/No diagnosis judgment, scoring (−10 wrong / −5
 * hint), and clear/found completion → SessionResult.
 *
 * Learner prose stays out of the engine — verdict/fail are emitted as content ids.
 */

export type Lead = "red" | "black";
export type ReadingStatus = "off" | "unseated" | "wrongMode" | "wrongPoints" | "ok";

export interface MeterReading {
  value: string;
  unit: string;
  status: ReadingStatus;
  spec: string;
  flag: string; // '', 'RANGE', 'AUTO'
  faulted: boolean;
}

export interface Placement {
  seated: boolean;
  modeOk: boolean;
  pairOk: boolean;
  redOk: boolean;
  blackOk: boolean;
}

export type CompletionStatus = "clear" | "found";

export interface MeterProcedureState {
  compRef: string;
  mode: MeterMode;
  red: ProbeTarget | null;
  black: ProbeTarget | null;
  lead: Lead; // next lead to seat (auto-swaps red→black on placement)
  stepIdx: number;
  score: number;
  attempts: number;
  hintUsed: boolean; // hint consumed on the current step
  faultAt: number; // faulted step index for the active component (-1 = healthy)
  done: Record<string, { steps: number; total: number; score: number; status: CompletionStatus }>;
  feedback: { tone: "warn" | "bad" | "good"; kind: string } | null;
  elapsed: number;
  finished: boolean;
}

const WRONG_PENALTY = 10;
const HINT_PENALTY = 5;
const START_SCORE = 100;

export class MeterProcedureEngine extends Engine<MeterProcedureState> {
  private state: MeterProcedureState;
  private faults: Record<string, number> = {};
  private done: MeterProcedureState["done"] = {};
  private rng: Rng;
  private randomFault: boolean;
  private source: InputSource = new LocalClockSource();

  constructor(ctx: EngineContext) {
    super();
    this.rng = new Rng(ctx.seed ?? 0x1234);
    this.randomFault = ctx.settings.randomFault;
    const comp = (ctx.focus && mmProcedureByRef(ctx.focus)) || MM_PROCEDURES[0];
    this.state = this.fresh(comp);
  }

  // ---- fault injection (authentic ensureFault) --------------------------------
  /** Deterministic fault at step 0 (randomFault off); random step (or -1 healthy,
   * ~12%) when randomFault on. Every component always resolves a fixed fault. */
  private ensureFault(comp: MeterProcedureComponent): number {
    if (this.faults[comp.ref] !== undefined) return this.faults[comp.ref];
    let f: number;
    if (!this.randomFault) {
      f = 0;
    } else {
      const r = this.rng.next();
      f = r < 0.12 ? -1 : Math.floor(this.rng.next() * comp.steps.length);
    }
    this.faults[comp.ref] = f;
    return f;
  }

  private fresh(comp: MeterProcedureComponent): MeterProcedureState {
    const faultAt = this.ensureFault(comp);
    return {
      compRef: comp.ref,
      mode: "OFF",
      red: null,
      black: null,
      lead: "red",
      stepIdx: 0,
      score: START_SCORE,
      attempts: 0,
      hintUsed: false,
      faultAt,
      done: this.done,
      feedback: null,
      elapsed: 0,
      finished: false,
    };
  }

  getState() {
    return this.state;
  }
  component(): MeterProcedureComponent {
    return mmProcedureByRef(this.state.compRef)!;
  }
  step(): MeterProcedureStep {
    const c = this.component();
    return c.steps[Math.min(this.state.stepIdx, c.steps.length - 1)];
  }
  faultStepOf(ref: string): number | undefined {
    return this.faults[ref];
  }

  private set(patch: Partial<MeterProcedureState>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  // ---- probe + mode actions ---------------------------------------------------
  selectComponent(ref: string) {
    const comp = mmProcedureByRef(ref);
    if (comp) this.set(this.fresh(comp));
  }
  setMode(mode: MeterMode) {
    this.set({ mode, feedback: null });
  }
  /** Seat a lead on a target. If `lead` is omitted the current `lead` is used and
   * auto-swaps red→black (authentic attach()). Re-seating a target frees whichever
   * lead already held it. */
  placeProbe(target: ProbeTarget, lead?: Lead) {
    const use = lead ?? this.state.lead;
    let red = this.state.red;
    let black = this.state.black;
    if (red === target) red = null;
    if (black === target) black = null;
    if (use === "red") red = target;
    else black = target;
    const nextLead: Lead = use === "red" ? "black" : "red";
    this.set({ red, black, lead: nextLead, feedback: null });
  }
  detachProbe(lead: Lead) {
    this.set(lead === "red" ? { red: null } : { black: null });
  }
  clearProbes() {
    this.set({ red: null, black: null, lead: "red" });
  }

  // ---- measurement model (authentic placement/reading) ------------------------
  placement(): Placement {
    const st = this.step();
    const { red, black, mode } = this.state;
    const isOhm = st.mode === "OHM";
    const pairOk = isOhm
      ? (red === st.red && black === st.black) || (red === st.black && black === st.red)
      : red === st.red && black === st.black;
    return {
      seated: !!red && !!black,
      modeOk: mode === st.mode,
      pairOk,
      redOk: red === st.red || (isOhm && red === st.black),
      blackOk: black === st.black || (isOhm && black === st.red),
    };
  }

  private unitFor(m: MeterMode): string {
    return m === "OHM" ? "Ω" : m === "MA" ? "A" : m === "VAC" ? "V~" : "V";
  }

  reading(): MeterReading {
    const st = this.step();
    const s = this.state;
    const pl = this.placement();
    if (s.mode === "OFF") return { value: "", unit: "", status: "off", spec: "", flag: "", faulted: false };
    const unit = this.unitFor(s.mode);
    if (!pl.seated) return { value: "- - - -", unit, status: "unseated", spec: "", flag: "", faulted: false };
    if (!pl.modeOk) return { value: "OL", unit, status: "wrongMode", spec: "", flag: "RANGE", faulted: false };
    if (!pl.pairOk) return { value: st.mode === "OHM" ? "OL" : "0.00", unit, status: "wrongPoints", spec: "", flag: "", faulted: false };
    const faulted = s.faultAt === s.stepIdx;
    const raw = faulted ? st.bad : st.good;
    return { value: raw, unit: raw === "OL" ? "" : st.unit, status: "ok", spec: st.spec, flag: "AUTO", faulted };
  }

  /** True when a valid measurement has been taken (both probes seated, correct
   * function + points). Only then may the learner answer. */
  measurementReady(): boolean {
    const pl = this.placement();
    return this.state.mode !== "OFF" && pl.seated && pl.modeOk && pl.pairOk;
  }

  // ---- hint -------------------------------------------------------------------
  useHint() {
    if (this.state.hintUsed) return;
    this.set({ hintUsed: true, score: Math.max(0, this.state.score - HINT_PENALTY) });
  }

  // ---- diagnosis answer (authentic answer()) ----------------------------------
  answer(yes: boolean) {
    if (!this.measurementReady()) {
      this.set({ feedback: { tone: "warn", kind: "takeMeasurement" } });
      return;
    }
    const c = this.component();
    const faulted = this.state.faultAt === this.state.stepIdx;
    const truth = !faulted; // in-spec when not faulted
    if (yes !== truth) {
      this.set({
        attempts: this.state.attempts + 1,
        score: Math.max(0, this.state.score - WRONG_PENALTY),
        feedback: { tone: "bad", kind: yes ? "wrongYes" : "wrongNo" },
      });
      return;
    }
    if (yes) {
      const last = this.state.stepIdx >= c.steps.length - 1;
      if (last) {
        this.recordDone(c, c.steps.length, "clear");
        this.finish(c, "clear");
      } else {
        this.set({ stepIdx: this.state.stepIdx + 1, red: null, black: null, lead: "red", hintUsed: false, feedback: null });
      }
    } else {
      // Correctly answered "No" on the faulted step → fault localised.
      this.recordDone(c, this.state.stepIdx + 1, "found");
      this.finish(c, "found");
    }
  }

  private recordDone(c: MeterProcedureComponent, steps: number, status: CompletionStatus) {
    this.done = { ...this.done, [c.ref]: { steps, total: c.steps.length, score: this.state.score, status } };
  }

  private finish(c: MeterProcedureComponent, status: CompletionStatus) {
    this.source.stop();
    const outcome: "pass" | "fault" = status === "clear" ? "pass" : "fault";
    this.set({ finished: true, done: this.done, feedback: { tone: "good", kind: status } });
    this.complete({
      tool: "multimeter",
      scenarioId: `multimeter-${c.ref}`,
      score: this.state.score,
      outcome,
      verdict: `content:multimeter.verdict.${status}`,
      steps: c.steps.map((_s, i) => ({
        label: `content:multimeter.${c.ref}.step.${i}.instruction`,
        ok: i < this.state.stepIdx || (status === "clear" && i < c.steps.length),
      })),
      at: 0,
    });
  }

  // ---- timer ------------------------------------------------------------------
  startTimer() {
    this.source.subscribe(() => {
      this.state = { ...this.state, elapsed: this.state.elapsed + 1 };
      this.emit();
    });
    this.source.start(1000);
  }
  dispose() {
    this.source.stop();
    super.dispose();
  }
}
