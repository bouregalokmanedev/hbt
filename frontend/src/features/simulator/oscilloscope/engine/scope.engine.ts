import { Engine, Rng } from "@/features/simulator/scanner/engine/scanner.engine";
import { SCOPE_EXERCISES, scopeById, type ScopeExercise, type Edge, type ProbeKey } from "../data/oscilloscope.data";

export interface ScopeEngineContext { vehicleId: string; focus?: string | null; seed?: number; settings?: { noise?: number }; exercises?: ScopeExercise[]; }

/**
 * ScopeEngine — framework-free reconstruction of the authentic Oscilloscope model
 * (P4.1). Zero React/Next/DOM imports. Reproduces the original signal pipeline
 * exactly: component fn → raw → sig (fault transforms → wrong-probe penalty →
 * AC/DC coupling → noise) → trigger detection + offset → auto-measurements +
 * cursors → auto-detected procedure → scoring → diagnosis → SessionResult.
 *
 * Learner prose is never embedded — verdict is emitted as a content id.
 */

export type Screen = "library" | "connect" | "scope" | "compare" | "tablet";
export type RTab = "component" | "pinout" | "probes" | "ref" | "ai" | "score";
export type Coupling = "DC" | "AC";

export interface Probes {
  A: string | null;
  B: string | null;
  CLAMP: string | null;
  GND: string | null;
}

export interface StepChecks {
  probeOk: boolean;
  vOk: boolean;
  tOk: boolean;
  trigOk: boolean;
  capOk: boolean;
  measOk: boolean;
  diagOk: boolean;
}

export interface Measurements {
  mn: number; mx: number; pp: number; mean: number;
  freq: number; duty: number; pw: number; rise: number; per: number;
}

export interface ScopeEngineState {
  compId: string;
  screen: Screen;
  rtab: RTab;
  running: boolean;
  timeDiv: number;
  vdivA: number; vdivB: number;
  offA: number; offB: number;
  couplingA: Coupling; couplingB: Coupling;
  invA: boolean; invB: boolean;
  trigLevel: number; trigEdge: Edge;
  persist: boolean; peakDet: boolean; refOn: boolean; cursors: boolean;
  cA: number; cB: number; // screen-x fractions 0..1
  probes: Probes;
  fault: string;
  diagnosis: string | null;
  tOffset: number;
  triggered: boolean;
  finished: boolean;
}

export class ScopeEngine extends Engine<ScopeEngineState> {
  private state: ScopeEngineState;
  private rng: Rng;
  private noise: number;
  private meanCache: Record<string, number> = {};
  private exercises: ScopeExercise[];

  constructor(private ctx: ScopeEngineContext) {
    super();
    this.rng = new Rng(ctx.seed ?? 0x5c09e);
    this.noise = ctx.settings?.noise ?? 1;
    this.exercises = ctx.exercises ?? SCOPE_EXERCISES;
    const comp = (ctx.focus && this.scopeById(ctx.focus)) || this.exercises[0];
    this.state = this.defaults(comp);
    this.sync();
  }

  private scopeById(id: string): ScopeExercise | undefined {
    return this.exercises.find((e) => e.id === id) ?? scopeById(id);
  }

  exercisesList(): ScopeExercise[] {
    return this.exercises;
  }

  private defaults(c: ScopeExercise): ScopeEngineState {
    return {
      compId: c.id,
      screen: "scope",
      rtab: "component",
      running: true,
      timeDiv: c.timeDiv,
      vdivA: c.chA.vdiv,
      vdivB: c.chB ? c.chB.vdiv : 1,
      offA: c.chA.off,
      offB: c.chB ? c.chB.off : 0,
      couplingA: "DC",
      couplingB: "DC",
      invA: false,
      invB: false,
      trigLevel: c.trig.level,
      trigEdge: c.trig.edge,
      persist: false,
      peakDet: false,
      refOn: false,
      cursors: false,
      cA: 0.35,
      cB: 0.35,
      probes: { A: null, B: null, CLAMP: null, GND: null },
      fault: "none",
      diagnosis: null,
      tOffset: 0,
      triggered: false,
      finished: false,
    };
  }

