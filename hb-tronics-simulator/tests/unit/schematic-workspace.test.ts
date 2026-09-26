import { describe, it, expect } from "vitest";
import { SchematicWorkspaceEngine } from "@sim/schematic";
import {
  SCH_COMPONENTS, SCH_WIRES, SCH_TRACES, SCH_TASKS, SCH_EXAM, SCH_LAYERS, SCH_COLOURS,
  SCH_IMG_W, SCH_IMG_H, schByKey, wiresFor, distinctEcuPins, pinsFor, relatedTo, traceById,
} from "@/data/schematic/workspace";
import type { EngineContext } from "@sim/core";

const ctx = (over: Partial<EngineContext> = {}): EngineContext => ({
  vehicleId: "corolla",
  focus: "R16",
  seed: 7,
  settings: { difficulty: "Medium", hints: true, randomFault: false, outlines: true, noise: 1, instrument: "Bench replica", probeMode: "Drag probes" },
  ...over,
});

describe("Schematic dataset (authentic, verified counts)", () => {
  it("has exactly 57 components across the 10 source types", () => {
    expect(SCH_COMPONENTS).toHaveLength(57);
    const by = (t: string) => SCH_COMPONENTS.filter((c) => c.type === t).length;
    expect(by("ecu")).toBe(1);
    expect(by("relay")).toBe(4);
    expect(by("fuse")).toBe(7);
    expect(by("ground")).toBe(4);
    expect(by("network")).toBe(2);
    expect(by("connector")).toBe(1);
    expect(by("module")).toBe(6);
    expect(by("sensor")).toBe(14);
    expect(by("actuator")).toBe(14);
    expect(by("switch")).toBe(4);
  });

  it("has exactly 133 pin-table rows", () => {
    expect(SCH_WIRES).toHaveLength(133);
    for (const w of SCH_WIRES) {
      expect(w.ecuPin).toBeTruthy();
      expect(schByKey(w.target)).toBeDefined();
      expect(w.connector).toBe(w.ecuPin[0]);
      expect(w.mismatch).toBe(w.ecuColour !== w.targetColour);
    }
  });

  it("has exactly 111 distinct ECU pins — connector A 34 / B 77", () => {
    expect(distinctEcuPins()).toHaveLength(111);
    expect(distinctEcuPins("A")).toHaveLength(34);
    expect(distinctEcuPins("B")).toHaveLength(77);
    expect(distinctEcuPins("A").length + distinctEcuPins("B").length).toBe(111);
  });

  it("has 12 wire colours incl. White/Black, and 9 colour-mismatch rows", () => {
    expect(Object.keys(SCH_COLOURS)).toHaveLength(12);
    expect(SCH_COLOURS["White/Black"]).toBeTruthy();
    expect(SCH_COLOURS["Light Green"]).toBeTruthy();
    expect(SCH_WIRES.filter((w) => w.mismatch)).toHaveLength(9);
  });

  it("component coordinates lie within the 4016×1479 image space", () => {
    expect([SCH_IMG_W, SCH_IMG_H]).toEqual([4016, 1479]);
    for (const c of SCH_COMPONENTS) {
      expect(c.x - c.w / 2).toBeGreaterThanOrEqual(-1);
      expect(c.x + c.w / 2).toBeLessThanOrEqual(SCH_IMG_W + 1);
      expect(c.y - c.h / 2).toBeGreaterThanOrEqual(-1);
      expect(c.y + c.h / 2).toBeLessThanOrEqual(SCH_IMG_H + 1);
    }
  });

  it("E1 is the ECU band on the y=1135 rail", () => {
    const e1 = schByKey("E1")!;
    expect(e1.type).toBe("ecu");
    expect(e1.y).toBe(1135);
    expect(e1.w).toBeGreaterThan(3000);
  });

  it("carries no learner prose (traces/tasks/exam use content ids)", () => {
    for (const t of SCH_TRACES) {
      expect(t.labelId).toMatch(/^schematic\.trace\./);
      for (const s of t.steps) expect(s.descId).toMatch(/^schematic\.trace\./);
    }
    for (const t of SCH_TASKS) { expect(t.promptId).toMatch(/^schematic\.task\./); expect(t.explainId).toMatch(/^schematic\.task\./); }
    for (const q of SCH_EXAM) expect(q.promptId).toMatch(/^schematic\.exam\./);
  });

  it("lookups: component / pin / wire / related resolve", () => {
    expect(schByKey("R16")!.name).toMatch(/Ignition coil relay/);
    expect(schByKey("nope")).toBeUndefined();
    expect(wiresFor("INJ1").length).toBeGreaterThan(0);
    expect(wiresFor("INJ1").every((w) => w.target === "INJ1")).toBe(true);
    expect(pinsFor("L3").length).toBeGreaterThan(0);
    expect(relatedTo("INJ1")).toContain("E1");
  });

  it("E1 hub: wiresFor('E1') spans all 133 rows", () => {
    expect(wiresFor("E1")).toHaveLength(133);
  });

  it("shared net: ground G_BA is bonded by ECU pins B 16 / B 51 / B 59", () => {
    const pins = new Set(wiresFor("G_BA").map((w) => w.ecuPin));
    expect(pins.has("B 16")).toBe(true);
    expect(pins.has("B 51")).toBe(true);
    expect(pins.has("B 59")).toBe(true);
  });

  it("3 authored traces with exact step counts (inj 6 / ign 7 / can 5)", () => {
    expect(SCH_TRACES.map((t) => t.id)).toEqual(["inj", "ign", "can"]);
    expect(traceById("inj")!.steps).toHaveLength(6);
    expect(traceById("ign")!.steps).toHaveLength(7);
    expect(traceById("can")!.steps).toHaveLength(5);
    for (const t of SCH_TRACES) for (const s of t.steps) expect(schByKey(s.cmp)).toBeDefined();
  });

  it("8 training tasks + 6 exam questions + 11 layers (4 NO-DATA)", () => {
    expect(SCH_TASKS).toHaveLength(8);
    expect(SCH_EXAM).toHaveLength(6);
    expect(SCH_LAYERS).toHaveLength(11);
    expect(SCH_LAYERS.filter((l) => l.na).map((l) => l.key).sort()).toEqual(["circuit", "flexray", "lin", "wirenum"]);
    for (const t of SCH_TASKS) expect(schByKey(t.answer)).toBeDefined();
    for (const q of SCH_EXAM) expect(schByKey(q.answer)).toBeDefined();
  });
});

