import { z } from "zod";

/**
 * LearningModule — the curriculum wrapper referenced by progress/certs (10 §7.1,
 * review F5). Named `LearningModule` to avoid collision with the hub-card
 * `Module` in data/schema/index.ts; this one groups scenarios into a course.
 */
export const LearningModule = z.object({
  id: z.string(),
  title: z.string(),
  scenarioIds: z.array(z.string()),
  prerequisites: z.array(z.string()),
  certificationId: z.string().nullable(),
});
export type LearningModule = z.infer<typeof LearningModule>;

export const LearningModuleSchema = z.array(LearningModule);
