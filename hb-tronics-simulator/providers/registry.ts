import type { Engine } from "@sim/core";

/**
 * Plain module-level engine registry (review F1, 10 §5.1). Engines live OUTSIDE
 * the React tree so a running scan / scored session survives navigation.
 * Keyed by tool id; created lazily by a factory.
 */
type AnyEngine = Engine<unknown>;

const registry = new Map<string, AnyEngine>();

export function getEngine<T extends AnyEngine>(key: string, factory: () => T): T {
  let e = registry.get(key) as T | undefined;
  if (!e) {
    e = factory();
    registry.set(key, e);
  }
  return e;
}

export function disposeEngine(key: string): void {
  const e = registry.get(key);
  if (e) {
    e.dispose();
    registry.delete(key);
  }
}

export function clearRegistry(): void {
  for (const [, e] of registry) e.dispose();
  registry.clear();
}
