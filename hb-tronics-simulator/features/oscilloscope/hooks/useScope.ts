"use client";

import { useEffect, useRef } from "react";
import { ScopeEngine } from "@sim/oscilloscope";
import { getEngine } from "@/providers/registry";
import { useEngineState } from "@/lib/useEngine";
import { useAppStore, useAppStoreApi } from "@/providers/StoreProvider";

/**
 * Binds the authentic framework-free ScopeEngine to React (P4.2). The engine lives
 * in the module registry (survives navigation); this hook only wires the snapshot
 * and the SessionResult commit path. No measurement logic here.
 */
export function useScope() {
  const focus = useAppStore((s) => s.focus);
  const noiseSetting = useAppStore((s) => s.settings.noise);
  const noise: 0 | 1 | 2 = noiseSetting === "Off" ? 0 : noiseSetting === "High" ? 2 : 1;
  const api = useAppStoreApi();

  const engine = getEngine(
    "oscilloscope",
    () =>
      new ScopeEngine({
        vehicleId: api.getState().vehicleId,
        focus: focus && ["inj", "coil", "cam", "app", "map", "knock", "lambda"].includes(focus) ? focus : "inj",
        settings: {
          difficulty: api.getState().settings.difficulty,
          hints: api.getState().settings.hints,
          randomFault: api.getState().settings.randomFault,
          outlines: true,
          noise,
          instrument: "Bench replica",
          probeMode: api.getState().settings.probeMode,
        },
      }),
  ) as ScopeEngine;

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
