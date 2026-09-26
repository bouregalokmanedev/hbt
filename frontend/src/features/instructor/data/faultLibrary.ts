/**
 * Library of 20 ready-made bench faults for the simulator builder.
 * Instructors pick entries into a pack or author their own; the lab merges
 * the pack manifest over the static dataset, so only overridden ECUs/PIDs
 * change. All ids/codes reference the canonical scanner dataset.
 */

export type FaultNodeStatus = "normal" | "fault" | "warn" | "none" | "offline";
export type FaultDtcStatus = "Current" | "Stored" | "Pending" | "Intermittent";
export type FaultSeverity = "high" | "medium" | "low";

export interface FaultLibraryNode {
    id: string;
    status: FaultNodeStatus;
    dtc: number;
}

export interface FaultLibraryDtc {
    code: string;
    desc: string;
    ecu: string;
    status: FaultDtcStatus;
    severity: FaultSeverity;
    count: number;
}

export interface FaultLibraryPid {
    id: string;
    base: number;
    fault?: boolean;
}

export interface FaultLibraryEntry {
    id: string;
    title: string;
    description: string;
    nodes: FaultLibraryNode[];
    dtcs: FaultLibraryDtc[];
    pids: FaultLibraryPid[];
    adasDone: boolean[];
}

const OK_ADAS = [true, true, false, false, false, false];

