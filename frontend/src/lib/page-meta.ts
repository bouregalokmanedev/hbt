import { useEffect } from "react";

import { env } from "@/config/env";

/**
 * Client-side document metadata for the public SPA routes.
 *
 * The shell in `index.html` carries generic defaults so a crawler that does
 * not execute JavaScript still sees something sensible. Pages call this hook
 * to refine the title, description, canonical URL, share card, and robots
 * directives after they render. For social scrapers that never run
 * JavaScript, per-course share cards still require prerendering at the edge
 * (see `docs/production-readiness.md`).
 */

const SITE_NAME = env.appName;
const DEFAULT_IMAGE = "/hbt-logo-full.png";
const DEFAULT_DESCRIPTION =
    "HBTronics — HVAC training with simulator labs, assessments and shareable verified certificates.";

export interface PageMetaOptions {
    /** Page title. The site name is appended unless it is already present. */
    title: string;
    description?: string;
    image?: string | null;
    imageAlt?: string;
    /**
     * Absolute path used for the canonical URL. Defaults to the current
     * pathname. Query strings are discarded.
     */
    canonicalPath?: string | null;
    type?: "website" | "article";
    noIndex?: boolean;
    noFollow?: boolean;
}

function siteTitle(title: string): string {
    const value = title.trim();
    if (!value) return SITE_NAME;
    return value.includes(SITE_NAME) ? value : `${value} | ${SITE_NAME}`;
}

/**
 * Collapse whitespace and keep meta descriptions within the ~160 character
 * window search engines typically display.
 */
export function metaDescription(value: string, maxLength = 160): string {
    const clean = value
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (clean.length <= maxLength) return clean;

    const slice = clean.slice(0, maxLength - 1);
    const lastSpace = slice.lastIndexOf(" ");
    return `${(lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`;
}

export function absoluteAssetUrl(value?: string | null, fallback = DEFAULT_IMAGE): string {
    const raw = value?.trim() || fallback;

    try {
        return new URL(raw, window.location.origin).href;
    } catch {
        return raw;
    }
}

function canonicalUrl(path?: string | null): string {
    const raw = (path ?? window.location.pathname).split(/[?#]/, 1)[0] || "/";
    const withSlash = raw.startsWith("/") ? raw : `/${raw}`;

    try {
        return new URL(withSlash, window.location.origin).href;
    } catch {
        return withSlash;
    }
}

function setMeta(attribute: "name" | "property", key: string, content: string | null): void {
    if (content === null) return;

    const selector = `meta[${attribute}="${key}"]`;
    let element = document.head.querySelector<HTMLMetaElement>(selector);

    if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
    }

    element.setAttribute("content", content);
}

function setCanonical(href: string): void {
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
    }

    link.setAttribute("href", href);
}

type ResolvedPageMeta = {
    title: string;
    description: string;
    image: string | null;
    imageAlt: string;
    canonicalPath: string | null;
    type: "website" | "article";
    noIndex: boolean;
    noFollow: boolean;
};

function applyPageMeta(options: ResolvedPageMeta): void {
    if (typeof document === "undefined") return;

    const title = siteTitle(options.title);
    const description = metaDescription(options.description);
    const image = absoluteAssetUrl(options.image);
    const imageAlt = options.imageAlt.trim() || `${SITE_NAME} logo`;
    const canonical = canonicalUrl(options.canonicalPath);
    const robots = `${options.noIndex ? "noindex" : "index"}, ${options.noFollow ? "nofollow" : "follow"}`;

    document.title = title;

    setMeta("name", "description", description);
    setMeta("name", "robots", robots);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);
    setMeta("name", "twitter:image:alt", imageAlt);

    setMeta("property", "og:type", options.type);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", image);
    setMeta("property", "og:image:alt", imageAlt);
    setMeta("property", "og:url", canonical);

    setCanonical(canonical);
}

function resetPageMeta(): void {
    applyPageMeta({
        title: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        image: DEFAULT_IMAGE,
        imageAlt: `${SITE_NAME} logo`,
        canonicalPath: "/",
        type: "website",
        noIndex: false,
        noFollow: false,
    });
}

export function usePageMeta(options: PageMetaOptions): void {
    const {
        title,
        description = DEFAULT_DESCRIPTION,
        image = null,
        imageAlt = `${SITE_NAME} logo`,
        canonicalPath = null,
        type = "website",
        noIndex = false,
        noFollow = false,
    } = options;

    useEffect(() => {
        applyPageMeta({
            title,
            description,
            image,
            imageAlt,
            canonicalPath,
            type,
            noIndex,
            noFollow,
        });

        return resetPageMeta;
    }, [
        title,
        description,
        image,
        imageAlt,
        canonicalPath,
        type,
        noIndex,
        noFollow,
    ]);
}
