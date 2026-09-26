/**
 * Scanner datasets (06 §1). Class-B canonical data: 21-ECU network on 3 buses,
 * 8 DTCs, 18 live PIDs, 7-step diagnostic tree for P2118.
 */

export type NodeStatus = "normal" | "fault" | "warn" | "none" | "offline";
export type Bus = "CAN-B" | "CAN-C" | "CAN-FD";

export interface EcuNode {
  id: string;
  name: string;
  bus: Bus;
  status: NodeStatus;
  dtc: number;
  protocol: string;
  x: number;
  y: number;
}

export const BUSES: { id: Bus; label: string; rate: string; y: number }[] = [
  { id: "CAN-B", label: "Body 125 kbit/s", rate: "125k", y: 90 },
  { id: "CAN-C", label: "Powertrain 500 kbit/s", rate: "500k", y: 220 },
  { id: "CAN-FD", label: "Chassis/ADAS 2 Mbit/s", rate: "2M", y: 350 },
];

/** Uniform last-scan timestamp for the System List (source shows one scan pass). */
export const LAST_SCAN = "27 Jul 12:18";

export const NODES: EcuNode[] = [
  // CAN-B (7)
  { id: "BCM", name: "Body Control Module", bus: "CAN-B", status: "normal", dtc: 0, protocol: "UDS", x: 60, y: 40 },
  { id: "IPC", name: "Instrument Cluster", bus: "CAN-B", status: "normal", dtc: 0, protocol: "UDS", x: 200, y: 40 },
  { id: "HVAC", name: "Climate Control", bus: "CAN-B", status: "normal", dtc: 0, protocol: "KWP2000", x: 340, y: 40 },
  { id: "IMMO", name: "Immobilizer", bus: "CAN-B", status: "normal", dtc: 0, protocol: "UDS", x: 480, y: 40 },
  { id: "TPMS", name: "Tyre Pressure Monitor", bus: "CAN-B", status: "warn", dtc: 1, protocol: "UDS", x: 620, y: 40 },
  { id: "DDM", name: "Driver Door Module", bus: "CAN-B", status: "normal", dtc: 0, protocol: "LIN", x: 760, y: 40 },
  { id: "PDM", name: "Passenger Door Module", bus: "CAN-B", status: "offline", dtc: 0, protocol: "LIN", x: 900, y: 40 },
  // CAN-C (7)
  { id: "ECM", name: "Engine Control Module", bus: "CAN-C", status: "fault", dtc: 3, protocol: "UDS", x: 60, y: 170 },
  { id: "TCM", name: "Transmission Control", bus: "CAN-C", status: "warn", dtc: 1, protocol: "UDS", x: 200, y: 170 },
  { id: "ABS", name: "ABS / ESC", bus: "CAN-C", status: "fault", dtc: 1, protocol: "UDS", x: 340, y: 170 },
  { id: "SRS", name: "Airbag / SRS", bus: "CAN-C", status: "normal", dtc: 0, protocol: "KWP2000", x: 480, y: 170 },
  { id: "EPS", name: "Electric Power Steering", bus: "CAN-C", status: "normal", dtc: 0, protocol: "UDS", x: 620, y: 170 },
  { id: "EPB", name: "Electric Parking Brake", bus: "CAN-C", status: "normal", dtc: 0, protocol: "UDS", x: 760, y: 170 },
  { id: "SAS", name: "Steering Angle Sensor", bus: "CAN-C", status: "normal", dtc: 0, protocol: "UDS", x: 900, y: 170 },
  // CAN-FD (7)
  { id: "ADAS", name: "Driver Assistance ECU", bus: "CAN-FD", status: "fault", dtc: 2, protocol: "DoIP", x: 60, y: 300 },
  { id: "CAM-F", name: "Front Camera", bus: "CAN-FD", status: "normal", dtc: 0, protocol: "DoIP", x: 200, y: 300 },
  { id: "RAD-F", name: "Front Radar", bus: "CAN-FD", status: "normal", dtc: 0, protocol: "DoIP", x: 340, y: 300 },
  { id: "BSM-L", name: "Blind-spot Radar L", bus: "CAN-FD", status: "normal", dtc: 0, protocol: "DoIP", x: 480, y: 300 },
  { id: "BSM-R", name: "Blind-spot Radar R", bus: "CAN-FD", status: "normal", dtc: 0, protocol: "DoIP", x: 620, y: 300 },
  { id: "PDC", name: "Park Distance Control", bus: "CAN-FD", status: "normal", dtc: 0, protocol: "UDS", x: 760, y: 300 },
  { id: "SVC", name: "Surround View Camera", bus: "CAN-FD", status: "none", dtc: 0, protocol: "—", x: 900, y: 300 },
];

