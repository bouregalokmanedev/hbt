import { describe, expect, it } from "vitest";

import {
    HELP_ARTICLES,
    HELP_CATEGORIES,
    localized,
    searchArticles,
} from "./data/articles";

describe("help knowledge base", () => {
    it("keeps every article inside a known category", () => {
        const ids = new Set(HELP_CATEGORIES.map((entry) => entry.id));

        for (const article of HELP_ARTICLES) {
            expect(ids.has(article.category), `${article.slug} → ${article.category}`).toBe(true);
        }
    });

    it("has a unique slug and a non-empty English and Arabic copy", () => {
        const slugs = new Set<string>();

        for (const article of HELP_ARTICLES) {
            expect(slugs.has(article.slug)).toBe(false);
            slugs.add(article.slug);

            expect(localized(article.title, "en").length).toBeGreaterThan(0);
            expect(localized(article.title, "ar").length).toBeGreaterThan(0);
            expect(localized(article.summary, "ar").length).toBeGreaterThan(0);
            expect(article.body.length).toBeGreaterThan(0);

            for (const paragraph of article.body) {
                expect(paragraph.en.length).toBeGreaterThan(0);
                expect(paragraph.ar.length).toBeGreaterThan(0);
            }
        }
    });

    it("returns nothing for an empty query", () => {
        expect(searchArticles("", "en")).toEqual([]);
        expect(searchArticles("   ", "en")).toEqual([]);
    });

    it("matches an English keyword and ranks title hits first", () => {
        const results = searchArticles("verification email", "en");
        const slugs = results.map((article) => article.slug);

        expect(slugs.length).toBeGreaterThan(0);
        expect(slugs[0]).toBe("verify-email");
    });

    it("finds the Arabic article when searching in Arabic", () => {
        const results = searchArticles("شهادة", "ar");
        const slugs = results.map((article) => article.slug);

        expect(slugs).toContain("certificates");
    });
});
