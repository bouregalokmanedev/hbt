import { describe, it, expect } from "vitest";
import { CTXSchema, CTX } from "@/data/shared/components";
import { VEHSchema, VEH } from "@/data/shared/vehicles";
import { MODSSchema, MODS } from "@/data/shared/modules";
import { REPORTSSchema, REPORTS } from "@/data/record";

describe("dataset validation (Zod at load)", () => {
  it("shared components (CTX) validate and count 11", () => {
    expect(() => CTXSchema.parse(CTX)).not.toThrow();
    expect(CTX.length).toBe(11);
  });
  it("vehicles (VEH) validate and count 4", () => {
    expect(() => VEHSchema.parse(VEH)).not.toThrow();
    expect(VEH.length).toBe(4);
  });
  it("modules (MODS) validate and count 5", () => {
    expect(() => MODSSchema.parse(MODS)).not.toThrow();
    expect(MODS.length).toBe(5);
  });
  it("reports validate and count 7", () => {
    expect(() => REPORTSSchema.parse(REPORTS)).not.toThrow();
    expect(REPORTS.length).toBe(7);
  });
});

describe("cross-tool ECU pin coherence (06 §6)", () => {
  it("MAF L3 signal lands on ECU B92 in both Multimeter and Schematic", async () => {
    const { mmProcedureByRef } = await import("@/data/multimeter/procedures");
    const { SCH_WIRES } = await import("@/data/schematic/workspace");
    const l3 = mmProcedureByRef("L3")!;
    const mmHasB92 = l3.steps.some((s) => s.black === "eB92" || s.red === "eB92");
    // authentic schematic pins carry a space ("B 92"); compare on the canonical token
    const schHasB92 = SCH_WIRES.some((w) => w.ecuPin.replace(/\s/g, "") === "B92" && w.target === "L3");
    expect(mmHasB92).toBe(true);
    expect(schHasB92).toBe(true);
  });

  it("schematic netlist is the authentic 57/133 harness and every wire targets a real node", async () => {
    const { SCH_COMPONENTS, SCH_WIRES, schByKey } = await import("@/data/schematic/workspace");
    expect(SCH_COMPONENTS.length).toBe(57);
    expect(SCH_WIRES.length).toBe(133);
    for (const w of SCH_WIRES) {
      expect(schByKey(w.target), `wire target ${w.target} must exist`).toBeTruthy();
    }
  });
});

describe("scenario / module model + repository seam (F5/F13)", () => {
  it("scenarios and modules validate against their schemas", async () => {
    const { ScenarioSchema } = await import("@/data/schema/scenario");
    const { LearningModuleSchema } = await import("@/data/schema/module");
    const { SCENARIOS } = await import("@/data/scenarios");
    const { LEARNING_MODULES } = await import("@/data/modules");
    expect(() => ScenarioSchema.parse(SCENARIOS)).not.toThrow();
    expect(() => LearningModuleSchema.parse(LEARNING_MODULES)).not.toThrow();
  });

  it("every module scenarioId resolves to a real scenario", async () => {
    const { getRepositories } = await import("@/data/repositories");
    const repo = getRepositories();
    for (const m of repo.modules.list()) {
      for (const sid of m.scenarioIds) {
        expect(repo.scenarios.byId(sid), `module ${m.id} → scenario ${sid}`).toBeTruthy();
      }
    }
  });

  it("StaticRepository returns the bundled data and accepts (ignores) an identity context", async () => {
    const { getRepositories } = await import("@/data/repositories");
    const repo = getRepositories();
    expect(repo.vehicles.list({ userId: "u1", tenantId: "t1" }).length).toBe(4);
    expect(repo.components.byRef("INJ")?.name).toContain("injector");
    expect(repo.scenarios.defaultForTool("scanner")?.id).toBe("scanner-P2118");
    expect(repo.vehicles.coverage("corolla", "scanner")).toBe("ok");
    expect(repo.record.reports().length).toBe(7);
  });
});
