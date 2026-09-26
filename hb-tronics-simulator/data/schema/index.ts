import { z } from "zod";

/** Tool identifiers used across the shared bench (01 §3, 06). */
export const ToolId = z.enum(["scanner", "multimeter", "oscilloscope", "location", "schematic"]);
export type ToolId = z.infer<typeof ToolId>;

/** Coverage state per tool for a vehicle (06 §0). */
export const Coverage = z.enum(["ok", "avail", "none"]);
export type Coverage = z.infer<typeof Coverage>;

/** Canonical shared component (CTX, 11 items) with per-tool identifiers. */
export const ComponentRef = z.object({
  ref: z.string(), // canonical ref, e.g. "INJ", "L3"
  name: z.string(), // Class-B technical name (canonical)
  system: z.string(),
  // per-tool ids so "focus" resolves in each tool (04 cross-tool data flow)
  loc: z.string().nullable(),
  mm: z.string().nullable(),
  scope: z.string().nullable(),
  sch: z.string().nullable(),
});
export type ComponentRef = z.infer<typeof ComponentRef>;

/** Active vehicle with per-tool coverage map (06 §0). */
export const Vehicle = z.object({
  id: z.string(),
  name: z.string(),
  engine: z.string(),
  transmission: z.string(),
  vin: z.string(),
  odometerKm: z.number(),
  installed: z.boolean(),
  coverage: z.record(ToolId, Coverage),
});
export type Vehicle = z.infer<typeof Vehicle>;

/** Hub module card / learning module (01/06). */
export const Module = z.object({
  id: ToolId,
  index: z.number(),
  tag: z.string(),
  name: z.string(),
  title: z.string(),
  desc: z.string(),
  skill: z.string(),
  progress: z.number(), // 0-100
  // Hub card subtitle/features/lastActivity are Class-C prose resolved by the UI
  // from content.hub.mod.<id>.* (14 §0 / F7) — not stored here.
  accent: z.string(),
  accentBg: z.string(),
});
export type Module = z.infer<typeof Module>;

/** A completed session report (06 §0, REPORTS 7). */
export const ReportStep = z.object({
  label: z.string(),
  ok: z.boolean(),
});
export const Report = z.object({
  id: z.string(),
  date: z.string(), // ISO
  tools: z.array(ToolId),
  finding: z.string(),
  outcome: z.enum(["pass", "fault"]),
  score: z.number(),
  verdict: z.string(),
  steps: z.array(ReportStep),
  vehicleId: z.string(),
  vin: z.string(),
  km: z.number(),
  tech: z.string(),
});
export type Report = z.infer<typeof Report>;
export type ReportStep = z.infer<typeof ReportStep>;