  getState() {
    return this.state;
  }
  comp(): ScopeExercise {
    return this.scopeById(this.state.compId) ?? scopeById(this.state.compId)!;
  }
  private set(patch: Partial<ScopeEngineState>, resync = false) {
    this.state = { ...this.state, ...patch };
    if (resync) this.sync();
    this.emit();
  }

  // ---------- signal pipeline (authentic) ----------
  private rnd(): number {
    return this.rng.next() * 2 - 1;
  }
  private noiseScale(): number {
    return this.noise;
  }
  raw(ch: "A" | "B", t: number): number {
    const c = this.comp();
    let p = t % c.period;
    if (p < 0) p += c.period;
    return c.fn(ch, p);
  }
  private dcMean(ch: "A" | "B"): number {
    const c = this.comp();
    const key = c.id + ch + this.state.fault;
    if (this.meanCache[key] === undefined) {
      let s = 0;
      const N = 400;
      for (let i = 0; i < N; i++) s += this.raw(ch, (i / N) * c.period);
      this.meanCache[key] = s / N;
    }
    return this.meanCache[key];
  }
  wrongProbe(): "none" | "supply" | "ground" | null {
    const c = this.comp();
    const a = this.state.probes.A;
    if (!a) return "none";
    if (a === c.correct.A) return null;
    const pin = c.pins.find((p) => p.n === a);
    if (!pin) return "ground";
    const n = pin.name.toLowerCase();
    if (n.indexOf("supply") >= 0 || n.indexOf("+b") >= 0 || n.indexOf("+12") >= 0 || n.indexOf("heater +") >= 0) return "supply";
    if (n.indexOf("ground") >= 0 || n.indexOf("shield") >= 0) return "ground";
    return null;
  }
  /** Full signal at channel `ch`, time `t` ms (fault + wrong-probe + coupling + noise). */
  sig(ch: "A" | "B", t: number, faultOverride?: string): number {
    const c = this.comp();
    const st = this.state;
    const fault = faultOverride !== undefined ? faultOverride : st.fault;
    let v = this.raw(ch, t);
    const cyc = Math.floor(t / c.period);
    const rest = ch === "A" ? c.openA : 0;
    switch (fault) {
      case "open": v = ch === "A" ? c.openA : 0; break;
      case "shortGnd": v = 0 + this.rnd() * 0.03; break;
      case "shortBat": v = c.supply || 12; break;
      case "highRes": v = rest + (v - rest) * 0.55; break;
      case "weak": v = rest + (v - rest) * 0.42; break;
      case "noise": v = v + this.rnd() * c.pk * 0.055; break;
      case "poorGnd": v = v + c.pk * 0.06 + c.pk * 0.03 * Math.sin(t * 3.1); break;
      case "dropout": if (cyc % 3 === 2) v = ch === "A" ? c.openA : 0; break;
      case "intermittent": if (Math.floor(t / (c.period * 3)) % 3 === 1) v = ch === "A" ? c.openA : 0; break;
      case "missing": if (cyc % 4 === 3) v = ch === "A" ? -0.85 : 0; break;
      case "coilWeak": v = ch === "A" ? (v > 40 ? 40 + (v - 40) * 0.16 : v) : v * 0.72; break;
      case "injShort": v = ch === "B" ? v * 1.85 : v; break;
    }
    const wrong = this.wrongProbe();
    if (wrong === "supply") v = ch === "A" ? (c.supply || 12) + this.rnd() * 0.05 : v;
    else if (wrong === "ground") v = this.rnd() * 0.04;
    else if (wrong === "none") v = this.rnd() * 0.05;
    if ((ch === "A" ? st.couplingA : st.couplingB) === "AC") v = v - this.dcMean(ch);
    const nAmp = ch === "A" ? c.pk * 0.0018 : c.chB ? c.chB.vdiv * 0.008 : 0.008;
    v += this.rnd() * nAmp * this.noiseScale();
    return v;
  }

