import { describe, it, expect } from "vitest";
import { LocationAtlasEngine } from "@sim/location";
import { LOC_COMPONENTS, LOC_CATEGORIES, LOC_SYSTEM_GROUPS, LOC_SYSTEMS_RAW, LOC_VIEWS, deriveSystemGroups, groupByKey, locByKey, locByCategory, locByGroup, LOC_VEHICLE } from "@/data/location/atlas";
import golden from "../unit/fixtures/location-systems.golden.json";
import type { EngineContext } from "@sim/core";

const ctx = (over: Partial<EngineContext> = {}): EngineContext => ({
  vehicleId: "corolla",
  focus: "R7",
  seed: 7,
  settings: { difficulty: "Medium", hints: true, randomFault: false, outlines: true, noise: 1, instrument: "Bench replica", probeMode: "Drag probes" },
  ...over,
});

describe("Location dataset", () => {
  it("has 115 components across the 6 authentic categories", () => {
    expect(LOC_COMPONENTS).toHaveLength(115);
    const byCat = (c: string) => LOC_COMPONENTS.filter((x) => x.cat === c).length;
    expect(byCat("Sensors")).toBe(8);
    expect(byCat("Actuators")).toBe(2);
    expect(byCat("ECUs")).toBe(15);
    expect(byCat("Relays")).toBe(15);
    expect(byCat("Fuses")).toBe(56);
    expect(byCat("Ground points")).toBe(19);
  });

  it("every component validates (ref/name/view/hotspot + image-relative coords)", () => {
    const views = new Set(LOC_VIEWS.map((v) => v.id));
    for (const c of LOC_COMPONENTS) {
      expect(c.key).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(views.has(c.view)).toBe(true);
      expect(c.hot.W).toBeGreaterThan(0);
      expect(c.hot.H).toBeGreaterThan(0);
      // hotspot lies within the image bounds
      expect(c.hot.x).toBeGreaterThanOrEqual(0);
      expect(c.hot.x + c.hot.w).toBeLessThanOrEqual(c.hot.W + 1);
      expect(c.hot.y + c.hot.h).toBeLessThanOrEqual(c.hot.H + 1);
    }
  });

  it("carries no learner prose in the dataset (ids resolved from content)", () => {
    for (const c of LOC_COMPONENTS) {
      expect(c).not.toHaveProperty("loc");
      expect(c).not.toHaveProperty("mount");
      expect(c).not.toHaveProperty("notes");
    }
  });

  it("category registry has All + 6 kinds + systems grouping", () => {
    expect(LOC_CATEGORIES.find((c) => c.id === "all")!.count).toBe(115);
    expect(LOC_CATEGORIES.map((c) => c.id)).toEqual(["all", "Sensors", "Actuators", "ECUs", "Relays", "Fuses", "Ground points", "systems"]);
  });

  it("lookup helpers work; vehicle string is canonical", () => {
    expect(locByKey("R7")!.name).toMatch(/Ignition relay/);
    expect(locByCategory("ECUs")).toHaveLength(15);
    expect(locByGroup("abs").length).toBeGreaterThan(0);
    expect(LOC_VEHICLE).toMatch(/Corolla/);
  });
});

