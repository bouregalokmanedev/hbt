import { useEffect, useState, useSyncExternalStore } from "react";

import { rememberLocalResult, simulatorApi } from "@/features/simulator/api/simulator.api";
import type { SessionResult } from "@/features/simulator/scanner/engine/scanner.engine";
import { SchematicWorkspaceEngine, type WorkspaceState } from "../engine/workspace.engine";
import { fetchCatalog, getSchematicDataForVehicle, isCatalogWarm } from "@/features/simulator/scanner/data/catalog";
import type { SchComponent, SchWire, SchTrace } from "../data/schematic.data";

const registry = new Map<string, SchematicWorkspaceEngine>();

function keyFor(vehicleId: string, focus?: string | null): string {
  return `schematic:${vehicleId}:${focus ?? "default"}`;
}

export function getSchematicEngine(vehicleId: string, focus?: string | null, data?: { components?: SchComponent[]; wires?: SchWire[]; traces?: SchTrace[] }): SchematicWorkspaceEngine {
  const key = keyFor(vehicleId, focus) + (data ? ":pack" : ":static");
  let engine = registry.get(key);
  if (!engine) {
    engine = new SchematicWorkspaceEngine({ vehicleId, focus: focus ?? null, ...data });
    registry.set(key, engine);
  }
  return engine;
}

export function disposeSchematicEngine(vehicleId: string, focus?: string | null): void {
  const key = keyFor(vehicleId, focus);
  registry.get(key)?.dispose();
  registry.delete(key);
}

/**
 * Binds the framework-free SchematicWorkspaceEngine to React.
 * Instantiates via a local registry (survives navigation) and subscribes with useSyncExternalStore.
 * No netlist / trace / scoring logic in React — all domain state is engine-driven.
 */
export function useSchematicWorkspace(
  vehicleId?: string | null,
  sessionId?: string | null,
  focus?: string | null,
): {
  engine: SchematicWorkspaceEngine | null;
  state: WorkspaceState | null;
  lastResult: SessionResult | null;
} {
  const effectiveVehicleId = vehicleId ?? "corolla-1zr-fe";
  const effectiveFocus = focus ?? null;

  const [engine, setEngine] = useState<SchematicWorkspaceEngine | null>(null);
  const [lastResult, setLastResult] = useState<SessionResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    let off: (() => void) | null = null;
    const init = async () => {
      let data: { components?: SchComponent[]; wires?: SchWire[]; traces?: SchTrace[] } | undefined;
      if (effectiveVehicleId.startsWith("backend:")) {
        if (!isCatalogWarm()) await fetchCatalog().catch(() => undefined);
        const pack = getSchematicDataForVehicle(effectiveVehicleId);
        if (pack) data = pack;
      }
      if (cancelled) return;
      const created = getSchematicEngine(effectiveVehicleId, effectiveFocus, data);
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
              tool: "schematic",
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
