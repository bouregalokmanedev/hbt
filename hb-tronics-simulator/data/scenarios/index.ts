import { ScenarioSchema, type Scenario } from "../schema/scenario";

/**
 * Seed scenarios (10 §7.1). All existing source exercises become data-driven
 * definitions here — engines load these by id instead of hard-coding rubrics,
 * verdicts and scenario ids. Class-B step content stays in data/<tool> and is
 * referenced via `contentRef`.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: "scanner-P2118",
    tool: "scanner",
    vehicleId: "corolla",
    focusRef: "H3",
    title: "P2118 throttle actuator diagnostic tree",
    difficulty: "Medium",
    seededFaults: ["P2118"],
    contentRef: "tree:P2118",
    rubric: { startScore: 100, penaltyPerAttempt: 8, passPct: 60 },
    verdict: "Throttle motor winding open — 6.42 Ω vs 0.3–1.8 Ω spec.",
  },
  {
    id: "scanner-scenario-12",
    tool: "scanner",
    vehicleId: "corolla",
    focusRef: null,
    title: "Scenario 12 — intermittent power loss under load",
    difficulty: "Medium",
    seededFaults: ["P0087"],
    contentRef: "training:12",
    rubric: { startScore: 100, weights: { accuracy: 92, process: 88, time: 76 }, passPct: 60 },
    verdict: "Restricted fuel filter starving the HP pump.",
  },
  {
    id: "mm-guided",
    tool: "multimeter",
    vehicleId: "corolla",
    focusRef: null,
    title: "Guided static measurement",
    difficulty: "Medium",
    seededFaults: [],
    contentRef: "steps",
    rubric: { startScore: 100, penaltyPerAttempt: 8, passPct: 60 },
    verdict: null,
  },
  {
    id: "osc-diagnosis",
    tool: "oscilloscope",
    vehicleId: "corolla",
    focusRef: null,
    title: "Waveform diagnosis",
    difficulty: "Medium",
    seededFaults: [],
    contentRef: "waveform",
    rubric: { startScore: 100, weights: { correct: 70, wiring: 30 }, passPct: 60 },
    verdict: null,
  },
  {
    id: "loc-quiz",
    tool: "location",
    vehicleId: "corolla",
    focusRef: null,
    title: "Component-location quiz",
    difficulty: "Medium",
    seededFaults: [],
    contentRef: "quiz",
    rubric: { startScore: 100, passPct: 60 },
    verdict: null,
  },
  {
    id: "sch-inj",
    tool: "schematic",
    vehicleId: "corolla",
    focusRef: "INJ",
    title: "Injector 1 harness trace",
    difficulty: "Medium",
    seededFaults: [],
    contentRef: "trace:inj",
    rubric: { startScore: 100, passPct: 60 },
    verdict: null,
  },
];

/** Validate at module load (dev) so malformed content fails loudly. */
ScenarioSchema.parse(SCENARIOS);

/** The default scenario a tool opens with when the shell passes no scenarioId. */
export const DEFAULT_SCENARIO_BY_TOOL: Record<string, string> = {
  scanner: "scanner-P2118",
  multimeter: "mm-guided",
  oscilloscope: "osc-diagnosis",
  location: "loc-quiz",
  schematic: "sch-inj",
};
