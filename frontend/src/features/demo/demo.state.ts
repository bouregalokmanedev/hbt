const STAGE_KEY = "hbt:demo-stage";

export type DemoStage = 0 | 1;

let lastKnownStage: DemoStage | null = null;

export function getDemoStage(): DemoStage {
  try {
    const raw = window.localStorage.getItem(STAGE_KEY);
    lastKnownStage = raw === "1" ? 1 : 0;
  } catch {
    lastKnownStage = lastKnownStage ?? 0;
  }
  return lastKnownStage ?? 0;
}

export function readDemoStage(): DemoStage {
  if (lastKnownStage !== null) return lastKnownStage;
  return getDemoStage();
}

export function setDemoStage(stage: DemoStage): void {
  lastKnownStage = stage;
  try {
    window.localStorage.setItem(STAGE_KEY, String(stage));
  } catch {
    // Memory-only stage when storage is blocked.
  }
}

export function bumpDemoStageForAuth(): void {
  if (readDemoStage() < 1) setDemoStage(1);
}

export const DEMO_LABS = [
  "scanner",
  "multimeter",
  "oscilloscope",
  "location",
  "schematic",
] as const;

export type DemoLabId = (typeof DEMO_LABS)[number];

export function isDemoLabUnlocked(labId: string): boolean {
  const stage = readDemoStage();
  if (labId === "scanner") return true;
  if (labId === "schematic") return stage >= 1;
  return false;
}

export const DEMO_SCANNER_VEHICLE_ID = "corolla";

export function isDemoVehicleUnlocked(vehicleId: string): boolean {
  return vehicleId === DEMO_SCANNER_VEHICLE_ID;
}

export interface DemoStep {
  id: string;
  title: string;
  description: string;
  tool: string;
  findingPlaceholder: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  complaint: string;
  vehicle: string;
  faultCodes: string[];
  steps: DemoStep[];
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "demo-no-start",
    title: "No-crank intermittent",
    description: "Customer reports the engine occasionally refuses to crank with a healthy battery.",
    complaint: "Intermittent no-crank after short trips",
    vehicle: "Toyota Corolla 1.6 · 1ZR-FE",
    faultCodes: ["P0512"],
    steps: [
      {
        id: "s1",
        title: "Scan the immobilizer",
        description: "Connect the scanner and check immobilizer and starter request signals.",
        tool: "scanner",
        findingPlaceholder: "What did the scanner report?",
      },
      {
        id: "s2",
        title: "Check battery voltage",
        description: "Measure resting battery voltage under load during a no-crank event.",
        tool: "multimeter",
        findingPlaceholder: "Enter measured voltage…",
      },
      {
        id: "s3",
        title: "Inspect starter relay",
        description: "Locate the starter relay and verify coil and load-side switching.",
        tool: "schematic",
        findingPlaceholder: "Relay status and evidence…",
      },
      {
        id: "s4",
        title: "Diagnose the root cause",
        description: "Combine findings and choose the most likely root cause.",
        tool: "scanner",
        findingPlaceholder: "Root cause and recommended fix…",
      },
    ],
  },
  {
    id: "demo-misfire",
    title: "Misfire under load",
    description: "Rough power and hesitation when accelerating uphill.",
    complaint: "Misfire under load on hill starts",
    vehicle: "Toyota Corolla 1.6 · 1ZR-FE",
    faultCodes: ["P0301"],
    steps: [],
  },
  {
    id: "demo-coolant",
    title: "Coolant temperature sensor",
    description: "Gauge erratic and fans run at unexpected times.",
    complaint: "Erratic temperature gauge",
    vehicle: "Toyota Corolla 1.6 · 1ZR-FE",
    faultCodes: ["P0115"],
    steps: [],
  },
  {
    id: "demo-abs",
    title: "ABS warning light",
    description: "ABS light stays on after wheel-speed road test.",
    complaint: "ABS warning after pothole",
    vehicle: "Toyota Corolla 1.6 · 1ZR-FE",
    faultCodes: ["C0035"],
    steps: [],
  },
];

export function isDemoScenarioUnlocked(index: number): boolean {
  return index === 0;
}

export function isDemoStepUnlocked(scenarioIndex: number, stepIndex: number): boolean {
  if (!isDemoScenarioUnlocked(scenarioIndex)) return false;
  if (readDemoStage() >= 1) return true;
  return stepIndex === 0;
}
