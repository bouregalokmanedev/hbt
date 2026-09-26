/**
 * Schematic authentic netlist (P6.1) — reverse-engineered VERBATIM from the source
 * tool `Schematic.dc.html` (docs 33–38). Class-B canonical technical data only:
 * 57 components, 133 pin-table rows (111 distinct ECU pins: A 34 / B 77), 12 wire
 * colours, 3 authored guided traces, 8 training tasks, 6 exam questions, 11 layers.
 *
 * Coordinates are preserved in the source's 4016×1479 schematic-image space
 * (x,y = hotspot CENTRE; the E1 ECU is a band on the y=1135 rail). Learner-facing
 * prose is NOT stored here — traces/tasks/exam carry stable content IDs resolved
 * from `content.schematic.*` (EN/AR/FR) by the UI (authored in P6.3). The English
 * source prose is captured alongside in `workspace.en-reference.json` for authoring.
 */

export type SchType = "ecu" | "relay" | "fuse" | "ground" | "network" | "connector" | "module" | "sensor" | "actuator" | "switch";

export interface SchComponent {
  key: string; code: string; name: string; type: SchType;
  x: number; y: number; w: number; h: number; // hotspot CENTRE + size, in 4016×1479 px
}

export interface SchWire {
  ecuPin: string;        // e.g. "A 1", "B 20"
  ecuColour: string;     // colour at the ECU end
  target: string;        // component key
  targetPin: string;     // pin id on the target
  targetColour: string;  // colour at the component end
  connector: string;     // "A" | "B" (first char of ecuPin)
  mismatch: boolean;     // ecuColour !== targetColour (colour changes at the joint)
}

export interface SchTraceStep { cmp: string; colour: string; descId: string }
export interface SchTrace { id: string; labelId: string; steps: SchTraceStep[] }
export interface SchTask { promptId: string; answer: string; explainId: string }
export interface SchExamQ { promptId: string; answer: string }
export interface SchLayer { key: string; labelId: string; na: boolean }

/** Single vehicle + sheet context (Class-B canonical). */
export const SCH_VEHICLE = "TOYOTA Corolla 1.6 16V VVT-i (1ZR-FE) 2013 - 2018";
export const SCH_SHEET = "R16 — Ignition coil relay";
/** Schematic diagram intrinsic pixel space (asset lives in public/, referenced by the UI). */
export const SCH_IMG_W = 4016;
export const SCH_IMG_H = 1479;
export const SCH_DIAGRAM = "/assets/simulator/diagram-r16.png";

export const SCH_TYPE_LABEL: Record<SchType, string> = {
  ecu: "ECU", relay: "RELAY", fuse: "FUSE", ground: "GROUND", network: "CAN",
  connector: "CONNECTOR", module: "MODULE", sensor: "SENSOR", actuator: "ACTUATOR", switch: "SWITCH",
};

/** 12 authentic wire colours → hex (White/Black renders as a split swatch in the UI). */
export const SCH_COLOURS: Record<string, string> = {
  "Pink": "#F3A6C0",
  "Black": "#1F242E",
  "Red": "#E23D3D",
  "Blue": "#2F6FE0",
  "Brown": "#8A5A34",
  "White": "#FFFFFF",
  "Yellow": "#F0C419",
  "Green": "#17A768",
  "Light Green": "#86C562",
  "Violet": "#8B5CF6",
  "Grey": "#98A2B3",
  "White/Black": "#E8EAEE",
};