describe("Location — authentic 58 system grouping (P5.3)", () => {
  it("presents exactly 58 groups matching the source getter (label/order/counts/membership)", () => {
    expect(LOC_SYSTEM_GROUPS).toHaveLength(58);
    // label + order
    expect(LOC_SYSTEM_GROUPS.map((g) => g.label)).toEqual(golden.map((g: any) => g.label));
    // counts + exact member keys (fuses/relays/ecus), per group
    for (let i = 0; i < golden.length; i++) {
      const g = LOC_SYSTEM_GROUPS[i], gold = golden[i] as any;
      expect(g.key).toBe(gold.key);
      expect(g.total).toBe(gold.total);
      expect(g.fuses).toEqual(gold.fuses);
      expect(g.relays).toEqual(gold.relays);
      expect(g.ecus).toEqual(gold.ecus);
    }
  });

  it("the grouping is derived from raw Class-B, not hand-entered (recompute === committed)", () => {
    const recomputed = deriveSystemGroups(LOC_COMPONENTS);
    expect(recomputed).toEqual(LOC_SYSTEM_GROUPS);
  });

  it("raw multi-label domain data remains intact and un-grouped", () => {
    // the raw registry (pre-grouping, ~80 distinct labels) is preserved untouched,
    // and still carries the spelling/plural variants the presentation model merges
    expect(LOC_SYSTEMS_RAW.length).toBeGreaterThan(LOC_SYSTEM_GROUPS.length);
    const names = new Set(LOC_SYSTEMS_RAW.map((s) => s.name));
    for (const variant of ["Headlight(s)", "Headlights", "Starting", "Starting system", "Power window(s)", "Power windows"]) {
      expect(names.has(variant)).toBe(true);
    }
    // and the raw fuse circuit membership (the Class-B source of the grouping) is intact
    const f1 = locByKey("F1")!;
    expect(f1.systems).toContain("ABS");
    expect(f1.systems!.length).toBeGreaterThan(30);
  });

  it("every presented group has ≥1 fuse (the fuse-gated filter that reduces 80→58)", () => {
    expect(LOC_SYSTEM_GROUPS.every((g) => g.fuses.length >= 1)).toBe(true);
  });

  it("group membership resolves to real components in source order (fuses, relays, ECUs)", () => {
    const abs = groupByKey("abs")!;
    const members = locByGroup("abs");
    expect(members.map((c) => c.key)).toEqual([...abs.fuses, ...abs.relays, ...abs.ecus]);
    expect(members.every(Boolean)).toBe(true);
  });
});

describe("LocationAtlasEngine — browse", () => {
  it("starts in browse on the focused component's view", () => {
    const e = new LocationAtlasEngine(ctx());
    expect(e.getState().mode).toBe("browse");
    expect(e.getState().selected).toBe("R7");
    expect(e.getState().view).toBe(locByKey("R7")!.view);
  });
  it("select updates selection, view + recent (last 4)", () => {
    const e = new LocationAtlasEngine(ctx());
    e.select("L3");
    expect(e.getState().selected).toBe("L3");
    expect(e.getState().view).toBe("sensors");
    e.select("E1"); e.select("GP4"); e.select("F5"); e.select("R2");
    expect(e.getState().recent).toHaveLength(4);
    expect(e.getState().recent[0]).toBe("R2");
  });
  it("category filter narrows the list", () => {
    const e = new LocationAtlasEngine(ctx());
    e.setCategory("Fuses");
    expect(e.filtered().every((c) => c.cat === "Fuses")).toBe(true);
    expect(e.filtered()).toHaveLength(56);
  });
  it("system filter selects a group (by key) → Systems view + member list", () => {
    const e = new LocationAtlasEngine(ctx());
    e.setSystem("abs");
    expect(e.getState().sys).toBe("abs");
    expect(e.getState().view).toBe("system");
    expect(e.getState().cat).toBe("systems");
    const members = new Set(locByGroup("abs").map((c) => c.key));
    expect(e.filtered().length).toBe(members.size);
    expect(e.filtered().every((c) => members.has(c.key))).toBe(true);
    // the selected group is exposed for the Systems trace panel
    expect(e.system()!.label).toBe("ABS");
  });
  it("search matches ref/name/oem/circuit (deterministic substring)", () => {
    const e = new LocationAtlasEngine(ctx());
    e.setSearch("oxygen");
    expect(e.filtered().length).toBeGreaterThan(0);
    expect(e.filtered().every((c) => `${c.ref} ${c.name} ${c.oem ?? ""} ${(c.systems ?? []).join(" ")}`.toLowerCase().includes("oxygen"))).toBe(true);
    e.setSearch("zzzznope");
    expect(e.filtered()).toHaveLength(0);
  });
  it("favourite toggle is deterministic", () => {
    const e = new LocationAtlasEngine(ctx());
    expect(e.getState().favs).toContain("R7");
    e.toggleFavourite("R7");
    expect(e.getState().favs).not.toContain("R7");
    e.toggleFavourite("E1");
    expect(e.getState().favs).toContain("E1");
  });
  it("view switch + zoom + outlines + dim-others are engine state", () => {
    const e = new LocationAtlasEngine(ctx());
    e.setView("ecu"); expect(e.getState().view).toBe("ecu");
    e.setZoom(2); expect(e.getState().zoom).toBe(2);
    e.setZoom(99); expect(e.getState().zoom).toBe(3); // clamped
    e.toggleOutlines(); expect(e.getState().outlines).toBe(false);
    e.toggleDimOthers(); expect(e.getState().dimOthers).toBe(false);
  });
  it("hotspot maps to its view's image coordinate space", () => {
    const e = new LocationAtlasEngine(ctx());
    const c = e.component("R7")!;
    expect(c.hot.W).toBe(772); // fusebox-layout
    expect(c.view).toBe("fuse");
  });
});

