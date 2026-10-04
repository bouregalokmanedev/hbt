/**
 * Scanner canonical datasets — ported from the hb-tronics-simulator reference
 * (data/scanner + data/shared/vehicles + features/scanner/data).
 *
 * Class-B facts (ids, codes, specs, counts) are never translated; UI prose
 * stays in the i18n dictionaries. Version with the dataset: 2026.7.
 */

import type { DtcDetail } from "./dtc.details";

export const SCANNER_DATASET_VERSION = "2026.7";

/* ---------------- ECUs ---------------- */

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

export const LAST_SCAN = "27 Jul 12:18";

export const NODES: EcuNode[] = [
    { id: "BCM", name: "Body Control Module", bus: "CAN-B", status: "normal", dtc: 0, protocol: "UDS", x: 60, y: 40 },
    { id: "IPC", name: "Instrument Cluster", bus: "CAN-B", status: "normal", dtc: 0, protocol: "UDS", x: 200, y: 40 },
    { id: "HVAC", name: "Climate Control", bus: "CAN-B", status: "normal", dtc: 0, protocol: "KWP2000", x: 340, y: 40 },
    { id: "IMMO", name: "Immobilizer", bus: "CAN-B", status: "normal", dtc: 0, protocol: "UDS", x: 480, y: 40 },
    { id: "TPMS", name: "Tyre Pressure Monitor", bus: "CAN-B", status: "warn", dtc: 1, protocol: "UDS", x: 620, y: 40 },
    { id: "DDM", name: "Driver Door Module", bus: "CAN-B", status: "normal", dtc: 0, protocol: "LIN", x: 760, y: 40 },
    { id: "PDM", name: "Passenger Door Module", bus: "CAN-B", status: "normal", dtc: 0, protocol: "LIN", x: 900, y: 40 },
    { id: "ECM", name: "Engine Control Module", bus: "CAN-C", status: "fault", dtc: 3, protocol: "UDS", x: 60, y: 170 },
    { id: "TCM", name: "Transmission Control", bus: "CAN-C", status: "warn", dtc: 1, protocol: "UDS", x: 200, y: 170 },
    { id: "ABS", name: "ABS / ESC", bus: "CAN-C", status: "fault", dtc: 1, protocol: "UDS", x: 340, y: 170 },
    { id: "SRS", name: "Airbag / SRS", bus: "CAN-C", status: "normal", dtc: 0, protocol: "KWP2000", x: 480, y: 170 },
    { id: "EPS", name: "Electric Power Steering", bus: "CAN-C", status: "normal", dtc: 0, protocol: "UDS", x: 620, y: 170 },
    { id: "EPB", name: "Electric Parking Brake", bus: "CAN-C", status: "normal", dtc: 0, protocol: "UDS", x: 760, y: 170 },
    { id: "SAS", name: "Steering Angle Sensor", bus: "CAN-C", status: "normal", dtc: 0, protocol: "UDS", x: 900, y: 170 },
    { id: "ADAS", name: "Driver Assistance ECU", bus: "CAN-FD", status: "fault", dtc: 2, protocol: "DoIP", x: 60, y: 300 },
    { id: "CAM-F", name: "Front Camera", bus: "CAN-FD", status: "normal", dtc: 0, protocol: "DoIP", x: 200, y: 300 },
    { id: "RAD-F", name: "Front Radar", bus: "CAN-FD", status: "normal", dtc: 0, protocol: "DoIP", x: 340, y: 300 },
    { id: "BSM-L", name: "Blind-spot Radar L", bus: "CAN-FD", status: "normal", dtc: 0, protocol: "DoIP", x: 480, y: 300 },
    { id: "BSM-R", name: "Blind-spot Radar R", bus: "CAN-FD", status: "normal", dtc: 0, protocol: "DoIP", x: 620, y: 300 },
    { id: "PDC", name: "Park Distance Control", bus: "CAN-FD", status: "normal", dtc: 0, protocol: "UDS", x: 760, y: 300 },
    { id: "SVC", name: "Surround View Camera", bus: "CAN-FD", status: "none", dtc: 0, protocol: "—", x: 900, y: 300 },
];

/* ---------------- DTCs ---------------- */

export type DtcStatus = "Current" | "Stored" | "Pending" | "Intermittent";

