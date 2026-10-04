import { useAuthStore } from "@/features/auth/store/auth.store";

/**
 * Vehicle selection / pack download storage is per student: every key is
 * scoped as `prefix:user:<id>` so one account's choice never leaks to
 * another account on the same browser.
 */
export const VEHICLE_STORAGE_PREFIXES = [
    "hbt:scanner-vehicle",
    "hbt:scanner-downloaded",
    "hbt:meter-vehicle",
    "hbt:meter-downloaded",
    "hbt:location-vehicle",
    "hbt:location-downloaded",
    "hbt:schematic-vehicle",
    "hbt:schematic-downloaded",
    "hbt:scope-vehicle",
    "hbt:scope-downloaded",
] as const;

/** Fired on every vehicle write/remove so page chrome (practice-car chip) re-reads. */
export const VEHICLE_CHANGED_EVENT = "hbt:vehicle-changed";

function notifyChanged(prefix: string): void {
    try {
        window.dispatchEvent(new CustomEvent(VEHICLE_CHANGED_EVENT, { detail: { prefix } }));
    } catch {
        // Storage/event unavailable — chrome simply keeps its last read.
    }
}

function scopedKey(prefix: string): string {
    const id = useAuthStore.getState().user?.id;
    const scoped = `${prefix}:user:${id ?? "anon"}`;
    try {
        // One-time migration: the old shared key belonged to whoever reads
        // it first, so fold it into the current student's slot.
        if (!window.localStorage.getItem(scoped)) {
            const legacy = window.localStorage.getItem(prefix);
            if (legacy !== null) {
                window.localStorage.setItem(scoped, legacy);
                window.localStorage.removeItem(prefix);
            }
        }
    } catch {
        // Storage unavailable — callers fall back to in-memory values.
    }
    return scoped;
}

export function readVehicleItem(prefix: string): string | null {
    try {
        return window.localStorage.getItem(scopedKey(prefix));
    } catch {
        return null;
    }
}

export function writeVehicleItem(prefix: string, value: string): void {
    try {
        window.localStorage.setItem(scopedKey(prefix), value);
    } catch {
        // Storage unavailable — keep the choice in memory only.
    }
    notifyChanged(prefix);
}

export function removeVehicleItem(prefix: string): void {
    try {
        window.localStorage.removeItem(scopedKey(prefix));
    } catch {
        // Ignore storage failures.
    }
    notifyChanged(prefix);
}
