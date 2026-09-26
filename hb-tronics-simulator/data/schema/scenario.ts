import { z } from "zod";
import { ToolId } from "./index";

/**
 * Scenario — a data-driven exercise definition (10 §7.1, review F5). Replaces
 * hard-coded scenario logic/strings inside engines. Engines take a scenarioId
 * and consume the loaded definition (rubric, seeded faults, verdict, metadata)
 * via the repository layer. Class-B step CONTENT stays in data/<tool> and is
 * referenced by `contentRef`, never duplicated here.
 */
export const ScenarioStep = z.object({
  id: z.string(),
  ok: z.boolean().optional(),
});
export type ScenarioStep = z.infer<typeof ScenarioStep>;

export const Rubric = z.object({
  startScore: z.number().default(100),
  /** score decrement per wrong attempt (guided-step tools) */
  penaltyPerAttempt: z.number().optional(),
  /** named sub-scores, e.g. { accuracy, process, time } for training scenarios */
  weights: z.record(z.string(), z.number()).optional(),
  /** pass threshold as a percentage */
  passPct: z.number().default(60),
});
export type Rubric = z.infer<typeof Rubric>;

export const Scenario = z.object({
  id: z.string(),
  tool: ToolId,
  vehicleId: z.string(),
  focusRef: z.string().nullable(),
  title: z.string(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  /** canonical seeded fault codes (Class-B); prose resolved by the UI (Class-C) */
  seededFaults: z.array(z.string()),
  /** key linking to the Class-B step content in data/<tool> (e.g. "tree:P2118") */
  contentRef: z.string().nullable(),
  rubric: Rubric,
  /** verdict prose id (Class-C) — engines emit the canonical verdict, UI localizes */
  verdict: z.string().nullable(),
});
export type Scenario = z.infer<typeof Scenario>;

export const ScenarioSchema = z.array(Scenario);