describe("SchematicWorkspaceEngine — study / selection / browse", () => {
  it("starts in study on the schematic view (no focus trace)", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    expect(e.getState().mode).toBe("study");
    expect(e.getState().view).toBe("schematic");
    expect(e.getState().sel).toBeNull();
  });
  it("focus INJ / COIL deep-links into the matching guided trace", () => {
    expect(new SchematicWorkspaceEngine(ctx({ focus: "INJ" })).getState().trace).toBe("inj");
    const c = new SchematicWorkspaceEngine(ctx({ focus: "COIL" }));
    expect(c.getState().mode).toBe("trace");
    expect(c.getState().trace).toBe("ign");
    expect(c.getState().tracePlaying).toBe(true);
  });
  it("select updates selection + records recent (last 6)", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.select("L3");
    expect(e.getState().sel).toBe("L3");
    ["R16", "INJ1", "COIL1", "G_BA", "E1", "T1"].forEach((k) => e.select(k));
    expect(e.getState().recent).toHaveLength(6);
    expect(e.getState().recent[0]).toBe("T1");
  });
  it("selectedWires returns the component's rows; E1 returns all 133", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.select("INJ1");
    expect(e.selectedWires().every(({ wire }) => wire.target === "INJ1")).toBe(true);
    e.select("E1");
    expect(e.selectedWires()).toHaveLength(133);
  });
  it("selectWire toggles + inspectWire resolves the target label", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.selectWire(0);
    expect(e.getState().selWire).toBe(0);
    e.selectWire(0);
    expect(e.getState().selWire).toBeNull();
    expect(e.inspectWire(0)!.targetLabel).toBe(schByKey(SCH_WIRES[0].target)!.name);
  });
  it("component filter narrows the list", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.setFilter("injector");
    expect(e.filteredComponents().length).toBeGreaterThan(0);
    expect(e.filteredComponents().every((c) => `${c.code} ${c.name}`.toLowerCase().includes("injector"))).toBe(true);
  });
  it("search matches components + wires (≤40), empty on no query", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    expect(e.search()).toHaveLength(0);
    e.setQuery("ignition coil");
    const hits = e.search();
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.length).toBeLessThanOrEqual(40);
    e.setQuery("zzzznope");
    expect(e.search()).toHaveLength(0);
  });
});

