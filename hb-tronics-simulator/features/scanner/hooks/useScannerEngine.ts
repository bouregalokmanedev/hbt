"use client";

import { useEffect, useRef } from "react";
import { ScannerEngine } from "@sim/scanner";
import { getEngine } from "@/providers/registry";
import { useEngineState } from "@/lib/useEngine";
import { useAppStoreApi } from "@/providers/StoreProvider";

export function useScannerEngine() {
  const api = useAppStoreApi();
  const engine = getEngine(
    "scanner",
    () =>
      new ScannerEngine({
        vehicleId: api.getState().vehicleId,
        focus: api.getState().focus ?? "INJ",
        settings: {
          difficulty: "Medium",
          hints: true,
          randomFault: true,
          outlines: true,
          noise: 1,
          instrument: "Bench replica",
          probeMode: "Drag probes",
        },
      }),
  );
  const state = useEngineState(engine);

  const wired = useRef(false);
  useEffect(() => {
    if (wired.current) return;
    wired.current = true;
    const off = engine.onComplete((r) => api.getState().commitResult({ ...r, at: Date.now() }));
    engine.startLive();
    return () => off();
  }, [engine, api]);

  return { engine, state };
}
