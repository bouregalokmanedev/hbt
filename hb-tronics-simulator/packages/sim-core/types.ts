/** Shared engine input contract from the shell (10 §5). */
export type ToolId = "scanner" | "multimeter" | "oscilloscope" | "location" | "schematic";

export interface EngineSettings {
  difficulty: "Easy" | "Medium" | "Hard";
  hints: boolean;
  randomFault: boolean;
  outlines: boolean;
  noise: 0 | 1 | 2;
  instrument: string;
  probeMode: "Drag probes" | "Click to place";
}

export interface EngineContext {
  vehicleId: string;
  focus: string; // canonical component ref
  settings: EngineSettings;
  scenarioId?: string;
  seed?: number;
}
