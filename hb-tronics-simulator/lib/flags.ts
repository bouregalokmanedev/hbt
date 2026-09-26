/**
 * Milestone 0.2 — feature flags (additive, no engine change).
 * NEXT_PUBLIC_DATA_SOURCE=static|http  default static reproduces today's behavior exactly.
 */
export const dataSourceFlag = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "static") as "static" | "http";
export const isHttpDataSource = dataSourceFlag === "http";
