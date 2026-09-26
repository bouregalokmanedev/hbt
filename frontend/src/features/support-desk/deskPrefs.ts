export interface DeskPrefs {
    defaultStatus: string;
    defaultAssigned: string;
}

const STORAGE_KEY = "hbt:support-desk-prefs";

export const DEFAULT_DESK_PREFS: DeskPrefs = {
    defaultStatus: "",
    defaultAssigned: "",
};

export function loadDeskPrefs(): DeskPrefs {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_DESK_PREFS };
        const parsed = JSON.parse(raw) as Partial<DeskPrefs>;
        return {
            defaultStatus: typeof parsed.defaultStatus === "string" ? parsed.defaultStatus : "",
            defaultAssigned:
                parsed.defaultAssigned === "me" || parsed.defaultAssigned === "unassigned"
                    ? parsed.defaultAssigned
                    : "",
        };
    } catch {
        return { ...DEFAULT_DESK_PREFS };
    }
}

export function saveDeskPrefs(patch: Partial<DeskPrefs>): DeskPrefs {
    const next: DeskPrefs = { ...loadDeskPrefs(), ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
}