export type DtcStatus = "Current" | "Stored" | "Pending" | "Intermittent";
export interface Dtc {
  code: string;
  desc: string;
  ecu: string;
  status: DtcStatus;
  severity: "high" | "medium" | "low";
  count: number;
  firstKm: number;
  lastKm: number;
  freezeFrame: boolean;
}

export const DTCS: Dtc[] = [
  { code: "P2118", desc: "Throttle actuator control motor current range/performance", ecu: "ECM", status: "Current", severity: "high", count: 4, firstKm: 97800, lastKm: 98420, freezeFrame: true },
  { code: "P0087", desc: "Fuel rail/system pressure too low", ecu: "ECM", status: "Stored", severity: "high", count: 2, firstKm: 97500, lastKm: 98010, freezeFrame: true },
  { code: "P0504", desc: "Brake switch A/B correlation", ecu: "ECM", status: "Pending", severity: "medium", count: 1, firstKm: 98200, lastKm: 98200, freezeFrame: false },
  { code: "C1201", desc: "Electronic stability control system malfunction", ecu: "ABS", status: "Current", severity: "high", count: 3, firstKm: 98000, lastKm: 98420, freezeFrame: false },
  { code: "U0129", desc: "Lost communication with brake system control module", ecu: "ABS", status: "Intermittent", severity: "medium", count: 5, firstKm: 97000, lastKm: 98300, freezeFrame: false },
  { code: "B1483", desc: "Front camera calibration not complete", ecu: "ADAS", status: "Stored", severity: "low", count: 1, firstKm: 98100, lastKm: 98100, freezeFrame: false },
  { code: "P0741", desc: "Torque converter clutch circuit performance", ecu: "TCM", status: "Pending", severity: "medium", count: 2, firstKm: 96000, lastKm: 98000, freezeFrame: false },
  { code: "C2126", desc: "TPMS sensor battery low", ecu: "TPMS", status: "Stored", severity: "low", count: 1, firstKm: 95000, lastKm: 95000, freezeFrame: false },
];

export interface Pid {
  id: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  base: number;
  step: number;
  decimals: number;
  spec: string;
  fault?: boolean;
}

