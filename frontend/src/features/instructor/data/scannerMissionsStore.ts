import { useSyncExternalStore } from "react";

/* Scanner-lab missions authored by the instructor. A mission describes a
   concrete bench task (target ECU + expected DTC outcome) that students
   complete during a diagnosis session. Local-only sandbox data — same
   pattern as specialFunctionsStore. */

export type MissionObjectiveKind =
    | "scan"
    | "readDtc"
    | "clearDtc"
    | "liveData"
    | "specialFunction";

export interface MissionObjective {
    id: string;
    kind: MissionObjectiveKind;
    /** Optional target ECU name (matched against authored systems). */
    ecuName?: string;
    /** Optional expected DTC code the student must find. */
    dtcCode?: string;
    label: string;
}

export interface ScannerMission {
    id: string;
    title: string;
    description: string;
    vehicleVariantId: string;
    vehicleLabel: string;
    objectives: MissionObjective[];
    published: boolean;
    createdAt: string;
}

const STORAGE_KEY = "hbt-scanner-missions";

let cache: ScannerMission[] | null = null;
const listeners = new Set<() => void>();

function load(): ScannerMission[] {
    if (cache) return cache;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        cache = Array.isArray(parsed) ? (parsed as ScannerMission[]) : [];
    } catch {
        cache = [];
    }
    return cache;
}

function persist(next: ScannerMission[]) {
    cache = next;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // Quota exceeded — keep the in-memory copy so the session still works.
    }
    for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function makeId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `ms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const scannerMissionsStore = {
    list: (): ScannerMission[] => load(),
    /** Missions visible to students (published only). */
    published: (): ScannerMission[] => load().filter((m) => m.published),
    publishedFor: (variantId: string): ScannerMission[] =>
        load().filter((m) => m.published && m.vehicleVariantId === variantId),
    add: (input: {
        title: string;
        description: string;
        vehicleVariantId: string;
        vehicleLabel: string;
        objectives: MissionObjective[];
    }): ScannerMission => {
        const mission: ScannerMission = {
            id: makeId(),
            createdAt: new Date().toISOString(),
            published: false,
            ...input,
        };
        persist([mission, ...load()]);
        return mission;
    },
    update: (id: string, patch: Partial<Omit<ScannerMission, "id" | "createdAt">>): void => {
        persist(
            load().map((mission) =>
                mission.id === id ? { ...mission, ...patch } : mission,
            ),
        );
    },
    remove: (id: string): void => {
        persist(load().filter((mission) => mission.id !== id));
    },
    /** Test helper: wipe the store between tests. */
    reset: (): void => {
        cache = null;
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // ignore
        }
        for (const listener of listeners) listener();
    },
};

export function useScannerMissions(): readonly ScannerMission[] {
    return useSyncExternalStore(subscribe, load, load);
}
