/* Persistent scanner-tablet preferences: measurement units, scan speed and
   motion. Values are read fresh on every use so a change on the Settings
   card applies to the next render or tick without a reload. */

export type TempUnit = "c" | "f";
export type PressUnit = "bar" | "psi";
export type SpeedUnit = "kmh" | "mph";
export type ScanSpeed = "slow" | "normal" | "fast";
export type MotionPref = "full" | "reduced";

export type ScannerUnits = {
    temp: TempUnit;
    press: PressUnit;
    speed: SpeedUnit;
};

const UNITS_KEY = "hbt:scanner-units";
const SPEED_KEY = "hbt:scanner-scan-speed";
const MOTION_KEY = "hbt:scanner-motion";

const DEFAULT_UNITS: ScannerUnits = { temp: "c", press: "bar", speed: "kmh" };

const isOneOf =
    <T extends string>(values: readonly T[]) =>
    (value: unknown): value is T =>
        typeof value === "string" && (values as readonly string[]).includes(value);

const isUnits = (value: unknown): value is ScannerUnits => {
    if (typeof value !== "object" || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
        isOneOf(["c", "f"] as const)(v.temp) &&
        isOneOf(["bar", "psi"] as const)(v.press) &&
        isOneOf(["kmh", "mph"] as const)(v.speed)
    );
};

function readJson<T>(key: string, fallback: T, validate: (value: unknown) => value is T): T {
    try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) return fallback;
        const parsed = JSON.parse(raw) as unknown;
        return validate(parsed) ? (parsed as T) : fallback;
    } catch {
        return fallback;
    }
}

function readString<T extends string>(key: string, fallback: T, valid: (value: unknown) => value is T): T {
    try {
        const raw = window.localStorage.getItem(key);
        return valid(raw) ? raw : fallback;
    } catch {
        return fallback;
    }
}

export function getScannerUnits(): ScannerUnits {
    return { ...DEFAULT_UNITS, ...readJson(UNITS_KEY, DEFAULT_UNITS, isUnits) };
}

export function setScannerUnits(patch: Partial<ScannerUnits>): void {
    const next = { ...getScannerUnits(), ...patch };
    try {
        window.localStorage.setItem(UNITS_KEY, JSON.stringify(next));
    } catch {
        // Ignore storage failures.
    }
}

export function getScanSpeed(): ScanSpeed {
    return readString(SPEED_KEY, "normal", isOneOf(["slow", "normal", "fast"] as const));
}

export function setScanSpeed(speed: ScanSpeed): void {
    try {
        window.localStorage.setItem(SPEED_KEY, speed);
    } catch {
        // Ignore storage failures.
    }
}

/** Cadence of the automatic-scan reveal loop. */
export function scanRevealMs(): number {
    const speed = getScanSpeed();
    if (speed === "slow") return 700;
    if (speed === "fast") return 200;
    return 400;
}

export function getScannerMotion(): MotionPref {
    return readString(MOTION_KEY, "full", isOneOf(["full", "reduced"] as const));
}

export function setScannerMotion(motion: MotionPref): void {
    try {
        window.localStorage.setItem(MOTION_KEY, motion);
    } catch {
        // Ignore storage failures.
    }
}

const PSI_PER_BAR = 14.503774;
const MPH_PER_KMH = 0.6213712;
const KMH_PER_MPH = 1.609344;

/** Authored value → the student's preferred unit (data ships metric). */
function convert(value: number, unit: string, units: ScannerUnits): { value: number; unit: string } {
    switch (unit) {
        case "°C":
            return units.temp === "f"
                ? { value: (value * 9) / 5 + 32, unit: "°F" }
                : { value, unit };
        case "°F":
            return units.temp === "c"
                ? { value: ((value - 32) * 5) / 9, unit: "°C" }
                : { value, unit };
        case "km/h":
            return units.speed === "mph"
                ? { value: value * MPH_PER_KMH, unit: "mph" }
                : { value, unit };
        case "mph":
            return units.speed === "kmh"
                ? { value: value * KMH_PER_MPH, unit: "km/h" }
                : { value, unit };
        case "kPa":
            return units.press === "psi"
                ? { value: value * 0.14503774, unit: "psi" }
                : { value: value / 100, unit: "bar" };
        case "MPa":
            return units.press === "psi"
                ? { value: value * 145.03774, unit: "psi" }
                : { value: value * 10, unit: "bar" };
        case "bar":
            return units.press === "psi"
                ? { value: value * PSI_PER_BAR, unit: "psi" }
                : { value, unit };
        case "psi":
            return units.press === "bar"
                ? { value: value / PSI_PER_BAR, unit: "bar" }
                : { value, unit };
        default:
            return { value, unit };
    }
}

function decimalsOf(raw: string): number {
    const dot = raw.indexOf(".");
    return dot === -1 ? 0 : raw.length - dot - 1;
}

/** Display string for a live-data sample under the current unit prefs. */
export function displayPid(raw: string, unit: string, units: ScannerUnits): { value: string; unit: string } {
    const parsed = Number.parseFloat(raw);
    if (Number.isNaN(parsed) || !unit) return { value: raw, unit };
    const next = convert(parsed, unit, units);
    if (next.unit === unit && next.value === parsed) return { value: raw, unit };
    return { value: next.value.toFixed(Math.max(1, decimalsOf(raw))), unit: next.unit };
}