export const SCH_COMPONENTS: SchComponent[] = [
  { key: "E1", code: "E1", name: "Engine control unit", type: "ecu", x: 1968, y: 1135, w: 3414, h: 92 },
  { key: "R16", code: "R16", name: "Ignition coil relay", type: "relay", x: 1225, y: 268, w: 90, h: 70 },
  { key: "R1", code: "R1", name: "Main relay", type: "relay", x: 505, y: 368, w: 90, h: 70 },
  { key: "R15", code: "R15", name: "Fuel injection relay", type: "relay", x: 780, y: 668, w: 100, h: 80 },
  { key: "R3", code: "R3", name: "Fuel pump relay", type: "relay", x: 630, y: 515, w: 90, h: 70 },
  { key: "F_INJEFIB", code: "O7", name: "Fuse INJ/EFI-B", type: "fuse", x: 448, y: 176, w: 70, h: 80 },
  { key: "F_EFIMAIN", code: "O7", name: "Fuse EFI-MAIN", type: "fuse", x: 548, y: 176, w: 70, h: 80 },
  { key: "F_EFI1", code: "O7", name: "Fuse EFI 1", type: "fuse", x: 775, y: 487, w: 70, h: 80 },
  { key: "F_IGN", code: "O7", name: "Fuse IGN", type: "fuse", x: 2778, y: 908, w: 70, h: 80 },
  { key: "F_ETCS", code: "O7", name: "Fuse ETCS", type: "fuse", x: 3705, y: 176, w: 70, h: 80 },
  { key: "F_MIRHTR", code: "O7", name: "Fuse MIR-HTR", type: "fuse", x: 3516, y: 1028, w: 70, h: 80 },
  { key: "F_STOP", code: "O7", name: "Fuse STOP", type: "fuse", x: 2834, y: 908, w: 70, h: 80 },
  { key: "G_AB", code: "O8", name: "Grounding point AB", type: "ground", x: 1262, y: 862, w: 70, h: 60 },
  { key: "G_BA", code: "O8", name: "Grounding point BA", type: "ground", x: 1066, y: 1222, w: 70, h: 60 },
  { key: "G_BB", code: "O8", name: "Grounding point BB", type: "ground", x: 1146, y: 1222, w: 70, h: 60 },
  { key: "G_EB", code: "O8", name: "Grounding point EB", type: "ground", x: 1492, y: 1380, w: 70, h: 60 },
  { key: "CAN1", code: "O2", name: "CAN system 1", type: "network", x: 2282, y: 1012, w: 80, h: 70 },
  { key: "CAN2", code: "O2", name: "CAN system 2", type: "network", x: 3637, y: 1018, w: 80, h: 70 },
  { key: "O6", code: "O6", name: "Diagnostic connector", type: "connector", x: 1980, y: 1020, w: 70, h: 70 },
  { key: "O19", code: "O19", name: "Instrument cluster circuit", type: "module", x: 2502, y: 1018, w: 80, h: 70 },
  { key: "G1", code: "G1", name: "Accelerator pedal position sensor", type: "sensor", x: 2130, y: 990, w: 90, h: 80 },
  { key: "E19", code: "E19", name: "Immobiliser control unit", type: "module", x: 1914, y: 1250, w: 90, h: 60 },
  { key: "E24", code: "E24", name: "Transmission control unit", type: "module", x: 2181, y: 1250, w: 90, h: 60 },
  { key: "E25", code: "E25", name: "Cruise control unit", type: "module", x: 2512, y: 1250, w: 90, h: 60 },
  { key: "E27", code: "E27", name: "Cooling fan control unit", type: "module", x: 2281, y: 1250, w: 90, h: 60 },
  { key: "INJ1", code: "A1", name: "Injector 1", type: "actuator", x: 695, y: 745, w: 70, h: 110 },
  { key: "INJ2", code: "A1", name: "Injector 2", type: "actuator", x: 1030, y: 748, w: 70, h: 110 },
  { key: "INJ3", code: "A1", name: "Injector 3", type: "actuator", x: 1096, y: 748, w: 70, h: 110 },
  { key: "INJ4", code: "A1", name: "Injector 4", type: "actuator", x: 1162, y: 748, w: 70, h: 110 },
  { key: "COIL1", code: "I1", name: "Ignition coil 1", type: "actuator", x: 313, y: 1258, w: 80, h: 110 },
  { key: "COIL2", code: "I1", name: "Ignition coil 2", type: "actuator", x: 414, y: 1258, w: 80, h: 110 },
  { key: "COIL3", code: "I1", name: "Ignition coil 3", type: "actuator", x: 514, y: 1258, w: 80, h: 110 },
  { key: "COIL4", code: "I1", name: "Ignition coil 4", type: "actuator", x: 604, y: 1258, w: 80, h: 110 },
  { key: "I2", code: "I2", name: "Knock sensor", type: "sensor", x: 2622, y: 995, w: 70, h: 80 },
  { key: "L3", code: "L3", name: "Mass airflow meter with air temperature sensor", type: "sensor", x: 882, y: 660, w: 110, h: 90 },
  { key: "L1", code: "L1", name: "MAP sensor", type: "sensor", x: 1745, y: 1230, w: 90, h: 80 },
  { key: "L11", code: "L11", name: "Oil pressure sensor", type: "sensor", x: 2356, y: 1230, w: 90, h: 80 },
  { key: "T1", code: "T1", name: "Coolant temperature sensor", type: "sensor", x: 2908, y: 985, w: 70, h: 80 },
  { key: "U1", code: "U1", name: "Oxygen sensor in front of the catalytic converter", type: "sensor", x: 1492, y: 775, w: 80, h: 110 },
  { key: "U2", code: "U2", name: "Oxygen sensor behind the catalytic converter", type: "sensor", x: 1378, y: 775, w: 80, h: 110 },
  { key: "V1", code: "V1", name: "Canister purge solenoid", type: "actuator", x: 1318, y: 550, w: 80, h: 80 },
  { key: "H3", code: "H3", name: "Throttle control motor with position sensor", type: "actuator", x: 1262, y: 1230, w: 110, h: 90 },
  { key: "X1", code: "X1", name: "Crankshaft position sensor (magnetic type)", type: "sensor", x: 2713, y: 990, w: 70, h: 80 },
  { key: "X7", code: "X7", name: "Camshaft position sensor (Hall Effect/MRE) — inlet", type: "sensor", x: 1966, y: 1230, w: 80, h: 80 },
  { key: "X8", code: "X8", name: "Camshaft position sensor (Hall Effect/MRE) — outlet", type: "sensor", x: 1572, y: 1230, w: 80, h: 80 },
  { key: "X9", code: "X9", name: "Gearbox input shaft speed sensor", type: "sensor", x: 3054, y: 985, w: 70, h: 80 },
  { key: "X2", code: "X2", name: "Gearbox output shaft speed sensor", type: "sensor", x: 3315, y: 985, w: 70, h: 80 },
  { key: "X16", code: "X16", name: "Turbine shaft speed sensor", type: "sensor", x: 3429, y: 990, w: 70, h: 80 },
  { key: "S1", code: "S1", name: "Brake pedal switch", type: "switch", x: 2814, y: 1018, w: 80, h: 70 },
  { key: "S3", code: "S3", name: "Clutch switch", type: "switch", x: 2994, y: 1018, w: 70, h: 70 },
  { key: "S18", code: "S18", name: "Gear position switch", type: "switch", x: 243, y: 1000, w: 110, h: 70 },
  { key: "S68", code: "S68", name: "Transmission power/economy selector switch", type: "switch", x: 1432, y: 1258, w: 80, h: 80 },
  { key: "A5", code: "A5", name: "Inlet camshaft timing solenoid", type: "actuator", x: 3194, y: 985, w: 70, h: 80 },
  { key: "A6", code: "A6", name: "Fuel delivery control valve", type: "actuator", x: 1618, y: 940, w: 60, h: 80 },
  { key: "A8", code: "A8", name: "Outlet camshaft timing solenoid", type: "actuator", x: 2401, y: 988, w: 70, h: 80 },
  { key: "A55", code: "A55", name: "Valve lift solenoid", type: "actuator", x: 1685, y: 988, w: 90, h: 80 },
  { key: "D41", code: "D41", name: "Transmission unit", type: "module", x: 805, y: 1230, w: 130, h: 90 },
];

