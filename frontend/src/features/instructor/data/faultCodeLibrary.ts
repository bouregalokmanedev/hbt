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
    { code: "P0230", desc: "Fuel pump primary circuit", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0261", desc: "Cylinder 1 injector circuit low", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0303", desc: "Cylinder 3 misfire detected", category: "powertrain", ecu: "ECM", severity: "high" },
    { code: "P0336", desc: "Crankshaft position sensor A circuit range/performance", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0404", desc: "Exhaust gas recirculation circuit range/performance", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0443", desc: "Evaporative emission purge control valve circuit", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0562", desc: "System voltage low", category: "powertrain", ecu: "ECM", severity: "medium" },
    { code: "P0717", desc: "Input/turbine speed sensor circuit no signal", category: "powertrain", ecu: "TCM", severity: "high" },
    { code: "P0732", desc: "Gear 2 incorrect ratio", category: "powertrain", ecu: "TCM", severity: "high" },
    { code: "P0755", desc: "Shift solenoid B", category: "powertrain", ecu: "TCM", severity: "medium" },
    { code: "P0760", desc: "Shift solenoid C", category: "powertrain", ecu: "TCM", severity: "medium" },
    { code: "P0765", desc: "Shift solenoid D", category: "powertrain", ecu: "TCM", severity: "medium" },
    { code: "P1520", desc: "Intake manifold runner control", category: "powertrain", ecu: "ECM", severity: "low" },
    { code: "P1614", desc: "Immobilizer signal error", category: "manufacturer", ecu: "CAS", severity: "high" },
    { code: "P1621", desc: "Immobilizer ID not recognized", category: "manufacturer", ecu: "CAS", severity: "high" },
    { code: "P1631", desc: "Fuel pump control module fault", category: "manufacturer", ecu: "EKPS", severity: "medium" },
    { code: "P1650", desc: "Steering angle sensor plausibility", category: "manufacturer", ecu: "ICM", severity: "medium" },
    { code: "P1748", desc: "Transmission solenoid power stage", category: "manufacturer", ecu: "TCM", severity: "high" },

    // ---- Manufacturer (P1) ----
    { code: "P1171", desc: "Throttle control motor circuit", category: "manufacturer", ecu: "ECM", severity: "high" },
    { code: "P1411", desc: "Secondary air injection system flow detected", category: "manufacturer", ecu: "ECM", severity: "medium" },
    { code: "P1602", desc: "Battery voltage out of range", category: "manufacturer", ecu: "ECM", severity: "medium" },

    // ---- Body (B) ----
    { code: "B0020", desc: "Driver frontal airbag deployment loop", category: "body", ecu: "SRS", severity: "high" },
    { code: "B0021", desc: "Passenger frontal airbag deployment loop", category: "body", ecu: "SRS", severity: "high" },
    { code: "B0081", desc: "Passenger seat occupancy sensor", category: "body", ecu: "SRS", severity: "medium" },
    { code: "B0429", desc: "Interior air temperature actuator circuit", category: "body", ecu: "HVAC", severity: "low" },
    { code: "B0542", desc: "Interior fan motor circuit", category: "body", ecu: "HVAC", severity: "low" },
    { code: "B1000", desc: "Control module general failure", category: "body", ecu: "BCM", severity: "high" },
    { code: "B1318", desc: "Low battery voltage", category: "body", ecu: "BCM", severity: "medium" },
    { code: "B1320", desc: "Supply voltage too high", category: "body", ecu: "BCM", severity: "medium" },
    { code: "B1414", desc: "Left headlamp leveling motor", category: "body", ecu: "BCM", severity: "low" },
    { code: "B1421", desc: "Rear window defroster relay", category: "body", ecu: "JBE", severity: "low" },
    { code: "B1483", desc: "Front camera calibration not complete", category: "body", ecu: "ADAS", severity: "low" },
    { code: "B1503", desc: "Interior light circuit", category: "body", ecu: "JBE", severity: "low" },
    { code: "B1600", desc: "Door lock motor jammed", category: "body", ecu: "DDM", severity: "medium" },
    { code: "B1710", desc: "Seat heating element open circuit", category: "body", ecu: "SM", severity: "low" },
    { code: "B1800", desc: "Parking sensor front left", category: "body", ecu: "PDC", severity: "low" },
    { code: "B2100", desc: "Roof blind motor fault", category: "body", ecu: "RFR", severity: "low" },
    { code: "B2205", desc: "Exterior mirror heater circuit", category: "body", ecu: "DDM", severity: "low" },

    // ---- Chassis (C) ----
    { code: "C0035", desc: "Left front wheel speed sensor circuit", category: "chassis", ecu: "ABS", severity: "high" },
    { code: "C0040", desc: "Right front wheel speed sensor circuit", category: "chassis", ecu: "ABS", severity: "high" },
    { code: "C0045", desc: "Left rear wheel speed sensor circuit", category: "chassis", ecu: "ABS", severity: "high" },
    { code: "C0050", desc: "Right rear wheel speed sensor circuit", category: "chassis", ecu: "ABS", severity: "high" },
    { code: "C0060", desc: "ABS hydraulic pump motor", category: "chassis", ecu: "ABS", severity: "high" },
    { code: "C0110", desc: "Yaw rate sensor circuit", category: "chassis", ecu: "ICM", severity: "medium" },
    { code: "C0140", desc: "Steering angle sensor circuit", category: "chassis", ecu: "ICM", severity: "medium" },
    { code: "C0161", desc: "Brake pedal switch circuit", category: "chassis", ecu: "ABS", severity: "medium" },
    { code: "C0195", desc: "Brake pressure sensor circuit", category: "chassis", ecu: "DSC", severity: "medium" },
    { code: "C0210", desc: "Lateral acceleration sensor", category: "chassis", ecu: "ICM", severity: "medium" },
    { code: "C0561", desc: "System disabled — information stored", category: "chassis", ecu: "ABS", severity: "medium" },
    { code: "C0567", desc: "Parking brake actuator fault", category: "chassis", ecu: "EPB", severity: "medium" },
    { code: "C0625", desc: "Electric parking brake motor", category: "chassis", ecu: "EPB", severity: "high" },
    { code: "C1101", desc: "Steering torque sensor circuit", category: "chassis", ecu: "EPS", severity: "medium" },
    { code: "C1235", desc: "TPMS sensor not programmed", category: "chassis", ecu: "TPMS", severity: "low" },
    { code: "C1241", desc: "TPMS low pressure warning", category: "chassis", ecu: "TPMS", severity: "medium" },
    { code: "C2000", desc: "Electronic power steering ECU", category: "chassis", ecu: "EPS", severity: "high" },
    { code: "C2126", desc: "TPMS sensor battery low", category: "chassis", ecu: "TBX", severity: "low" },

    // ---- Network (U) ----
    { code: "U0001", desc: "High speed CAN communication bus", category: "network", ecu: "ECM", severity: "high" },
    { code: "U0010", desc: "Medium speed CAN communication bus", category: "network", ecu: "ECM", severity: "medium" },
    { code: "U0100", desc: "Lost communication with engine control module", category: "network", ecu: "TCM", severity: "high" },
    { code: "U0104", desc: "Lost communication with cruise control module", category: "network", ecu: "ECM", severity: "medium" },
    { code: "U0121", desc: "Lost communication with ABS control module", category: "network", ecu: "ABS", severity: "high" },
    { code: "U0126", desc: "Lost communication with steering angle sensor", category: "network", ecu: "ICM", severity: "medium" },
    { code: "U0129", desc: "Lost communication with brake system control module", category: "network", ecu: "ABS", severity: "medium" },
    { code: "U0140", desc: "Lost communication with body control module", category: "network", ecu: "BCM", severity: "medium" },
    { code: "U0151", desc: "Lost communication with airbag control module", category: "network", ecu: "SRS", severity: "high" },
    { code: "U0167", desc: "Lost communication with car access system", category: "network", ecu: "CAS", severity: "high" },
    { code: "U0184", desc: "Lost communication with radio", category: "network", ecu: "CCC", severity: "low" },
    { code: "U0201", desc: "Lost communication with door control module A", category: "network", ecu: "DDM", severity: "medium" },
    { code: "U0212", desc: "Lost communication with steering column module", category: "network", ecu: "SZL", severity: "medium" },
    { code: "U0230", desc: "Lost communication with fuel pump control module", category: "network", ecu: "EKPS", severity: "medium" },
    { code: "U0300", desc: "Control module request — MIL on", category: "network", ecu: "ECM", severity: "high" },
    { code: "U0401", desc: "Invalid data received from engine control module", category: "network", ecu: "ECM", severity: "medium" },
    { code: "U1000", desc: "Control module communication error", category: "network", ecu: "CGM", severity: "high" },
    { code: "U1100", desc: "Control module malfunction", category: "network", ecu: "ICM", severity: "medium" },
];

/** Exact lookup for a typed code (case-insensitive). */
export function faultCodeByCode(code: string): FaultCodeEntry | undefined {
    const q = code.trim().toUpperCase();
    if (!q) return undefined;
    return FAULT_CODE_LIBRARY.find((entry) => entry.code === q);
}

/** Case-insensitive search across code, description, ECU and category. */
export function searchFaultCodes(query: string, limit = FAULT_CODE_LIBRARY.length): FaultCodeEntry[] {
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
