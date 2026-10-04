/* Authored fault-code dossiers for the scanner lab.
   Static bench content ships here; instructor packs can override any code
   through `manifest.dtcDetails` (merged in catalog.applyManifest). */

export interface DtcDetailCause {
    label: string;
    note: string;
    pct: number;
}

export interface DtcDetailMeasurement {
    k: string;
    spec: string;
    measured: string;
    ok: boolean;
}

export interface DtcDetailRepairRow {
    label: string;
    value: string;
}

export interface DtcDetail {
    meaning: string;
    related?: { code: string; text: string };
    conditions: string[];
    freeze: DtcDetailMeasurement[];
    tools: string[];
    causesIntro?: string;
    causes: DtcDetailCause[];
    live: DtcDetailMeasurement[];
    repair: { decision: string; evidence: string; rows: DtcDetailRepairRow[]; doNotStop: string };
}

export const DTC_DETAILS: Record<string, DtcDetail> = {
    P2118: {
        meaning:
            "The ECM monitors current draw through the throttle actuator motor and compares commanded plate position against the position reported by the two throttle position sensors. This code sets when the measured motor current falls outside the modelled range for the commanded movement — meaning the motor circuit cannot deliver the expected torque, or the plate is mechanically restricted.",
        related: {
            code: "P0087",
            text: "fuel rail pressure too low. Diagnose the fuel-pressure branch first — a torque-limited engine can force the throttle strategy outside its adaptation window and set this code as a consequence.",
        },
        conditions: [
            "Engine at operating temperature, 85 – 105 °C",
            "Battery voltage above 12.4 V, charging system OK",
            "No pending U-codes on CAN-C",
            "Throttle body free of mechanical obstruction",
            "Ignition ON, engine idling for at least 60 s",
        ],
        freeze: [
            { k: "Throttle motor resistance", spec: "0.3 – 1.8 Ω", measured: "6.42 Ω", ok: false },
            { k: "Motor supply voltage", spec: "B+ ± 0.3 V", measured: "13.81 V", ok: true },
            { k: "Ground circuit", spec: "< 0.5 Ω", measured: "0.21 Ω", ok: true },
            { k: "TP sensor 1", spec: "0.6 – 4.4 V", measured: "0.82 V", ok: true },
            { k: "TP sensor 2", spec: "0.6 – 4.4 V", measured: "0.79 V", ok: true },
            { k: "Commanded vs actual position", spec: "≤ 3 % deviation", measured: "11 % deviation", ok: false },
        ],
        tools: [
            "DVOM with 4-wire resistance mode",
            "Back-probe lead set",
            "HB-LINK 3 bus monitor",
            "Pin tension gauge",
            "Throttle body service kit",
        ],
        causesIntro:
            "Ranked from 2 418 confirmed repairs on this engine family in the HB knowledge cloud. Percentages are the share of cases where that item was the verified fix.",
        causes: [
            { label: "Throttle actuator motor winding open or high-resistance", note: "68 % of confirmed fixes", pct: 68 },
            { label: "Corroded or loose C104 connector terminals", note: "17 % of confirmed fixes", pct: 17 },
            { label: "Open or high-resistance ground at G102", note: "9 % of confirmed fixes", pct: 9 },
            { label: "Carbon build-up binding the throttle plate", note: "4 % of confirmed fixes", pct: 4 },
            { label: "ECM internal driver fault", note: "2 % of confirmed fixes", pct: 2 },
        ],
        live: [
            { k: "Throttle motor resistance", spec: "0.3 – 1.8 Ω", measured: "6.42 Ω", ok: false },
            { k: "Motor supply voltage", spec: "B+ ± 0.3 V", measured: "13.81 V", ok: true },
            { k: "Ground circuit", spec: "< 0.5 Ω", measured: "0.21 Ω", ok: true },
            { k: "TP sensor 1", spec: "0.6 – 4.4 V", measured: "0.82 V", ok: true },
            { k: "TP sensor 2", spec: "0.6 – 4.4 V", measured: "0.79 V", ok: true },
            { k: "Commanded vs actual position", spec: "≤ 3 % deviation", measured: "11 % deviation", ok: false },
        ],
        repair: {
            decision: "Replace throttle body assembly, then relearn",
            evidence:
                "Evidence: motor winding resistance out of specification with supply, ground, CAN and both position sensors verified good. No mechanical binding found on the plate, so cleaning will not resolve it.",
            rows: [
                { label: "Part", value: "22030-0T030 throttle body" },
                { label: "Labour", value: "0.8 h" },
                { label: "Post-repair", value: "Throttle relearn · clear adaptations" },
                { label: "Verification", value: "Road test · re-scan · monitor 2 drive cycles" },
            ],
            doNotStop:
                "P0087 fuel rail pressure remains unresolved and is the code that matches the driver complaint of power loss under load. The low-pressure feed measured 2.1 bar against a 4.5 – 5.5 bar specification. Test filter restriction and delivery volume before returning the vehicle, or it will come back.",
        },
    },
    P0087: {
        meaning:
            "The ECM compares requested fuel-rail pressure against the value reported by the rail sensor. This code sets when actual pressure stays below the commanded value beyond a calibrated time — the high-pressure circuit cannot deliver the fuel the strategy asks for, so power is limited and combustion runs lean under load.",
        related: {
            code: "P2118",
            text: "throttle actuator current may be a consequence: a torque-limited engine forces the throttle strategy outside its adaptation window. Clear the fuel branch before touching the throttle.",
        },
        conditions: [
            "Engine at operating temperature, 85 – 105 °C",
            "Fuel level above one quarter",
            "Battery voltage above 12.4 V",
            "No low-pressure supply DTCs pending",
            "Engine idling for at least 60 s before the request step",
        ],
        freeze: [
            { k: "Low-pressure feed", spec: "4.5 – 5.5 bar", measured: "2.1 bar", ok: false },
            { k: "Requested vs actual rail pressure", spec: "≤ 15 bar deviation", measured: "46 bar deviation", ok: false },
            { k: "Rail sensor supply", spec: "5.00 ± 0.25 V", measured: "5.02 V", ok: true },
            { k: "Fuel temperature", spec: "0 – 90 °C", measured: "41 °C", ok: true },
            { k: "SCV duty cycle", spec: "15 – 85 %", measured: "62 %", ok: true },
        ],
        tools: [
            "Low-pressure fuel gauge with tee adapter",
            "DVOM",
            "Back-probe lead set",
            "Delivery-volume test bottle",
            "HB-LINK 3 bus monitor",
        ],
        causesIntro:
            "Ranked from confirmed fuel-pressure repairs on this engine family in the HB knowledge cloud.",
        causes: [
            { label: "Restricted fuel filter", note: "44 % of confirmed fixes", pct: 44 },
            { label: "Weak low-pressure (lift) pump", note: "23 % of confirmed fixes", pct: 23 },
            { label: "Leaking or blocked injectors", note: "15 % of confirmed fixes", pct: 15 },
            { label: "Faulty rail-pressure sensor", note: "11 % of confirmed fixes", pct: 11 },
            { label: "Stuck suction-control valve", note: "7 % of confirmed fixes", pct: 7 },
        ],
        live: [
            { k: "Rail pressure — actual", spec: "matches requested", measured: "11.2 MPa", ok: false },
            { k: "Rail pressure — requested", spec: "11 – 14 MPa", measured: "13.0 MPa", ok: true },
            { k: "Low-pressure feed", spec: "4.5 – 5.5 bar", measured: "2.1 bar", ok: false },
            { k: "Fuel temperature", spec: "0 – 90 °C", measured: "41 °C", ok: true },
            { k: "SCV duty cycle", spec: "15 – 85 %", measured: "62 %", ok: true },
        ],
        repair: {
            decision: "Replace the fuel filter, then test low-pressure delivery",
            evidence:
                "Evidence: feed pressure measured 2.1 bar against a 4.5 – 5.5 bar specification while pump current and SCV duty cycle both stayed plausible — a restricted supply explains every reading without condemning the pump.",
            rows: [
                { label: "Part", value: "Fuel filter element" },
                { label: "Labour", value: "0.6 h" },
                { label: "Post-repair", value: "Prime system · clear adaptations" },
                { label: "Verification", value: "Idle pressure · full-load snap · 2 drive cycles" },
            ],
            doNotStop:
                "P2118 throttle motor current is still present. Re-check the motor winding after the fuel repair — if it measures 6.42 Ω against a 0.3 – 1.8 Ω specification it needs its own repair regardless of fuel pressure.",
        },
    },
    P0504: {
        meaning:
            "The ECM reads two brake-switch circuits that must agree at every pedal position. This code sets when the two signals disagree beyond a calibrated time — one switch is out of adjustment, sticking internally, or its wiring is damaged.",
        conditions: [
            "Battery voltage above 12.4 V",
            "Brake pedal cycled at least once since the last clear",
            "No CAN faults affecting the ECM",
            "Transmission selector in P or N during the test",
        ],
        freeze: [
            { k: "Stop-lamp switch A", spec: "0 V released / B+ pressed", measured: "12.4 V released", ok: false },
            { k: "Stop-lamp switch B", spec: "B+ released / 0 V pressed", measured: "12.4 V released", ok: true },
            { k: "Battery voltage", spec: "≥ 12.4 V", measured: "13.86 V", ok: true },
            { k: "Cruise state", spec: "Standby with pedal released", measured: "Inhibited", ok: false },
        ],
        tools: ["DVOM", "Back-probe lead set", "Brake-pedal stop adjuster", "Scan tool with actuation test"],
        causes: [
            { label: "Stop-lamp switch out of adjustment", note: "41 % of confirmed fixes", pct: 41 },
            { label: "Corroded connector at the pedal bracket", note: "24 % of confirmed fixes", pct: 24 },
            { label: "Worn switch internal contact", note: "18 % of confirmed fixes", pct: 18 },
            { label: "Damaged wiring under the dash", note: "12 % of confirmed fixes", pct: 12 },
            { label: "ECM input stage", note: "5 % of confirmed fixes", pct: 5 },
        ],
        live: [
            { k: "Stop-lamp switch A", spec: "0 V released / B+ pressed", measured: "12.4 V released", ok: false },
            { k: "Stop-lamp switch B", spec: "B+ released / 0 V pressed", measured: "12.4 V released", ok: true },
            { k: "Brake pressure request", spec: "0 bar at rest", measured: "0 bar", ok: true },
            { k: "Battery voltage", spec: "≥ 12.4 V", measured: "13.86 V", ok: true },
        ],
        repair: {
            decision: "Adjust or replace the stop-lamp switch",
            evidence:
                "Evidence: switch A reports the pressed state with the pedal released while switch B is correct — the fault is at the switch/pedal interface, not in the wiring or the ECM input.",
            rows: [
                { label: "Part", value: "Stop-lamp switch" },
                { label: "Labour", value: "0.3 h" },
                { label: "Post-repair", value: "Set pedal stop · clear adaptations" },
                { label: "Verification", value: "Both signals track through 10 pedal cycles" },
            ],
            doNotStop:
                "An invalid brake signal disables cruise control and can hold the engine in an elevated idle. Confirm both switches agree before returning the vehicle.",
        },
    },
    C1201: {
        meaning:
            "The ABS/ESC module receives an engine-torque signal from the ECM over CAN. This code sets when the ECM reports a fault that forces the module to inhibit stability control — the chassis system itself is healthy, it is simply reacting to an engine-side fault.",
        related: {
            code: "P2118",
            text: "engine control fault is present on this vehicle. Diagnose the ECM branch first — C1201 normally clears once the fault that triggered it is resolved.",
        },
        conditions: [
            "Engine running at idle",
            "Battery voltage above 12.4 V",
            "Engine torque request message valid on CAN",
            "No ABS wheel-speed faults present",
        ],
        freeze: [
            { k: "Requested engine torque", spec: "± 20 Nm of actual", measured: "−64 Nm deviation", ok: false },
            { k: "Engine speed", spec: "750 – 850 rpm idle", measured: "812 rpm", ok: true },
            { k: "Battery voltage", spec: "≥ 12.4 V", measured: "13.9 V", ok: true },
            { k: "Wheel speeds", spec: "0 km/h stationary", measured: "0 km/h", ok: true },
        ],
        tools: ["HB-LINK 3 bus monitor", "Scan tool (2 modules)", "DVOM", "Back-probe lead set"],
        causesIntro: "Ranked from confirmed repairs on this platform in the HB knowledge cloud.",
        causes: [
            { label: "ECM fault setting a torque limit", note: "52 % of confirmed fixes", pct: 52 },
            { label: "Wheel-speed sensor plausibility fault", note: "18 % of confirmed fixes", pct: 18 },
            { label: "Low system voltage during cranking", note: "14 % of confirmed fixes", pct: 14 },
            { label: "ABS module configuration missing", note: "10 % of confirmed fixes", pct: 10 },
            { label: "CAN message delay / bus load", note: "6 % of confirmed fixes", pct: 6 },
        ],
        live: [
            { k: "Engine torque request", spec: "± 20 Nm of actual", measured: "−64 Nm deviation", ok: false },
            { k: "Engine speed", spec: "750 – 850 rpm idle", measured: "812 rpm", ok: true },
            { k: "ESC status", spec: "Available", measured: "Inhibited", ok: false },
            { k: "Battery voltage", spec: "≥ 12.4 V", measured: "13.9 V", ok: true },
        ],
        repair: {
            decision: "Resolve the ECM fault, then clear and verify both modules",
            evidence:
                "Evidence: the ABS module reports correct wheel speeds, supply and configuration while the ECM torque request is out of range — the chassis side is reacting, not failing.",
            rows: [
                { label: "Part", value: "None — electrical/diagnostic repair" },
                { label: "Labour", value: "0.4 h diagnosis" },
                { label: "Post-repair", value: "Clear codes in ECM and ABS" },
                { label: "Verification", value: "ESC warning off · stability test · re-scan" },
            ],
            doNotStop:
                "P2118 throttle motor current is still the root cause of the torque limitation. Clearing C1201 alone will bring the warning back on the next drive cycle.",
        },
    },
    U0129: {
        meaning:
            "A module on the bus stopped receiving brake-system control messages within the expected time window. This code sets when the message counter or timeout for the brake module expires — the receiving module is healthy, the conversation is not.",
        conditions: [
            "Ignition ON, bus awake for at least 5 s",
            "Battery voltage above 12.4 V",
            "No other U-codes on the same segment",
            "Terminating resistance measurable at the diagnostic link",
        ],
        freeze: [
            { k: "Bus voltage CAN-H/CAN-L", spec: "2.5 V ± 1 V", measured: "2.51 / 2.49 V", ok: true },
            { k: "Bus load", spec: "< 45 %", measured: "31 %", ok: true },
            { k: "Brake module message age", spec: "< 200 ms", measured: "1 840 ms", ok: false },
            { k: "Battery voltage", spec: "≥ 12.4 V", measured: "13.7 V", ok: true },
        ],
        tools: ["HB-LINK 3 bus monitor", "DVOM", "Oscilloscope with differential probe", "Terminating-resistor test set"],
        causes: [
            { label: "Chafed CAN wire at a body pass-through", note: "38 % of confirmed fixes", pct: 38 },
            { label: "Corroded ground at the brake module", note: "26 % of confirmed fixes", pct: 26 },
            { label: "Loose diagnostic/connector terminal", note: "19 % of confirmed fixes", pct: 19 },
            { label: "Failed terminating resistor", note: "11 % of confirmed fixes", pct: 11 },
            { label: "Brake module internal fault", note: "6 % of confirmed fixes", pct: 6 },
        ],
        live: [
            { k: "Brake module messages", spec: "present, < 200 ms age", measured: "1 840 ms age", ok: false },
            { k: "Bus load", spec: "< 45 %", measured: "31 %", ok: true },
            { k: "CAN-H / CAN-L", spec: "2.5 V ± 1 V", measured: "2.51 / 2.49 V", ok: true },
            { k: "Terminating resistance", spec: "60 Ω across bus", measured: "120 Ω", ok: false },
        ],
        repair: {
            decision: "Find and repair the open in the brake-module branch",
            evidence:
                "Evidence: bus voltages and load stay healthy while message age and terminating resistance show one branch open — the fault is physical, in that branch, not in either module.",
            rows: [
                { label: "Part", value: "None — wiring repair" },
                { label: "Labour", value: "0.9 h diagnosis + repair" },
                { label: "Post-repair", value: "Clear U-codes · verify both modules" },
                { label: "Verification", value: "Bus monitor 10 min · wiggle test" },
            ],
            doNotStop:
                "Intermittent network faults return under vibration. Wiggle-test the pass-through grommet while watching message age before signing off.",
        },
    },
    B1483: {
        meaning:
            "The ADAS control module has not completed the camera calibration sequence after replacement, aiming or a windscreen repair. Until calibration finishes, lane and collision functions stay disabled and this code remains stored.",
        conditions: [
            "Ignition ON, ADAS module awake",
            "Camera mounted and connected",
            "No network faults on CAN-FD",
            "Calibration target set available",
        ],
        freeze: [
            { k: "Calibration step", spec: "Step 5 of 5", measured: "Step 2 of 5", ok: false },
            { k: "Camera image quality", spec: "Score ≥ 80", measured: "91", ok: true },
            { k: "Mounting angle", spec: "± 1.5°", measured: "0.4°", ok: true },
            { k: "Supply voltage", spec: "9 – 16 V", measured: "13.9 V", ok: true },
        ],
        tools: ["Calibration target set", "Scan tool with ADAS suite", "Wheel alignment rack", "HB-LINK 3 bus monitor"],
        causes: [
            { label: "Calibration never run after replacement", note: "54 % of confirmed fixes", pct: 54 },
            { label: "Target set mispositioned during calibration", note: "21 % of confirmed fixes", pct: 21 },
            { label: "Obstructed or dirty camera lens", note: "12 % of confirmed fixes", pct: 12 },
            { label: "Incorrect ride-height / tyre pressure", note: "9 % of confirmed fixes", pct: 9 },
            { label: "Camera hardware fault", note: "4 % of confirmed fixes", pct: 4 },
        ],
        live: [
            { k: "Calibration step", spec: "5 of 5 complete", measured: "2 of 5", ok: false },
            { k: "Camera frame rate", spec: "25 fps", measured: "25 fps", ok: true },
            { k: "Lane detection state", spec: "Available", measured: "Unavailable", ok: false },
            { k: "Supply voltage", spec: "9 – 16 V", measured: "13.9 V", ok: true },
        ],
        repair: {
            decision: "Run static camera calibration with a correctly placed target",
            evidence:
                "Evidence: image quality, mounting angle and supply are all within specification — the module simply never completed its learning sequence.",
            rows: [
                { label: "Part", value: "None — calibration procedure" },
                { label: "Labour", value: "0.7 h" },
                { label: "Post-repair", value: "Set tyre pressures · check ride height" },
                { label: "Verification", value: "Lane assist active · road test at 60 km/h" },
            ],
            doNotStop:
                "A calibrated camera on a vehicle with uneven tyre wear will drift again. Check pressures and alignment before the road test.",
        },
    },
    P0741: {
        meaning:
            "The TCM commands the torque-converter clutch solenoid and compares turbine speed against input-shaft speed. This code sets when the clutch does not apply as commanded — either it is slipping under load or it is mechanically stuck off.",
        conditions: [
            "Transmission at operating temperature, 80 – 100 °C",
            "Battery voltage above 12.4 V",
            "Vehicle in a steady cruise, 60 – 90 km/h",
            "No CAN faults affecting the TCM",
        ],
        freeze: [
            { k: "TCC solenoid current", spec: "0.8 – 1.4 A commanded", measured: "0.0 A", ok: false },
            { k: "Turbine vs input speed", spec: "< 20 rpm difference", measured: "240 rpm slip", ok: false },
            { k: "Transmission temperature", spec: "80 – 100 °C", measured: "92 °C", ok: true },
            { k: "Line pressure", spec: "3.5 – 4.5 bar", measured: "4.1 bar", ok: true },
        ],
        tools: ["Scan tool with TCM data", "DVOM", "Transmission pressure gauge", "Used-oil sample kit"],
        causes: [
            { label: "Worn clutch pack / burned friction material", note: "46 % of confirmed fixes", pct: 46 },
            { label: "Stuck TCC solenoid", note: "24 % of confirmed fixes", pct: 24 },
            { label: "Restricted valve-body passage", note: "14 % of confirmed fixes", pct: 14 },
            { label: "Open solenoid circuit", note: "10 % of confirmed fixes", pct: 10 },
            { label: "TCM calibration", note: "6 % of confirmed fixes", pct: 6 },
        ],
        live: [
            { k: "TCC commanded", spec: "Apply in cruise", measured: "Released", ok: false },
            { k: "TCC solenoid current", spec: "0.8 – 1.4 A", measured: "0.0 A", ok: false },
            { k: "Turbine speed", spec: "tracks input shaft", measured: "240 rpm slip", ok: false },
            { k: "Transmission temperature", spec: "80 – 100 °C", measured: "92 °C", ok: true },
        ],
        repair: {
            decision: "Check solenoid circuit, then plan a valve-body / clutch inspection",
            evidence:
                "Evidence: no commanded current reaches the solenoid while line pressure and temperature are correct — start with the electrical side before opening the transmission.",
            rows: [
                { label: "Part", value: "TCC solenoid (if circuit tests good)" },
                { label: "Labour", value: "1.4 h" },
                { label: "Post-repair", value: "Adaptation reset · fluid and filter" },
                { label: "Verification", value: "Lock-up at cruise · no slip under load" },
            ],
            doNotStop:
                "Metal in the fluid means the clutch is already worn — replacing only the solenoid will not hold. Sample the oil before quoting the repair.",
        },
    },
    C2126: {
        meaning:
                "Each TPMS sensor reports pressure, temperature and its own battery voltage. This code sets when a sensor reports a voltage below the service threshold — the reading is still transmitted but the sensor is expected to fail within roughly four months.",
        conditions: [
            "Ignition ON, vehicle stationary",
            "Sensor transmitting at 315/433 MHz",
            "No repeater or wheel-rotation faults",
            "Ambient temperature above −10 °C",
        ],
        freeze: [
            { k: "Sensor battery voltage", spec: "≥ 2.0 V", measured: "1.64 V", ok: false },
            { k: "Tyre pressure", spec: "2.2 – 2.5 bar", measured: "2.3 bar", ok: true },
            { k: "Tyre temperature", spec: "−10 – 80 °C", measured: "34 °C", ok: true },
            { k: "Signal strength", spec: "> −95 dBm", measured: "−88 dBm", ok: true },
        ],
        tools: ["TPMS activation tool", "Pressure gauge", "Torque wrench for valve cores", "Wheel weights"],
        causes: [
            { label: "Sensor battery at end of life", note: "71 % of confirmed fixes", pct: 71 },
            { label: "Damaged valve stem / corrosion", note: "13 % of confirmed fixes", pct: 13 },
            { label: "Wrong sensor type fitted", note: "9 % of confirmed fixes", pct: 9 },
            { label: "Receiver antenna fault", note: "4 % of confirmed fixes", pct: 4 },
            { label: "Signal interference from accessories", note: "3 % of confirmed fixes", pct: 3 },
        ],
        live: [
            { k: "Sensor battery voltage", spec: "≥ 2.0 V", measured: "1.64 V", ok: false },
            { k: "Tyre pressure", spec: "2.2 – 2.5 bar", measured: "2.3 bar", ok: true },
            { k: "Tyre temperature", spec: "−10 – 80 °C", measured: "34 °C", ok: true },
            { k: "Signal strength", spec: "> −95 dBm", measured: "−88 dBm", ok: true },
        ],
        repair: {
            decision: "Replace the low-voltage sensor and re-register it",
            evidence:
                "Evidence: pressure, temperature and signal strength are all correct while battery voltage is below threshold — the sensor is healthy except for its cell.",
            rows: [
                { label: "Part", value: "TPMS sensor with valve" },
                { label: "Labour", value: "0.5 h per wheel" },
                { label: "Post-repair", value: "Set pressures cold · relearn IDs" },
                { label: "Verification", value: "All four IDs registered · warning off" },
            ],
            doNotStop:
                "Sensors fail in sets — a vehicle showing one low battery will usually show a second within months. Inspect all four and quote in pairs if the mileage is high.",
        },
    },
};

/** Static detail for a code, if this bench ships one. */
export function dtcDetailFor(code: string): DtcDetail | undefined {
    return DTC_DETAILS[code];
}

/** Layer an instructor-pack override over the static dossier (repair merged one level deeper). */
export function mergeDtcDetail(code: string, override?: Partial<DtcDetail>): DtcDetail | undefined {
    const base = DTC_DETAILS[code];
    if (!override) return base;
    if (!base) {
        return {
            meaning: override.meaning ?? "",
            conditions: override.conditions ?? [],
            freeze: override.freeze ?? [],
            tools: override.tools ?? [],
            causes: override.causes ?? [],
            live: override.live ?? [],
            repair: { decision: "", evidence: "", rows: [], doNotStop: "", ...(override.repair ?? {}) },
            ...(override.related ? { related: override.related } : {}),
            ...(override.causesIntro ? { causesIntro: override.causesIntro } : {}),
        };
    }
    return {
        ...base,
        ...override,
        conditions: override.conditions ?? base.conditions,
        freeze: override.freeze ?? base.freeze,
        tools: override.tools ?? base.tools,
        causes: override.causes ?? base.causes,
        live: override.live ?? base.live,
        repair: { ...base.repair, ...(override.repair ?? {}) },
    };
}
