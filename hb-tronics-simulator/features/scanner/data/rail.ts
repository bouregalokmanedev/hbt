import type { ScannerScreen } from "../screens/types";

/**
 * Scanner 66px icon rail (SC, doc 17 — verified against the original tool DOM:
 * `navDefs` + `groupOf`). Nine tool items between the SCAN home tile (top) and the
 * Diagnostic Assistant toggle (bottom). Each item carries the exact source SVG path
 * and terse caption; captions are canonical short-codes (kept stable across locales,
 * like the app's SCN/DMM/OSC toolbar codes), tooltips resolve from localized nav.*.
 */
export interface RailItem {
  group: string; // active-group id (from the original groupOf)
  screen: ScannerScreen; // target screen this item navigates to
  tag: string; // terse caption under the icon (canonical)
  d: string; // exact source SVG path
}

export const RAIL_ITEMS: RailItem[] = [
  { group: "home", screen: "workstation", tag: "HOME", d: "M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1Z" },
  { group: "select", screen: "select", tag: "DIAG", d: "M3 13.5h18M5.5 13.5 7.2 8a2 2 0 0 1 1.9-1.4h5.8A2 2 0 0 1 16.8 8l1.7 5.5M4 13.5v4h16v-4" },
  { group: "systems", screen: "systems", tag: "SYS", d: "M4 6.5h16M4 12h16M4 17.5h16" },
  { group: "livedata", screen: "livedata", tag: "DATA", d: "M3 12h3.5l2.2-6 3.3 12 2.4-6H21" },
  { group: "training", screen: "training", tag: "TRAIN", d: "M12 5 21 9l-9 4-9-4 9-4ZM6.5 11v4.2c0 1.3 2.5 2.4 5.5 2.4s5.5-1.1 5.5-2.4V11" },
  { group: "adas", screen: "adas", tag: "ADAS", d: "M12 20a8 8 0 0 1 0-16M12 17a5 5 0 0 1 0-10M15.5 4.5 20 12l-4.5 7.5" },
  { group: "history", screen: "history", tag: "HIST", d: "M4 12a8 8 0 1 0 3-6.2M4 4v4h4M12 8.5V12l2.6 1.6" },
  { group: "report", screen: "report", tag: "REPT", d: "M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20ZM9.5 12h5M9.5 15.5h5" },
  { group: "settings", screen: "settings", tag: "SET", d: "M4 8h10M18 8h2M4 16h4M12 16h8M16 8v0M9 16v0" },
];

/** Which rail group is active for a given screen (adapted from the source groupOf). */
export const RAIL_GROUP: Record<ScannerScreen, string> = {
  workstation: "home",
  dashboard: "home",
  select: "select",
  overview: "select",
  scan: "select",
  network: "select",
  systems: "systems",
  dtcs: "systems",
  livedata: "livedata",
  graph: "livedata",
  training: "training",
  adas: "adas",
  history: "history",
  report: "report",
  settings: "settings",
};

/** Assistant toggle icon (bottom control) — exact source path + a centred circle. */
export const RAIL_ASSISTANT_D = "M12 3v2M12 19v2M4.5 12H3M21 12h-1.5M6.2 6.2 5 5M17.8 6.2 19 5M6.2 17.8 5 19M17.8 17.8 19 19";
