"use client";

import { useSyncExternalStore } from "react";
import type { Engine } from "@sim/core";

/**
 * useSyncExternalStore adapter (10 §6.3). Subscribes a React view to an engine's
 * snapshot without the engine importing React. Component unmount detaches the
 * view, never the engine (F1).
 */
export function useEngineState<TState>(engine: Engine<TState>): TState {
  return useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.getState(),
    () => engine.getState(),
  );
}
