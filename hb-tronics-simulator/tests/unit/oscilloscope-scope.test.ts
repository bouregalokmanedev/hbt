import { describe, it, expect } from "vitest";
import { ScopeEngine } from "@sim/oscilloscope";
import { SCOPE_EXERCISES, scopeById, CAMPAT, OSC_FAULT_IDS } from "@/data/oscilloscope/scope";
import type { EngineContext } from "@sim/core";

// noise:0 → the baseline-noise term vanishes, so with the correct probe placed the
// signal pipeline is fully deterministic for non-random fault transforms.
const ctx = (over: Partial<EngineContext> = {}): EngineContext => ({
  vehicleId: "corolla",
  focus: "inj",
  seed: 7,
  settings: { difficulty: "Medium", hints: true, randomFault: false, outlines: true, noise: 0, instrument: "Bench replica", probeMode: "Drag probes" },
  ...over,
});

/** Place the correct probes so wrongProbe() is null (clean signal). */
function connectCorrectly(e: ScopeEngine) {
  const c = e.comp();
  e.placeProbe("A", c.correct.A);
  if (c.correct.B) e.placeProbe("B", c.correct.B);
  e.placeProbe("GND", c.correct.GND);
  if (c.correct.CLAMP) e.placeProbe("CLAMP", c.correct.CLAMP);
}

describe("Oscilloscope dataset", () => {
  it("has the 7 authentic exercises with codes", () => {
    expect(SCOPE_EXERCISES.map((e) => e.code)).toEqual(["INJ-01", "IGN-01", "CMP-01", "APP-01", "MAP-01", "KNK-01", "O2-01"]);
  });
  it("every exercise validates (fn, channels, trigger, correct, faults)", () => {
    for (const e of SCOPE_EXERCISES) {
      expect(typeof e.fn).toBe("function");
      expect(e.chA.vdiv).toBeGreaterThan(0);
      expect(e.period).toBeGreaterThan(0);
      expect(["rising", "falling"]).toContain(e.trig.edge);
      expect(e.correct.A).toBeTruthy();
      expect(e.correct.GND).toBeTruthy();
      expect(e.faults[0]).toBe("none");
      expect(e.pins.length).toBeGreaterThan(0);
    }
  });
  it("CAMPAT sums to the cam period", () => {
    expect(CAMPAT.reduce((a, b) => a + b, 0)).toBe(scopeById("cam")!.period);
  });
  it("fault ids are covered by the union list", () => {
    expect(OSC_FAULT_IDS).toContain("none");
    expect(OSC_FAULT_IDS).toContain("coilWeak");
    expect(OSC_FAULT_IDS.length).toBeGreaterThanOrEqual(10);
  });
  it("carries no learner prose in the dataset (ids resolved from content)", () => {
    for (const e of SCOPE_EXERCISES) {
      expect(e).not.toHaveProperty("instruction");
      expect(e).not.toHaveProperty("function");
      expect(e).not.toHaveProperty("sub");
    }
  });
});

describe("ScopeEngine — waveform generation (raw fn)", () => {
  it("INJ Ch A: rest 12 V, pull-down −0.6 V, ~68 V spike peak", () => {
    const e = new ScopeEngine(ctx());
    expect(e.raw("A", 0.5)).toBe(12); // p < s
    expect(e.raw("A", 2)).toBeCloseTo(-0.6, 5); // pull-down
    // scan for the peak
    let mx = -Infinity;
    for (let p = 0; p < 20; p += 0.01) mx = Math.max(mx, e.raw("A", p));
    expect(mx).toBeGreaterThan(60);
    expect(mx).toBeLessThan(72);
  });
  it("CAM: square wave switches between the two Hall levels", () => {
    const e = new ScopeEngine(ctx({ focus: "cam" }));
    const levels = new Set<number>();
    for (let p = 0; p < 200; p += 1) levels.add(Number(e.raw("A", p).toFixed(2)));
    expect([...levels].sort()).toEqual([-0.85, 4.85]);
  });
  it("O2: signal oscillates around the 0.45 V switch point", () => {
    const e = new ScopeEngine(ctx({ focus: "lambda" }));
    let mn = Infinity, mx = -Infinity;
    for (let p = 0; p < 1100; p += 5) { const v = e.raw("A", p); mn = Math.min(mn, v); mx = Math.max(mx, v); }
    expect(mn).toBeLessThan(0.2);
    expect(mx).toBeGreaterThan(0.7);
  });
});

