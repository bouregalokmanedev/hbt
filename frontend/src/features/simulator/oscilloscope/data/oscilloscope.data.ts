/**
 * Oscilloscope — authentic exercise dataset (P4.1), reverse-engineered from the
 * original tool `6f804578….dc.html` (see docs 22–26). Class-B canonical technical
 * data only: 7 exercises, each with its physics waveform generator `fn(ch,p)`,
 * channel/trigger config, correct probe terminals, pins, reference specs, fault
 * set, and live-state units.
 *
 * Learner-facing prose is NOT stored here — resolved later (P4.3) from the content
 * namespace by convention, e.g.
 *   content.oscilloscope.<id>.{sub,instruction,function,bullets.<i>,probeNote.<i>}
 *   content.oscilloscope.fault.<faultId>.{label,desc}
 *   content.oscilloscope.ai.<key>.{head,why,next}
 * Channel/pin/spec/connector strings are short canonical technical identifiers and
 * are kept here (LTR), matching the Multimeter precedent for pin functions.
 */

export type Edge = "rising" | "falling";
export type ProbeKey = "A" | "B" | "CLAMP" | "GND";

export interface ScopeChannel {
  label: string; // canonical technical label
  unit: string;
  vdiv: number; // volts (or amps) per division
  off: number; // vertical position, divisions
  colorKey: string; // A | B | C (trace colour role)
}
export interface ScopeTrig {
  level: number;
  edge: Edge;
  min: number;
  max: number;
  step: number;
}
export interface ScopePin {
  n: string;
  name: string;
}
export interface ScopeSpec {
  k: string;
  v: string;
}
export interface ScopeAnim {
  unit: string;
  unit2: string;
}

export interface ScopeExercise {
  id: string;
  code: string;
  name: string; // canonical component name
  activeLow?: boolean;
  period: number; // ms
  supply: number; // V
  openA: number; // Ch A rest / open-circuit value
  pk: number; // nominal peak (drives noise amplitude)
  timeDiv: number; // default ms/div
  chA: ScopeChannel;
  chB: ScopeChannel | null;
  trig: ScopeTrig;
  connector: string;
  pins: ScopePin[];
  ecuPins: ScopePin[];
  specs: ScopeSpec[];
  correct: { A: string; B?: string; GND: string; CLAMP?: string };
  faults: string[];
  anim: ScopeAnim;
  /** Pure ideal-signal generator: value for channel `ch` at phase `p` ms within `period`. */
  fn: (ch: "A" | "B", p: number) => number;
}

/** Camshaft segment-width pattern (ms), sums to the cam period (200). */
export const CAMPAT = [28, 29, 13, 33, 30, 9, 38, 20];

