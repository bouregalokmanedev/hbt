import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { trackEvent, visitorId } from "./tracking";

const VISITOR = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

describe("trackEvent", () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
        fetchMock.mockReset().mockResolvedValue({ ok: true });
        vi.stubGlobal("fetch", fetchMock);
        localStorage.clear();
        localStorage.setItem("hbt-visitor-id", VISITOR);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        localStorage.clear();
    });

    it("posts to the versioned endpoint with the browser visitor id", async () => {
        await trackEvent("page_view", { page: "/" });

        expect(fetchMock).toHaveBeenCalledTimes(1);

        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        // VITE_API_URL has no /v1 suffix — a missing segment 404s silently
        // and the analytics table stays empty with no visible error.
        expect(String(url)).toContain("/v1/analytics/events");

        const body = JSON.parse(String(init.body)) as Record<string, unknown>;
        expect(body.event).toBe("page_view");
        expect(body.page).toBe("/");
        expect(body.visitor_id).toBe(VISITOR);
    });

    it("reuses the stored visitor id across calls", async () => {
        expect(visitorId()).toBe(VISITOR);
        await trackEvent("cta_click", { page: "/pricing" });

        const body = JSON.parse(
            String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body),
        ) as { visitor_id: string };
        expect(body.visitor_id).toBe(VISITOR);
    });
});
