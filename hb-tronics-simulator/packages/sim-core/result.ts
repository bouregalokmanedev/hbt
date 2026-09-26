/**
 * SessionResult — the single write-path contract from an engine to the learning
 * record (review F2, 10 §6.1). Engines emit this via onComplete; the React
 * bridge routes it to recordStore.commitResult. Engines never import the store.
 */
export interface SessionResultStep {
  label: string; // Class-C prose resolved by UI where needed; canonical id-friendly here
  ok: boolean;
}

export interface SessionResult {
  tool: "scanner" | "multimeter" | "oscilloscope" | "location" | "schematic";
  scenarioId: string;
  score: number;
  steps: SessionResultStep[];
  verdict: string;
  outcome: "pass" | "fault";
  /** epoch ms — stamped by the bridge/UI, not inside the engine (determinism). */
  at: number;
}