export const PARAMS: Pid[] = [
  { id: "RPM", name: "Engine Speed", unit: "rpm", min: 600, max: 6500, base: 820, step: 40, decimals: 0, spec: "750–850 idle" },
  { id: "VS", name: "Vehicle Speed", unit: "km/h", min: 0, max: 220, base: 0, step: 1, decimals: 0, spec: "0 at idle" },
  { id: "ECT", name: "Coolant Temperature", unit: "°C", min: -40, max: 130, base: 89, step: 1, decimals: 0, spec: "80–95" },
  { id: "EOT", name: "Engine Oil Temperature", unit: "°C", min: -40, max: 150, base: 95, step: 1, decimals: 0, spec: "90–110" },
  { id: "VBAT", name: "Battery Voltage", unit: "V", min: 9, max: 15, base: 13.9, step: 0.1, decimals: 2, spec: "13.5–14.5" },
  { id: "IAT", name: "Intake Air Temperature", unit: "°C", min: -20, max: 80, base: 32, step: 1, decimals: 0, spec: "ambient+" },
  { id: "TPS", name: "Throttle Position", unit: "%", min: 0, max: 100, base: 3.5, step: 0.5, decimals: 1, spec: "0–5 idle" },
  { id: "APP", name: "Accelerator Pedal Position", unit: "%", min: 0, max: 100, base: 0, step: 0.5, decimals: 1, spec: "0 released" },
  { id: "FRP", name: "Fuel Rail Pressure — Actual", unit: "MPa", min: 0, max: 20, base: 11.2, step: 0.3, decimals: 1, spec: "11–14", fault: true },
  { id: "FRPD", name: "Fuel Rail Pressure — Requested", unit: "MPa", min: 0, max: 20, base: 13.0, step: 0.2, decimals: 1, spec: "matches actual" },
  { id: "LPP", name: "Low-pressure Feed", unit: "kPa", min: 0, max: 600, base: 210, step: 15, decimals: 0, spec: "280–350", fault: true },
  { id: "MAP", name: "Boost / Manifold Pressure", unit: "kPa", min: 20, max: 105, base: 34, step: 2, decimals: 0, spec: "30–40 idle" },
  { id: "MAF", name: "Air Mass Flow", unit: "g/s", min: 0, max: 200, base: 3.4, step: 0.3, decimals: 1, spec: "2–5 idle" },
  { id: "LAM", name: "Lambda — Bank 1", unit: "λ", min: 0.7, max: 1.3, base: 1.0, step: 0.02, decimals: 2, spec: "0.98–1.02" },
  { id: "IGN", name: "Ignition Timing", unit: "°", min: -10, max: 45, base: 12, step: 1, decimals: 0, spec: "8–16 idle" },
  { id: "INJ", name: "Injection Timing", unit: "ms", min: 0, max: 20, base: 3.1, step: 0.2, decimals: 1, spec: "2.5–4 idle" },
  { id: "LOAD", name: "Calculated Engine Load", unit: "%", min: 0, max: 100, base: 21, step: 1.5, decimals: 0, spec: "18–25 idle" },
  { id: "IDL", name: "Idle Status", unit: "%", min: 0, max: 100, base: 33, step: 1, decimals: 0, spec: "25–40" },
];

/**
 * DTC-detail 5-tab content (02 §B). Class-B expected values here; learner-facing
 * prose (overview / cause labels / repair) is Class-C, resolved by the UI from
 * the `content` message namespace by id (14 §0 / F7) — no prose stored here.
 */
export interface DtcDetail {
  /** Class-C cause ids (confidence is Class-B); prose lives in content.dtc.<code>.cause.<id> */
  causes: { id: string; confidence: number }[];
  liveExpected: { pid: string; expected: string; measured: string; ok: boolean }[];
}

export const DTC_DETAIL: Record<string, DtcDetail> = {
  P2118: {
    causes: [
      { id: "winding", confidence: 62 },
      { id: "connector", confidence: 18 },
      { id: "wiring", confidence: 12 },
      { id: "ecu", confidence: 8 },
    ],
    liveExpected: [
      { pid: "TPS", expected: "0–5 % idle", measured: "3.5 %", ok: true },
      { pid: "Motor supply", expected: "> 12.0 V", measured: "13.88 V", ok: true },
      { pid: "Motor resistance", expected: "0.3 – 1.8 Ω", measured: "6.42 Ω", ok: false },
    ],
  },
};

export interface TreeStep {
  id: string; // stable content id; label/hint prose live in content.scanner.tree.<id>
  measure: string; // revealed reading (Class-B)
  expected: string; // Class-B
  ok: boolean; // whether this step passes (Class-B)
  terminal?: boolean;
}

// Diagnostic tree for P2118 (06 §1) — fails at motor resistance.
// Learner-facing `label`/`hint` prose is Class-C (content.scanner.tree.<id>.label/.hint).
export const TREE: TreeStep[] = [
  { id: "supply", measure: "13.92 V", expected: "> 12.0 V", ok: true },
  { id: "connector", measure: "OK", expected: "No spread terminals", ok: true },
  { id: "motorSupply", measure: "13.88 V", expected: "> 12.0 V", ok: true },
  { id: "ground", measure: "0.4 Ω", expected: "< 1.0 Ω", ok: true },
  { id: "can", measure: "No U-codes", expected: "Bus healthy", ok: true },
  { id: "winding", measure: "6.42 Ω", expected: "0.3 – 1.8 Ω", ok: false, terminal: true },
  { id: "correlation", measure: "—", expected: "TP1/TP2 track", ok: true },
];

// ADAS calibration items + statuses now live in features/scanner/data/adas.ts
// (the ADAS Calibration workstation model). Prose is Class-C (content.scanner.adas.*).

