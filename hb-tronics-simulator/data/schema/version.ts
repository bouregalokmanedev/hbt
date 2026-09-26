import { z } from "zod";

/** Every dataset carries a version/coverage tag for pack evolution (F14, 10 §7). */
export const DatasetVersion = z.object({
  version: z.string(), // e.g. "2026.7"
  coverage: z.string(),
});
export type DatasetVersion = z.infer<typeof DatasetVersion>;

export const COVERAGE_VERSION = "2026.7";
export const HB_OS_VERSION = "HB-OS 4.2.1";
