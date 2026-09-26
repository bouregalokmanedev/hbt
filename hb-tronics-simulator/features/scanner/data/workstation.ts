/**
 * Scanner "Diagnostic Workstation" landing data (SC-01/SC-02, doc 19 §1).
 * Class-B structure only — icons, badges, locked flags, routes, technical
 * session values. Learner-facing prose (titles/descriptions/header/status)
 * is Class-C, resolved by the UI from `content.scanner.ws.*` by id.
 */
import type { ScannerScreen } from "../screens/types";

export type HeroTone = "dark" | "brand" | "light";
export interface HeroPanel {
  id: "intelligent" | "local" | "reset";
  tone: HeroTone;
  icon: string; // Icon name
  badgeId: string; // content id for the badge label
  route?: ScannerScreen; // where the panel leads (undefined = informational)
}

/** Three hero panels (source order: Intelligent / Local / Reset). */
export const HERO_PANELS: HeroPanel[] = [
  { id: "intelligent", tone: "dark", icon: "cloud", badgeId: "cloudOnline" },
  { id: "local", tone: "brand", icon: "car", badgeId: "startHere", route: "dashboard" },
  { id: "reset", tone: "light", icon: "reset", badgeId: "routines38" },
];

export interface FunctionModule {
  id: string;
  icon: string;
  /** Class-B badge value shown verbatim (counts/levels), or null. */
  badge: string | null;
  locked?: boolean; // ECU Programming — PRO+ in the source
  route?: ScannerScreen; // existing screen this module opens, if any
}

/** Ten function-grid modules (source order). */
export const FUNCTION_MODULES: FunctionModule[] = [
  { id: "adas", icon: "target", badge: "2 DUE", route: "adas" },
  { id: "immobilizer", icon: "key", badge: null },
  { id: "tpms", icon: "gauge", badge: null },
  { id: "history", icon: "history", badge: null, route: "history" },
  { id: "software", icon: "upload", badge: "742" },
  { id: "coverage", icon: "grid", badge: null },
  { id: "training", icon: "cap", badge: "L2 · 68%", route: "training" },
  { id: "knowledge", icon: "book", badge: null },
  { id: "other", icon: "modules", badge: null },
  { id: "ecu", icon: "lock", badge: null, locked: true },
];

/** Recent sessions (Class-B technical record; vehicle names/codes are canonical). */
export interface RecentSession {
  vehicle: string;
  meta: string; // date · time · km · tech
  dtc: number;
}
export const RECENT_SESSIONS: RecentSession[] = [
  { vehicle: "Toyota Camry 2.5 G (ASV70)", meta: "27 Jul 2026 · 12:18 · 96 412 km · H. Barakat", dtc: 8 },
  { vehicle: "Toyota Camry 2.5 G (ASV70)", meta: "11 Jul 2026 · 09:42 · 94 880 km · H. Barakat", dtc: 5 },
  { vehicle: "Volkswagen Touareg 3.0 V6 TDI", meta: "02 Jul 2026 · 16:05 · 148 220 km · M. Aziz", dtc: 2 },
];

/** Top-right meta cards (Class-B canonical values; labels are chrome). */
export const META_CARDS: { id: string; value: string }[] = [
  { id: "vci", value: "HB-LINK 3 · BT" },
  { id: "os", value: "HB-OS 4.2.1 · 3 updates" },
  { id: "coverage", value: "142 brands · 2026.7" },
];
