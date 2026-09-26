import { describe, expect, it } from "vitest";

import { ScannerEngine } from "./scanner.engine";

function fresh() {
    return new ScannerEngine(
        { vehicleId: "veh-1", seed: 42 },
        {
            params: [
                { id: "rpm", base: 800, min: 0, max: 6000, step: 10 },
                { id: "ect", base: 85, min: -40, max: 140, step: 1 },
            ],
            nodes: [{ id: "ECU1", name: "Engine ECU", status: "ok", dtc: 0 }],
            tree: [
                { id: "step1", ok: true },
                { id: "step2", ok: false, terminal: true },
            ],
            trainingSteps: 2,
            trainingCorrect: 1,
            assistantTurns: 2,
        },
    );
}

describe("ScannerEngine", () => {
    it("initial state is consistent", () => {
        const eng = fresh();
        const s = eng.getState();
        expect(s.live["rpm"]).toBeDefined();
        expect(s.treeStep).toBe(0);
        expect(s.tStep).toBe(0);
    });

    it("emits on state change", () => {
        const eng = fresh();
        let emitted = 0;
        eng.subscribe(() => emitted++);
        eng.toggleLive();
        expect(emitted).toBeGreaterThan(0);
        eng.treeMeasure();
        expect(eng.getState().treeMeasured).toBe(true);
    });

    it("tree measure then verdict advances", () => {
        const eng = fresh();
        eng.treeMeasure();
        eng.treeVerdict(true);
        expect(eng.getState().treeStates[0].done).toBe(true);
        expect(eng.getState().treeStep).toBe(1);
    });

    it("training submit scores", () => {
        const eng = fresh();
        eng.submitTraining(1);
        expect(eng.getState().tFeedback?.correct).toBe(true);
        expect(eng.getState().tScore?.accuracy).toBeGreaterThan(0);
        // Multi-step session: first answer grades in place; finish after the last step.
        expect(eng.getState().lastResult).toBeNull();
        eng.trainingGoStep(1);
        eng.submitTraining(1);
        expect(eng.getState().tFinished).toBe(true);
        expect(eng.getState().lastResult).toBeTruthy();
        expect(eng.getState().lastResult?.score).toBeGreaterThan(0);
        expect(eng.getState().lastResult?.outcome).toBe("pass");
    });
});
