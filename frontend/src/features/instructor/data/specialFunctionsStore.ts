import { useSyncExternalStore } from "react";

export interface SpecialFunctionInstance {
    id: string;
    functionId: string;
    vehicleVariantId: string;
    vehicleLabel: string;
    title: string;
    description: string;
    /** Data URL of the uploaded image (localStorage has no file storage). */
    image: string | null;
    createdAt: string;
}

const STORAGE_KEY = "hbt-scanner-special-functions";

let cache: SpecialFunctionInstance[] | null = null;
const listeners = new Set<() => void>();

function load(): SpecialFunctionInstance[] {
    if (cache) return cache;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        cache = Array.isArray(parsed) ? (parsed as SpecialFunctionInstance[]) : [];
    } catch {
        cache = [];
    }
    return cache;
}

function persist(next: SpecialFunctionInstance[]) {
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
    return `sf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const specialFunctionsStore = {
    list: (): SpecialFunctionInstance[] => load(),
    countFor: (functionId: string): number =>
        load().filter((instance) => instance.functionId === functionId).length,
    add: (input: {
        functionId: string;
        vehicleVariantId: string;
        vehicleLabel: string;
        title: string;
        description: string;
        image: string | null;
    }): SpecialFunctionInstance => {
        const instance: SpecialFunctionInstance = {
            id: makeId(),
            createdAt: new Date().toISOString(),
            ...input,
        };
        persist([instance, ...load()]);
        return instance;
    },
    remove: (id: string): void => {
        persist(load().filter((instance) => instance.id !== id));
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

export function useSpecialFunctionInstances(): SpecialFunctionInstance[] {
    return useSyncExternalStore(subscribe, specialFunctionsStore.list, specialFunctionsStore.list);
}
