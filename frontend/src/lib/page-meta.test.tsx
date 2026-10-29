import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { env } from "@/config/env";

import { metaDescription, usePageMeta } from "./page-meta";

function meta(attribute: "name" | "property", key: string): string | null {
    return document.head
        .querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
        ?.getAttribute("content") ?? null;
}

function canonical(): string | null {
    return document.head
        .querySelector<HTMLLinkElement>('link[rel="canonical"]')
        ?.getAttribute("href") ?? null;
}

beforeEach(() => {
    document.head
        .querySelectorAll('meta[name], meta[property], link[rel="canonical"]')
        .forEach((element) => element.remove());
    document.title = "";
});

describe("usePageMeta", () => {
    it("sets the document title with the site suffix once", () => {
        const { unmount } = renderHook(() =>
            usePageMeta({ title: "Help center" }),
        );

        expect(document.title).toBe(`Help center | ${env.appName}`);
        unmount();
    });

    it("does not duplicate the site name in a title that already contains it", () => {
        const title = `${env.appName} — Learn. Practice. Diagnose.`;
        const { unmount } = renderHook(() => usePageMeta({ title }));

        expect(document.title).toBe(title);
        unmount();
    });

    it("writes description, share card, robots, and absolute URLs", () => {
        const { unmount } = renderHook(() =>
            usePageMeta({
                title: "CAN bus diagnostics",
                description: "  Learn   CAN bus\nnetworks with practical labs.  ",
                image: "/storage/courses/can-bus.webp",
                imageAlt: "CAN bus diagnostics",
                canonicalPath: "/courses/course-1?ref=email",
                type: "article",
                noIndex: true,
                noFollow: true,
            }),
        );

        expect(meta("name", "description")).toBe(
            "Learn CAN bus networks with practical labs.",
        );
        expect(meta("property", "og:title")).toBe(
            `CAN bus diagnostics | ${env.appName}`,
        );
        expect(meta("property", "og:description")).toBe(
            "Learn CAN bus networks with practical labs.",
        );
        expect(meta("property", "og:image")).toBe(
            `${window.location.origin}/storage/courses/can-bus.webp`,
        );
        expect(meta("property", "og:image:alt")).toBe("CAN bus diagnostics");
        expect(meta("property", "og:type")).toBe("article");
        expect(meta("property", "og:url")).toBe(
            `${window.location.origin}/courses/course-1`,
        );
        expect(meta("name", "twitter:image")).toBe(
            `${window.location.origin}/storage/courses/can-bus.webp`,
        );
        expect(meta("name", "robots")).toBe("noindex, nofollow");
        expect(canonical()).toBe(
            `${window.location.origin}/courses/course-1`,
        );
        unmount();
    });

    it("restores the generic defaults when the page unmounts", () => {
        const { unmount } = renderHook(() =>
            usePageMeta({
                title: "Verify a certificate",
                description: "Confirm a credential.",
                canonicalPath: "/verify-certificate",
                noIndex: true,
            }),
        );

        unmount();

        expect(document.title).toBe(env.appName);
        expect(meta("name", "robots")).toBe("index, follow");
        expect(meta("property", "og:url")).toBe(
            `${window.location.origin}/`,
        );
        expect(canonical()).toBe(`${window.location.origin}/`);
        expect(meta("property", "og:image")).toBe(
            `${window.location.origin}/hbt-logo-full.png`,
        );
    });
});

describe("metaDescription", () => {
    it("keeps short descriptions unchanged", () => {
        expect(metaDescription("Short text")).toBe("Short text");
    });

    it("collapses whitespace and truncates long descriptions at a word boundary", () => {
        const value = `  ${"diagnostics ".repeat(30)}  `;
        const result = metaDescription(value);

        expect(result.length).toBeLessThanOrEqual(160);
        expect(result.endsWith("…")).toBe(true);
        expect(result).not.toContain("\n");
    });
});
