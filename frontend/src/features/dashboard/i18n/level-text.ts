type TFunction = (key: string, options?: Record<string, unknown>) => string;

const LEVEL_KEYS: Record<string, string> = {
    Foundation: "foundation",
    Explorer: "explorer",
    Apprentice: "apprentice",
    Technician: "technician",
    Specialist: "specialist",
    Expert: "expert",
    Master: "master",
    "Maximum level": "max",
};

/**
 * Level titles come from the backend in English.
 * Resolve them through the locale dictionary by stable title,
 * falling back to the server string for unknown titles.
 */
export function levelText(title: string, t: TFunction): string {
    const key = LEVEL_KEYS[title];

    if (!key) return title;

    return t(`dashboard.levels.${key}`);
}