describe("LocationAtlasEngine — training (authentic scoring)", () => {
  it("Practise this enters training on the component", () => {
    const e = new LocationAtlasEngine(ctx());
    e.practise("L3");
    expect(e.getState().mode).toBe("train");
    expect(e.getState().tTarget).toBe("L3");
  });
  it("correct pick scores 10 (no hints) and advances", () => {
    const e = new LocationAtlasEngine(ctx());
    e.setMode("train");
    const target = e.getState().tTarget!;
    e.select(target);
    expect(e.getState().tScore).toBe(10);
    expect(e.getState().tLog[0]).toMatchObject({ ok: true });
    expect(e.getState().tDone).toBe(1);
  });
  it("hint penalty: pts = max(2, 10 - hints*2)", () => {
    const e = new LocationAtlasEngine(ctx());
    e.setMode("train");
    e.useHint(); e.useHint(); // 2 hints
    const target = e.getState().tTarget!;
    e.select(target);
    expect(e.getState().tScore).toBe(6); // 10 - 2*2
  });
  it("wrong pick increments attempts + hints and logs", () => {
    const e = new LocationAtlasEngine(ctx());
    e.setMode("train");
    const target = e.getState().tTarget!;
    const wrong = LOC_COMPONENTS.find((c) => c.key !== target)!.key;
    e.select(wrong);
    expect(e.getState().tAttempts).toBe(1);
    expect(e.getState().tHints).toBe(1);
    expect(e.getState().tVerdict).toBe("no");
    expect(e.getState().tLog[0]).toMatchObject({ ok: false });
  });
  it("Hard/Expert difficulty disables hints", () => {
    const e = new LocationAtlasEngine(ctx({ settings: { ...ctx().settings, difficulty: "Hard" } }));
    e.setMode("train");
    e.useHint();
    expect(e.getState().tHints).toBe(0);
  });
  it("skip advances the task without scoring", () => {
    const e = new LocationAtlasEngine(ctx());
    e.setMode("train");
    const t0 = e.getState().tTarget;
    e.skipTask();
    expect(e.getState().tDone).toBe(1);
    expect(e.getState().tTarget).not.toBe(t0);
  });
  it("completing the task set emits a SessionResult", () => {
    const e = new LocationAtlasEngine(ctx());
    let result: any = null;
    e.onComplete((r) => (result = r));
    e.setMode("train");
    for (let i = 0; i < 8; i++) e.select(e.getState().tTarget!);
    expect(e.getState().finished).toBe(true);
    expect(result.tool).toBe("location");
    expect(result.scenarioId).toBe("location-training");
    expect(result.steps).toHaveLength(8);
    expect(result.outcome).toBe("pass"); // all correct → 80/80
  });
});

describe("LocationAtlasEngine — quiz", () => {
  it("first-try correct scores 10; retry scores fewer", () => {
    const e = new LocationAtlasEngine(ctx());
    e.setMode("quiz");
    const target = e.getState().qList[e.getState().qIdx];
    e.select(target);
    expect(e.getState().qScore).toBe(10);
    // second question, answer wrong then right → fewer points
    const t2 = e.getState().qList[e.getState().qIdx];
    const wrong = LOC_COMPONENTS.find((c) => c.key !== t2)!.key;
    e.select(wrong);
    expect(e.getState().qTries).toBe(1);
    e.select(t2);
    expect(e.getState().qScore).toBe(10 + 4); // 6 - 1*2
  });
  it("timer ticks only while quiz is running", () => {
    const e = new LocationAtlasEngine(ctx());
    e.setMode("quiz");
    e.tickQuiz(); e.tickQuiz();
    expect(e.getState().qElapsed).toBe(2);
  });
  it("completing the quiz emits a SessionResult", () => {
    const e = new LocationAtlasEngine(ctx());
    let result: any = null;
    e.onComplete((r) => (result = r));
    e.setMode("quiz");
    for (let i = 0; i < 8; i++) e.select(e.getState().qList[e.getState().qIdx]);
    expect(e.getState().qDone).toBe(true);
    expect(result.tool).toBe("location");
    expect(result.scenarioId).toBe("location-quiz");
    expect(result.score).toBe(80);
  });
});
