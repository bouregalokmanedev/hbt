import { useSyncExternalStore } from "react";

/* Getting-started progress for the scanner lab. Steps are marked by the
   screens themselves as the student performs each action; the checklist
   widget and tour subscribe to this store. Persisted per browser. */

export type ScannerStep =
    | "plugged"
    | "diagnosis"
    | "scan"
    | "dtcRead"
    | "dtcCleared"
    | "liveData"
    | "specialFunction";

export const SCANNER_STEPS: readonly ScannerStep[] = [
    "plugged",
    "diagnosis",
    "scan",
    "dtcRead",
    "dtcCleared",
    "liveData",
    "specialFunction",
] as const;

const KEY = "hbt:scanner-start-steps";
const TOUR_KEY = "hbt:scanner-tour-done";

let cache: Set<ScannerStep> | null = null;
const listeners = new Set<() => void>();

function read(): Set<ScannerStep> {
    if (cache) return cache;
    let next = new Set<ScannerStep>();
    try {
        const raw = window.localStorage.getItem(KEY);
        if (raw) {
            for (const id of JSON.parse(raw) as string[]) {
                if ((SCANNER_STEPS as readonly string[]).includes(id)) {
                    next.add(id as ScannerStep);
                }
            }
        }
    } catch {
        // Storage unavailable — session-only progress.
    }
    cache = next;
    return next;
}

function write(next: Set<ScannerStep>) {
    cache = next;
    try {
        window.localStorage.setItem(KEY, JSON.stringify([...next]));
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

/** Mark one getting-started step as complete (idempotent). */
export function markScannerStep(id: ScannerStep) {
    const current = read();
    if (current.has(id)) return;
    const next = new Set(current);
    next.add(id);
    write(next);
}

/** Clear all progress (used by tests and the checklist's restart). */
export function resetScannerSteps() {
    cache = null;
    try {
        window.localStorage.removeItem(KEY);
    } catch {
        // Ignore.
    }
    for (const listener of listeners) listener();
}

/** Live set of completed step ids. */
export function useScannerSteps(): ReadonlySet<ScannerStep> {
    return useSyncExternalStore(subscribe, read, read);
}

export function isTourDone(): boolean {
    try {
        return window.localStorage.getItem(TOUR_KEY) === "1";
    } catch {
        return false;
    }
}

export function markTourDone() {
    try {
        window.localStorage.setItem(TOUR_KEY, "1");
    } catch {
        // Ignore.
    }
}

export function resetTourDone() {
    try {
        window.localStorage.removeItem(TOUR_KEY);
    } catch {
        // Ignore.
    }
}
