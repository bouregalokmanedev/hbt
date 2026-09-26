import { useEffect, useState } from "react";

export type ThemeChoice = "system" | "light" | "dark";

const STORAGE_KEY = "hbt:theme";
export const THEME_EVENT = "hbt:theme-change";

function systemDark(): boolean {
    return (
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    );
}

export function getStoredTheme(): ThemeChoice {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw === "light" || raw === "dark" || raw === "system") return raw;
    } catch {
        // Storage unavailable — fall through to system.
    }
    return "system";
}

export function resolveDark(choice: ThemeChoice): boolean {
    if (choice === "dark") return true;
    if (choice === "light") return false;
    return systemDark();
}

/** Apply a choice to <html> immediately (no React needed). */
export function applyTheme(choice: ThemeChoice): void {
    document.documentElement.classList.toggle("dark", resolveDark(choice));
}

/** Persist + apply + notify every listener in this tab. */
export function setTheme(choice: ThemeChoice): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
        // Ignore persistence failures; still apply in-memory.
    }
    applyTheme(choice);
    window.dispatchEvent(
        new CustomEvent<ThemeChoice>(THEME_EVENT, { detail: choice }),
    );
}

/** Earliest possible application — call once at app startup to avoid a flash. */
export function initTheme(): void {
    applyTheme(getStoredTheme());
}

/**
 * React binding: applies the given choice (falls back to storage),
 * re-applies when the OS theme flips (system mode) or another part
 * of the app broadcasts a change.
 */
export function useTheme(choice?: ThemeChoice): ThemeChoice {
    const [current, setCurrent] = useState<ThemeChoice>(
        () => choice ?? getStoredTheme(),
    );

    useEffect(() => {
        if (choice) setCurrent(choice);
    }, [choice]);

    useEffect(() => {
        applyTheme(current);

        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const onMedia = () => {
            if (current === "system") applyTheme("system");
        };
        const onEvent = (event: Event) =>
            setCurrent((event as CustomEvent<ThemeChoice>).detail ?? getStoredTheme());
        const onStorage = () => setCurrent(getStoredTheme());

        media.addEventListener("change", onMedia);
        window.addEventListener(THEME_EVENT, onEvent);
        window.addEventListener("storage", onStorage);
        return () => {
            media.removeEventListener("change", onMedia);
            window.removeEventListener(THEME_EVENT, onEvent);
            window.removeEventListener("storage", onStorage);
        };
    }, [current]);

    return current;
}
