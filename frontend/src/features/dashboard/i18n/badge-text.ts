type TFunction = (key: string, options?: Record<string, unknown>) => string;

interface BadgeLike {
    id: string;
    title: string;
    description?: string | null;
}

/**
 * Badge titles and descriptions come from the backend in English.
 * Resolve them through the locale dictionary by stable badge id,
 * falling back to the server strings for unknown ids.
 */
export function badgeText(
    badge: BadgeLike,
    t: TFunction,
): { title: string; description?: string | null } {
    return {
        title: t(`badges.${badge.id}.title`, { defaultValue: badge.title }),
        description:
            badge.description == null
                ? badge.description
                : t(`badges.${badge.id}.description`, {
                    defaultValue: badge.description,
                }),
    };
}