export const SCH_WIRES: SchWire[] = [
  { ecuPin: "A 1", ecuColour: "Pink", target: "F_INJEFIB", targetPin: "2", targetColour: "Pink", connector: "A", mismatch: false },
  { ecuPin: "A 1", ecuColour: "Pink", target: "R15", targetPin: "5", targetColour: "Red", connector: "A", mismatch: true },
  { ecuPin: "A 2", ecuColour: "Black", target: "E1", targetPin: "A 3", targetColour: "Black", connector: "A", mismatch: false },
  { ecuPin: "A 2", ecuColour: "Black", target: "L3", targetPin: "3", targetColour: "Black", connector: "A", mismatch: false },
  { ecuPin: "A 2", ecuColour: "Black", target: "F_EFI1", targetPin: "2", targetColour: "Black", connector: "A", mismatch: false },
  { ecuPin: "A 2", ecuColour: "Black", target: "R15", targetPin: "2", targetColour: "Black", connector: "A", mismatch: false },
  { ecuPin: "A 3", ecuColour: "Black", target: "E1", targetPin: "A 2", targetColour: "Black", connector: "A", mismatch: false },
  { ecuPin: "A 3", ecuColour: "Black", target: "L3", targetPin: "3", targetColour: "Black", connector: "A", mismatch: false },
  { ecuPin: "A 3", ecuColour: "Black", target: "F_EFI1", targetPin: "2", targetColour: "Black", connector: "A", mismatch: false },
  { ecuPin: "A 3", ecuColour: "Black", target: "R15", targetPin: "2", targetColour: "Black", connector: "A", mismatch: false },
  { ecuPin: "A 9", ecuColour: "Blue", target: "S1", targetPin: "1", targetColour: "Blue", connector: "A", mismatch: false },
  { ecuPin: "A 10", ecuColour: "Red", target: "S1", targetPin: "3", targetColour: "Red", connector: "A", mismatch: false },
  { ecuPin: "A 12", ecuColour: "Black", target: "CAN2", targetPin: "H", targetColour: "Black", connector: "A", mismatch: false },
  { ecuPin: "A 13", ecuColour: "Black", target: "CAN1", targetPin: "H", targetColour: "Black", connector: "A", mismatch: false },
  { ecuPin: "A 17", ecuColour: "Blue", target: "F_MIRHTR", targetPin: "2", targetColour: "Blue", connector: "A", mismatch: false },
  { ecuPin: "A 21", ecuColour: "Red", target: "R3", targetPin: "2", targetColour: "Red", connector: "A", mismatch: false },
  { ecuPin: "A 22", ecuColour: "Light Green", target: "S3", targetPin: "1", targetColour: "Light Green", connector: "A", mismatch: false },
  { ecuPin: "A 23", ecuColour: "Pink", target: "O6", targetPin: "13", targetColour: "Pink", connector: "A", mismatch: false },
  { ecuPin: "A 25", ecuColour: "Blue", target: "CAN2", targetPin: "L", targetColour: "Blue", connector: "A", mismatch: false },
  { ecuPin: "A 26", ecuColour: "White", target: "CAN1", targetPin: "L", targetColour: "White", connector: "A", mismatch: false },
  { ecuPin: "A 27", ecuColour: "Light Green", target: "O19", targetPin: "B11", targetColour: "Light Green", connector: "A", mismatch: false },
  { ecuPin: "A 28", ecuColour: "Pink", target: "E19", targetPin: "13", targetColour: "Pink", connector: "A", mismatch: false },
  { ecuPin: "A 29", ecuColour: "Light Green", target: "E19", targetPin: "12", targetColour: "Light Green", connector: "A", mismatch: false },
  { ecuPin: "A 31", ecuColour: "Grey", target: "O6", targetPin: "9", targetColour: "Grey", connector: "A", mismatch: false },
  { ecuPin: "A 37", ecuColour: "Black", target: "F_IGN", targetPin: "2", targetColour: "Black", connector: "A", mismatch: false },
  { ecuPin: "A 37", ecuColour: "Black", target: "S1", targetPin: "4", targetColour: "Black", connector: "A", mismatch: false },
  { ecuPin: "A 40", ecuColour: "Grey", target: "E25", targetPin: "A 12", targetColour: "Grey", connector: "A", mismatch: false },
  { ecuPin: "A 41", ecuColour: "Blue", target: "E24", targetPin: "A 5", targetColour: "Blue", connector: "A", mismatch: false },
  { ecuPin: "A 42", ecuColour: "White", target: "E24", targetPin: "A 3", targetColour: "Yellow", connector: "A", mismatch: true },
  { ecuPin: "A 43", ecuColour: "Red", target: "E24", targetPin: "A 1", targetColour: "Red", connector: "A", mismatch: false },
  { ecuPin: "A 44", ecuColour: "Violet", target: "O19", targetPin: "B6", targetColour: "Violet", connector: "A", mismatch: false },
  { ecuPin: "A 45", ecuColour: "Red", target: "E27", targetPin: "A 2", targetColour: "Red", connector: "A", mismatch: false },
  { ecuPin: "A 46", ecuColour: "Blue", target: "R1", targetPin: "1", targetColour: "Blue", connector: "A", mismatch: false },
  { ecuPin: "A 50", ecuColour: "Brown", target: "G_AB", targetPin: "1", targetColour: "Brown", connector: "A", mismatch: false },
  { ecuPin: "A 50", ecuColour: "Brown", target: "R15", targetPin: "1", targetColour: "White/Black", connector: "A", mismatch: true },
  { ecuPin: "A 50", ecuColour: "Brown", target: "R16", targetPin: "2", targetColour: "White/Black", connector: "A", mismatch: true },
  { ecuPin: "A 50", ecuColour: "Brown", target: "R1", targetPin: "2", targetColour: "White/Black", connector: "A", mismatch: true },
  { ecuPin: "A 51", ecuColour: "White", target: "G1", targetPin: "6", targetColour: "White", connector: "A", mismatch: false },
  { ecuPin: "A 52", ecuColour: "Yellow", target: "G1", targetPin: "5", targetColour: "Yellow", connector: "A", mismatch: false },
  { ecuPin: "A 53", ecuColour: "Black", target: "G1", targetPin: "4", targetColour: "Black", connector: "A", mismatch: false },
  { ecuPin: "A 54", ecuColour: "Red", target: "G1", targetPin: "3", targetColour: "Red", connector: "A", mismatch: false },
  { ecuPin: "A 55", ecuColour: "Pink", target: "G1", targetPin: "2", targetColour: "Pink", connector: "A", mismatch: false },
  { ecuPin: "A 56", ecuColour: "Blue", target: "G1", targetPin: "1", targetColour: "Blue", connector: "A", mismatch: false },
  { ecuPin: "A 57", ecuColour: "Green", target: "S68", targetPin: "6", targetColour: "Green", connector: "A", mismatch: false },
  { ecuPin: "A 60", ecuColour: "Blue", target: "E25", targetPin: "A 1", targetColour: "Blue", connector: "A", mismatch: false },
  { ecuPin: "B 16", ecuColour: "Brown", target: "E1", targetPin: "B 51", targetColour: "White/Black", connector: "B", mismatch: true },
  { ecuPin: "B 16", ecuColour: "Brown", target: "E1", targetPin: "B 59", targetColour: "White/Black", connector: "B", mismatch: true },
  { ecuPin: "B 16", ecuColour: "Brown", target: "G_BA", targetPin: "1", targetColour: "Brown", connector: "B", mismatch: false },
  { ecuPin: "B 17", ecuColour: "Yellow", target: "INJ2", targetPin: "2", targetColour: "Yellow", connector: "B", mismatch: false },
  { ecuPin: "B 18", ecuColour: "Green", target: "INJ3", targetPin: "2", targetColour: "Green", connector: "B", mismatch: false },
  { ecuPin: "B 19", ecuColour: "White", target: "INJ4", targetPin: "2", targetColour: "White", connector: "B", mismatch: false },
  { ecuPin: "B 20", ecuColour: "Black", target: "INJ1", targetPin: "2", targetColour: "Black", connector: "B", mismatch: false },
  { ecuPin: "B 21", ecuColour: "White/Black", target: "E1", targetPin: "B 52", targetColour: "White/Black", connector: "B", mismatch: false },
  { ecuPin: "B 21", ecuColour: "White/Black", target: "G_BB", targetPin: "1", targetColour: "White/Black", connector: "B", mismatch: false },
  { ecuPin: "B 22", ecuColour: "Blue", target: "U1", targetPin: "1", targetColour: "Blue", connector: "B", mismatch: false },
  { ecuPin: "B 23", ecuColour: "Red", target: "U2", targetPin: "1", targetColour: "Red", connector: "B", mismatch: false },
  { ecuPin: "B 29", ecuColour: "Black", target: "F_ETCS", targetPin: "2", targetColour: "Black", connector: "B", mismatch: false },
  { ecuPin: "B 30", ecuColour: "Pink", target: "H3", targetPin: "1", targetColour: "Pink", connector: "B", mismatch: false },
  { ecuPin: "B 49", ecuColour: "Red", target: "A55", targetPin: "3", targetColour: "Red", connector: "B", mismatch: false },
  { ecuPin: "B 50", ecuColour: "Yellow", target: "A6", targetPin: "1", targetColour: "Yellow", connector: "B", mismatch: false },
  { ecuPin: "B 51", ecuColour: "White/Black", target: "E1", targetPin: "B 16", targetColour: "Brown", connector: "B", mismatch: true },
  { ecuPin: "B 51", ecuColour: "White/Black", target: "E1", targetPin: "B 59", targetColour: "White/Black", connector: "B", mismatch: false },
  { ecuPin: "B 51", ecuColour: "White/Black", target: "G_BA", targetPin: "1", targetColour: "White/Black", connector: "B", mismatch: false },
  { ecuPin: "B 52", ecuColour: "White/Black", target: "E1", targetPin: "B 21", targetColour: "White/Black", connector: "B", mismatch: false },
  { ecuPin: "B 52", ecuColour: "White/Black", target: "G_BB", targetPin: "1", targetColour: "White/Black", connector: "B", mismatch: false },
  { ecuPin: "B 54", ecuColour: "White", target: "COIL4", targetPin: "A3", targetColour: "White", connector: "B", mismatch: false },
  { ecuPin: "B 55", ecuColour: "Green", target: "COIL3", targetPin: "A3", targetColour: "Green", connector: "B", mismatch: false },
  { ecuPin: "B 57", ecuColour: "Red", target: "COIL1", targetPin: "A3", targetColour: "Red", connector: "B", mismatch: false },
  { ecuPin: "B 58", ecuColour: "Black", target: "COIL2", targetPin: "A3", targetColour: "Black", connector: "B", mismatch: false },
  { ecuPin: "B 59", ecuColour: "White/Black", target: "E1", targetPin: "B 16", targetColour: "Brown", connector: "B", mismatch: true },
  { ecuPin: "B 59", ecuColour: "White/Black", target: "E1", targetPin: "B 51", targetColour: "White/Black", connector: "B", mismatch: false },
  { ecuPin: "B 59", ecuColour: "White/Black", target: "G_BA", targetPin: "1", targetColour: "White/Black", connector: "B", mismatch: false },
  { ecuPin: "B 60", ecuColour: "Violet", target: "H3", targetPin: "2", targetColour: "Violet", connector: "B", mismatch: false },
  { ecuPin: "B 61", ecuColour: "Black", target: "A55", targetPin: "4", targetColour: "Black", connector: "B", mismatch: false },
  { ecuPin: "B 62", ecuColour: "Grey", target: "A55", targetPin: "2", targetColour: "Grey", connector: "B", mismatch: false },
  { ecuPin: "B 64", ecuColour: "Pink", target: "A8", targetPin: "2", targetColour: "Pink", connector: "B", mismatch: false },
  { ecuPin: "B 65", ecuColour: "Green", target: "A8", targetPin: "1", targetColour: "Green", connector: "B", mismatch: false },
  { ecuPin: "B 66", ecuColour: "Violet", target: "D41", targetPin: "7", targetColour: "Violet", connector: "B", mismatch: false },
  { ecuPin: "B 67", ecuColour: "Light Green", target: "D41", targetPin: "2", targetColour: "Light Green", connector: "B", mismatch: false },
  { ecuPin: "B 69", ecuColour: "Green", target: "D41", targetPin: "4", targetColour: "Green", connector: "B", mismatch: false },
  { ecuPin: "B 70", ecuColour: "Pink", target: "D41", targetPin: "9", targetColour: "Pink", connector: "B", mismatch: false },
  { ecuPin: "B 71", ecuColour: "Red", target: "D41", targetPin: "5", targetColour: "Red", connector: "B", mismatch: false },
  { ecuPin: "B 72", ecuColour: "Blue", target: "D41", targetPin: "8", targetColour: "Blue", connector: "B", mismatch: false },
  { ecuPin: "B 73", ecuColour: "Black", target: "D41", targetPin: "3", targetColour: "Black", connector: "B", mismatch: false },
  { ecuPin: "B 74", ecuColour: "Yellow", target: "A5", targetPin: "2", targetColour: "Yellow", connector: "B", mismatch: false },
  { ecuPin: "B 75", ecuColour: "Black", target: "A5", targetPin: "1", targetColour: "Black", connector: "B", mismatch: false },
  { ecuPin: "B 76", ecuColour: "Blue", target: "V1", targetPin: "1", targetColour: "Blue", connector: "B", mismatch: false },
  { ecuPin: "B 78", ecuColour: "Red", target: "X1", targetPin: "1", targetColour: "Red", connector: "B", mismatch: false },
  { ecuPin: "B 79", ecuColour: "Blue", target: "S18", targetPin: "2", targetColour: "Blue", connector: "B", mismatch: false },
  { ecuPin: "B 80", ecuColour: "Pink", target: "X8", targetPin: "1", targetColour: "Pink", connector: "B", mismatch: false },
  { ecuPin: "B 81", ecuColour: "Grey", target: "S18", targetPin: "7", targetColour: "Grey", connector: "B", mismatch: false },
  { ecuPin: "B 82", ecuColour: "Black", target: "X7", targetPin: "1", targetColour: "Black", connector: "B", mismatch: false },
  { ecuPin: "B 83", ecuColour: "Red", target: "H3", targetPin: "4", targetColour: "Red", connector: "B", mismatch: false },
  { ecuPin: "B 84", ecuColour: "Light Green", target: "H3", targetPin: "6", targetColour: "Light Green", connector: "B", mismatch: false },
  { ecuPin: "B 87", ecuColour: "Violet", target: "L1", targetPin: "2", targetColour: "Violet", connector: "B", mismatch: false },
  { ecuPin: "B 89", ecuColour: "Green", target: "L11", targetPin: "2", targetColour: "Green", connector: "B", mismatch: false },
  { ecuPin: "B 90", ecuColour: "Blue", target: "L3", targetPin: "1", targetColour: "Blue", connector: "B", mismatch: false },
  { ecuPin: "B 91", ecuColour: "Violet", target: "L3", targetPin: "5", targetColour: "Violet", connector: "B", mismatch: false },
  { ecuPin: "B 92", ecuColour: "Black", target: "L3", targetPin: "4", targetColour: "Black", connector: "B", mismatch: false },
  { ecuPin: "B 93", ecuColour: "Black", target: "T1", targetPin: "2", targetColour: "Black", connector: "B", mismatch: false },
  { ecuPin: "B 94", ecuColour: "Brown", target: "T1", targetPin: "1", targetColour: "Brown", connector: "B", mismatch: false },
  { ecuPin: "B 95", ecuColour: "Yellow", target: "D41", targetPin: "1", targetColour: "Yellow", connector: "B", mismatch: false },
  { ecuPin: "B 96", ecuColour: "Grey", target: "D41", targetPin: "6", targetColour: "Grey", connector: "B", mismatch: false },
  { ecuPin: "B 97", ecuColour: "Black", target: "S18", targetPin: "8", targetColour: "Black", connector: "B", mismatch: false },
  { ecuPin: "B 99", ecuColour: "Violet", target: "S18", targetPin: "3", targetColour: "Violet", connector: "B", mismatch: false },
  { ecuPin: "B 102", ecuColour: "Yellow", target: "COIL1", targetPin: "A2", targetColour: "Yellow", connector: "B", mismatch: false },
  { ecuPin: "B 102", ecuColour: "Yellow", target: "COIL2", targetPin: "A2", targetColour: "Yellow", connector: "B", mismatch: false },
  { ecuPin: "B 102", ecuColour: "Yellow", target: "COIL3", targetPin: "A2", targetColour: "Yellow", connector: "B", mismatch: false },
  { ecuPin: "B 102", ecuColour: "Yellow", target: "COIL4", targetPin: "A2", targetColour: "Yellow", connector: "B", mismatch: false },
  { ecuPin: "B 103", ecuColour: "Black", target: "U1", targetPin: "3", targetColour: "Black", connector: "B", mismatch: false },
  { ecuPin: "B 110", ecuColour: "Green", target: "X1", targetPin: "2", targetColour: "Green", connector: "B", mismatch: false },
  { ecuPin: "B 111", ecuColour: "White", target: "X8", targetPin: "3", targetColour: "White", connector: "B", mismatch: false },
  { ecuPin: "B 112", ecuColour: "Black", target: "X8", targetPin: "2", targetColour: "Black", connector: "B", mismatch: false },
  { ecuPin: "B 113", ecuColour: "White", target: "X7", targetPin: "3", targetColour: "White", connector: "B", mismatch: false },
  { ecuPin: "B 114", ecuColour: "Pink", target: "X7", targetPin: "2", targetColour: "Pink", connector: "B", mismatch: false },
  { ecuPin: "B 115", ecuColour: "Green", target: "H3", targetPin: "5", targetColour: "Green", connector: "B", mismatch: false },
  { ecuPin: "B 116", ecuColour: "Blue", target: "H3", targetPin: "3", targetColour: "Blue", connector: "B", mismatch: false },
  { ecuPin: "B 118", ecuColour: "Red", target: "L1", targetPin: "3", targetColour: "Red", connector: "B", mismatch: false },
  { ecuPin: "B 119", ecuColour: "Yellow", target: "L1", targetPin: "1", targetColour: "Yellow", connector: "B", mismatch: false },
  { ecuPin: "B 120", ecuColour: "Red", target: "L11", targetPin: "3", targetColour: "Red", connector: "B", mismatch: false },
  { ecuPin: "B 121", ecuColour: "Violet", target: "L11", targetPin: "1", targetColour: "Violet", connector: "B", mismatch: false },
  { ecuPin: "B 122", ecuColour: "White", target: "L3", targetPin: "2", targetColour: "White", connector: "B", mismatch: false },
  { ecuPin: "B 123", ecuColour: "Black", target: "I2", targetPin: "2", targetColour: "Black", connector: "B", mismatch: false },
  { ecuPin: "B 124", ecuColour: "White", target: "I2", targetPin: "1", targetColour: "White", connector: "B", mismatch: false },
  { ecuPin: "B 125", ecuColour: "Grey", target: "X16", targetPin: "1", targetColour: "Grey", connector: "B", mismatch: false },
  { ecuPin: "B 126", ecuColour: "Pink", target: "X16", targetPin: "2", targetColour: "Pink", connector: "B", mismatch: false },
  { ecuPin: "B 127", ecuColour: "Pink", target: "X9", targetPin: "2", targetColour: "Pink", connector: "B", mismatch: false },
  { ecuPin: "B 128", ecuColour: "Violet", target: "X9", targetPin: "1", targetColour: "Violet", connector: "B", mismatch: false },
  { ecuPin: "B 129", ecuColour: "Green", target: "X2", targetPin: "1", targetColour: "Green", connector: "B", mismatch: false },
  { ecuPin: "B 130", ecuColour: "Pink", target: "X2", targetPin: "2", targetColour: "Pink", connector: "B", mismatch: false },
  { ecuPin: "B 133", ecuColour: "Yellow", target: "U2", targetPin: "3", targetColour: "Yellow", connector: "B", mismatch: false },
  { ecuPin: "B 134", ecuColour: "Blue", target: "U2", targetPin: "4", targetColour: "Blue", connector: "B", mismatch: false },
  { ecuPin: "B 135", ecuColour: "Yellow", target: "U1", targetPin: "4", targetColour: "Yellow", connector: "B", mismatch: false },
];

