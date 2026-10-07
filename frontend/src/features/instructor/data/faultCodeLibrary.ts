/**
 * Curated library of fault codes for the scanner fault-variant builder.
 * Instructors pick entries from here (or type their own code by hand) when
 * authoring a fault pack. ECU ids reference the canonical scanner NODES
 * dataset so prefilled rows match the ECU dropdown options.
 */

export type FaultCodeCategory =
    | "powertrain"
    | "manufacturer"
    | "body"
    | "chassis"
    | "network";

export type FaultCodeSeverity = "high" | "medium" | "low";

export interface FaultCodeEntry {
    /** DTC code, e.g. "P0300". */
    code: string;
    /** Short student-facing description. */
    desc: string;
    category: FaultCodeCategory;
    /** Suggested ECU (must match a scanner NODES id). */
    ecu: string;
    severity: FaultCodeSeverity;
}

export const FAULT_CODE_LIBRARY: FaultCodeEntry[] = [
    // ---- Powertrain (P0) ----
    { code: "P0087", desc: "Fuel rail/system pressure too low", category: "powertrain", ecu: "ECM", severity: "high" },
    { code: "P0101", desc: "Mass airflow circuit range/performance", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0102", desc: "Mass airflow circuit low input", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0113", desc: "Intake air temperature sensor 1 circuit high", category: "powertrain", ecu: "ECM", severity: "low" },
    { code: "P0116", desc: "Engine coolant temperature sensor range/performance", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0128", desc: "Coolant thermostat below regulating temperature", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0130", desc: "O2 sensor circuit bank 1 sensor 1", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0133", desc: "O2 sensor circuit slow response bank 1 sensor 1", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0135", desc: "O2 sensor heater circuit bank 1 sensor 1", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0171", desc: "System too lean bank 1", category: "powertrain", ecu: "ECM", severity: "high" },
    { code: "P0172", desc: "System too rich bank 1", category: "powertrain", ecu: "ECM", severity: "high" },
    { code: "P0201", desc: "Injector circuit cylinder 1", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0300", desc: "Random/multiple cylinder misfire detected", category: "powertrain", ecu: "ECM", severity: "high" },
    { code: "P0301", desc: "Cylinder 1 misfire detected", category: "powertrain", ecu: "ECM", severity: "high" },
    { code: "P0302", desc: "Cylinder 2 misfire detected", category: "powertrain", ecu: "ECM", severity: "high" },
    { code: "P0325", desc: "Knock sensor 1 circuit", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0335", desc: "Crankshaft position sensor A circuit", category: "powertrain", ecu: "ECM", severity: "high" },
    { code: "P0340", desc: "Camshaft position sensor A circuit", category: "powertrain", ecu: "ECM", severity: "high" },
    { code: "P0401", desc: "Exhaust gas recirculation flow insufficient", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0403", desc: "Exhaust gas recirculation circuit", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0420", desc: "Catalyst system efficiency below threshold bank 1", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0440", desc: "Evaporative emission control system", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0442", desc: "Evaporative emission control system leak detected (small)", category: "powertrain", ecu: "ECM", severity: "low" },
    { code: "P0455", desc: "Evaporative emission control system leak detected (gross)", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0500", desc: "Vehicle speed sensor A", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0504", desc: "Brake switch A/B correlation", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0505", desc: "Idle air control system", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0700", desc: "Transmission control system malfunction", category: "powertrain", ecu: "TCM", severity: "high" },
    { code: "P0715", desc: "Input/turbine speed sensor circuit", category: "powertrain", ecu: "TCM", severity: "medium" },
    { code: "P0720", desc: "Output speed sensor circuit", category: "powertrain", ecu: "TCM", severity: "medium" },
    { code: "P0730", desc: "Incorrect gear ratio", category: "powertrain", ecu: "TCM", severity: "high" },
    { code: "P0741", desc: "Torque converter clutch circuit performance", category: "powertrain", ecu: "TCM", severity: "medium" },
    { code: "P0750", desc: "Shift solenoid A", category: "powertrain", ecu: "TCM", severity: "medium" },
    { code: "P2118", desc: "Throttle actuator control motor current range/performance", category: "powertrain", ecu: "ECM", severity: "high" },

    // ---- Manufacturer (P1) ----
    { code: "P1171", desc: "Throttle control motor circuit", category: "manufacturer", ecu: "ECM", severity: "high" },
    { code: "P1411", desc: "Secondary air injection system flow detected", category: "manufacturer", ecu: "ECM", severity: "medium" },

    // ---- Body (B) ----
    { code: "B0020", desc: "Driver frontal airbag deployment loop", category: "body", ecu: "SRS", severity: "high" },
    { code: "B0429", desc: "Interior air temperature actuator circuit", category: "body", ecu: "HVAC", severity: "low" },
    { code: "B1000", desc: "Control module general failure", category: "body", ecu: "BCM", severity: "high" },
    { code: "B1318", desc: "Low battery voltage", category: "body", ecu: "BCM", severity: "medium" },
    { code: "B1483", desc: "Front camera calibration not complete", category: "body", ecu: "ADAS", severity: "low" },

    // ---- Chassis (C) ----
    { code: "C0035", desc: "Left front wheel speed sensor circuit", category: "chassis", ecu: "ABS", severity: "high" },
    { code: "C0040", desc: "Right front wheel speed sensor circuit", category: "chassis", ecu: "ABS", severity: "high" },
    { code: "C0561", desc: "System disabled — information stored", category: "chassis", ecu: "ABS", severity: "medium" },
    { code: "C1201", desc: "Engine control system malfunction — ESC inhibited", category: "chassis", ecu: "ABS", severity: "high" },
    { code: "C2126", desc: "TPMS sensor battery low", category: "chassis", ecu: "TPMS", severity: "low" },

    // ---- Network (U) ----
    { code: "U0001", desc: "High speed CAN communication bus", category: "network", ecu: "ECM", severity: "high" },
    { code: "U0100", desc: "Lost communication with engine control module", category: "network", ecu: "TCM", severity: "high" },
    { code: "U0129", desc: "Lost communication with brake system control module", category: "network", ecu: "ABS", severity: "medium" },
    { code: "U0140", desc: "Lost communication with body control module", category: "network", ecu: "BCM", severity: "medium" },
    { code: "U0201", desc: "Lost communication with door control module A", category: "network", ecu: "DDM", severity: "medium" },
];

/** Exact lookup for a typed code (case-insensitive). */
export function faultCodeByCode(code: string): FaultCodeEntry | undefined {
    const q = code.trim().toUpperCase();
    if (!q) return undefined;
    return FAULT_CODE_LIBRARY.find((entry) => entry.code === q);
}

/** Case-insensitive search across code, description, ECU and category. */
export function searchFaultCodes(query: string, limit = 100): FaultCodeEntry[] {
    const q = query.trim().toUpperCase();
    if (!q) return FAULT_CODE_LIBRARY.slice(0, limit);
    return FAULT_CODE_LIBRARY.filter(
        (entry) =>
            entry.code.includes(q) ||
            entry.desc.toUpperCase().includes(q) ||
            entry.ecu.toUpperCase().includes(q) ||
            entry.category.toUpperCase().includes(q),
    ).slice(0, limit);
}
