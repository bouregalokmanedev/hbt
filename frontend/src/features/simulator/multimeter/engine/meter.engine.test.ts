import { describe, expect, it } from "vitest";

import { MeterProcedureEngine, requiredRedJack } from "./meter.engine";

function fresh() {
    return new MeterProcedureEngine({ vehicleId: "test-veh", seed: 1 });
}

function seatJacksForStep(eng: MeterProcedureEngine) {
    const mode = eng.step().mode;
    eng.setJack("black", "COM");
    const need = requiredRedJack(mode);
    if (need) eng.setJack("red", need);
}

describe("MeterProcedureEngine", () => {
    it("starts OFF and unseated", () => {
        const eng = fresh();
        const s = eng.getState();
        expect(s.mode).toBe("OFF");
        expect(s.redJack).toBe("V/Ω");
        expect(s.blackJack).toBe("COM");
        expect(eng.reading().status).toBe("off");
        expect(eng.placement().seated).toBe(false);
        expect(eng.measurementReady()).toBe(false);
    });

    it("mode mismatch yields wrongMode when jacks ok", () => {
        const eng = fresh();
        const step = eng.step();
        eng.setMode(step.mode === "VDC" ? "OHM" : "VDC");
        seatJacksForStep(eng);
        eng.placeProbe(step.red, "red");
        eng.placeProbe(step.black, "black");
        expect(eng.placement().modeOk).toBe(false);
        expect(eng.reading().status).toBe("wrongMode");
        expect(eng.measurementReady()).toBe(false);
    });

    it("wrong red jack yields wrongJack", () => {
        const eng = fresh();
        const step = eng.step();
        eng.setMode(step.mode);
        eng.setJack("black", "COM");
        // Force a jack that cannot be correct for the step mode when step isn't A.
        eng.setJack("red", step.mode === "A" ? "V/Ω" : "A");
        eng.placeProbe(step.red, "red");
        eng.placeProbe(step.black, "black");
        expect(eng.placement().jackOk).toBe(false);
        expect(eng.reading().status).toBe("wrongJack");
        expect(eng.measurementReady()).toBe(false);
    });

    it("black must be in COM", () => {
        const eng = fresh();
        const step = eng.step();
        eng.setMode(step.mode);
        seatJacksForStep(eng);
        eng.setJack("black", "V/Ω");
        eng.placeProbe(step.red, "red");
        eng.placeProbe(step.black, "black");
        expect(eng.placement().jackOk).toBe(false);
        expect(eng.measurementReady()).toBe(false);
    });

    it("wrong pins yields wrongPoints", () => {
        const eng = fresh();
        const step = eng.step();
        eng.setMode(step.mode);
        seatJacksForStep(eng);
        eng.placeProbe("c99", "red");
        eng.placeProbe("c98", "black");
        expect(eng.placement().pairOk).toBe(false);
        expect(eng.reading().status).toBe("wrongPoints");
    });

    it("OHM polarity is agnostic", () => {
        const eng = fresh();
        const step = eng.step();
        if (step.mode !== "OHM") return;
        eng.setMode("OHM");
        seatJacksForStep(eng);
        eng.placeProbe(step.black, "red");
        eng.placeProbe(step.red, "black");
        expect(eng.placement().pairOk).toBe(true);
        expect(eng.placement().redOk).toBe(true);
        expect(eng.placement().blackOk).toBe(true);
        expect(eng.reading().status).toBe("ok");
    });

    it("correct placement yields ok reading", () => {
        const eng = fresh();
        const step = eng.step();
        eng.setMode(step.mode);
        seatJacksForStep(eng);
        eng.placeProbe(step.red, "red");
        eng.placeProbe(step.black, "black");
        expect(eng.measurementReady()).toBe(true);
        expect(eng.reading().status).toBe("ok");
        expect(eng.reading().spec).toBe(step.spec);
    });

    it("answer without measurementReady warns", () => {
        const eng = fresh();
        eng.answer(true);
        expect(eng.getState().feedback?.kind).toBe("takeMeasurement");
    });

    it("useHint applies soft penalty once", () => {
        const eng = fresh();
        const before = eng.getState().score;
        eng.useHint();
        expect(eng.getState().hintUsed).toBe(true);
        expect(eng.getState().score).toBe(before - 3);
        eng.useHint();
        expect(eng.getState().score).toBe(before - 3);
    });

    it("wrong judgement uses soft penalty and keeps step", () => {
        const eng = fresh();
        const step = eng.step();
        eng.setMode(step.mode);
        seatJacksForStep(eng);
        eng.placeProbe(step.red, "red");
        eng.placeProbe(step.black, "black");
        const faulted = eng.getState().faultAt === eng.getState().stepIdx;
        const correctYes = !faulted;
        eng.answer(!correctYes);
        expect(eng.getState().feedback?.tone).toBe("bad");
        expect(eng.getState().score).toBe(96);
        expect(eng.getState().finished).toBe(false);
        expect(eng.getState().stepIdx).toBe(0);
        expect(eng.getState().feedback?.detail?.spec).toBeTruthy();
    });

    it("completes with clear when all steps passed", () => {
        const eng = fresh();
        const comp = eng.component();
        for (let i = 0; i < comp.steps.length; i++) {
            const step = eng.step();
            eng.setMode(step.mode);
            seatJacksForStep(eng);
            eng.clearProbes();
            eng.placeProbe(step.red, "red");
            eng.placeProbe(step.black, "black");
            const faulted = eng.getState().faultAt === eng.getState().stepIdx;
            eng.answer(!faulted);
            if (eng.getState().finished) break;
        }
        expect(eng.getState().finished).toBe(true);
    });

    it("lead alternates and detaches", () => {
        const eng = fresh();
        eng.placeProbe("c1");
        expect(eng.getState().red).toBe("c1");
        eng.placeProbe("c2");
        expect(eng.getState().black).toBe("c2");
        eng.detachProbe("red");
        expect(eng.getState().red).toBeNull();
        eng.clearProbes();
        expect(eng.getState().black).toBeNull();
    });

    it("requiredRedJack maps modes", () => {
        expect(requiredRedJack("VDC")).toBe("V/Ω");
        expect(requiredRedJack("OHM")).toBe("V/Ω");
        expect(requiredRedJack("MA")).toBe("mA");
        expect(requiredRedJack("A")).toBe("A");
        expect(requiredRedJack("OFF")).toBeNull();
    });
});
