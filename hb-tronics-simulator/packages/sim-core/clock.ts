/**
 * Deterministic tick source (10 §8.1). Wraps setInterval but is injectable, so
 * engines can be driven by a fake clock in tests. Replaces the source's ad-hoc
 * 420/200/90 ms timers. Framework-free — no React/DOM types beyond the timer.
 */
export type TickListener = (tick: number) => void;

export interface ClockLike {
  start(intervalMs: number, cb: TickListener): void;
  stop(): void;
  readonly tick: number;
}

export class Clock implements ClockLike {
  private handle: ReturnType<typeof setInterval> | null = null;
  private _tick = 0;
  get tick() {
    return this._tick;
  }
  start(intervalMs: number, cb: TickListener): void {
    this.stop();
    this.handle = setInterval(() => {
      this._tick += 1;
      cb(this._tick);
    }, intervalMs);
  }
  stop(): void {
    if (this.handle) {
      clearInterval(this.handle);
      this.handle = null;
    }
  }
}

/** Manual clock for headless tests — advance ticks by hand. */
export class ManualClock implements ClockLike {
  private cb: TickListener | null = null;
  private _tick = 0;
  get tick() {
    return this._tick;
  }
  start(_intervalMs: number, cb: TickListener): void {
    this.cb = cb;
  }
  stop(): void {
    this.cb = null;
  }
  advance(n = 1): void {
    for (let i = 0; i < n; i++) {
      this._tick += 1;
      this.cb?.(this._tick);
    }
  }
}
