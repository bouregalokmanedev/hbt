/**
 * Seedable RNG (mulberry32) — replaces the source's Math.random() so noise and
 * random-walks are deterministic and replayable (10 §8.1). Framework-free.
 */
export class Rng {
  private state: number;
  constructor(seed = 0x9e3779b9) {
    this.state = seed >>> 0;
  }
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** Uniform in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  /** Signed noise in [-amp, amp]. */
  noise(amp: number): number {
    return (this.next() * 2 - 1) * amp;
  }
  int(min: number, maxInclusive: number): number {
    return Math.floor(this.range(min, maxInclusive + 1));
  }
}
