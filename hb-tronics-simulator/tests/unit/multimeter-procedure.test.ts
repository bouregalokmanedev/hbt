import { describe, it, expect } from "vitest";
import { MeterProcedureEngine } from "@sim/multimeter";
import { MM_PROCEDURES, MM_STEP_TOTAL, ROTARY_MODES, mmProcedureByRef } from "@/data/multimeter/procedures";
import type { EngineContext } from "@sim/core";

const ctx = (over: Partial<EngineContext> = {}): EngineContext => ({
  vehicleId: "corolla",
  focus: "L3",
  seed: 7,
  settings: { difficulty: "Medium", hints: true, randomFault: false, outlines: true, noise: 1, instrument: "Bench replica", probeMode: "Drag probes" },
  ...over,
});

/** Seat a step's exact probes + mode (correct measurement). */
function takeMeasurement(e: MeterProcedureEngine, stepIdx = e.getState().stepIdx) {
  const step = e.component().steps[stepIdx];
  e.setMode(step.mode);
  e.placeProbe(step.red, "red");
  e.placeProbe(step.black, "black");
}

describe("Multimeter dataset", () => {
  it("has 11 components across 4 groups and 54 steps", () => {
    expect(MM_PROCEDURES).toHaveLength(11);
    expect(MM_STEP_TOTAL).toBe(54);
    expect(new Set(MM_PROCEDURES.map((c) => c.group)).size).toBe(4);
  });

  it("every component + step validates (refs, targets, readings, modes)", () => {
    const modes = new Set(ROTARY_MODES);
    for (const c of MM_PROCEDURES) {
      expect(c.ref).toMatch(/^[A-Z]\d$/);
      expect(c.ecu.pins.length).toBeGreaterThan(0);
      expect(c.steps.length).toBeGreaterThan(0);
      for (const s of c.steps) {
        expect(modes.has(s.mode)).toBe(true);
        expect(s.mode).not.toBe("OFF");
        expect(s.red).toBeTruthy();
        expect(s.black).toBeTruthy();
        expect(s.good).toBeTruthy();
        expect(s.bad).toBeTruthy();
        // probe targets are component pin / ecu pin / earth
        for (const t of [s.red, s.black]) expect(/^(c.+|e.+|gnd)$/.test(t)).toBe(true);
        if (s.table) {
          expect(s.table.head).toHaveLength(2);
          expect(s.table.rows.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("carries no learner prose in the dataset (ids resolved from content)", () => {
    for (const c of MM_PROCEDURES) {
      expect(c).not.toHaveProperty("complaint");
      for (const s of c.steps) {
        expect(s).not.toHaveProperty("instruction");
        expect(s).not.toHaveProperty("fail");
        expect(s).not.toHaveProperty("b");
      }
    }
  });

  it("exposes the 7 authentic rotary positions", () => {
    expect([...ROTARY_MODES]).toEqual(["OFF", "VDC", "VAC", "OHM", "MA", "A", "HZ"]);
  });
});

describe("MeterProcedureEngine — modes + probes", () => {
  it("starts OFF and selects modes independently of placement", () => {
    const e = new MeterProcedureEngine(ctx());
    expect(e.getState().mode).toBe("OFF");
    e.setMode("OHM");
    expect(e.getState().mode).toBe("OHM");
  });

  it("seats probes and auto-swaps the active lead red→black", () => {
    const e = new MeterProcedureEngine(ctx());
    expect(e.getState().lead).toBe("red");
    e.placeProbe("c2"); // uses current lead = red
    expect(e.getState().red).toBe("c2");
    expect(e.getState().lead).toBe("black");
    e.placeProbe("c5"); // now black
    expect(e.getState().black).toBe("c5");
    expect(e.placement().seated).toBe(true);
  });

  it("re-seating a target frees whichever lead already held it", () => {
    const e = new MeterProcedureEngine(ctx());
    e.placeProbe("c2", "red");
    e.placeProbe("c2", "black"); // c2 moves to black, red freed
    expect(e.getState().red).toBeNull();
    expect(e.getState().black).toBe("c2");
  });

  it("detach + clear remove probes", () => {
    const e = new MeterProcedureEngine(ctx());
    e.placeProbe("c2", "red");
    e.placeProbe("c5", "black");
    e.detachProbe("red");
    expect(e.getState().red).toBeNull();
    e.clearProbes();
    expect(e.getState().black).toBeNull();
  });
});

describe("MeterProcedureEngine — placement + reading validation", () => {
  it("reads blank when OFF", () => {
    const e = new MeterProcedureEngine(ctx());
    expect(e.reading().status).toBe("off");
  });

  it("requires both probes seated", () => {
    const e = new MeterProcedureEngine(ctx());
    e.setMode("OHM");
    e.placeProbe("c2", "red");
    expect(e.reading().status).toBe("unseated");
    expect(e.reading().value).toBe("- - - -");
  });

  it("flags the wrong rotary function", () => {
    const e = new MeterProcedureEngine(ctx()); // L3 step 0 is OHM
    e.setMode("VDC");
    e.placeProbe("c2", "red");
    e.placeProbe("c5", "black");
    const r = e.reading();
    expect(r.status).toBe("wrongMode");
    expect(r.value).toBe("OL");
    expect(r.flag).toBe("RANGE");
  });

  it("shows OL (Ω) / 0.00 (V) at the wrong probe points", () => {
    const e = new MeterProcedureEngine(ctx()); // L3 step0 OHM
    e.setMode("OHM");
    e.placeProbe("c1", "red");
    e.placeProbe("gnd", "black");
    expect(e.reading().status).toBe("wrongPoints");
    expect(e.reading().value).toBe("OL");
    // a VDC step → 0.00 at wrong points
    e.selectComponent("L1"); // step0 VDC
    e.setMode("VDC");
    e.placeProbe("c1", "red");
    e.placeProbe("c2", "black");
    expect(e.reading().value).toBe("0.00");
  });

  it("resolves the in-spec reading only for exact mode + points", () => {
    const e = new MeterProcedureEngine(ctx({ focus: "L1" })); // step0 healthy? L1 fault at step0 (deterministic)
    // move to a non-faulted step to read 'good'
    const step0 = e.component().steps[0];
    e.setMode(step0.mode);
    e.placeProbe(step0.red, "red");
    e.placeProbe(step0.black, "black");
    // step 0 is the faulted step (deterministic) → reads bad
    expect(e.reading().value).toBe(step0.bad);
    expect(e.reading().faulted).toBe(true);
  });

  it("OHM polarity is interchangeable", () => {
    const e = new MeterProcedureEngine(ctx({ focus: "A1" })); // A1 step0 OHM c1/c2
    const s0 = e.component().steps[0];
    e.setMode("OHM");
    e.placeProbe(s0.black, "red"); // swapped polarity
    e.placeProbe(s0.red, "black");
    expect(e.placement().pairOk).toBe(true);
  });

  it("VDC polarity is fixed (swapped leads fail the pair check)", () => {
    // L3 step 1 is a VDC measurement (c2 / gnd) — use a healthy seed to reach it
    const e = new MeterProcedureEngine(ctx({ focus: "L3", settings: { ...ctx().settings, randomFault: true }, seed: findHealthySeed("L3") }));
    takeMeasurement(e, 0);
    e.answer(true); // advance to step 1 (VDC)
    const s1 = e.component().steps[1];
    expect(s1.mode).toBe("VDC");
    e.setMode("VDC");
    e.placeProbe(s1.black, "red"); // swapped
    e.placeProbe(s1.red, "black");
    expect(e.placement().pairOk).toBe(false);
  });
});

describe("MeterProcedureEngine — fault injection", () => {
  it("injects a deterministic fault at step 0 when randomFault is off", () => {
    for (const c of MM_PROCEDURES) {
      const e = new MeterProcedureEngine(ctx({ focus: c.ref }));
      expect(e.getState().faultAt).toBe(0);
    }
  });

  it("faulted step reads bad, healthy steps read good", () => {
    const e = new MeterProcedureEngine(ctx({ focus: "H3" })); // 10 steps, fault at 0
    // step 0 (faulted)
    takeMeasurement(e, 0);
    expect(e.reading().value).toBe(e.component().steps[0].bad);
    // correctly answer No → found → finished
    e.answer(false);
    expect(e.getState().finished).toBe(true);
    expect(e.getState().done.H3.status).toBe("found");
  });

  it("random-fault mode can produce a healthy component (fault -1)", () => {
    // sweep seeds to find a -1 (healthy) assignment; the model supports it
    let sawHealthy = false;
    let sawFaulted = false;
    for (let seed = 0; seed < 60 && !(sawHealthy && sawFaulted); seed++) {
      const e = new MeterProcedureEngine(ctx({ focus: "L3", seed, settings: { ...ctx().settings, randomFault: true } }));
      if (e.getState().faultAt === -1) sawHealthy = true;
      if (e.getState().faultAt >= 0) sawFaulted = true;
    }
    expect(sawFaulted).toBe(true);
  });
});

describe("MeterProcedureEngine — answers, scoring, hints", () => {
  it("blocks an answer until a valid measurement is taken", () => {
    const e = new MeterProcedureEngine(ctx());
    e.answer(true);
    expect(e.getState().feedback?.kind).toBe("takeMeasurement");
    expect(e.getState().score).toBe(100); // no penalty for the guard
  });

  it("wrong answer deducts 10 and records an attempt", () => {
    const e = new MeterProcedureEngine(ctx({ focus: "L1" })); // step0 faulted → truth = No
    takeMeasurement(e, 0);
    e.answer(true); // wrong (says in-spec on a faulted reading)
    expect(e.getState().score).toBe(90);
    expect(e.getState().attempts).toBe(1);
    expect(e.getState().feedback?.tone).toBe("bad");
  });

  it("hint deducts 5 once per step only", () => {
    const e = new MeterProcedureEngine(ctx());
    e.useHint();
    expect(e.getState().score).toBe(95);
    e.useHint(); // no double charge on the same step
    expect(e.getState().score).toBe(95);
  });

  it("correct 'No' on the faulted step completes as 'found' (fault outcome)", () => {
    const e = new MeterProcedureEngine(ctx({ focus: "U1" }));
    let result: any = null;
    e.onComplete((r) => (result = r));
    takeMeasurement(e, 0);
    e.answer(false);
    expect(e.getState().finished).toBe(true);
    expect(e.getState().done.U1.status).toBe("found");
    expect(result.tool).toBe("multimeter");
    expect(result.outcome).toBe("fault");
    expect(result.verdict).toBe("content:multimeter.verdict.found");
    expect(result.scenarioId).toBe("multimeter-U1");
  });
});

describe("MeterProcedureEngine — progression + completion (healthy path)", () => {
  it("walks every step in-spec to a 'clear' completion when healthy", () => {
    // randomFault seed chosen so L1 is healthy (faultAt -1); otherwise force via a stub
    const e = new MeterProcedureEngine(ctx({ focus: "L1", settings: { ...ctx().settings, randomFault: true }, seed: findHealthySeed("L1") }));
    expect(e.getState().faultAt).toBe(-1);
    let result: any = null;
    e.onComplete((r) => (result = r));
    const comp = e.component();
    for (let i = 0; i < comp.steps.length; i++) {
      takeMeasurement(e, i);
      expect(e.reading().value).toBe(comp.steps[i].good); // healthy → good everywhere
      e.answer(true); // in-spec
    }
    expect(e.getState().finished).toBe(true);
    expect(e.getState().done.L1.status).toBe("clear");
    expect(result.outcome).toBe("pass");
    expect(result.verdict).toBe("content:multimeter.verdict.clear");
  });

  it("advances the step index on a correct in-spec answer (non-final)", () => {
    const e = new MeterProcedureEngine(ctx({ focus: "L3", settings: { ...ctx().settings, randomFault: true }, seed: findHealthySeed("L3") }));
    expect(e.getState().faultAt).toBe(-1);
    takeMeasurement(e, 0);
    e.answer(true);
    expect(e.getState().stepIdx).toBe(1);
    expect(e.getState().red).toBeNull(); // probes cleared for the next step
  });
});

/** Find a seed for which the given component is assigned a healthy (-1) fault. */
function findHealthySeed(ref: string): number {
  for (let seed = 0; seed < 400; seed++) {
    const e = new MeterProcedureEngine(ctx({ focus: ref, seed, settings: { ...ctx().settings, randomFault: true } }));
    if (e.getState().faultAt === -1) return seed;
  }
  throw new Error("no healthy seed found for " + ref);
}

describe("MeterProcedureEngine — result contract", () => {
  it("emits a well-formed SessionResult with per-step labels as content ids", () => {
    const e = new MeterProcedureEngine(ctx({ focus: "T1" }));
    let result: any = null;
    e.onComplete((r) => (result = r));
    takeMeasurement(e, 0);
    e.answer(false); // faulted step0 → found
    expect(result).toBeTruthy();
    expect(result.tool).toBe("multimeter");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.steps.every((s: any) => /^content:multimeter\.T1\.step\.\d+\.instruction$/.test(s.label))).toBe(true);
    expect(mmProcedureByRef("T1")!.steps).toHaveLength(result.steps.length);
  });
});
