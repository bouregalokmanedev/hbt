import { VEH } from "../../shared/vehicles";
import { CTX } from "../../shared/components";
import { REPORTS } from "../../record";
import { SCENARIOS, DEFAULT_SCENARIO_BY_TOOL } from "../../scenarios";
import { LEARNING_MODULES } from "../../modules";
import type { Coverage, ToolId } from "../../schema";
import type {
  VehicleRepository,
  ComponentRepository,
  ScenarioRepository,
  ModuleRepository,
  RecordRepository,
  Repositories,
} from "../types";

/**
 * StaticRepository implementations — read the bundled datasets today. The
 * `ctx` identity argument is accepted and ignored (review F13). Swapping any of
 * these for an HTTP-backed implementation requires no change in callers.
 */

const staticVehicles: VehicleRepository = {
  list: () => VEH,
  byId: (id) => VEH.find((v) => v.id === id),
  coverage: (vehicleId, tool) => (VEH.find((v) => v.id === vehicleId)?.coverage[tool] ?? "none") as Coverage,
};

const staticComponents: ComponentRepository = {
  list: () => CTX,
  byRef: (ref) => CTX.find((c) => c.ref === ref),
};

const staticScenarios: ScenarioRepository = {
  list: () => SCENARIOS,
  byId: (id) => SCENARIOS.find((s) => s.id === id),
  byTool: (tool: ToolId) => SCENARIOS.filter((s) => s.tool === tool),
  defaultForTool: (tool: ToolId) => SCENARIOS.find((s) => s.id === DEFAULT_SCENARIO_BY_TOOL[tool]),
};

const staticModules: ModuleRepository = {
  list: () => LEARNING_MODULES,
  byId: (id) => LEARNING_MODULES.find((m) => m.id === id),
};

const staticRecord: RecordRepository = {
  reports: () => REPORTS,
  commit: async (result) => ({ resultId: result.scenarioId, reportId: `r-${result.scenarioId}` }),
};

export const staticRepositories: Repositories = {
  vehicles: staticVehicles,
  components: staticComponents,
  scenarios: staticScenarios,
  modules: staticModules,
  record: staticRecord,
};