describe("SchematicWorkspaceEngine — layers", () => {
  it("default active layers on; toggling flips visibility", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    expect(e.layerOn("grounds")).toBe(true);
    e.toggleLayer("grounds");
    expect(e.layerOn("grounds")).toBe(false);
    expect(e.layersOnCount()).toBe(6);
  });
  it("NO-DATA layers are inert (cannot be toggled on)", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.toggleLayer("lin");
    expect(e.layerOn("lin")).toBe(false);
    e.toggleLayer("flexray");
    expect(e.layerOn("flexray")).toBe(false);
  });
});

describe("SchematicWorkspaceEngine — trace state machine", () => {
  it("setTrace resets to step 0 and plays; expected component matches step 0", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.setTrace("ign");
    expect(e.getState().mode).toBe("trace");
    expect(e.getState().traceStep).toBe(0);
    expect(e.traceExpected()).toBe(traceById("ign")!.steps[0].cmp);
  });
  it("correct pick advances the guided trace", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.setTrace("inj");
    const expected = e.traceExpected();
    e.answerTrace(expected);
    expect(e.getState().traceStep).toBe(1);
    expect(e.getState().feedback).toEqual({ ok: true });
  });
  it("incorrect pick flags feedback without advancing", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.setTrace("inj");
    const wrong = SCH_COMPONENTS.find((c) => c.key !== e.traceExpected())!.key;
    e.answerTrace(wrong);
    expect(e.getState().traceStep).toBe(0);
    expect(e.getState().feedback).toEqual({ ok: false });
  });
  it("advancing through all steps completes the trace (100% progress)", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.setTrace("can");
    const n = traceById("can")!.steps.length;
    for (let i = 0; i < n; i++) e.traceAdvance();
    expect(e.getState().traceDone).toBe(true);
    expect(e.getState().tracePlaying).toBe(false);
    expect(e.traceProgress()).toBe(100);
  });
  it("reset returns to step 0", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.setTrace("ign");
    e.traceAdvance();
    e.traceReset();
    expect(e.getState().traceStep).toBe(0);
    expect(e.getState().traceDone).toBe(false);
  });
});

describe("SchematicWorkspaceEngine — training (accuracy scoring)", () => {
  it("training mode; canvas pick answers the current task", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.setMode("training");
    expect(e.getState().mode).toBe("training");
    const target = e.trainingTarget();
    e.select(target);
    expect(e.getState().feedback).toEqual({ ok: true });
    expect(e.getState().taskDone).toBe(1);
    expect(e.accuracyPct()).toBe(100);
  });
  it("wrong pick lowers accuracy, does not advance taskDone", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.setMode("training");
    const target = e.trainingTarget();
    const wrong = SCH_COMPONENTS.find((c) => c.key !== target)!.key;
    e.select(wrong);
    expect(e.getState().feedback).toEqual({ ok: false });
    expect(e.getState().taskDone).toBe(0);
    expect(e.accuracyPct()).toBe(0);
  });
  it("accuracy = round(100*taskCorrect/attempts) — one wrong then one right = 50%", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.setMode("training");
    const target = e.trainingTarget();
    const wrong = SCH_COMPONENTS.find((c) => c.key !== target)!.key;
    e.select(wrong);
    e.select(target);
    expect(e.accuracyPct()).toBe(50);
  });
  it("reveal exposes the answer without scoring", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.setMode("training");
    e.reveal();
    expect(e.getState().revealed).toBe(true);
    expect(e.getState().sel).toBe(e.trainingTarget());
    expect(e.getState().attempts).toBe(0);
  });
  it("nextTask advances the task index", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.setMode("training");
    const t0 = e.trainingTarget();
    e.nextTask();
    expect(e.getState().taskIdx).toBe(1);
    expect(e.trainingTarget()).not.toBe(t0);
  });
  it("locating all 8 tasks emits a training SessionResult", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    let result: any = null;
    e.onComplete((r) => (result = r));
    e.setMode("training");
    for (let i = 0; i < SCH_TASKS.length + 1; i++) { e.select(e.trainingTarget()); e.nextTask(); }
    expect(e.getState().finished).toBe(true);
    expect(result.tool).toBe("schematic");
    expect(result.scenarioId).toBe("schematic-training");
    expect(result.outcome).toBe("pass");
    expect(result.steps).toHaveLength(8);
  });
});