export const SCH_TRACES: SchTrace[] = [
  {
    id: "inj", labelId: "schematic.trace.inj.label",
    steps: [
    { cmp: "F_INJEFIB", colour: "Pink", descId: "schematic.trace.inj.step.0" },
    { cmp: "E1", colour: "Pink", descId: "schematic.trace.inj.step.1" },
    { cmp: "R15", colour: "Red", descId: "schematic.trace.inj.step.2" },
    { cmp: "E1", colour: "Black", descId: "schematic.trace.inj.step.3" },
    { cmp: "INJ1", colour: "Black", descId: "schematic.trace.inj.step.4" },
    { cmp: "G_BA", colour: "Brown", descId: "schematic.trace.inj.step.5" },
    ],
  },
  {
    id: "ign", labelId: "schematic.trace.ign.label",
    steps: [
    { cmp: "F_IGN", colour: "Black", descId: "schematic.trace.ign.step.0" },
    { cmp: "E1", colour: "Black", descId: "schematic.trace.ign.step.1" },
    { cmp: "R16", colour: "White/Black", descId: "schematic.trace.ign.step.2" },
    { cmp: "E1", colour: "Yellow", descId: "schematic.trace.ign.step.3" },
    { cmp: "COIL1", colour: "Yellow", descId: "schematic.trace.ign.step.4" },
    { cmp: "E1", colour: "Red", descId: "schematic.trace.ign.step.5" },
    { cmp: "G_AB", colour: "Brown", descId: "schematic.trace.ign.step.6" },
    ],
  },
  {
    id: "can", labelId: "schematic.trace.can.label",
    steps: [
    { cmp: "E1", colour: "Black", descId: "schematic.trace.can.step.0" },
    { cmp: "CAN1", colour: "Black", descId: "schematic.trace.can.step.1" },
    { cmp: "E1", colour: "White", descId: "schematic.trace.can.step.2" },
    { cmp: "CAN1", colour: "White", descId: "schematic.trace.can.step.3" },
    { cmp: "O6", colour: "Pink", descId: "schematic.trace.can.step.4" },
    ],
  },
];