/** Training scenario 12 (06 §1) — 6 guided steps + single-attempt answer. */
export interface TrainingStep {
  id: string; // content id; label/detail prose live in content.scanner.training.step.<id>
  screen: string; // scanner screen this step points at (Class-B)
}

export const TRAINING_STEPS: TrainingStep[] = [
  { id: "codes", screen: "dtcs" },
  { id: "live", screen: "livedata" },
  { id: "graph", screen: "graph" },
  { id: "supply", screen: "livedata" },
  { id: "isolate", screen: "dashboard" },
  { id: "confirm", screen: "training" },
];

// Root-cause answer ids (06 §1); labels are Class-C (content.scanner.training.answer.<id>).
export const TRAINING_ANSWERS = ["pump", "filter", "injector", "sensor"] as const;
export const TRAINING_CORRECT = 1; // "filter"
export const TRAINING_SCORES = { accuracy: 92, process: 88, time: 76 };

/** Vehicle-selection database (06 §1) — brands → models → variants + VIN decode. */
export interface VehicleVariant {
  variant: string;
  engine: string;
  years: string;
}
export interface VehicleModel {
  model: string;
  variants: VehicleVariant[];
}
export interface VehicleBrand {
  brand: string;
  favourite: boolean;
  models: VehicleModel[];
}

export const BRANDS: VehicleBrand[] = [
  {
    brand: "Toyota",
    favourite: true,
    models: [
      { model: "Corolla", variants: [
        { variant: "1.6 16V VVT-i", engine: "1ZR-FE", years: "2013–2018" },
        { variant: "1.8 Hybrid", engine: "2ZR-FXE", years: "2016–2019" },
      ] },
      { model: "Camry", variants: [{ variant: "2.5 Dynamic Force", engine: "A25A-FKS", years: "2018–2023" }] },
      { model: "RAV4", variants: [{ variant: "2.0 Valvematic", engine: "3ZR-FAE", years: "2013–2018" }] },
    ],
  },
  {
    brand: "Volkswagen",
    favourite: true,
    models: [
      { model: "Golf", variants: [{ variant: "1.6 TDI", engine: "CZCA", years: "2012–2019" }] },
      { model: "Passat", variants: [{ variant: "2.0 TDI", engine: "CRLB", years: "2014–2019" }] },
    ],
  },
  {
    brand: "Hyundai",
    favourite: false,
    models: [{ model: "i30", variants: [{ variant: "1.6 CRDi", engine: "D4FB", years: "2011–2017" }] }],
  },
  {
    brand: "Ford",
    favourite: false,
    models: [{ model: "Focus", variants: [{ variant: "1.0 EcoBoost", engine: "M1DA", years: "2012–2018" }] }],
  },
  {
    brand: "BMW",
    favourite: false,
    models: [{ model: "3 Series", variants: [{ variant: "320d", engine: "N47D20", years: "2011–2015" }] }],
  },
  {
    brand: "Mercedes-Benz",
    favourite: false,
    models: [{ model: "C-Class", variants: [{ variant: "C220d", engine: "OM651", years: "2014–2018" }] }],
  },
];

export const RECENT_VEHICLES = [
  { name: "Toyota Corolla 1ZR-FE", vin: "JTNBV58E90J123456", km: 98420 },
  { name: "Toyota Camry A25A-FKS", vin: "4T1BZ1FB7LU012345", km: 42110 },
  { name: "VW Golf CZCA", vin: "WVWZZZ1KZAW000111", km: 176500 },
];

/**
 * Diagnostic Assistant — the authentic deterministic Socratic dialogue (doc 17,
 * verified against the original tool source). A fixed seed question is followed by
 * 4 turns; at each turn the learner picks one of two predefined replies and the
 * assistant advances to the next scripted response (both replies advance the same
 * — echoed, not branching). This array carries ids only; all prose is Class-C
 * (content.scanner.assist.*). Option ids `t<turn>a|b`, reply ids `r<turn>`.
 */
export const ASSISTANT_TURNS = [
  { opts: ["t0a", "t0b"], reply: "r0" },
  { opts: ["t1a", "t1b"], reply: "r1" },
  { opts: ["t2a", "t2b"], reply: "r2" },
  { opts: ["t3a", "t3b"], reply: "r3" },
] as const;
