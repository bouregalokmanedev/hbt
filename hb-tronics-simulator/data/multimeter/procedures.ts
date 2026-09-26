/**
 * Multimeter — authentic procedure dataset (SC doc 17/19, reverse-engineered from
 * the original tool `.dc.html`). Class-B canonical technical data only: 11
 * components across 4 systems, 54 guided measurement steps, with pinouts, ECU
 * links, rotary mode, probe targets, spec/good/bad readings, and reference tables.
 *
 * Learner-facing prose is NOT stored here — it is resolved later (P3.4) from the
 * content namespace by convention:
 *   content.multimeter.<ref>.complaint
 *   content.multimeter.<ref>.step.<i>.instruction   (the step body)
 *   content.multimeter.<ref>.step.<i>.question       (table steps only)
 *   content.multimeter.<ref>.step.<i>.fail
 */

/** Rotary dial functions (7 physical positions). Only OHM/VDC/MA are exercised by
 * the 54 steps; VAC/A/HZ exist on the dial for fidelity. */
export type MeterMode = "OFF" | "VDC" | "VAC" | "OHM" | "MA" | "A" | "HZ";
export const ROTARY_MODES: readonly MeterMode[] = ["OFF", "VDC", "VAC", "OHM", "MA", "A", "HZ"] as const;

/** Probe targets: component pin `c<pin>`, ECU pin `e<pin>`, engine earth `gnd`. */
export type ProbeTarget = string;

export interface MeterProcedureStep {
  mode: Exclude<MeterMode, "OFF">;
  red: ProbeTarget;
  black: ProbeTarget;
  spec: string; // canonical spec string
  good: string; // reading when in-spec
  bad: string; // reading when faulted
  unit: string;
  table?: { head: [string, string]; rows: [string, string][] }; // reference chart (canonical)
}

export interface MeterProcedureComponent {
  ref: string; // canonical component ref (= code)
  code: string;
  group: string;
  name: string;
  img: string; // asset ref (may be empty)
  sym: string; // schematic symbol key
  pins: (string | number)[];
  pinFn: Record<string, string>;
  ecu: { code: string; name: string; pins: string[] };
  links: Record<string, string>; // component pin → ECU pin
  supply: (string | number)[]; // pins fed from a supply rail
  steps: MeterProcedureStep[];
}

export const MM_GROUPS = ["Air & fuel", "Ignition", "Position sensors", "Emissions & temperature"] as const;