export const SCH_TASKS: SchTask[] = [
  { promptId: "schematic.task.0.prompt", answer: "F_EFI1", explainId: "schematic.task.0.explain" },
  { promptId: "schematic.task.1.prompt", answer: "R16", explainId: "schematic.task.1.explain" },
  { promptId: "schematic.task.2.prompt", answer: "G_BA", explainId: "schematic.task.2.explain" },
  { promptId: "schematic.task.3.prompt", answer: "L3", explainId: "schematic.task.3.explain" },
  { promptId: "schematic.task.4.prompt", answer: "INJ1", explainId: "schematic.task.4.explain" },
  { promptId: "schematic.task.5.prompt", answer: "CAN1", explainId: "schematic.task.5.explain" },
  { promptId: "schematic.task.6.prompt", answer: "G1", explainId: "schematic.task.6.explain" },
  { promptId: "schematic.task.7.prompt", answer: "R1", explainId: "schematic.task.7.explain" },
];

export const SCH_EXAM: SchExamQ[] = [
  { promptId: "schematic.exam.0.prompt", answer: "R15" },
  { promptId: "schematic.exam.1.prompt", answer: "G_AB" },
  { promptId: "schematic.exam.2.prompt", answer: "X1" },
  { promptId: "schematic.exam.3.prompt", answer: "F_IGN" },
  { promptId: "schematic.exam.4.prompt", answer: "H3" },
  { promptId: "schematic.exam.5.prompt", answer: "E24" },
];