export const FAULT_LIBRARY: FaultLibraryEntry[] = [
    {
        id: "throttle-actuator",
        title: "Throttle actuator control",
        description: "Throttle motor current out of range on the ECM.",
        nodes: [{ id: "ECM", status: "fault", dtc: 3 }],
        dtcs: [
            { code: "P2118", desc: "Throttle actuator control motor current range/performance", ecu: "ECM", status: "Current", severity: "high", count: 4 },
        ],
        pids: [{ id: "TPS", base: 3.5 }],
        adasDone: OK_ADAS,
    },
    {
        id: "fuel-rail-low",
        title: "Fuel rail pressure low",
        description: "Rail pressure below requested under load.",
        nodes: [{ id: "ECM", status: "fault", dtc: 2 }],
        dtcs: [
            { code: "P0087", desc: "Fuel rail/system pressure too low", ecu: "ECM", status: "Current", severity: "high", count: 2 },
        ],
        pids: [
            { id: "FRP", base: 8.4, fault: true },
            { id: "LPP", base: 190, fault: true },
        ],
        adasDone: OK_ADAS,
    },
    {
        id: "brake-switch",
        title: "Brake switch correlation",
        description: "Brake switch A/B signals disagree.",
        nodes: [{ id: "ECM", status: "warn", dtc: 1 }],
        dtcs: [
            { code: "P0504", desc: "Brake switch A/B correlation", ecu: "ECM", status: "Pending", severity: "medium", count: 1 },
        ],
        pids: [],
        adasDone: OK_ADAS,
    },
    {
        id: "esc-malfunction",
        title: "ESC system malfunction",
        description: "Stability control reports an internal fault.",
        nodes: [{ id: "ABS", status: "fault", dtc: 1 }],
        dtcs: [
            { code: "C1201", desc: "ESC system malfunction", ecu: "ABS", status: "Current", severity: "high", count: 3 },
        ],
        pids: [],
        adasDone: OK_ADAS,
    },
    {
        id: "lost-comm-brake",
        title: "Lost communication with brake ECU",
        description: "Intermittent CAN drop-outs to the ABS module.",
        nodes: [{ id: "ABS", status: "warn", dtc: 1 }],
        dtcs: [
            { code: "U0129", desc: "Lost communication with brake system", ecu: "ABS", status: "Intermittent", severity: "medium", count: 5 },
        ],
        pids: [],
        adasDone: OK_ADAS,
    },
    {
        id: "camera-calibration",
        title: "Front camera not calibrated",
        description: "ADAS camera calibration incomplete after windshield work.",
        nodes: [{ id: "ADAS", status: "fault", dtc: 2 }],
        dtcs: [
            { code: "B1483", desc: "Front camera calibration not complete", ecu: "ADAS", status: "Stored", severity: "low", count: 1 },
        ],
        pids: [],
        adasDone: [false, false, false, false, false, false],
    },
    {
        id: "tcc-performance",
        title: "Torque converter clutch",
        description: "TCC slip outside expected range in the transmission.",
        nodes: [{ id: "TCM", status: "warn", dtc: 1 }],
        dtcs: [
            { code: "P0741", desc: "Torque converter clutch performance", ecu: "TCM", status: "Pending", severity: "medium", count: 2 },
        ],
        pids: [{ id: "LOAD", base: 28 }],
        adasDone: OK_ADAS,
    },
    {
        id: "tpms-battery",
        title: "TPMS sensor battery low",
        description: "One tyre-pressure sensor reports a dying battery.",
        nodes: [{ id: "TPMS", status: "warn", dtc: 1 }],
        dtcs: [
            { code: "C2126", desc: "TPMS sensor battery low", ecu: "TPMS", status: "Stored", severity: "low", count: 1 },
        ],
        pids: [],
        adasDone: OK_ADAS,
    },
    {
        id: "maf-range",
        title: "MAF sensor range fault",
        description: "Air-mass readings drift out of the expected window.",
        nodes: [{ id: "ECM", status: "fault", dtc: 1 }],
        dtcs: [
            { code: "P0101", desc: "Mass air flow sensor range/performance", ecu: "ECM", status: "Current", severity: "medium", count: 2 },
        ],
        pids: [{ id: "MAF", base: 6.8, fault: true }],
        adasDone: OK_ADAS,
    },
    {
        id: "o2-slow",
        title: "O2 sensor slow response",
        description: "Bank 1 lambda sensor reacts too slowly.",
        nodes: [{ id: "ECM", status: "warn", dtc: 1 }],
        dtcs: [
            { code: "P0133", desc: "O2 sensor slow response bank 1", ecu: "ECM", status: "Stored", severity: "medium", count: 1 },
        ],
        pids: [{ id: "LAM", base: 1.04, fault: true }],
        adasDone: OK_ADAS,
    },
    {
        id: "coolant-rationality",
        title: "Coolant temperature rationality",
        description: "Coolant reading implausible against oil temperature.",
        nodes: [{ id: "ECM", status: "warn", dtc: 1 }],
        dtcs: [
            { code: "P0116", desc: "Coolant temperature rationality fault", ecu: "ECM", status: "Stored", severity: "low", count: 1 },
        ],
        pids: [{ id: "ECT", base: 62, fault: true }],
        adasDone: OK_ADAS,
    },
    {
        id: "knock-sensor",
        title: "Knock sensor circuit",
        description: "Knock signal missing under load.",
        nodes: [{ id: "ECM", status: "fault", dtc: 1 }],
        dtcs: [
            { code: "P0325", desc: "Knock sensor circuit malfunction", ecu: "ECM", status: "Current", severity: "medium", count: 2 },
        ],
        pids: [{ id: "IGN", base: 6, fault: true }],
        adasDone: OK_ADAS,
    },
    {
        id: "evap-leak",
        title: "EVAP small leak",
        description: "Evaporative system leak detected during self-test.",
        nodes: [{ id: "ECM", status: "warn", dtc: 1 }],
        dtcs: [
            { code: "P0442", desc: "Evaporative emission small leak detected", ecu: "ECM", status: "Stored", severity: "low", count: 1 },
        ],
        pids: [],
        adasDone: OK_ADAS,
    },
    {
        id: "catalyst-efficiency",
        title: "Catalyst efficiency low",
        description: "Catalytic converter efficiency below threshold.",
        nodes: [{ id: "ECM", status: "fault", dtc: 1 }],
        dtcs: [
            { code: "P0420", desc: "Catalyst efficiency below threshold bank 1", ecu: "ECM", status: "Stored", severity: "medium", count: 2 },
        ],
        pids: [{ id: "LAM", base: 0.94, fault: true }],
        adasDone: OK_ADAS,
    },
    {
        id: "abs-wheel-speed",
        title: "ABS wheel-speed sensor",
        description: "Front-left wheel-speed signal erratic.",
        nodes: [{ id: "ABS", status: "fault", dtc: 1 }],
        dtcs: [
            { code: "C0035", desc: "Left front wheel-speed sensor circuit", ecu: "ABS", status: "Current", severity: "high", count: 3 },
        ],
        pids: [{ id: "VS", base: 0 }],
        adasDone: OK_ADAS,
    },
    {
        id: "steering-angle",
        title: "Steering angle offset",
        description: "Steering-angle zero point drifted after alignment.",
        nodes: [{ id: "SAS", status: "warn", dtc: 1 }],
        dtcs: [
            { code: "C0460", desc: "Steering angle sensor plausibility", ecu: "ABS", status: "Stored", severity: "medium", count: 1 },
        ],
        pids: [],
        adasDone: [true, false, false, false, false, false],
    },
    {
        id: "battery-charge",
        title: "Charging voltage low",
        description: "System voltage drops at idle with loads on.",
        nodes: [{ id: "ECM", status: "warn", dtc: 1 }],
        dtcs: [
            { code: "P0562", desc: "System voltage low", ecu: "ECM", status: "Pending", severity: "medium", count: 1 },
        ],
        pids: [{ id: "VBAT", base: 11.8, fault: true }],
        adasDone: OK_ADAS,
    },
    {
        id: "trans-range",
        title: "Transmission range sensor",
        description: "Gear selector position implausible.",
        nodes: [{ id: "TCM", status: "fault", dtc: 1 }],
        dtcs: [
            { code: "P0705", desc: "Transmission range sensor circuit", ecu: "TCM", status: "Current", severity: "high", count: 2 },
        ],
        pids: [],
        adasDone: OK_ADAS,
    },
    {
        id: "radar-blocked",
        title: "Front radar blocked",
        description: "Radar field of view obstructed; ADAS degraded.",
        nodes: [
            { id: "ADAS", status: "fault", dtc: 1 },
            { id: "RAD-F", status: "warn", dtc: 0 },
        ],
        dtcs: [
            { code: "U0235", desc: "Lost communication with front radar", ecu: "ADAS", status: "Current", severity: "medium", count: 2 },
        ],
        pids: [],
        adasDone: [false, false, false, false, false, false],
    },
    {
        id: "epb-actuator",
        title: "Parking brake actuator",
        description: "Electric parking brake motor over-current.",
        nodes: [{ id: "EPB", status: "fault", dtc: 1 }],
        dtcs: [
            { code: "C0280", desc: "Parking brake motor circuit range", ecu: "EPB", status: "Current", severity: "medium", count: 2 },
        ],
        pids: [],
        adasDone: OK_ADAS,
    },
];

export function libraryEntryById(id: string): FaultLibraryEntry | null {
    return FAULT_LIBRARY.find((entry) => entry.id === id) ?? null;
}
