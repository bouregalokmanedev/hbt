import { useEffect, useState, useSyncExternalStore } from "react";

import { ScopeEngine, type ScopeEngineState } from "../engine/scope.engine";
import type { SessionResult } from "@/features/simulator/scanner/engine/scanner.engine";
import { rememberLocalResult, simulatorApi } from "@/features/simulator/api/simulator.api";
import { fetchCatalog, getScopeExercisesForVehicle, isCatalogWarm } from "@/features/simulator/scanner/data/catalog";
import type { ScopeExercise } from "../data/oscilloscope.data";
import { readVehicleItem } from "@/features/simulator/lib/vehicleStorage";

const SCOPE_VEHICLE_KEY = "hbt:scope-vehicle";
const registry = new Map<string, ScopeEngine>();

function resolveVehicleId(explicit?: string | null): string {
  if (explicit) return explicit;
  try {
    const stored = typeof window !== "undefined" ? readVehicleItem(SCOPE_VEHICLE_KEY) : null;
    if (stored) return stored;
  } catch {
    // ignore storage failures
  }
  return "corolla-1zr-fe";
}

function keyFor(vehicleId: string, focus?: string | null): string {
  return `oscilloscope:${vehicleId}:${focus ?? "default"}`;
}

export function getScopeEngine(vehicleId: string, focus?: string | null, exercises?: ScopeExercise[]): ScopeEngine {
  const key = keyFor(vehicleId, focus) + (exercises ? ":pack" : ":static");
  let engine = registry.get(key);
  if (!engine) {
    engine = new ScopeEngine({
      vehicleId,
      focus: focus && ["inj", "coil", "cam", "app", "map", "knock", "lambda"].includes(focus) ? focus : "inj",
      settings: { noise: 1 },
      exercises,
    });
    registry.set(key, engine);
  }
  return engine;
}

export function disposeScopeEngine(vehicleId: string, focus?: string | null): void {
  const key = keyFor(vehicleId, focus);
  registry.get(key)?.dispose();
  registry.delete(key);
}

/**
 * React bridge for the framework-free ScopeEngine (port of hb-tronics-simulator/features/oscilloscope/hooks/useScope.ts).
 * Instantiates the engine via a local registry (survives navigation) and subscribes with useSyncExternalStore.
 * No measurement logic here — all values come from engine methods.
 */
export function useScope(
  vehicleId?: string | null,
  sessionId?: string | null,
  focus?: string | null,
): {
  engine: ScopeEngine | null;
  state: ScopeEngineState | null;
  lastResult: SessionResult | null;
} {
  const effectiveVehicleId = resolveVehicleId(vehicleId ?? null);
  const effectiveFocus = focus ?? null;

  const [engine, setEngine] = useState<ScopeEngine | null>(null);
  const [lastResult, setLastResult] = useState<SessionResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    let off: (() => void) | null = null;
    const init = async () => {
      let exercises: ScopeExercise[] | undefined;
      if (effectiveVehicleId.startsWith("backend:")) {
        if (!isCatalogWarm()) await fetchCatalog().catch(() => undefined);
        const pack = getScopeExercisesForVehicle(effectiveVehicleId);
        if (pack) exercises = pack;
      }
      if (cancelled) return;
      const created = getScopeEngine(effectiveVehicleId, effectiveFocus, exercises);
      setEngine(created);
      off = created.onComplete((result) => {
        const stamped = { ...result, at: result.at || Date.now() } as SessionResult;
        setLastResult(stamped);
        if (!sessionId) return;
        const payload = {
          score: result.score,
          outcome: result.outcome,
          verdict: result.verdict,
          attempts: result.attempts,
          hints_used: result.hintsUsed,
          duration_seconds: result.durationSeconds,
          scenario_key: result.scenarioId,
          steps: result.steps,
          metadata: {
            scenarioId: result.scenarioId,
            at: stamped.at,
            vehicleId: effectiveVehicleId,
            hintsUsed: result.hintsUsed,
            attempts: result.attempts,
          },
        };
        void simulatorApi
          .complete(sessionId, payload)
          .catch(() => {
            rememberLocalResult({
              id: `local-${sessionId}-${stamped.at}`,
              session_id: sessionId,
              tool: "oscilloscope",
              score: payload.score,
              outcome: payload.outcome,
              verdict: payload.verdict,
              attempts: payload.attempts ?? null,
              hints_used: payload.hints_used ?? null,
              duration_seconds: payload.duration_seconds ?? null,
              scenario_key: payload.scenario_key ?? null,
              steps: payload.steps as { label: string; ok: boolean }[] | null,
              metadata: payload.metadata as never,
              created_at: new Date().toISOString(),
            });
          });
      });
    };
    void init();
    return () => {
      cancelled = true;
      if (off) off();
    };
  }, [effectiveVehicleId, effectiveFocus, sessionId]);

  useEffect(
    () => () => {
      // Do not dispose on every unmount if shared across tabs; keep matching multimeter pattern
      // but expose dispose for manual cleanup.
    },
    [effectiveVehicleId, effectiveFocus],
  );

  const state = useSyncExternalStore(
    (listener) => engine?.subscribe(listener) ?? (() => {}),
    () => engine?.getState() ?? null,
    () => engine?.getState() ?? null,
  );

  return { engine, state, lastResult };
}