export interface Dtc {
    code: string;
    desc: string;
    ecu: string;
    /** System group shown next to the ECU (Engine, Chassis, ADAS, …). */
    sys?: string;
    status: DtcStatus;
    severity: "high" | "medium" | "low";
    count: number;
    firstKm: number;
    lastKm: number;
    firstSeen?: string;
    lastSeen?: string;
    freezeFrame: boolean;
}

export const DTCS: Dtc[] = [
    { code: "P2118", desc: "Throttle actuator control motor current range/performance", ecu: "ECM", sys: "Engine", status: "Current", severity: "high", count: 4, firstKm: 97800, lastKm: 98420, firstSeen: "21 Jul", lastSeen: "27 Jul", freezeFrame: true },
    { code: "P0087", desc: "Fuel rail/system pressure too low", ecu: "ECM", sys: "Engine", status: "Stored", severity: "high", count: 2, firstKm: 97500, lastKm: 98010, firstSeen: "11 Jul", lastSeen: "24 Jul", freezeFrame: true },
    { code: "P0504", desc: "Brake switch A/B correlation", ecu: "ECM", sys: "Engine", status: "Pending", severity: "medium", count: 1, firstKm: 98200, lastKm: 98200, firstSeen: "25 Jul", lastSeen: "25 Jul", freezeFrame: false },
    { code: "C1201", desc: "Engine control system malfunction — ESC inhibited", ecu: "ABS", sys: "Chassis", status: "Current", severity: "high", count: 3, firstKm: 98000, lastKm: 98420, firstSeen: "21 Jul", lastSeen: "27 Jul", freezeFrame: false },
    { code: "U0129", desc: "Lost communication with brake system control module", ecu: "ABS", sys: "Chassis", status: "Intermittent", severity: "medium", count: 5, firstKm: 97000, lastKm: 98300, firstSeen: "09 Jul", lastSeen: "26 Jul", freezeFrame: false },
    { code: "B1483", desc: "Front camera calibration not complete", ecu: "ADAS", sys: "ADAS", status: "Stored", severity: "low", count: 1, firstKm: 98100, lastKm: 98100, firstSeen: "22 Jul", lastSeen: "22 Jul", freezeFrame: false },
    { code: "P0741", desc: "Torque converter clutch circuit performance", ecu: "TCM", sys: "Transmission", status: "Pending", severity: "medium", count: 2, firstKm: 96000, lastKm: 98000, firstSeen: "02 Jul", lastSeen: "24 Jul", freezeFrame: false },
    { code: "C2126", desc: "TPMS sensor battery low", ecu: "TPMS", sys: "Chassis", status: "Stored", severity: "low", count: 1, firstKm: 95000, lastKm: 95000, firstSeen: "01 Jul", lastSeen: "01 Jul", freezeFrame: false },
];

export interface DtcCause {
    id: string;
    confidence: number;
}

export interface DtcLiveExpected {
    pid: string;
    expected: string;
    measured: string;
    ok: boolean;
}

