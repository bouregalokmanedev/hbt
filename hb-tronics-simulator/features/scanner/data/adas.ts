/**
 * ADAS Calibration workstation data (SC, doc 17/19). Class-B structure only —
 * item ids, calibration status, target-board metadata. Learner-facing prose (item
 * names, notes, pre-conditions, status) is Class-C (content.scanner.adas.*).
 */
export type AdasStatus = "required" | "calibrated" | "notEquipped";

export interface AdasItem {
  id: string;
  status: AdasStatus;
}

/** Six ADAS items (source order + statuses). */
export const ADAS_ITEMS: AdasItem[] = [
  { id: "camera", status: "required" },
  { id: "frontRadar", status: "calibrated" },
  { id: "blindL", status: "calibrated" },
  { id: "blindR", status: "required" },
  { id: "park", status: "calibrated" },
  { id: "surround", status: "notEquipped" },
];

/** The active static calibration (source: Front camera). */
export const ADAS_ACTIVE = {
  itemId: "camera",
  type: "static" as const,
  targetBoard: "HB-T14",
  distance: "1.28 m",
  tolerance: "± 5 mm",
  dtc: "B1483",
  preconditionCount: 6,
};

/** Status dot colours (source hex). */
export const ADAS_STATUS_COLOR: Record<AdasStatus, string> = {
  required: "#F59E0B",
  calibrated: "#12A150",
  notEquipped: "#9AA0A6",
};