describe("ScopeEngine — fault transforms (sig)", () => {
  it("open: Ch A pinned at openA", () => {
    const e = new ScopeEngine(ctx());
    connectCorrectly(e);
    e.setFault("open");
    expect(e.sig("A", 5)).toBeCloseTo(12, 5);
    expect(e.sig("B", 5)).toBeCloseTo(0, 5);
  });
  it("shortBat: Ch A pinned at supply", () => {
    const e = new ScopeEngine(ctx());
    connectCorrectly(e);
    e.setFault("shortBat");
    expect(e.sig("A", 5)).toBeCloseTo(12, 5);
  });
  it("highRes/weak attenuate toward rest", () => {
    const e = new ScopeEngine(ctx());
    connectCorrectly(e);
    const healthy = e.raw("A", 5);
    e.setFault("highRes");
    const hr = e.sig("A", 5);
    e.setFault("weak");
    const wk = e.sig("A", 5);
    // both pull the amplitude toward rest (openA=12); |v-12| shrinks
    expect(Math.abs(hr - 12)).toBeLessThan(Math.abs(healthy - 12));
    expect(Math.abs(wk - 12)).toBeLessThan(Math.abs(hr - 12));
  });
  it("injShort inflates Ch B current ×1.85", () => {
    const e = new ScopeEngine(ctx());
    connectCorrectly(e);
    const b = e.raw("B", 2.5);
    e.setFault("injShort");
    expect(e.sig("B", 2.5)).toBeCloseTo(b * 1.85, 4);
  });
  it("coilWeak clips the primary kick", () => {
    const e = new ScopeEngine(ctx({ focus: "coil" }));
    connectCorrectly(e);
    e.setFault("coilWeak");
    // sample the spike region; capped well below the ~330 V healthy kick
    let mx = -Infinity;
    for (let p = 0; p < 20; p += 0.01) mx = Math.max(mx, e.sig("A", p));
    expect(mx).toBeLessThan(120);
  });
  it("every listed fault yields a finite signal", () => {
    for (const ex of SCOPE_EXERCISES) {
      const e = new ScopeEngine(ctx({ focus: ex.id }));
      connectCorrectly(e);
      for (const f of ex.faults) {
        e.setFault(f);
        for (let p = 0; p < ex.period; p += ex.period / 20) {
          expect(Number.isFinite(e.sig("A", p))).toBe(true);
        }
      }
    }
  });
});

describe("ScopeEngine — probe model", () => {
  it("wrongProbe reports supply / ground / none / null", () => {
    const e = new ScopeEngine(ctx());
    expect(e.wrongProbe()).toBe("none"); // nothing connected
    e.placeProbe("A", "1"); // INJ pin 1 = +12 V supply
    expect(e.wrongProbe()).toBe("supply");
    e.placeProbe("A", "2"); // correct driver terminal
    expect(e.wrongProbe()).toBeNull();
  });
  it("wrong (supply) probe flattens Ch A near supply", () => {
    const e = new ScopeEngine(ctx());
    e.placeProbe("A", "1");
    for (let p = 0; p < 20; p += 2) expect(Math.abs(e.sig("A", p) - 12)).toBeLessThan(0.3);
  });
  it("probeOk only when A/GND(/B) match the correct terminals", () => {
    const e = new ScopeEngine(ctx());
    expect(e.stepChecks().probeOk).toBe(false);
    connectCorrectly(e);
    expect(e.stepChecks().probeOk).toBe(true);
  });
});

describe("ScopeEngine — trigger + timebase", () => {
  it("detects a trigger and sets the horizontal offset", () => {
    const e = new ScopeEngine(ctx());
    connectCorrectly(e);
    expect(e.getState().triggered).toBe(true);
    // offset places the trigger 20% into the span
    expect(e.getState().tOffset).toBeLessThan(e.findTrigger()!);
  });
  it("span = timeDiv × 10; setTimeDiv updates it", () => {
    const e = new ScopeEngine(ctx());
    expect(e.span()).toBe(e.getState().timeDiv * 10);
    e.setTimeDiv(5);
    expect(e.span()).toBe(50);
  });
  it("trigOk needs the correct edge and a level inside the signal band", () => {
    const e = new ScopeEngine(ctx());
    connectCorrectly(e);
    expect(e.stepChecks().trigOk).toBe(true); // defaults are correct
    e.setTrigEdge("rising"); // wrong edge for INJ
    expect(e.stepChecks().trigOk).toBe(false);
  });
});

describe("ScopeEngine — channel controls", () => {
  it("vdiv / offset / coupling / invert update state; vOk tracks vdiv", () => {
    const e = new ScopeEngine(ctx());
    expect(e.stepChecks().vOk).toBe(true);
    e.setVdiv("A", e.comp().chA.vdiv * 4); // 2 octaves off
    expect(e.stepChecks().vOk).toBe(false);
    e.setOffset("A", 1.5); expect(e.getState().offA).toBe(1.5);
    e.setCoupling("A", "AC"); expect(e.getState().couplingA).toBe("AC");
    e.toggleInvert("A"); expect(e.getState().invA).toBe(true);
  });
  it("AC coupling removes the DC component of the signal", () => {
    const e = new ScopeEngine(ctx({ focus: "lambda" })); // ~0.45 V DC mean
    connectCorrectly(e);
    e.setCoupling("A", "AC");
    let sum = 0; const N = 200;
    for (let i = 0; i < N; i++) sum += e.sig("A", (i / N) * e.comp().period);
    expect(Math.abs(sum / N)).toBeLessThan(0.05); // mean ≈ 0
  });
});