export const SCOPE_EXERCISES: ScopeExercise[] = [
  {
    id: "inj", code: "INJ-01", name: "Fuel Injector", activeLow: true,
    period: 20, supply: 12, openA: 12, pk: 70, timeDiv: 2,
    chA: { label: "Injector − (driver)", unit: "V", vdiv: 10, off: -3, colorKey: "A" },
    chB: { label: "Current clamp 20 A", unit: "A", vdiv: 1, off: -3, colorKey: "C" },
    trig: { level: 6, edge: "falling", min: -10, max: 80, step: 1 },
    connector: "2-way injector connector",
    pins: [{ n: "1", name: "+12 V supply, main relay" }, { n: "2", name: "ECU injector driver (low side)" }],
    ecuPins: [{ n: "#10", name: "Injector 1 driver" }, { n: "E1", name: "Power ground" }],
    specs: [{ k: "Rest voltage", v: "12 – 14.4 V" }, { k: "Pull-down", v: "< 1 V" }, { k: "Inductive spike", v: "55 – 75 V" }, { k: "Peak current", v: "≈ 3 A" }, { k: "Hold current", v: "≈ 1.5 A" }, { k: "Pulse width, idle", v: "2.5 – 4 ms" }],
    correct: { A: "2", GND: "BAT−", CLAMP: "1" },
    faults: ["none", "open", "shortGnd", "shortBat", "highRes", "injShort", "dropout", "noise"],
    anim: { unit: "%", unit2: "A" },
    fn(ch, p) {
      const s = 1.0, pw = 3.2;
      if (ch === "A") {
        if (p < s) return 12;
        if (p < s + pw) return -0.6;
        const dt = p - (s + pw);
        if (dt < 0.05) return -0.6 + 68.6 * (dt / 0.05);
        return 12 + 56 * Math.exp(-(dt - 0.05) / 0.36);
      }
      if (p < s) return 0;
      const q = p - s;
      if (q < 1.0) return 3.05 * (q / 1.0);
      if (q < pw) return 1.52 + 0.05 * Math.sin(q * 42);
      return 1.52 * Math.exp(-(q - pw) / 0.12);
    },
  },
  {
    id: "coil", code: "IGN-01", name: "Ignition Coil — Primary", activeLow: true,
    period: 20, supply: 12, openA: 12.4, pk: 340, timeDiv: 2,
    chA: { label: "Primary / IGT switched", unit: "V", vdiv: 50, off: -3, colorKey: "A" },
    chB: { label: "Primary current clamp", unit: "A", vdiv: 2, off: -3, colorKey: "C" },
    trig: { level: 20, edge: "rising", min: -20, max: 360, step: 5 },
    connector: "4-way coil connector",
    pins: [{ n: "1", name: "IGT — ignition signal from ECU" }, { n: "2", name: "IGF — confirmation to ECU" }, { n: "3", name: "Ground (E1)" }, { n: "4", name: "+B supply, EFI relay" }],
    ecuPins: [{ n: "IGT1", name: "Ignition command, cyl 1" }, { n: "IGF", name: "Ignition confirmation" }],
    specs: [{ k: "Primary resistance", v: "0.3 – 2 Ω" }, { k: "Secondary resistance", v: "5 – 20 kΩ" }, { k: "Current limit", v: "≈ 7 A" }, { k: "Supply", v: "12 V" }, { k: "Dwell, idle", v: "3 – 4 ms" }, { k: "Inductive kick", v: "250 – 350 V" }],
    correct: { A: "1", B: "2", GND: "3", CLAMP: "4" },
    faults: ["none", "open", "coilWeak", "shortGnd", "highRes", "dropout", "noise"],
    anim: { unit: "%", unit2: "A" },
    fn(ch, p) {
      const s = 1.2, dw = 3.6;
      if (ch === "A") {
        if (p < s) return 12.4;
        if (p < s + dw) { const q = p - s; return q > 2.6 ? (Math.sin(q * 90) > 0 ? 2.0 : 1.1) : 1.1; }
        const dt = p - (s + dw);
        if (dt < 0.04) return 1.1 + 330 * (dt / 0.04);
        if (dt < 1.7) return 22 + 300 * Math.exp(-dt / 0.1) * Math.abs(Math.cos(dt * 42));
        if (dt < 2.4) return 12.4 + 9 * Math.exp(-(dt - 1.7) / 0.25);
        return 12.4;
      }
      if (p < s) return 0;
      if (p < s + dw) { const q = p - s; return Math.min(7.1, 7.4 * (1 - Math.exp(-q / 1.4))) + (q > 2.6 ? 0.18 * Math.sin(q * 90) : 0); }
      return 7.1 * Math.exp(-(p - s - dw) / 0.05);
    },
  },
  {
    id: "cam", code: "CMP-01", name: "Camshaft Position Sensor",
    period: 200, supply: 5, openA: 5, pk: 5, timeDiv: 20,
    chA: { label: "Signal (G2)", unit: "V", vdiv: 2, off: -1.6, colorKey: "A" },
    chB: null,
    trig: { level: 2.5, edge: "rising", min: -2, max: 6, step: 0.1 },
    connector: "3-way sensor connector",
    pins: [{ n: "1", name: "+5 V supply (VC)" }, { n: "2", name: "Signal (G2 / VVT)" }, { n: "3", name: "Ground (E2)" }],
    ecuPins: [{ n: "VV1+", name: "Camshaft signal input" }, { n: "E2", name: "Sensor ground" }],
    specs: [{ k: "Supply", v: "5 V from ECU" }, { k: "High level", v: "4.5 – 5 V" }, { k: "Low level", v: "< 0.5 V" }, { k: "Output type", v: "Square wave, unequal segments" }, { k: "Amplitude vs speed", v: "Independent of rpm" }],
    correct: { A: "2", GND: "3" },
    faults: ["none", "open", "shortGnd", "shortBat", "missing", "weak", "noise", "intermittent"],
    anim: { unit: "°", unit2: "V" },
    fn(ch, p) {
      let acc = 0, hi = true;
      for (let i = 0; i < CAMPAT.length; i++) { if (p < acc + CAMPAT[i]) break; acc += CAMPAT[i]; hi = !hi; }
      return hi ? 4.85 : -0.85;
    },
  },
  {
    id: "app", code: "APP-01", name: "Accelerator Pedal Position Sensor",
    period: 1200, supply: 5, openA: 0, pk: 5, timeDiv: 120,
    chA: { label: "VPA — primary", unit: "V", vdiv: 1, off: -3, colorKey: "A" },
    chB: { label: "VPA2 — secondary", unit: "V", vdiv: 1, off: -3, colorKey: "B" },
    trig: { level: 1.5, edge: "rising", min: -1, max: 6, step: 0.1 },
    connector: "6-way pedal connector",
    pins: [{ n: "1", name: "VCPA — 5 V supply, track 1" }, { n: "2", name: "VPA — primary signal" }, { n: "3", name: "EPA — ground, track 1" }, { n: "4", name: "VCP2 — 5 V supply, track 2" }, { n: "5", name: "VPA2 — secondary signal" }, { n: "6", name: "EPA2 — ground, track 2" }],
    ecuPins: [{ n: "VPA", name: "Primary pedal signal" }, { n: "VPA2", name: "Secondary pedal signal" }],
    specs: [{ k: "Track resistance", v: "500 Ω – 15 kΩ" }, { k: "Supply", v: "5 V regulated" }, { k: "VPA released", v: "0.6 – 0.9 V" }, { k: "VPA full travel", v: "3.9 – 4.3 V" }, { k: "VPA2 ratio", v: "≈ ½ of VPA" }, { k: "Response", v: "Almost linear with angle" }],
    correct: { A: "2", B: "5", GND: "3" },
    faults: ["none", "open", "shortGnd", "shortBat", "highRes", "weak", "noise", "dropout"],
    anim: { unit: "%", unit2: "V" },
    fn(ch, p) {
      const x = p < 600 ? p / 600 : (1200 - p) / 600;
      const e = x * x * (3 - 2 * x);
      return ch === "A" ? 0.78 + 3.4 * e : 0.38 + 1.72 * e;
    },
  },
  {
    id: "map", code: "MAP-01", name: "MAP Sensor",
    period: 4000, supply: 5, openA: 0, pk: 5, timeDiv: 400,
    chA: { label: "PIM — signal", unit: "V", vdiv: 1, off: -3, colorKey: "A" },
    chB: null,
    trig: { level: 2.5, edge: "rising", min: -1, max: 6, step: 0.1 },
    connector: "3-way sensor connector",
    pins: [{ n: "1", name: "VC — 5 V supply" }, { n: "2", name: "PIM — signal" }, { n: "3", name: "E2 — ground" }],
    ecuPins: [{ n: "PIM", name: "MAP signal input" }, { n: "VC", name: "5 V sensor supply" }],
    specs: [{ k: "Supply", v: "5 V from ECU" }, { k: "Idle output", v: "1.0 – 1.5 V" }, { k: "Key on, engine off", v: "≈ 4.4 V" }, { k: "Snap throttle", v: "Rises to ≈ 4.4 V" }, { k: "Output", v: "Proportional to manifold pressure" }],
    correct: { A: "2", GND: "3" },
    faults: ["none", "open", "shortGnd", "shortBat", "weak", "noise", "poorGnd"],
    anim: { unit: "%", unit2: "V" },
    fn(ch, p) {
      const rip = 0.05 * Math.sin(p * 0.9);
      if (p < 1500) return 1.15 + rip;
      if (p < 1700) return 1.15 + 3.25 * ((p - 1500) / 200) + rip;
      if (p < 2600) return 4.4 + rip * 0.6;
      if (p < 2900) return 4.4 - 3.05 * ((p - 2600) / 300) + rip;
      return 1.35 + rip;
    },
  },
  {
    id: "knock", code: "KNK-01", name: "Knock Sensor",
    period: 60, supply: 0, openA: 0, pk: 1.8, timeDiv: 6,
    chA: { label: "KNK1 — piezo signal", unit: "V", vdiv: 0.5, off: 0, colorKey: "A" },
    chB: null,
    trig: { level: 0.4, edge: "rising", min: -2, max: 2, step: 0.05 },
    connector: "2-way screened connector",
    pins: [{ n: "1", name: "KNK1 — piezo signal" }, { n: "2", name: "EKNK — shield / ground" }],
    ecuPins: [{ n: "KNK1", name: "Knock signal input" }, { n: "EKNK", name: "Knock shield ground" }],
    specs: [{ k: "Output", v: "≈ 20 mV per g" }, { k: "Resistance", v: "Infinite (open piezo)" }, { k: "Signal type", v: "AC burst on engine noise" }, { k: "Coupling", v: "AC required" }, { k: "Sensors, 4-cyl", v: "1" }],
    correct: { A: "1", GND: "2" },
    faults: ["none", "open", "shortGnd", "weak", "noise", "poorGnd"],
    anim: { unit: "%", unit2: "V" },
    fn(ch, p) {
      let v = 0.09 * Math.sin(p * 7.3) + 0.055 * Math.sin(p * 19.1);
      const b = p - 12;
      if (b > 0 && b < 8) v += 1.45 * Math.exp(-b / 1.6) * Math.sin(b * 44);
      return v;
    },
  },
  {
    id: "lambda", code: "O2-01", name: "Oxygen Sensor",
    period: 1100, supply: 0.9, openA: 0.45, pk: 0.9, timeDiv: 110,
    chA: { label: "OX — signal", unit: "V", vdiv: 0.2, off: -2, colorKey: "A" },
    chB: null,
    trig: { level: 0.45, edge: "rising", min: -0.2, max: 1.2, step: 0.02 },
    connector: "4-way sensor connector",
    pins: [{ n: "1", name: "HT — heater +B" }, { n: "2", name: "EHT — heater ground (ECU)" }, { n: "3", name: "OX — signal" }, { n: "4", name: "E2 — signal ground" }],
    ecuPins: [{ n: "OX1A", name: "Oxygen signal input" }, { n: "HT1A", name: "Heater control" }],
    specs: [{ k: "Rich mixture", v: "0.8 – 0.9 V" }, { k: "Lean mixture", v: "0.1 – 0.2 V" }, { k: "Switch point", v: "≈ 0.45 V (λ = 1)" }, { k: "Operating temp", v: "> 350 °C" }, { k: "Crossings", v: "≈ 1 – 2 per second" }],
    correct: { A: "3", GND: "4" },
    faults: ["none", "open", "shortGnd", "shortBat", "weak", "noise", "poorGnd"],
    anim: { unit: "λ", unit2: "V" },
    fn(ch, p) {
      return 0.45 + 0.38 * Math.tanh(2.6 * Math.sin((2 * Math.PI * p) / 1100));
    },
  },
];

/** Every fault id that appears across the 7 exercises (for content coverage). */
export const OSC_FAULT_IDS = [...new Set(SCOPE_EXERCISES.flatMap((e) => e.faults))];

/** Total exercises + steps constant (7 exercises × 7 procedure steps). */
export const OSC_PROCEDURE_STEPS = 7;

export function scopeById(id: string): ScopeExercise | undefined {
  return SCOPE_EXERCISES.find((e) => e.id === id);
}
