import DOMPurify from "dompurify";

/**
 * Sanitize rich HTML (lesson bodies) before rendering with
 * dangerouslySetInnerHTML. Strips scripts, event handlers, and
 * javascript:/data: URLs while keeping normal formatting tags.
 */
export function sanitizeHtml(html: string): string {
    if (!html) return "";
    return DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ["style", "form", "input", "button", "meta", "link", "base"],
        FORBID_ATTR: ["style"],
    });
}
