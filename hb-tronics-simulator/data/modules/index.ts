import { LearningModuleSchema, type LearningModule } from "../schema/module";

/**
 * Learning-module curriculum (10 §7.1). Groups scenarios into the 5 tool
 * courses that progress/certs reference by stable id.
 */
export const LEARNING_MODULES: LearningModule[] = [
  { id: "mod-scanner", title: "Diagnostic scanner", scenarioIds: ["scanner-P2118", "scanner-scenario-12"], prerequisites: [], certificationId: "cert-powertrain" },
  { id: "mod-multimeter", title: "Guided static measurement", scenarioIds: ["mm-guided"], prerequisites: [], certificationId: null },
  { id: "mod-oscilloscope", title: "Waveform laboratory", scenarioIds: ["osc-diagnosis"], prerequisites: [], certificationId: "cert-scope" },
  { id: "mod-location", title: "Component-location atlas", scenarioIds: ["loc-quiz"], prerequisites: [], certificationId: null },
  { id: "mod-schematic", title: "Wiring-diagram workspace", scenarioIds: ["sch-inj"], prerequisites: ["mod-multimeter"], certificationId: null },
];

LearningModuleSchema.parse(LEARNING_MODULES);