export const SCH_LAYERS: SchLayer[] = [
  { key: "labels", labelId: "schematic.layer.labels", na: false },
  { key: "pins", labelId: "schematic.layer.pins", na: false },
  { key: "colours", labelId: "schematic.layer.colours", na: false },
  { key: "grounds", labelId: "schematic.layer.grounds", na: false },
  { key: "power", labelId: "schematic.layer.power", na: false },
  { key: "canh", labelId: "schematic.layer.canh", na: false },
  { key: "canl", labelId: "schematic.layer.canl", na: false },
  { key: "lin", labelId: "schematic.layer.lin", na: true },
  { key: "flexray", labelId: "schematic.layer.flexray", na: true },
  { key: "wirenum", labelId: "schematic.layer.wirenum", na: true },
  { key: "circuit", labelId: "schematic.layer.circuit", na: true },
];

/** Default layer visibility (source: active layers on, NO-DATA layers off). */
export const SCH_DEFAULT_LAYERS: Record<string, boolean> = {
  labels: true, pins: true, colours: true, grounds: true, power: true, canh: true, canl: true,
};

const CMP_BY_KEY: Record<string, SchComponent> = Object.fromEntries(SCH_COMPONENTS.map((c) => [c.key, c]));
export function schByKey(key: string): SchComponent | undefined { return CMP_BY_KEY[key]; }

