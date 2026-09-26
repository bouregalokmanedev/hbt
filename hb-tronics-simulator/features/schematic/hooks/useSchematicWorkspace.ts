"use client";

import { useEffect, useRef } from "react";
import { SchematicWorkspaceEngine } from "@sim/schematic";
import { getEngine } from "@/providers/registry";
import { useEngineState } from "@/lib/useEngine";
import { useAppStore, useAppStoreApi } from "@/providers/StoreProvider";

/**
 * Binds the authentic framework-free SchematicWorkspaceEngine to React (P6.2). The
 * engine lives in the module registry (survives navigation); this hook only wires
 * the snapshot and the SessionResult commit path. No netlist / trace / scoring
 * logic in React.
 */
export function useSchematicWorkspace() {
  const focus = useAppStore((s) => s.focus);
  const difficulty = useAppStore((s) => s.settings.difficulty);
  const api = useAppStoreApi();

  const engine = getEngine(
    "schematic",
    () =>
      new SchematicWorkspaceEngine({
        vehicleId: api.getState().vehicleId,
        focus: focus ?? "R16",
        settings: {
          difficulty,
          hints: api.getState().settings.hints,
          randomFault: false,
          outlines: api.getState().settings.outlines,
          noise: 1,
          instrument: "Bench replica",
          probeMode: "Drag probes",
        },
      }),
  ) as SchematicWorkspaceEngine;

  const state = useEngineState(engine);

  const wired = useRef(false);
  useEffect(() => {
    if (wired.current) return;
    wired.current = true;
    const off = engine.onComplete((r) => api.getState().commitResult({ ...r, at: Date.now() }));
    return () => off();
  }, [engine, api]);

  return { engine, state };
}