  // ---------- trigger / offset ----------
  span(): number {
    return this.state.timeDiv * 10;
  }
  findTrigger(): number | null {
    const c = this.comp();
    const st = this.state;
    const N = 900;
    const lvl = st.trigLevel;
    const rising = st.trigEdge === "rising";
    let prev = this.sig("A", 0, st.fault);
    for (let i = 1; i <= N; i++) {
      const t = (i / N) * c.period;
      const v = this.sig("A", t, st.fault);
      if (rising ? prev < lvl && v >= lvl : prev > lvl && v <= lvl) return t;
      prev = v;
    }
    return null;
  }
  /** Recompute trigger + horizontal offset from the current controls. */
  private sync() {
    const span = this.span();
    const trig = this.findTrigger();
    const triggered = trig !== null;
    this.state = { ...this.state, triggered, tOffset: triggered ? (trig as number) - 0.2 * span : 0 };
  }

  // ---------- auto-measurements (authentic) ----------
  measure(faultOverride?: string): Measurements {
    const span = this.span();
    const c = this.comp();
    const N = 1400;
    let mn = Infinity, mx = -Infinity, sum = 0, above = 0;
    const t0 = this.state.tOffset;
    const samples = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const v = this.sig("A", t0 + (i / N) * span, faultOverride);
      samples[i] = v; sum += v;
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    const BINS = 48, hist = new Array(BINS).fill(0), rangeAll = mx - mn || 1;
    for (let i = 0; i < N; i++) hist[Math.min(BINS - 1, Math.floor(((samples[i] - mn) / rangeAll) * BINS))]++;
    let i1 = 0;
    for (let b = 1; b < BINS; b++) if (hist[b] > hist[i1]) i1 = b;
    let i2 = -1;
    for (let b = 0; b < BINS; b++) if (Math.abs(b - i1) > 3 && (i2 < 0 || hist[b] > hist[i2])) i2 = b;
    const lvl = (b: number) => mn + ((b + 0.5) / BINS) * rangeAll;
    const mid = i2 >= 0 && hist[i2] > N * 0.02 ? (lvl(i1) + lvl(i2)) / 2 : (mn + mx) / 2;
    let lastCross: number | null = null;
    const periods: number[] = [];
    for (let i = 1; i < N; i++) {
      if (samples[i] > mid) above++;
      if (samples[i - 1] < mid && samples[i] >= mid) {
        const t = (i / N) * span;
        if (lastCross !== null) periods.push(t - lastCross);
        lastCross = t;
      }
    }
    let per = periods.length ? periods.reduce((a, b) => a + b, 0) / periods.length : c.period;
    if (!periods.length) per = c.period;
    const freq = 1000 / per;
    const activeLow = !!c.activeLow;
    const duty = ((activeLow ? N - above : above) / N) * 100;
    let best = 0, run = 0;
    for (let i = 0; i < N; i++) {
      const on = activeLow ? samples[i] < mid : samples[i] >= mid;
      if (on) { run++; if (run > best) best = run; } else run = 0;
    }
    const pw = (best / N) * span;
    let rise = 0;
    const lo = mn + 0.1 * (mx - mn), hi = mn + 0.9 * (mx - mn);
    for (let i = 1; i < N; i++) {
      if (samples[i - 1] < lo && samples[i] >= lo) {
        for (let j = i; j < N; j++) { if (samples[j] >= hi) { rise = ((j - i) / N) * span; break; } }
        break;
      }
    }
    return { mn, mx, pp: mx - mn, mean: sum / N, freq, duty, pw, rise, per };
  }

