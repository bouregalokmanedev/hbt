import type { ScannerEngine, ScannerState } from "@sim/scanner";

/** Shared props for the decomposed Scanner screen components. */
export interface ScannerScreenProps {
  // The next-intl translator for the `scanner` namespace (loosely typed by design).
  t: any;
  engine: ScannerEngine;
  state: ScannerState;
}
