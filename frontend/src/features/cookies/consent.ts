export interface CookieConsent {
    necessary: true;
    preferences: boolean;
    analytics: boolean;
    marketing: boolean;
    updatedAt: string;
}

export const COOKIE_CONSENT_KEY = "hbt-cookie-consent";

/** Fired on `window` whenever the stored decision changes. */
export const COOKIE_CONSENT_CHANGED_EVENT = "hbt:cookie-consent-changed";

/** Dispatch this on `window` to reopen the banner (e.g. from a footer link). */
export const OPEN_COOKIE_CONSENT_EVENT = "hbt:open-cookie-consent";

function safeGet(): string | null {
    try {
        return localStorage.getItem(COOKIE_CONSENT_KEY);
    } catch {
        return null;
    }
}

function safeSet(value: string | null): void {
    try {
        if (value === null) localStorage.removeItem(COOKIE_CONSENT_KEY);
        else localStorage.setItem(COOKIE_CONSENT_KEY, value);
    } catch {
        // Storage unavailable (private mode): the banner will simply reappear.
    }
}

export function readConsent(): CookieConsent | null {
    const raw = safeGet();
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as Partial<CookieConsent>;
        if (typeof parsed !== "object" || parsed === null) return null;
        if (typeof parsed.analytics !== "boolean") return null;

        return {
            necessary: true,
            preferences: parsed.preferences === true,
            analytics: parsed.analytics,
            marketing: parsed.marketing === true,
            updatedAt:
                typeof parsed.updatedAt === "string"
                    ? parsed.updatedAt
                    : new Date().toISOString(),
        };
    } catch {
        return null;
    }
}

export function hasConsent(): boolean {
    return readConsent() !== null;
}

/** Analytics stay off until the visitor explicitly opts in. */
export function hasAnalyticsConsent(): boolean {
    return readConsent()?.analytics === true;
}

export function writeConsent(input: {
    preferences: boolean;
    analytics: boolean;
    marketing: boolean;
}): CookieConsent {
    const consent: CookieConsent = {
        necessary: true,
        preferences: input.preferences,
        analytics: input.analytics,
        marketing: input.marketing,
        updatedAt: new Date().toISOString(),
    };

    safeSet(JSON.stringify(consent));
    window.dispatchEvent(new Event(COOKIE_CONSENT_CHANGED_EVENT));

    return consent;
}

export function clearConsent(): void {
    safeSet(null);
    window.dispatchEvent(new Event(COOKIE_CONSENT_CHANGED_EVENT));
}

export function openCookieConsent(): void {
    window.dispatchEvent(new Event(OPEN_COOKIE_CONSENT_EVENT));
}