export const MM_PROCEDURES: MeterProcedureComponent[] = [
  {
    ref: "L3", code: "L3", group: "Air & fuel", name: "Mass airflow meter with air temperature sensor", img: "ref/maf/7.png", sym: "maf",
    pins: [1, 2, 3, 4, 5],
    pinFn: { 1: "Mass airflow meter earth", 2: "Air temperature sensor signal / 5 V supply", 3: "Mass airflow meter supply +12 V", 4: "Mass airflow meter signal", 5: "Air temperature sensor earth" },
    ecu: { code: "E1", name: "Engine control unit", pins: ["A3", "A2", "A1", "B122", "B92", "B90", "B91"] },
    links: { 2: "B122", 4: "B92", 5: "B90", 1: "B91" }, supply: [3],
    steps: [
      { mode: "OHM", red: "c2", black: "c5", spec: "See chart", good: "2.35", bad: "OL", unit: "kΩ", table: { head: ["Temperature T(°C)", "Resistance R(Ω)"], rows: [["-20", "13.6 - 18.4 k"], ["20", "2.21 - 2.69 k"], ["60", "490 - 670"]] } },
      { mode: "VDC", red: "c2", black: "gnd", spec: "4.8 – 5.2 V", good: "5.02", bad: "0.03", unit: "V" },
      { mode: "VDC", red: "c3", black: "gnd", spec: "12 – 14.4 V", good: "13.2", bad: "0.2", unit: "V" },
      { mode: "VDC", red: "c5", black: "gnd", spec: "0 – 0.2 V", good: "0.10", bad: "4.83", unit: "V" },
      { mode: "VDC", red: "c1", black: "gnd", spec: "0 – 0.2 V", good: "0.10", bad: "5.01", unit: "V" },
      { mode: "OHM", red: "c4", black: "eB92", spec: "< 1 Ω", good: "0.5", bad: "OL", unit: "Ω" },
    ],
  },
  {
    ref: "L1", code: "L1", group: "Air & fuel", name: "MAP sensor", img: "", sym: "map",
    pins: [1, 2, 3],
    pinFn: { 1: "Sensor earth", 2: "Pressure signal to control unit", 3: "5 V supply from control unit" },
    ecu: { code: "E1", name: "Engine control unit", pins: ["B118", "B87", "B119"] },
    links: { 3: "B118", 2: "B87", 1: "B119" }, supply: [],
    steps: [
      { mode: "VDC", red: "c3", black: "gnd", spec: "4.8 – 5.2 V", good: "5.01", bad: "0.02", unit: "V" },
      { mode: "VDC", red: "c1", black: "gnd", spec: "0 – 0.2 V", good: "0.10", bad: "4.90", unit: "V" },
      { mode: "OHM", red: "c2", black: "eB87", spec: "< 1 Ω", good: "0.5", bad: "OL", unit: "Ω" },
    ],
  },
  {
    ref: "A1", code: "A1", group: "Air & fuel", name: "Injector 1", img: "", sym: "inj",
    pins: [1, 2],
    pinFn: { 1: "Supply +12 V from main relay", 2: "Earth switching from control unit" },
    ecu: { code: "E1", name: "Engine control unit", pins: ["A1", "A2", "A3", "B20"] },
    links: { 2: "B20" }, supply: [1],
    steps: [
      { mode: "OHM", red: "c1", black: "c2", spec: "11.6 – 12.4 Ω", good: "12.0", bad: "OL", unit: "Ω" },
      { mode: "VDC", red: "c1", black: "gnd", spec: "12 – 14.4 V", good: "13.2", bad: "0.1", unit: "V" },
      { mode: "VDC", red: "c2", black: "gnd", spec: "0.5 – 2 V", good: "1.21", bad: "13.1", unit: "V" },
      { mode: "MA", red: "c1", black: "c2", spec: "0.8 – 1.4 A", good: "1.05", bad: "0.02", unit: "A" },
      { mode: "OHM", red: "c2", black: "eB20", spec: "< 1 Ω", good: "0.5", bad: "OL", unit: "Ω" },
    ],
  },
  {
    ref: "H3", code: "H3", group: "Air & fuel", name: "Throttle control motor with position sensor", img: "ref/throttle/1.png", sym: "motorpot",
    pins: [1, 2, 3, 4, 5, 6],
    pinFn: { 1: "Motor terminal (–)", 2: "Motor terminal (+)", 3: "Potentiometer earth", 4: "Position signal 2", 5: "Potentiometer 5 V supply", 6: "Position signal 1" },
    ecu: { code: "E1", name: "Engine control unit", pins: ["B116", "B84", "B115", "B83", "B60", "B30"] },
    links: { 6: "B116", 5: "B84", 4: "B115", 3: "B83", 2: "B60", 1: "B30" }, supply: [],
    steps: [
      { mode: "OHM", red: "c2", black: "c1", spec: "0.3 – 100 Ω", good: "50.15", bad: "OL", unit: "Ω" },
      { mode: "VDC", red: "c5", black: "gnd", spec: "4.5 – 5.5 V", good: "5.02", bad: "0.03", unit: "V" },
      { mode: "VDC", red: "c3", black: "gnd", spec: "0 – 0.2 V", good: "0.10", bad: "4.82", unit: "V" },
      { mode: "VDC", red: "c2", black: "c1", spec: "12 – 14.4 V", good: "12.04", bad: "0.00", unit: "V" },
      { mode: "VDC", red: "c6", black: "gnd", spec: "0.4 – 1.0 V", good: "0.68", bad: "0.02", unit: "V" },
      { mode: "VDC", red: "c4", black: "gnd", spec: "3.9 – 4.7 V", good: "4.31", bad: "0.02", unit: "V" },
      { mode: "OHM", red: "c6", black: "eB116", spec: "< 1 Ω", good: "0.5", bad: "OL", unit: "Ω" },
      { mode: "OHM", red: "c4", black: "eB115", spec: "< 1 Ω", good: "0.5", bad: "OL", unit: "Ω" },
      { mode: "OHM", red: "c1", black: "eB30", spec: "< 1 Ω", good: "0.5", bad: "OL", unit: "Ω" },
      { mode: "OHM", red: "c2", black: "eB60", spec: "< 1 Ω", good: "0.5", bad: "OL", unit: "Ω" },
    ],
  },
  {
    ref: "I1", code: "I1", group: "Ignition", name: "Ignition coil 1", img: "", sym: "coil",
    pins: ["A2", "A3"],
    pinFn: { A2: "Supply +12 V from ignition switch", A3: "Trigger signal from control unit" },
    ecu: { code: "E1", name: "Engine control unit", pins: ["B57", "B102"] },
    links: { A3: "B57" }, supply: ["A2"],
    steps: [
      { mode: "VDC", red: "cA2", black: "gnd", spec: "12 – 14.4 V", good: "13.2", bad: "0.1", unit: "V" },
      { mode: "OHM", red: "cA3", black: "eB57", spec: "< 1 Ω", good: "0.5", bad: "OL", unit: "Ω" },
    ],
  },
  {
    ref: "I2", code: "I2", group: "Ignition", name: "Knock sensor", img: "ref/knock/img.jpeg", sym: "knock",
    pins: [1, 2],
    pinFn: { 1: "Sensor earth / screen", 2: "Piezo signal to control unit" },
    ecu: { code: "E1", name: "Engine control unit", pins: ["B123", "B124"] },
    links: { 2: "B123", 1: "B124" }, supply: [],
    steps: [
      { mode: "OHM", red: "c2", black: "c1", spec: "120 – 280 kΩ", good: "200", bad: "OL", unit: "kΩ" },
      { mode: "VDC", red: "c1", black: "gnd", spec: "0 – 0.2 V", good: "0.10", bad: "3.41", unit: "V" },
      { mode: "OHM", red: "c2", black: "eB123", spec: "< 1 Ω", good: "0.5", bad: "OL", unit: "Ω" },
      { mode: "OHM", red: "c1", black: "gnd", spec: "< 1 Ω", good: "0.4", bad: "OL", unit: "Ω" },
      { mode: "OHM", red: "c2", black: "c1", spec: "> 1 MΩ", good: "OL", bad: "12.4", unit: "Ω" },
    ],
  },
  {
    ref: "X1", code: "X1", group: "Position sensors", name: "Crankshaft position sensor (magnetic type)", img: "ref/crank/3.png", sym: "ind",
    pins: [1, 2],
    pinFn: { 1: "Coil terminal / signal +", 2: "Coil terminal / signal –" },
    ecu: { code: "E1", name: "Engine control unit", pins: ["B78", "B110"] },
    links: { 1: "B78", 2: "B110" }, supply: [],
    steps: [
      { mode: "OHM", red: "c1", black: "c2", spec: "1.63 – 2.74 kΩ", good: "2.185", bad: "OL", unit: "kΩ" },
      { mode: "OHM", red: "c1", black: "eB78", spec: "< 1 Ω", good: "0.5", bad: "OL", unit: "Ω" },
      { mode: "OHM", red: "c2", black: "eB110", spec: "< 1 Ω", good: "0.5", bad: "OL", unit: "Ω" },
      { mode: "OHM", red: "c2", black: "gnd", spec: "< 1 Ω", good: "0.4", bad: "OL", unit: "Ω" },
      { mode: "OHM", red: "c1", black: "gnd", spec: "> 1 MΩ", good: "OL", bad: "8.2", unit: "Ω" },
    ],
  },
  {
    ref: "X7", code: "X7", group: "Position sensors", name: "Camshaft position sensor (Hall Effect/MRE type) - inlet", img: "ref/cam/1.png", sym: "hall",
    pins: [1, 2, 3],
    pinFn: { 1: "5 V supply from control unit", 2: "Sensor earth", 3: "Hall signal to control unit" },
    ecu: { code: "E1", name: "Engine control unit", pins: ["B82", "B113", "B114"] },
    links: { 1: "B82", 3: "B113", 2: "B114" }, supply: [],
    steps: [
      { mode: "VDC", red: "c1", black: "gnd", spec: "4.8 – 5.2 V", good: "5.00", bad: "0.03", unit: "V" },
      { mode: "VDC", red: "c2", black: "gnd", spec: "0 – 0.2 V", good: "0.10", bad: "4.71", unit: "V" },
      { mode: "VDC", red: "c3", black: "gnd", spec: "0.3 V ⇄ 4.8 V", good: "4.78", bad: "0.00", unit: "V" },
      { mode: "OHM", red: "c3", black: "eB113", spec: "< 1 Ω", good: "0.5", bad: "OL", unit: "Ω" },
    ],
  },
  {
    ref: "G1", code: "G1", group: "Position sensors", name: "Accelerator pedal position sensor", img: "ref/app/1.png", sym: "pot2",
    pins: [1, 2, 3, 4, 5, 6],
    pinFn: { 1: "Track 1 · 5 V supply", 2: "Track 2 · earth", 3: "Track 2 · output signal", 4: "Track 2 · 5 V supply", 5: "Track 1 · earth", 6: "Track 1 · output signal" },
    ecu: { code: "E1", name: "Engine control unit", pins: ["A53", "A51", "A52", "A55", "A54", "A56"] },
    links: { 1: "A53", 6: "A51", 5: "A52", 2: "A55", 3: "A54", 4: "A56" }, supply: [],
    steps: [
      { mode: "VDC", red: "c4", black: "gnd", spec: "4.8 – 5.2 V", good: "5.01", bad: "0.02", unit: "V" },
      { mode: "VDC", red: "c1", black: "gnd", spec: "4.8 – 5.2 V", good: "4.99", bad: "0.02", unit: "V" },
      { mode: "VDC", red: "c5", black: "gnd", spec: "0 – 0.2 V", good: "0.10", bad: "4.90", unit: "V" },
      { mode: "VDC", red: "c2", black: "gnd", spec: "0 – 0.2 V", good: "0.10", bad: "4.88", unit: "V" },
      { mode: "VDC", red: "eA51", black: "gnd", spec: "See table", good: "0.82", bad: "0.04", unit: "V", table: { head: ["Angle α(º)", "Voltage U(V)"], rows: [["15", "0.5 - 1.1"], ["100", "2.6 - 4.5"]] } },
      { mode: "VDC", red: "eA54", black: "gnd", spec: "See table", good: "1.64", bad: "0.05", unit: "V", table: { head: ["Angle α(º)", "Voltage U(V)"], rows: [["15", "1.2 - 2"], ["100", "3.4 - 4.7"]] } },
    ],
  },
  {
    ref: "U1", code: "U1", group: "Emissions & temperature", name: "Oxygen sensor", img: "ref/o2/6.png", sym: "lambda",
    pins: [1, 2, 3, 4],
    pinFn: { 1: "Sensor signal", 2: "Heater supply +12 V", 3: "Sensor earth / reference", 4: "Heater earth from control unit" },
    ecu: { code: "E1", name: "Engine control unit", pins: ["B22", "B103"] },
    links: { 1: "B22", 3: "B103" }, supply: [2],
    steps: [
      { mode: "OHM", red: "c2", black: "c1", spec: "1.8 – 3.4 Ω", good: "2.6", bad: "OL", unit: "Ω" },
      { mode: "VDC", red: "c2", black: "gnd", spec: "12 – 14.4 V", good: "13.2", bad: "0.2", unit: "V" },
      { mode: "VDC", red: "c4", black: "gnd", spec: "0 – 0.2 V", good: "0.10", bad: "2.74", unit: "V" },
      { mode: "OHM", red: "c1", black: "eB22", spec: "< 1 Ω", good: "0.5", bad: "OL", unit: "Ω" },
      { mode: "OHM", red: "c3", black: "eB103", spec: "< 1 Ω", good: "0.5", bad: "OL", unit: "Ω" },
    ],
  },
  {
    ref: "T1", code: "T1", group: "Emissions & temperature", name: "Coolant temperature sensor", img: "ref/coolant/4.png", sym: "ntc",
    pins: [1, 2],
    pinFn: { 1: "Signal / 5 V supply from control unit", 2: "Sensor earth" },
    ecu: { code: "E1", name: "Engine control unit", pins: ["B93", "B94"] },
    links: { 1: "B93", 2: "B94" }, supply: [],
    steps: [
      { mode: "OHM", red: "c1", black: "c2", spec: "See chart", good: "2.45", bad: "OL", unit: "kΩ", table: { head: ["Temperature T(°C)", "Resistance R(Ω)"], rows: [["20", "2.32 - 2.59 k"], ["80", "310 - 326"]] } },
      { mode: "VDC", red: "c1", black: "gnd", spec: "4.8 – 5.2 V", good: "5.00", bad: "0.02", unit: "V" },
      { mode: "VDC", red: "c2", black: "gnd", spec: "0 – 0.2 V", good: "0.10", bad: "4.91", unit: "V" },
    ],
  },
];

/** Total measurement steps across all components (source: "54 measurement steps"). */
export const MM_STEP_TOTAL = MM_PROCEDURES.reduce((n, c) => n + c.steps.length, 0);

export function mmProcedureByRef(ref: string): MeterProcedureComponent | undefined {
  return MM_PROCEDURES.find((c) => c.ref === ref);
}

/** Human-readable target label helper (canonical): component pin / ECU pin / earth. */
export function probeTargetKind(t: ProbeTarget): "component" | "ecu" | "earth" {
  if (t === "gnd") return "earth";
  return t.charAt(0) === "e" ? "ecu" : "component";
}