  /** Cursor ΔT (ms) and ΔV (Ch A) between cursors A and B. */
  cursorReadout(): { dt: number; dv: number; vA: number; vB: number } {
    const span = this.span();
    const st = this.state;
    const vA = this.sig("A", st.tOffset + st.cA * span);
    const vB = this.sig("A", st.tOffset + st.cB * span);
    return { dt: Math.abs(st.cB - st.cA) * span, dv: vB - vA, vA, vB };
  }

  // ---------- live state (Info tab, authentic animate()) ----------
  /** Deterministic component live-state at a given phase (ms). Values come from the
   * signal pipeline; the UI supplies the phase (rAF tick). Returns two normalised
   * bars (0..100), their display values, and an "event" flag (spike/switch/etc). */
  liveState(phaseMs: number): { p1: number; p2: number; v1: string; v2: string; hot: boolean } {
    const c = this.comp();
    const tt = ((phaseMs % c.period) + c.period) % c.period;
    const a = this.sig("A", tt);
    const b = c.chB ? this.sig("B", tt) : 0;
    const nrm = (v: number, mx: number) => Math.max(0, Math.min(100, (v / mx) * 100));
    let p1 = 0, p2 = 0, v1 = "", v2 = "", hot = false;
    switch (c.id) {
      case "inj": p1 = a < 1 ? 100 : 0; p2 = nrm(b, 3.2); v1 = `${p1.toFixed(0)} %`; v2 = `${b.toFixed(2)} A`; hot = a > 30; break;
      case "coil": p1 = a < 6 ? 100 : 0; p2 = nrm(b, 7.4); v1 = `${p1.toFixed(0)} %`; v2 = `${b.toFixed(2)} A`; hot = a > 80; break;
      case "cam": p1 = ((tt / c.period) * 100) % 100; p2 = nrm(a, 5); v1 = `${((tt / c.period) * 360).toFixed(0)}°`; v2 = `${a.toFixed(2)} V`; hot = a > 2.5; break;
      case "app": p1 = nrm(a - 0.78, 3.4); p2 = nrm(a, 5); v1 = `${p1.toFixed(0)} %`; v2 = `${a.toFixed(2)} V`; hot = a < 0.95; break;
      case "map": p1 = nrm(a, 5); p2 = nrm(a, 5); v1 = `${p1.toFixed(0)} %`; v2 = `${a.toFixed(2)} V`; hot = a > 3.5; break;
      case "knock": p1 = nrm(Math.abs(a), 1.6); p2 = p1; v1 = `${p1.toFixed(0)} %`; v2 = `${Math.abs(a).toFixed(2)} V`; hot = Math.abs(a) > 0.5; break;
      default: p1 = nrm(a, 0.9); p2 = p1; v1 = a > 0.45 ? "λ < 1" : "λ > 1"; v2 = `${a.toFixed(2)} V`; hot = a > 0.45; break;
    }
    return { p1, p2, v1, v2, hot };
  }

  // ---------- procedure checks + score (authentic) ----------
  stepChecks(): StepChecks {
    const st = this.state;
    const c = this.comp();
    const pr = st.probes;
    const probeOk = pr.A === c.correct.A && (!c.correct.B || pr.B === c.correct.B) && pr.GND === c.correct.GND;
    const vOk = Math.abs(Math.log2(st.vdivA / c.chA.vdiv)) < 1.01;
    const tOk = Math.abs(Math.log2(st.timeDiv / c.timeDiv)) < 1.01;
    const m = this.measure();
    const trigOk = st.trigEdge === c.trig.edge && st.trigLevel > m.mn + m.pp * 0.08 && st.trigLevel < m.mx - m.pp * 0.08;
    const capOk = !st.running || st.persist;
    const measOk = Math.abs(st.cB - st.cA) > 0.03;
    const diagOk = st.diagnosis === st.fault;
    return { probeOk, vOk, tOk, trigOk, capOk, measOk, diagOk };
  }
  score(): number {
    const k = this.stepChecks();
    return (k.probeOk ? 25 : 0) + (k.vOk && k.tOk ? 20 : 0) + (k.trigOk ? 15 : 0) + (k.measOk ? 15 : 0) + (k.diagOk ? 25 : 0);
  }
  stepsDone(): number {
    const k = this.stepChecks();
    return [k.probeOk, k.vOk && k.tOk, k.trigOk, k.capOk, k.measOk, k.diagOk].filter(Boolean).length;
  }