export const DTC_DETAIL: Record<string, { causes: DtcCause[]; liveExpected: DtcLiveExpected[] }> = {
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

/* ---------------- Live PIDs (18) ---------------- */

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

/* ---------------- Fault tree (P2118, 7 steps) ---------------- */

export interface TreeStep {
    id: string;
    label: string;
    measure: string;
    expected: string;
    ok: boolean;
    terminal?: boolean;
}

export const TREE: TreeStep[] = [
    { id: "supply", label: "Check supply voltage at throttle connector", measure: "13.92 V", expected: "> 12.0 V", ok: true },
    { id: "connector", label: "Inspect connector for corrosion/damage", measure: "OK", expected: "No spread terminals", ok: true },
    { id: "motorSupply", label: "Check motor supply at ECU pin", measure: "13.88 V", expected: "> 12.0 V", ok: true },
    { id: "ground", label: "Measure ground resistance", measure: "0.4 Ω", expected: "< 1.0 Ω", ok: true },
    { id: "can", label: "Check CAN communication", measure: "No U-codes", expected: "Bus healthy", ok: true },
    { id: "winding", label: "Measure motor resistance", measure: "6.42 Ω", expected: "0.3 – 1.8 Ω", ok: false, terminal: true },
    { id: "correlation", label: "Check TP correlation", measure: "—", expected: "TP1/TP2 track", ok: true },
];

/* ---------------- Training scenario 12 ---------------- */

export interface TrainingStep {
    id: string;
    screen: string;
}

export const TRAINING_STEPS: TrainingStep[] = [
    { id: "codes", screen: "dtcs" },
    { id: "live", screen: "livedata" },
    { id: "graph", screen: "graph" },
    { id: "supply", screen: "livedata" },
    { id: "isolate", screen: "dashboard" },
    { id: "confirm", screen: "training" },
];

export const TRAINING_ANSWERS = ["pump", "filter", "injector", "sensor"] as const;
export const TRAINING_CORRECT = 1;
export const TRAINING_SCORES = { accuracy: 92, process: 88, time: 76 };

export const ACTIVE_SCENARIO = {
    n: 12,
    difficulty: "intermediate",
    durationMin: 25,
    level: "L2",
    levelPct: 68,
    objectiveCount: 4,
};

export const SCENARIO_LIBRARY: { n: number; status: "passed" | "progress" | "locked"; score?: number }[] = [
    { n: 11, status: "passed", score: 94 },
    { n: 12, status: "progress" },
    { n: 13, status: "locked" },
    { n: 14, status: "locked" },
];

export const SCENARIO_COUNT = 64;

/* ---------------- ADAS ---------------- */

export type AdasStatus = "required" | "calibrated" | "notEquipped";

export interface AdasItem {
    id: string;
    status: AdasStatus;
}

export const ADAS_ITEMS: AdasItem[] = [
    { id: "camera", status: "required" },
    { id: "frontRadar", status: "calibrated" },
    { id: "blindL", status: "calibrated" },
    { id: "blindR", status: "required" },
    { id: "park", status: "calibrated" },
    { id: "surround", status: "notEquipped" },
];

export const ADAS_ACTIVE = {
    itemId: "camera",
    type: "static" as const,
    targetBoard: "HB-T14",
    distance: "1.28 m",
    tolerance: "± 5 mm",
    dtc: "B1483",
    preconditionCount: 6,
};

/* ---------------- Assistant (deterministic dialogue skeleton) ---------------- */

export const ASSISTANT_TURNS = [
    { opts: ["t0a", "t0b"], reply: "r0" },
    { opts: ["t1a", "t1b"], reply: "r1" },
    { opts: ["t2a", "t2b"], reply: "r2" },
    { opts: ["t3a", "t3b"], reply: "r3" },
] as const;

/* ---------------- Vehicle catalogue (garage, 4) ---------------- */

export type Coverage = "ok" | "avail" | "none";
export type ToolId = "scanner" | "multimeter" | "oscilloscope" | "location" | "schematic";

export interface Vehicle {
    id: string;
    name: string;
    engine: string;
    transmission: string;
    vin: string;
    odometerKm: number;
    installed: boolean;
    coverage: Record<ToolId, Coverage>;
}

export const VEH: Vehicle[] = [
    {
        id: "corolla",
        name: "Toyota Corolla 1.6 16V VVT-i",
        engine: "1ZR-FE",
        transmission: "6 MT",
        vin: "JTNBV58E90J123456",
        odometerKm: 98420,
        installed: true,
        coverage: { scanner: "ok", multimeter: "ok", oscilloscope: "ok", location: "ok", schematic: "ok" },
    },
    {
        id: "camry",
        name: "Toyota Camry 2.5",
        engine: "A25A-FKS",
        transmission: "8 AT",
        vin: "4T1BZ1FB7LU012345",
        odometerKm: 42110,
        installed: false,
        coverage: { scanner: "avail", multimeter: "avail", oscilloscope: "avail", location: "avail", schematic: "avail" },
    },
    {
        id: "golf",
        name: "VW Golf 1.6 TDI",
        engine: "CZCA",
        transmission: "5 MT",
        vin: "WVWZZZ1KZAW000111",
        odometerKm: 176500,
        installed: false,
        coverage: { scanner: "ok", multimeter: "avail", oscilloscope: "none", location: "avail", schematic: "none" },
    },
    {
        id: "i30",
        name: "Hyundai i30 1.6 CRDi",
        engine: "D4FB",
        transmission: "6 MT",
        vin: "TMAD381CAFJ099887",
        odometerKm: 121300,
        installed: false,
        coverage: { scanner: "none", multimeter: "none", oscilloscope: "none", location: "none", schematic: "none" },
    },
];

export function vehicleById(id: string): Vehicle | undefined {
    return VEH.find((v) => v.id === id);
}

/* ---------------- Per-vehicle fault profiles ----------------
   Each garage vehicle gets its own fault environment: which ECUs report,
   which DTCs are present, and how live values behave. The P2118 bench tree
   stays the training scenario for every vehicle; the surroundings change,
   so switching vehicles changes results, scores and reports. */

export interface VehicleProfile {
    nodes: EcuNode[];
    dtcs: Dtc[];
    pids: Pid[];
    adasDone: boolean[];
    /** Instructor-authored DTC dossiers from the pack manifest, keyed by code. */
    dtcDetails?: Record<string, DtcDetail>;
}

function withNodes(statuses: Partial<Record<string, { status: NodeStatus; dtc: number }>>): EcuNode[] {
    return NODES.map((n) => (statuses[n.id] ? { ...n, ...statuses[n.id]! } : { ...n }));
}

function withPids(bases: Partial<Record<string, { base: number; fault?: boolean }>>): Pid[] {
    return PARAMS.map((p) => {
        const over = bases[p.id];
        if (!over) return { ...p };
        return { ...p, base: over.base, fault: over.fault ?? p.fault };
    });
}

/** All 21 ECUs reporting normal / 0 DTCs ("none" = not equipped stays none). */
function healthyNodes(): EcuNode[] {
    return NODES.map((n) => ({ ...n, status: n.status === "none" ? "none" : "normal", dtc: 0 }));
}

/** All PIDs in-spec — clear the fault flags baked into PARAMS (FRP, LPP). */
function healthyPids(): Pid[] {
    return PARAMS.map((p) => ({ ...p, fault: false }));
}

const COROLLA_PROFILE: VehicleProfile = {
    nodes: withNodes({}),
    dtcs: [...DTCS],
    pids: withPids({}),
    adasDone: [true, true, false, false, false, false],
};

/** New vehicle with no instructor faults: full 21-ECU copy, 0 DTCs, all live values good. */
export const HEALTHY_PROFILE: VehicleProfile = {
    nodes: healthyNodes(),
    dtcs: [],
    pids: healthyPids(),
    adasDone: [true, true, false, false, false, false],
};

const CAMRY_PROFILE: VehicleProfile = {
    nodes: withNodes({
        ECM: { status: "fault", dtc: 2 },
        TCM: { status: "warn", dtc: 1 },
        ABS: { status: "normal", dtc: 0 },
        TPMS: { status: "warn", dtc: 1 },
        ADAS: { status: "fault", dtc: 1 },
    }),
    dtcs: [
        { code: "P0087", desc: "Fuel rail/system pressure too low", ecu: "ECM", status: "Current", severity: "high", count: 3, firstKm: 41500, lastKm: 42110, freezeFrame: true },
        { code: "P2118", desc: "Throttle actuator control motor current range/performance", ecu: "ECM", status: "Stored", severity: "high", count: 1, firstKm: 41000, lastKm: 41000, freezeFrame: false },
        { code: "P0504", desc: "Brake switch A/B correlation", ecu: "ECM", status: "Pending", severity: "medium", count: 1, firstKm: 41900, lastKm: 41900, freezeFrame: false },
        { code: "P0741", desc: "Torque converter clutch circuit performance", ecu: "TCM", status: "Pending", severity: "medium", count: 2, firstKm: 40000, lastKm: 41500, freezeFrame: false },
        { code: "B1483", desc: "Front camera calibration not complete", ecu: "ADAS", status: "Stored", severity: "low", count: 1, firstKm: 41800, lastKm: 41800, freezeFrame: false },
        { code: "C2126", desc: "TPMS sensor battery low", ecu: "TPMS", status: "Stored", severity: "low", count: 1, firstKm: 39000, lastKm: 39000, freezeFrame: false },
    ],
    pids: withPids({
        RPM: { base: 800 },
        ECT: { base: 91 },
        FRP: { base: 8.4, fault: true },
        LPP: { base: 190, fault: true },
        MAF: { base: 3.8 },
    }),
    adasDone: [true, false, false, false, false, false],
};

const GOLF_PROFILE: VehicleProfile = {
    nodes: withNodes({
        ECM: { status: "warn", dtc: 1 },
        TCM: { status: "normal", dtc: 0 },
        ABS: { status: "fault", dtc: 2 },
        TPMS: { status: "normal", dtc: 0 },
        ADAS: { status: "normal", dtc: 0 },
    }),
    dtcs: [
        { code: "C1201", desc: "Electronic stability control system malfunction", ecu: "ABS", status: "Current", severity: "high", count: 4, firstKm: 175000, lastKm: 176500, freezeFrame: false },
        { code: "U0129", desc: "Lost communication with brake system control module", ecu: "ABS", status: "Current", severity: "medium", count: 3, firstKm: 174000, lastKm: 176500, freezeFrame: false },
        { code: "P0504", desc: "Brake switch A/B correlation", ecu: "ECM", status: "Stored", severity: "medium", count: 1, firstKm: 176000, lastKm: 176000, freezeFrame: false },
        { code: "P0741", desc: "Torque converter clutch circuit performance", ecu: "TCM", status: "Pending", severity: "medium", count: 1, firstKm: 170000, lastKm: 175000, freezeFrame: false },
        { code: "P0087", desc: "Fuel rail/system pressure too low", ecu: "ECM", status: "Stored", severity: "high", count: 1, firstKm: 173000, lastKm: 173000, freezeFrame: true },
    ],
    pids: withPids({
        RPM: { base: 780 },
        FRP: { base: 12.5 },
        LPP: { base: 300 },
        MAP: { base: 36 },
        MAF: { base: 3.8 },
    }),
    adasDone: [true, true, true, false, false, false],
};

const VEHICLE_PROFILES: Record<string, VehicleProfile> = {
    corolla: COROLLA_PROFILE,
    camry: CAMRY_PROFILE,
    golf: GOLF_PROFILE,
};

export function getVehicleProfile(vehicleId: string): VehicleProfile {
    return VEHICLE_PROFILES[vehicleId] ?? COROLLA_PROFILE;
}

/* ---------------- Brand drill-down (select screen) ---------------- */

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
            {
                model: "Corolla",
                variants: [
                    { variant: "1.6 16V VVT-i", engine: "1ZR-FE", years: "2013–2018" },
                    { variant: "1.8 Hybrid", engine: "2ZR-FXE", years: "2016–2019" },
                ],
            },
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

/* ---------------- Workstation landing ---------------- */

export type HeroTone = "dark" | "brand" | "light";

export interface HeroPanel {
    id: "intelligent" | "local" | "reset";
    tone: HeroTone;
    route?: "dashboard" | "dtcs" | "network" | "training" | "adas" | "history";
}

export const HERO_PANELS: HeroPanel[] = [
    { id: "intelligent", tone: "dark", route: "dtcs" },
    { id: "local", tone: "brand", route: "dashboard" },
    { id: "reset", tone: "light" },
];

export interface FunctionModule {
    id: string;
    badge: string | null;
    locked?: boolean;
    route?: "dashboard" | "dtcs" | "network" | "training" | "adas" | "history";
}

export const FUNCTION_MODULES: FunctionModule[] = [
    { id: "adas", badge: "2 DUE", route: "adas" },
    { id: "immobilizer", badge: null },
    { id: "tpms", badge: null },
    { id: "history", badge: null, route: "history" },
    { id: "software", badge: "742" },
    { id: "coverage", badge: null },
    { id: "training", badge: "L2 · 68%", route: "training" },
    { id: "knowledge", badge: null },
    { id: "other", badge: null },
    { id: "ecu", badge: null, locked: true },
];

export interface RecentSession {
    vehicle: string;
    meta: string;
    dtc: number;
}

export const RECENT_SESSIONS: RecentSession[] = [
    { vehicle: "Toyota Camry 2.5 G (ASV70)", meta: "27 Jul 2026 · 12:18 · 96 412 km · H. Barakat", dtc: 8 },
    { vehicle: "Toyota Camry 2.5 G (ASV70)", meta: "11 Jul 2026 · 09:42 · 94 880 km · H. Barakat", dtc: 5 },
    { vehicle: "Volkswagen Touareg 3.0 V6 TDI", meta: "02 Jul 2026 · 16:05 · 148 220 km · M. Aziz", dtc: 2 },
];

export const META_CARDS: { id: string; value: string }[] = [
    { id: "vci", value: "HB-LINK 3 · BT" },
    { id: "os", value: "HB-OS 4.2.1 · 3 updates" },
    { id: "coverage", value: "142 brands · 2026.7" },
];
