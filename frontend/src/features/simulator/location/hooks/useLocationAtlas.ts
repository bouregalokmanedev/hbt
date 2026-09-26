import { useEffect, useState, useSyncExternalStore } from "react";

import { rememberLocalResult, simulatorApi } from "@/features/simulator/api/simulator.api";
import type { SessionResult } from "@/features/simulator/scanner/engine/scanner.engine";
import { LocationAtlasEngine, type AtlasState } from "@/features/simulator/location/engine/atlas.engine";
import { fetchCatalog, getLocationComponentsForVehicle, isCatalogWarm } from "@/features/simulator/scanner/data/catalog";
import type { LocComponent } from "../data/location.data";

const registry = new Map<string, LocationAtlasEngine>();

function keyFor(vehicleId: string, focus?: string | null): string {
  return `location:${vehicleId}:${focus ?? "default"}`;
}

export function getLocationEngine(vehicleId: string, focus?: string | null, components?: LocComponent[]): LocationAtlasEngine {
  const key = keyFor(vehicleId, focus) + (components ? ":pack" : ":static");
  let engine = registry.get(key);
  if (!engine) {
    engine = new LocationAtlasEngine({
      vehicleId,
      focus: focus ?? null,
      components,
    });
    registry.set(key, engine);
  }
  return engine;
}

export function disposeLocationEngine(vehicleId: string, focus?: string | null): void {
  const key = keyFor(vehicleId, focus);
  registry.get(key)?.dispose();
  registry.delete(key);
}

/**
 * React bridge — the only place UI meets the engine. Engine state flows out
 * via useSyncExternalStore; SessionResults flow to the backend session.
 * Mirrors useMeterProcedure / useScope patterns.
 */
export function useLocationAtlas(
  vehicleId?: string | null,
  sessionId?: string | null,
  focus?: string | null,
): {
  engine: LocationAtlasEngine | null;
  state: AtlasState | null;
  lastResult: SessionResult | null;
} {
  const effectiveVehicleId = vehicleId ?? "corolla-1zr-fe";
  const effectiveFocus = focus ?? null;

  const [engine, setEngine] = useState<LocationAtlasEngine | null>(null);
  const [lastResult, setLastResult] = useState<SessionResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    let off: (() => void) | null = null;
    const init = async () => {
      let components: LocComponent[] | undefined;
      if (effectiveVehicleId.startsWith("backend:")) {
        if (!isCatalogWarm()) await fetchCatalog().catch(() => undefined);
        const pack = getLocationComponentsForVehicle(effectiveVehicleId);
        if (pack) components = pack;
      }
      if (cancelled) return;
      const created = getLocationEngine(effectiveVehicleId, effectiveFocus, components);
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
              tool: "location",
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

  const state = useSyncExternalStore(
    (listener) => engine?.subscribe(listener) ?? (() => {}),
    () => engine?.getState() ?? null,
    () => engine?.getState() ?? null,
  );

  return { engine, state, lastResult };
}