  // ---------- intents ----------
  selectComponent(id: string) {
    const c = this.scopeById(id);
    if (c) this.set(this.defaults(c), true);
  }
  setScreen(screen: Screen) { this.set({ screen }); }
  setRtab(rtab: RTab) { this.set({ rtab }); }
  toggleRun() { this.set({ running: !this.state.running }); }
  single() { this.set({ running: false }); }
  autoSet() {
    const c = this.comp();
    this.set({ timeDiv: c.timeDiv, vdivA: c.chA.vdiv, vdivB: c.chB ? c.chB.vdiv : 1, offA: c.chA.off, offB: c.chB ? c.chB.off : 0, trigLevel: c.trig.level, trigEdge: c.trig.edge, running: true }, true);
  }
  setTimeDiv(v: number) { this.set({ timeDiv: v }, true); }
  setVdiv(ch: "A" | "B", v: number) { this.set(ch === "A" ? { vdivA: v } : { vdivB: v }); }
  setOffset(ch: "A" | "B", v: number) { this.set(ch === "A" ? { offA: v } : { offB: v }); }
  setCoupling(ch: "A" | "B", cpl: Coupling) { this.set(ch === "A" ? { couplingA: cpl } : { couplingB: cpl }, ch === "A"); }
  toggleInvert(ch: "A" | "B") { this.set(ch === "A" ? { invA: !this.state.invA } : { invB: !this.state.invB }); }
  setTrigLevel(v: number) { this.set({ trigLevel: v }, true); }
  setTrigEdge(edge: Edge) { this.set({ trigEdge: edge }, true); }
  togglePersist() { this.set({ persist: !this.state.persist }); }
  togglePeakDet() { this.set({ peakDet: !this.state.peakDet }); }
  toggleRef() { this.set({ refOn: !this.state.refOn }); }
  toggleCursors() { this.set({ cursors: !this.state.cursors }); }
  setCursor(which: "A" | "B", v: number) {
    const c = Math.max(0, Math.min(1, v));
    this.set(which === "A" ? { cA: c } : { cB: c });
  }
  placeProbe(key: ProbeKey, terminal: string | null) {
    // Ch A placement changes whether there is a signal at all → recompute trigger.
    this.set({ probes: { ...this.state.probes, [key]: terminal } }, key === "A");
  }
  setFault(fault: string) {
    this.meanCache = {};
    this.set({ fault, diagnosis: null, finished: false }, true);
  }
  submitDiagnosis(fault: string) {
    this.set({ diagnosis: fault });
    const k = this.stepChecks();
    const outcome: "pass" | "fault" = k.diagOk ? "pass" : "fault";
    this.set({ finished: true });
    this.complete({
      tool: "oscilloscope",
      scenarioId: `oscilloscope-${this.state.compId}`,
      score: this.score(),
      outcome,
      verdict: `content:oscilloscope.verdict.${k.diagOk ? "correct" : "wrong"}`,
      steps: [
        { label: "content:oscilloscope.step.probe", ok: k.probeOk },
        { label: "content:oscilloscope.step.vdiv", ok: k.vOk },
        { label: "content:oscilloscope.step.timebase", ok: k.tOk },
        { label: "content:oscilloscope.step.trigger", ok: k.trigOk },
        { label: "content:oscilloscope.step.capture", ok: k.capOk },
        { label: "content:oscilloscope.step.cursors", ok: k.measOk },
        { label: "content:oscilloscope.step.diagnosis", ok: k.diagOk },
      ],
      at: 0,
    });
  }
}
