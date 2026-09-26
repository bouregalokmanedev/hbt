import type { ToolId } from "@/data/schema";

export const TOOL_ROUTES: Record<ToolId, string> = {
  scanner: "/tools/scanner",
  multimeter: "/tools/multimeter",
  oscilloscope: "/tools/oscilloscope",
  location: "/tools/location",
  schematic: "/tools/schematic",
};

/** Build a locale-prefixed href. */
export function href(locale: string, path: string): string {
  return `/${locale}${path.startsWith("/") ? "" : "/"}${path}`;
}

export interface RailItem {
  id: string;
  icon: string;
  href: string; // path without locale prefix
  labelKey: string; // shell.rail.<key>
  tool?: ToolId;
}

export const RAIL_TOP: RailItem[] = [{ id: "hub", icon: "hub", href: "/hub", labelKey: "hub" }];

export const RAIL_SIMS: RailItem[] = [
  { id: "scanner", icon: "scanner", href: "/tools/scanner", labelKey: "scanner", tool: "scanner" },
  { id: "multimeter", icon: "multimeter", href: "/tools/multimeter", labelKey: "multimeter", tool: "multimeter" },
  { id: "oscilloscope", icon: "oscilloscope", href: "/tools/oscilloscope", labelKey: "oscilloscope", tool: "oscilloscope" },
  { id: "location", icon: "location", href: "/tools/location", labelKey: "location", tool: "location" },
  { id: "schematic", icon: "schematic", href: "/tools/schematic", labelKey: "schematic", tool: "schematic" },
];

export const RAIL_LEARN: RailItem[] = [
  { id: "progress", icon: "progress", href: "/progress", labelKey: "progress" },
  { id: "reports", icon: "reports", href: "/reports", labelKey: "reports" },
];

export const RAIL_FOOT: RailItem[] = [
  { id: "garage", icon: "garage", href: "/garage", labelKey: "garage" },
  { id: "settings", icon: "settings", href: "/settings", labelKey: "settings" },
];
