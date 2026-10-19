import type { EcuDtc } from "@/features/instructor/data/vehicleSystems";
import { SYSTEM_KEYS, type EcuNode, type SystemKey } from "./systemsData";

/* Automatic-scan logic: the scan walks every control unit of the vehicle.
   Whether an ECU reports faults is randomized each scan — only ECUs with
   instructor-authored DTCs can be faulty, and even those are not obligated
   to show a fault every time. */

export type ScanFaults = Record<string, EcuDtc[]>;

/** Every ECU of the vehicle, drivetrain → chassis → body. */
export function flatScanEcus(
    systems: Record<SystemKey, EcuNode[]>,
): EcuNode[] {
    return SYSTEM_KEYS.flatMap((key) => systems[key] ?? []);
}

/** Roll which ECUs report their authored DTCs on this scan. */
export function rollScanFaults(
    ecus: EcuNode[],
    random: () => number = Math.random,
): ScanFaults {
    const faults: ScanFaults = {};
    for (const ecu of ecus) {
        if (ecu.dtcs.length > 0 && random() < 0.5) {
            faults[ecu.id] = ecu.dtcs;
        }
    }
    return faults;
}
