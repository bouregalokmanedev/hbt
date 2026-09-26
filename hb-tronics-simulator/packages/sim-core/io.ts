/**
 * InputSource — the real-time transport seam (review F4, 10 §8.1).
 * An engine is driven by an InputSource: today a LocalClockSource; later a
 * RemoteChannelSource (WebSocket) with NO engine/UI rewrite. Inbound messages
 * are coalesced to a frame at this boundary (review F9). Interface + local impl
 * only; the WS client is not built now.
 */
import { Clock, type ClockLike, type TickListener } from "./clock";

export interface InputSource {
  subscribe(onTick: TickListener): void;
  dispatch(intent: unknown): void;
  start(intervalMs: number): void;
  stop(): void;
}

/** Local, deterministic driver backed by a Clock. Default for the static app. */
export class LocalClockSource implements InputSource {
  private listener: TickListener | null = null;
  constructor(private clock: ClockLike = new Clock()) {}
  subscribe(onTick: TickListener): void {
    this.listener = onTick;
  }
  dispatch(_intent: unknown): void {
    // No-op locally: local engines apply intents directly. The seam exists so a
    // RemoteChannelSource can forward intents over the wire without UI changes.
  }
  start(intervalMs: number): void {
    this.clock.start(intervalMs, (t) => this.listener?.(t));
  }
  stop(): void {
    this.clock.stop();
  }
}