/** Pin-table rows for a component. E1 (the ECU hub) returns ALL rows. */
export function wiresFor(key: string): SchWire[] {
  if (key === "E1") return SCH_WIRES;
  return SCH_WIRES.filter((w) => w.target === key);
}
/** Distinct ECU pins overall, or for one connector ("A"/"B"). */
export function distinctEcuPins(connector?: string): string[] {
  const seen = new Set<string>();
  for (const w of SCH_WIRES) if (!connector || w.connector === connector) seen.add(w.ecuPin);
  return [...seen];
}
/** ECU pins a component connects to (its distinct ecuPins). */
export function pinsFor(key: string): string[] {
  const seen = new Set<string>();
  for (const w of wiresFor(key)) seen.add(w.ecuPin);
  return [...seen];
}
/** Components sharing at least one ECU pin with the given component (shared-net neighbours). */
export function relatedTo(key: string): string[] {
  if (key === "E1") {
    const out: string[] = []; const seen = new Set<string>();
    for (const w of SCH_WIRES) if (w.target !== "E1" && !seen.has(w.target)) { seen.add(w.target); out.push(w.target); }
    return out;
  }
  // Source always lists the ECU hub E1 first for any non-E1 selection, then the
  // components sharing one of its ECU pins (shared-net neighbours).
  const pins = new Set(wiresFor(key).map((w) => w.ecuPin));
  const out: string[] = ["E1"]; const seen = new Set<string>(["E1"]);
  for (const w of SCH_WIRES) if (pins.has(w.ecuPin) && w.target !== key && !seen.has(w.target)) { seen.add(w.target); out.push(w.target); }
  return out;
}
export function traceById(id: string): SchTrace | undefined { return SCH_TRACES.find((t) => t.id === id); }

export const SCH_COMPONENT_TOTAL = SCH_COMPONENTS.length;
export const SCH_WIRE_TOTAL = SCH_WIRES.length;
