import { useAuthStore } from "@/features/auth/store/auth.store";

/**
 * Persisted "clear codes" state for the scanner bench.
 *
 * Clearing DTCs used to live in component state, so a refresh or a tab switch
 * brought every code back. The cleared set is now stored per student AND per
 * vehicle (`hbt:scanner-cleared:user:<id>:<vehicle>`) so one account's choice
 * never leaks to another, and each practice car keeps its own history.
 *
 * A new full scan is the escape hatch: scan start calls `resetClearedCodes`
 * so whatever is still faulty is re-detected (mirrors a real scanner).
 */
const PREFIX = "hbt:scanner-cleared";

/** Fired on every write/reset so mounted views (DtcPanel) re-read storage. */
export const CLEARED_DTC_EVENT = "hbt:scanner-cleared-changed";

function scopedKey(vehicleKey: string): string {
    const id = useAuthStore.getState().user?.id;
    return `${PREFIX}:user:${id ?? "anon"}:${vehicleKey}`;
}

function notify(): void {
    try {
        window.dispatchEvent(new Event(CLEARED_DTC_EVENT));
    } catch {
        // Storage/event unavailable — mounted views keep their last read.
    }
}

/** Codes already cleared for this student + vehicle (empty when none). */
export function readClearedCodes(vehicleKey: string): string[] {
    try {
        const raw = window.localStorage.getItem(scopedKey(vehicleKey));
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === "string") : [];
    } catch {
        return [];
    }
}

/** Remember every passed code as cleared and notify listeners. */
export function writeClearedCodes(vehicleKey: string, codes: string[]): void {
    try {
        window.localStorage.setItem(scopedKey(vehicleKey), JSON.stringify(codes));
    } catch {
        // Storage unavailable — clearing still applies to the mounted view.
    }
    notify();
}

/** Drop the remembered set (full scan re-detects what is still faulty). */
export function resetClearedCodes(vehicleKey: string): void {
    try {
        window.localStorage.removeItem(scopedKey(vehicleKey));
    } catch {
        // Ignore storage failures.
    }
    notify();
}
