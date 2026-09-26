import { describe, it, expect } from "vitest";
import { ScannerEngine } from "@sim/scanner";
import { ASSISTANT_TURNS } from "@/data/scanner";
import { SchematicWorkspaceEngine } from "@sim/schematic";
import type { EngineContext } from "@sim/core";

const ctx = (over: Partial<EngineContext> = {}): EngineContext => ({
  vehicleId: "corolla",
  focus: "INJ",
  seed: 7,
  settings: {
    difficulty: "Medium",
    hints: true,
    randomFault: false,
    outlines: true,
    noise: 1,
    instrument: "Bench replica",
    probeMode: "Drag probes",
  },
  ...over,
});

describe("ScannerEngine diagnostic tree (P2118)", () => {
  it("terminates at the motor-resistance fault with a session result", () => {
    const e = new ScannerEngine(ctx());
    let completed: any = null;
    e.onComplete((r) => (completed = r));
    // walk the 7-step tree; steps 0-4 pass, step 5 is the fault
    for (let i = 0; i < 6; i++) {
      e.treeMeasure();
      const isFault = i === 5;
      e.treeVerdict(!isFault); // learner calls pass on ok steps, fail on the fault
    }
    expect(e.getState().treeFinished).toBe(true);
    expect(completed).not.toBeNull();
    expect(completed.tool).toBe("scanner");
    expect(completed.outcome).toBe("fault");
  });

  it("live-data seeds a full history buffer", () => {
    const e = new ScannerEngine(ctx());
    const s = e.getState();
    expect(Object.keys(s.live).length).toBeGreaterThan(10);
    expect(s.live.RPM.history.length).toBe(48);
  });

  it("training scenario 12 scores the correct root cause and emits a result", () => {
    const e = new ScannerEngine(ctx());
    let completed: any = null;
    e.onComplete((r) => (completed = r));
    e.submitTraining(1); // restricted fuel filter (correct)
    expect(e.getState().tScore?.accuracy).toBe(92);
    expect(completed.scenarioId).toBe("scanner-scenario-12");
    // single attempt — a second submit is ignored
    e.submitTraining(0);
    expect(e.getState().tAnswer).toBe(1);
  });

  it("assistant plays the fixed 4-turn Socratic dialogue and echoes chosen replies", () => {
    const e = new ScannerEngine(ctx());
    // Pick the first option each turn; extra calls past the script are no-ops.
    for (let i = 0; i < 6; i++) e.aiAsk(ASSISTANT_TURNS[Math.min(i, 3)].opts[0]);
    // 4 turns × (user + ai) = 8 log entries, capped at the script length
    expect(e.getState().aiTurn).toBe(4);
    expect(e.getState().aiLog.length).toBe(8);
    // user echoes carry the chosen option id; ai entries resolve by turn
    expect(e.getState().aiLog[0]).toMatchObject({ role: "user", turn: 0, optId: "t0a" });
    expect(e.getState().aiLog[1]).toMatchObject({ role: "ai", turn: 0 });
  });
});

describe("SchematicWorkspaceEngine (cross-engine focus/trace)", () => {
  it("auto-enters trace mode when focus is INJ", () => {
    const e = new SchematicWorkspaceEngine(ctx({ focus: "INJ" }));
    expect(e.getState().mode).toBe("trace");
    expect(e.getState().trace).toBe("inj");
  });
  it("plays the authored guided trace to completion", () => {
    const e = new SchematicWorkspaceEngine(ctx({ focus: "COIL" }));
    expect(e.getState().trace).toBe("ign");
    const n = e.trace().steps.length; // authentic ign trace has 7 steps
    for (let i = 0; i < n; i++) e.traceAdvance();
    expect(e.getState().traceDone).toBe(true);
    expect(e.getState().tracePlaying).toBe(false);
  });
});
