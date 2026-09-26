"use client";

import { useEffect, useRef } from "react";
import { MeterProcedureEngine } from "@sim/multimeter";
import { getEngine } from "@/providers/registry";
import { useEngineState } from "@/lib/useEngine";
import { useAppStore, useAppStoreApi } from "@/providers/StoreProvider";

/**
 * Binds the authentic framework-free MeterProcedureEngine to React (P3.3). The
 * engine lives in the module registry (survives navigation); this hook only wires
 * the snapshot, the timer, and the SessionResult commit path. No measurement logic
 * lives here.
 */
export function useMeterProcedure() {
  const focus = useAppStore((s) => s.focus);
  const randomFault = useAppStore((s) => s.settings.randomFault);
  const difficulty = useAppStore((s) => s.settings.difficulty);
  const api = useAppStoreApi();

  const engine = getEngine(
    "multimeter",
    () =>
      new MeterProcedureEngine({
        vehicleId: api.getState().vehicleId,
        focus: focus ?? "L3",
        settings: {
          difficulty,
          hints: api.getState().settings.hints,
          randomFault,
          outlines: true,
          noise: 1,
          instrument: "Bench replica",
          probeMode: api.getState().settings.probeMode,
        },
      }),
  ) as MeterProcedureEngine;

  const state = useEngineState(engine);

  const wired = useRef(false);
  useEffect(() => {
    if (wired.current) return;
    wired.current = true;
    const off = engine.onComplete((r) => api.getState().commitResult({ ...r, at: Date.now() }));
    engine.startTimer();
    return () => off();
  }, [engine, api]);

  useEffect(() => {
    if (focus) engine.selectComponent(focus);
  }, [engine, focus]);

  return { engine, state };
}
