import { useSyncExternalStore } from "react";
import type { ScanFaults } from "../screens/diagnosis/scan";

/* Saved DTC reports for the scanner lab. Reports are written when the
   student taps Save on the report screen and listed by the Report tile
   on the tablet home. Local-only (no backend round-trip). */

export type SavedReport = {
    id: string;
    savedAt: string;
    brand: string;
    brandVersion: string;
    mode: string;
    vehicleName: string;
    year: string | number;
    vin: string;
    systemCount: number;
    faultySystemCount: number;
    codeCount: number;
    faults: ScanFaults;
    ecuNames: Record<string, string>;
};

const KEY = "hbt:scanner-reports";
const MAX = 50;

let cache: SavedReport[] | null = null;
const listeners = new Set<() => void>();

function read(): SavedReport[] {
    if (cache) return cache;
    let next: SavedReport[] = [];
    try {
        const raw = window.localStorage.getItem(KEY);
        if (raw) {
            const parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                next = parsed.filter(
                    (r): r is SavedReport =>
                        Boolean(r) && typeof (r as SavedReport).id === "string",
                );
            }
        }
    } catch {
        // Storage unavailable — session-only.
    }
    cache = next;
    return next;
}

function write(next: SavedReport[]) {
    cache = next;
    try {
        window.localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX)));
    } catch {
        // Ignore storage failures.
    }
    for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function makeId(): string {
    return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Persist a report (newest first, capped). Returns the stored record. */
export function saveReport(
    input: Omit<SavedReport, "id" | "savedAt">,
): SavedReport {
    const record: SavedReport = {
        ...input,
        id: makeId(),
        savedAt: new Date().toISOString(),
    };
    write([record, ...read()].slice(0, MAX));
    return record;
}

export function deleteReport(id: string) {
    write(read().filter((r) => r.id !== id));
}

export function clearReports() {
    write([]);
}

/** Live list of saved reports (newest first). */
export function useSavedReports(): readonly SavedReport[] {
    return useSyncExternalStore(subscribe, read, read);
}
