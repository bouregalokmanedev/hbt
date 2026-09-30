import { beforeEach, describe, expect, it } from "vitest";

import {
    COOKIE_CONSENT_KEY,
    clearConsent,
    hasAnalyticsConsent,
    hasConsent,
    readConsent,
    writeConsent,
} from "./consent";

beforeEach(() => {
    localStorage.clear();
});

describe("cookie consent storage", () => {
    it("returns null while no choice has been made", () => {
        expect(readConsent()).toBeNull();
        expect(hasConsent()).toBe(false);
        expect(hasAnalyticsConsent()).toBe(false);
    });

    it("round-trips the stored decision", () => {
        writeConsent({ preferences: true, analytics: false, marketing: true });

        expect(hasConsent()).toBe(true);
        expect(readConsent()).toEqual({
            necessary: true,
            preferences: true,
            analytics: false,
            marketing: true,
            updatedAt: expect.any(String),
        });
        expect(hasAnalyticsConsent()).toBe(false);
        expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toContain(
            '"analytics":false',
        );
    });

    it("keeps analytics off until explicitly accepted", () => {
        writeConsent({ preferences: true, analytics: true, marketing: false });

        expect(hasAnalyticsConsent()).toBe(true);
    });

    it("ignores corrupted or partial payloads", () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, "{not json");
        expect(readConsent()).toBeNull();

        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({}));
        expect(readConsent()).toBeNull();
    });

    it("clearConsent removes the stored choice", () => {
        writeConsent({ preferences: false, analytics: true, marketing: false });
        clearConsent();

        expect(readConsent()).toBeNull();
    });
});
