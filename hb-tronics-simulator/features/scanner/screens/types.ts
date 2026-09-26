/** Scanner top-level screens (doc 17 §B). `workstation` is the SC-01 landing. */
export type ScannerScreen =
  | "workstation"
  | "dashboard"
  | "select"
  | "overview"
  | "scan"
  | "network"
  | "systems"
  | "dtcs"
  | "livedata"
  | "graph"
  | "adas"
  | "training"
  | "history"
  | "report"
  | "settings";
