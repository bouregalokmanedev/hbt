import { describe, it, expect } from "vitest";
import { Rng, StepMachine, ManualClock, specStatus, clampScore } from "@sim/core";

describe("Rng", () => {
  it("is deterministic for a fixed seed", () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const seqA = Array.from({ length: 5 }, () => a.next());
    const seqB = Array.from({ length: 5 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });
  it("produces values in [0,1)", () => {
    const r = new Rng(1);
    for (let i = 0; i < 100; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("StepMachine", () => {
  it("advances on correct verdicts and terminates at the failing branch", () => {
    const m = new StepMachine([
      { ok: true },
      { ok: true },
      { ok: false, terminal: true },
    ]);
    m.measure(0);
    expect(m.judge(0, true)).toBe(true);
    expect(m.step).toBe(1);
    m.measure(1);
    expect(m.judge(1, true)).toBe(true);
    m.measure(2);
    // learner must correctly call FAIL on the failing branch
    expect(m.judge(2, true)).toBe(false); // wrong call
    expect(m.judge(2, false)).toBe(true); // correct
    expect(m.finished).toBe(true);
    expect(m.attempts).toBe(1);
  });
});

describe("ManualClock", () => {
  it("advances ticks deterministically", () => {
    const c = new ManualClock();
    let ticks = 0;
    c.start(100, () => (ticks += 1));
    c.advance(3);
    expect(ticks).toBe(3);
    expect(c.tick).toBe(3);
  });
});

describe("helpers", () => {
  it("specStatus flags out-of-range as fault", () => {
    expect(specStatus(5, 0, 10)).toBe("ok");
    expect(specStatus(11, 0, 10)).toBe("fault");
  });
  it("clampScore bounds 0..100", () => {
    expect(clampScore(120)).toBe(100);
    expect(clampScore(-5)).toBe(0);
  });
});
