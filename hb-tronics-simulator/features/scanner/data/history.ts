/**
 * Diagnostic History sessions (SC, doc 17/19). Class-B canonical records — session
 * ids, dates, vehicles, odometer, technician, DTC counts, status. All values are
 * from the captured source evidence; no learner-facing prose (status labels are
 * chrome: scanner.hist.status.*).
 */
export type SessionStatus = "open" | "repaired" | "clear";

export interface HistorySession {
  id: string;
  date: string; // "27 Jul 2026"
  time: string; // "12:18"
  vehicle: string; // canonical
  odometerKm: number;
  technician: string;
  dtc: number;
  status: SessionStatus;
}

/** The five most-recent sessions (source window; catalogue is larger — see SESSION_TOTAL). */
export const HISTORY_SESSIONS: HistorySession[] = [
  { id: "HB-24071", date: "27 Jul 2026", time: "12:18", vehicle: "Toyota Camry 2.5 G (ASV70)", odometerKm: 96412, technician: "H. Barakat", dtc: 8, status: "open" },
  { id: "HB-23988", date: "11 Jul 2026", time: "09:42", vehicle: "Toyota Camry 2.5 G (ASV70)", odometerKm: 94880, technician: "H. Barakat", dtc: 5, status: "repaired" },
  { id: "HB-23902", date: "02 Jul 2026", time: "16:05", vehicle: "Volkswagen Touareg 3.0 V6 TDI", odometerKm: 148220, technician: "M. Aziz", dtc: 2, status: "repaired" },
  { id: "HB-23855", date: "24 Jun 2026", time: "11:20", vehicle: "BMW 320i (G20) B48", odometerKm: 52018, technician: "S. Haddad", dtc: 0, status: "clear" },
  { id: "HB-23790", date: "15 Jun 2026", time: "14:47", vehicle: "Kia Sportage 1.6 T-GDI", odometerKm: 31640, technician: "H. Barakat", dtc: 3, status: "repaired" },
];

/** Total sessions in the catalogue (source: "184 sessions · 5 shown"). */
export const SESSION_TOTAL = 184;

export const STATUS_STYLE: Record<SessionStatus, { fg: string; bg: string }> = {
  open: { fg: "#B4560F", bg: "#FFF3E8" },
  repaired: { fg: "#0B7A3C", bg: "#EDF7F1" },
  clear: { fg: "#0B7A3C", bg: "#EDF7F1" },
};

/** Fields compared side-by-side in the compare view. */
export const COMPARE_FIELDS = ["date", "vehicle", "odometer", "technician", "dtc", "status"] as const;
export type CompareField = (typeof COMPARE_FIELDS)[number];

/**
 * Pure session comparison (kept out of the React view). Reports which evidenced
 * fields differ between two sessions, plus the DTC delta.
 */
export function compareSessions(a: HistorySession, b: HistorySession): { changed: Record<CompareField, boolean>; diffCount: number; dtcDelta: number } {
  const changed = {
    date: a.date !== b.date || a.time !== b.time,
    vehicle: a.vehicle !== b.vehicle,
    odometer: a.odometerKm !== b.odometerKm,
    technician: a.technician !== b.technician,
    dtc: a.dtc !== b.dtc,
    status: a.status !== b.status,
  } as Record<CompareField, boolean>;
  return { changed, diffCount: COMPARE_FIELDS.filter((f) => changed[f]).length, dtcDelta: b.dtc - a.dtc };
}

