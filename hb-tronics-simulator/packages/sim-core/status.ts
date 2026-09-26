/**
 * Single status→colour helper reused across every tool (03, 10 §8.1).
 * Returns token-friendly foreground/background hex pairs from docs 07/09.
 */
export type StatusKind = "ok" | "warn" | "fault" | "info" | "muted";

export interface StatusColor {
  fg: string;
  bg: string;
}

const MAP: Record<StatusKind, StatusColor> = {
  ok: { fg: "#0B7A3C", bg: "#EDF7F1" },
  warn: { fg: "#B4560F", bg: "#FFF3E8" },
  fault: { fg: "#B42318", bg: "#FDECEA" },
  info: { fg: "#1F6AE1", bg: "#EFF5FE" },
  muted: { fg: "#8A9099", bg: "#F5F6F7" },
};

export function statusColor(kind: StatusKind): StatusColor {
  return MAP[kind];
}

/** Compare a reading against a numeric spec range → status kind. */
export function specStatus(value: number, min: number, max: number): StatusKind {
  if (value < min || value > max) return "fault";
  return "ok";
}