describe("SchematicWorkspaceEngine — practice (deterministic MCQ)", () => {
  it("question is derived deterministically from taskIdx (4 sorted pin options incl. answer)", () => {
    const a = new SchematicWorkspaceEngine(ctx());
    a.setMode("practice");
    const q1 = a.practiceQuestion();
    const b = new SchematicWorkspaceEngine(ctx());
    b.setMode("practice");
    expect(b.practiceQuestion()).toEqual(q1); // deterministic
    expect(q1.options).toContain(q1.answer);
    expect(q1.options.length).toBeGreaterThanOrEqual(1);
    expect(q1.options.length).toBeLessThanOrEqual(4);
    expect([...q1.options].sort()).toEqual(q1.options);
  });
  it("correct answer scores; wrong does not", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.setMode("practice");
    const q = e.practiceQuestion();
    e.answerPractice(q.answer);
    expect(e.getState().practiceCorrect).toBe(1);
    expect(e.getState().feedback).toEqual({ ok: true });
    e.nextTask();
    const q2 = e.practiceQuestion();
    const wrong = q2.options.find((o) => o !== q2.answer) ?? "ZZ";
    e.answerPractice(wrong);
    expect(e.getState().practiceCorrect).toBe(1);
    expect(e.getState().feedback).toEqual({ ok: false });
  });
  it("answering 8 practice questions emits a practice SessionResult", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    let result: any = null;
    e.onComplete((r) => (result = r));
    e.setMode("practice");
    for (let i = 0; i < 8; i++) { e.answerPractice(e.practiceQuestion().answer); e.nextTask(); }
    expect(result.scenarioId).toBe("schematic-practice");
    expect(result.score).toBe(100);
    expect(result.outcome).toBe("pass");
  });
});

describe("SchematicWorkspaceEngine — exam (6 fixed questions)", () => {
  it("collects answers, keeps exam state separate, no immediate grading", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.setMode("exam");
    expect(e.examQuestion()).toBe(SCH_EXAM[0]);
    e.select("R15");
    expect(e.getState().examAnswers[0]).toBe("R15");
    expect(e.getState().taskDone).toBe(0); // training counter untouched
    e.nextExam();
    expect(e.getState().examIdx).toBe(1);
  });
  it("submit grades the collected answers and emits an exam SessionResult", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    let result: any = null;
    e.onComplete((r) => (result = r));
    e.setMode("exam");
    for (let i = 0; i < SCH_EXAM.length; i++) { e.answerExam(SCH_EXAM[i].answer); if (i < SCH_EXAM.length - 1) e.nextExam(); }
    e.submitExam();
    expect(e.getState().examSubmitted).toBe(true);
    expect(e.examCorrect()).toBe(6);
    expect(result.scenarioId).toBe("schematic-exam");
    expect(result.score).toBe(100);
    expect(result.steps).toHaveLength(6);
    expect(result.steps.every((s: any) => s.ok)).toBe(true);
  });
  it("a wrong exam answer lowers the exam score below pass", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    let result: any = null;
    e.onComplete((r) => (result = r));
    e.setMode("exam");
    const wrong0 = SCH_COMPONENTS.find((c) => c.key !== SCH_EXAM[0].answer)!.key;
    e.answerExam(wrong0);
    for (let i = 1; i < SCH_EXAM.length; i++) { e.nextExam(); e.answerExam(SCH_COMPONENTS.find((c) => c.key !== SCH_EXAM[i].answer)!.key); }
    e.submitExam();
    expect(e.examCorrect()).toBe(0);
    expect(result.score).toBe(0);
    expect(result.outcome).toBe("fault");
  });
  it("restart clears exam state", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    e.setMode("exam");
    e.answerExam("R15");
    e.submitExam();
    e.restartExam();
    expect(e.getState().examIdx).toBe(0);
    expect(e.getState().examAnswers).toEqual({});
    expect(e.getState().examSubmitted).toBe(false);
  });
});

describe("SchematicWorkspaceEngine — mode isolation", () => {
  it("switching mode clears selection + feedback; five distinct modes", () => {
    const e = new SchematicWorkspaceEngine(ctx());
    for (const m of ["study", "trace", "training", "practice", "exam"] as const) {
      e.setMode(m);
      expect(e.getState().mode).toBe(m);
      expect(e.getState().sel).toBeNull();
      expect(e.getState().feedback).toBeNull();
    }
  });
});
