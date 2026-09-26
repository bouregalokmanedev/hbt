import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { trackOnce } from "@/lib/track";
import { useAuthStore } from "@/features/auth/store/auth.store";

export interface SimulatorSession {
  id: string;
  tool: string;
  vehicle_key: string;
  scenario_key?: string | null;
  status: string;
}

export interface SimulatorResult {
  id: string;
  session_id?: string | null;
  tool: string;
  scenario_key?: string | null;
  score: number;
  outcome?: string | null;
  verdict?: string | null;
  attempts?: number | null;
  hints_used?: number | null;
  duration_seconds?: number | null;
  steps?: { label: string; ok: boolean }[] | null;
  metadata?: {
    scenarioId?: string;
    vehicleId?: string;
    at?: number;
    hintsUsed?: number;
    attempts?: number;
    adasDone?: boolean[];
    adasCalibrated?: number;
    adasTotal?: number;
    source?: string;
    durationSeconds?: number;
  } | null;
  created_at?: string | null;
}

function sortByCreatedDesc(list: SimulatorResult[]): SimulatorResult[] {
  return [...list].sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
  );
}

/** Unwrap array | { data: [] } | paginated { data: { data: [] } } shapes. */
function normalizeResults(raw: unknown): SimulatorResult[] {
  if (Array.isArray(raw)) return raw as SimulatorResult[];
  if (raw && typeof raw === "object") {
    const nested = (raw as { data?: unknown }).data;
    if (Array.isArray(nested)) return nested as SimulatorResult[];
    if (nested && typeof nested === "object") {
      const deeper = (nested as { data?: unknown }).data;
      if (Array.isArray(deeper)) return deeper as SimulatorResult[];
    }
  }
  return [];
}

export const SIMULATOR_RESULTS_EVENT = "hbt:simulator-results";

/** Fired when the backend refuses to start a session (monthly cap reached). */
export const SIMULATOR_LIMIT_EVENT = "hbt:simulator-limit-reached";

export function notifySimulatorResults(): void {
  window.dispatchEvent(new Event(SIMULATOR_RESULTS_EVENT));
}

/** Shared browser key prefix — always scoped to the signed-in user. */
export const LOCAL_RESULTS_PREFIX = "hbt:simulator-local-results";

function localResultsKey(): string {
  const id = useAuthStore.getState().user?.id;
  return id ? `${LOCAL_RESULTS_PREFIX}:${id}` : `${LOCAL_RESULTS_PREFIX}:anon`;
}

function readLocalResults(): SimulatorResult[] {
  try {
    const raw = window.localStorage.getItem(localResultsKey());
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SimulatorResult[]) : [];
  } catch {
    return [];
  }
}

function writeLocalResults(list: SimulatorResult[]): void {
  try {
    window.localStorage.setItem(localResultsKey(), JSON.stringify(list.slice(0, 50)));
  } catch {
    // Storage unavailable — keep only in-memory via the event consumers.
  }
}

/** Drop every user-scoped mirror (and the old shared key) — call on logout. */
export function clearLocalSimulatorResults(): void {
  try {
    const stale: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(LOCAL_RESULTS_PREFIX)) stale.push(key);
    }
    stale.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage unavailable.
  }
}

/** Persist a local mirror so History/Report/Hub stay correct if the API write fails. */
export function rememberLocalResult(result: SimulatorResult): void {
  const existing = readLocalResults();
  const next = [result, ...existing.filter((r) => r.id !== result.id)];
  writeLocalResults(next);
  notifySimulatorResults();
}

function mergeWithLocal(apiResults: SimulatorResult[]): SimulatorResult[] {
  const local = readLocalResults();
  if (local.length === 0) return apiResults;
  const apiIds = new Set(apiResults.map((r) => r.id));
  const missing = local.filter((r) => !apiIds.has(r.id));
  if (missing.length === 0) return apiResults;
  return sortByCreatedDesc([...apiResults, ...missing]);
}

export const simulatorApi = {
  start: async (payload: {
    vehicle_key: string;
    tool: string;
    scenario_key?: string;
  }): Promise<SimulatorSession> => {
    try {
      return await api<SimulatorSession>("/v1/simulator/sessions", {
        method: "POST",
        body: payload,
      });
    } catch (error) {
      // Monthly free-tier cap: report the funnel event once and let every
      // caller know a plan upgrade is what unblocks the bench.
      if (error instanceof ApiError && error.errors?.sessions) {
        trackOnce("simulator_limit_reached", { source: "simulator_start" });
        try {
          window.dispatchEvent(new Event(SIMULATOR_LIMIT_EVENT));
        } catch {
          // Non-browser test environments.
        }
      }
      throw error;
    }
  },
  complete: (
    sessionId: string,
    payload: {
      score: number;
      outcome?: string;
      verdict?: string;
      attempts?: number;
      hints_used?: number;
      duration_seconds?: number;
      scenario_key?: string;
      steps?: unknown;
      metadata?: Record<string, unknown>;
    },
  ) =>
    api<SimulatorResult>(`/v1/simulator/sessions/${sessionId}/complete`, {
      method: "POST",
      body: payload,
    }),
  results: async () => {
    try {
      const remote = normalizeResults(await api<unknown>("/v1/simulator/results"));
      return mergeWithLocal(sortByCreatedDesc(remote));
    } catch {
      return sortByCreatedDesc(readLocalResults());
    }
  },
  catalog: () =>
    api<
      {
        id: string;
        name: string;
        models: {
          id: string;
          name: string;
          variants: {
            id: string;
            name: string;
            engine_code: string | null;
            transmission: string | null;
            metadata: { vin?: string; odometer_km?: number; coverage?: Record<string, string> } | null;
            packs: { id: string; code: string; version: string; manifest: unknown[] }[];
          }[];
        }[];
      }[]
    >("/v1/simulator/catalog"),
};