describe("ScopeEngine — auto-measurements + cursors", () => {
  it("INJ measurement: Vmax≈68, Vmin≈−0.6, Vpp≈68, freq≈50 Hz", () => {
    const e = new ScopeEngine(ctx());
    connectCorrectly(e);
    const m = e.measure();
    expect(m.mx).toBeGreaterThan(60);
    expect(m.mx).toBeLessThan(72);
    expect(m.mn).toBeLessThan(1);
    expect(m.pp).toBeGreaterThan(60);
    expect(m.freq).toBeGreaterThan(40);
    expect(m.freq).toBeLessThan(60);
    expect(m.pw).toBeGreaterThan(0);
  });
  it("cursor ΔT scales with the timebase; measOk needs cursors apart", () => {
    const e = new ScopeEngine(ctx());
    connectCorrectly(e);
    expect(e.stepChecks().measOk).toBe(false); // cA===cB
    e.setCursor("A", 0.2);
    e.setCursor("B", 0.6);
    const r = e.cursorReadout();
    expect(r.dt).toBeCloseTo(0.4 * e.span(), 5);
    expect(e.stepChecks().measOk).toBe(true);
  });
});

describe("ScopeEngine — overlays", () => {
  it("persist / peakDet / ref / cursors toggle", () => {
    const e = new ScopeEngine(ctx());
    e.togglePersist(); expect(e.getState().persist).toBe(true);
    e.togglePeakDet(); expect(e.getState().peakDet).toBe(true);
    e.toggleRef(); expect(e.getState().refOn).toBe(true);
    e.toggleCursors(); expect(e.getState().cursors).toBe(true);
  });
  it("capOk when a capture is frozen (single/stop) or persist is on", () => {
    const e = new ScopeEngine(ctx());
    expect(e.stepChecks().capOk).toBe(false); // running, no persist
    e.single();
    expect(e.stepChecks().capOk).toBe(true);
  });
});

describe("ScopeEngine — procedure, scoring, diagnosis, result", () => {
  it("AUTO SET satisfies the vdiv/timebase/trigger steps (signal present)", () => {
    const e = new ScopeEngine(ctx());
    connectCorrectly(e); // a probe must be on the signal for a trigger to exist
    e.setVdiv("A", 999); e.setTimeDiv(999); e.setTrigEdge("rising");
    e.autoSet();
    const k = e.stepChecks();
    expect(k.vOk && k.tOk && k.trigOk).toBe(true);
  });
  it("score is the authentic 25/20/15/15/25 weighting", () => {
    const e = new ScopeEngine(ctx());
    // no probe yet → Ch A is noise, so only vdiv+timebase (20) score
    expect(e.score()).toBe(20);
    connectCorrectly(e); // +probeOk 25, +trigOk 15 (signal now present)
    expect(e.score()).toBe(25 + 20 + 15);
    e.setCursor("A", 0.2); e.setCursor("B", 0.7); // +measOk 15
    expect(e.score()).toBe(25 + 20 + 15 + 15);
    e.submitDiagnosis("none"); // correct diagnosis (fault none) → +25
    expect(e.score()).toBe(100);
  });
  it("diagnosis correct only when it equals the injected fault", () => {
    const e = new ScopeEngine(ctx());
    e.setFault("open");
    e.submitDiagnosis("shortGnd");
    expect(e.stepChecks().diagOk).toBe(false);
    e.setFault("open");
    e.submitDiagnosis("open");
    expect(e.stepChecks().diagOk).toBe(true);
  });
  it("emits a SessionResult on diagnosis submit", () => {
    const e = new ScopeEngine(ctx());
    let result: any = null;
    e.onComplete((r) => (result = r));
    connectCorrectly(e);
    e.setCursor("A", 0.2); e.setCursor("B", 0.7);
    e.submitDiagnosis("none");
    expect(result.tool).toBe("oscilloscope");
    expect(result.outcome).toBe("pass");
    expect(result.scenarioId).toBe("oscilloscope-inj");
    expect(result.steps).toHaveLength(7);
    expect(result.verdict).toBe("content:oscilloscope.verdict.correct");
  });
  it("liveState is deterministic and returns normalised bars + event per component", () => {
    const e = new ScopeEngine(ctx());
    connectCorrectly(e);
    const a = e.liveState(2); // injector pull-down phase (a<1) → pintle lifted
    expect(a.p1).toBe(100);
    expect(a.v2).toMatch(/ A$/);
    // rest phase → pintle down
    expect(e.liveState(0.5).p1).toBe(0);
    // same phase → same values (deterministic)
    expect(e.liveState(2)).toEqual(a);
    // lambda reports a mixture state
    const l = new ScopeEngine(ctx({ focus: "lambda" }));
    connectCorrectly(l);
    expect(l.liveState(100).v1).toMatch(/λ/);
  });

  it("selectComponent resets to that exercise's defaults", () => {
    const e = new ScopeEngine(ctx());
    e.selectComponent("lambda");
    expect(e.getState().compId).toBe("lambda");
    expect(e.getState().timeDiv).toBe(scopeById("lambda")!.timeDiv);
    expect(e.getState().vdivA).toBe(scopeById("lambda")!.chA.vdiv);
  });
});
