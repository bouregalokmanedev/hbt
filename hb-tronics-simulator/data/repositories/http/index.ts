import type { Repositories, RepoContext } from "../types";
import { staticRepositories } from "../static";

/**
 * Milestone 3.3 — HTTP repositories stub (identity-capable, contract-identical).
 * Reference data delegates to static today; record.commit posts to /api/v1/simulator/results.
 * Real session wiring arrives with SessionProvider (M2); until then ctx is empty.
 */
async function commit(result: import("../../../packages/sim-core/result").SessionResult, _ctx?: RepoContext): Promise<{ resultId: string; reportId: string }> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  if (!base) return { resultId: result.scenarioId, reportId: `r-${result.scenarioId}` };
  const res = await fetch(`${base}/api/v1/simulator/results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });
  if (!res.ok) throw new Error(`commit failed ${res.status}`);
  const body = (await res.json()) as { data: { resultId: string; reportId: string } };
  return body.data;
}

export const httpRepositories: Repositories = {
  vehicles: staticRepositories.vehicles,
  components: staticRepositories.components,
  scenarios: staticRepositories.scenarios,
  modules: staticRepositories.modules,
  record: {
    reports: (ctx) => staticRepositories.record.reports(ctx),
    commit,
  },
};
