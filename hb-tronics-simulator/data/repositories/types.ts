import type { Vehicle, ComponentRef, Report, ToolId } from "../schema";
import type { Scenario } from "../schema/scenario";
import type { LearningModule } from "../schema/module";

/**
 * Repository interfaces — the sole seam to a future API (10 §7/§15). Today every
 * method is backed by the static Data layer; later by HTTP, with ZERO changes in
 * UI or Simulation layers. Interfaces are **identity-capable** (review F13):
 * each method accepts an optional context carrying userId/tenantId that the
 * StaticRepository ignores, so per-user authorization can arrive server-side
 * without touching callers.
 */
export interface RepoContext {
  userId?: string;
  tenantId?: string;
}

export interface VehicleRepository {
  list(ctx?: RepoContext): Vehicle[];
  byId(id: string, ctx?: RepoContext): Vehicle | undefined;
  coverage(vehicleId: string, tool: ToolId, ctx?: RepoContext): "ok" | "avail" | "none";
}

export interface ComponentRepository {
  list(ctx?: RepoContext): ComponentRef[];
  byRef(ref: string, ctx?: RepoContext): ComponentRef | undefined;
}

export interface ScenarioRepository {
  list(ctx?: RepoContext): Scenario[];
  byId(id: string, ctx?: RepoContext): Scenario | undefined;
  byTool(tool: ToolId, ctx?: RepoContext): Scenario[];
  defaultForTool(tool: ToolId, ctx?: RepoContext): Scenario | undefined;
}

export interface ModuleRepository {
  list(ctx?: RepoContext): LearningModule[];
  byId(id: string, ctx?: RepoContext): LearningModule | undefined;
}

export interface RecordRepository {
  reports(ctx?: RepoContext): Report[];
  commit?(result: import("../../packages/sim-core/result").SessionResult, ctx?: RepoContext): Promise<{ resultId: string; reportId: string }>;
}

/** The aggregate the app resolves via `getRepositories()` (index). */
export interface Repositories {
  vehicles: VehicleRepository;
  components: ComponentRepository;
  scenarios: ScenarioRepository;
  modules: ModuleRepository;
  record: RecordRepository;
}
