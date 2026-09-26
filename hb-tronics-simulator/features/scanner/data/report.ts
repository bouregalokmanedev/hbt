/**
 * Diagnostic Report document data (SC, doc 17/19). Class-B canonical metadata +
 * recorded measurements (spec/value). The fault-code list reuses the shared DTCS
 * dataset. Learner-facing prose (customer complaint, measurement labels) is
 * Class-C (content.scanner.report.*).
 */
export const REPORT_META = {
  session: "HB-24071",
  date: "27 Jul 2026",
  time: "12:18",
  technician: "H. Barakat",
  level: "L4",
  vehicle: "Toyota Camry 2.5 G (ASV70)",
  vin: "4T1BZ1FB7LU012345",
  odometerKm: 96412,
};

export interface ReportMeasurement {
  id: string; // content id for the label
  spec: string; // Class-B canonical
  value: string; // Class-B canonical
  ok: boolean; // in / out of spec
}

/** Recorded measurements (source order + values). */
export const REPORT_MEASUREMENTS: ReportMeasurement[] = [
  { id: "throttleR", spec: "0.3 – 1.8 Ω", value: "6.42 Ω", ok: false },
  { id: "motorSupply", spec: "B+ ± 0.3 V", value: "13.81 V", ok: true },
  { id: "ground", spec: "< 0.5 Ω", value: "0.21 Ω", ok: true },
  { id: "tp1", spec: "0.6 – 4.4 V", value: "0.82 V", ok: true },
];
