/**
 * Engine base (10 §6.3 / §8.1). Plain class exposing getState/subscribe/dispatch
 * + onComplete(SessionResult). No React/DOM imports — the UI subscribes via a
 * useSyncExternalStore adapter. This is the seam that lets the simulation evolve
 * independently of the UI.
 */
import type { SessionResult } from "./result";

export type Listener = () => void;

export abstract class Engine<TState> {
  protected listeners = new Set<Listener>();
  private completeHandlers = new Set<(r: SessionResult) => void>();

  abstract getState(): TState;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  protected emit(): void {
    for (const l of this.listeners) l();
  }

  onComplete(handler: (r: SessionResult) => void): () => void {
    this.completeHandlers.add(handler);
    return () => this.completeHandlers.delete(handler);
  }

  protected complete(result: SessionResult): void {
    for (const h of this.completeHandlers) h(result);
  }

  /** Optional lifecycle hooks; default no-ops. */
  dispose(): void {
    this.listeners.clear();
    this.completeHandlers.clear();
  }
}
