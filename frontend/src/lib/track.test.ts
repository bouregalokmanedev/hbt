import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_CONSENT_KEY } from "@/features/cookies/consent";

import { track, trackOnce } from "./track";

function grantAnalyticsConsent(analytics = true) {
  localStorage.setItem(
    COOKIE_CONSENT_KEY,
    JSON.stringify({
      necessary: true,
      preferences: true,
      analytics,
      marketing: false,
      updatedAt: new Date().toISOString(),
    }),
  );
}

describe("track", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    localStorage.clear();
    grantAnalyticsConsent();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("posts the funnel event with page, properties and a session hash", () => {
    track("pricing_viewed", { source: "pricing_page" });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toContain("/v1/analytics/events");
    expect(init.method).toBe("POST");

    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.event).toBe("pricing_viewed");
    expect(body.page).toBe(window.location.pathname);
    expect(body.properties).toEqual({ source: "pricing_page" });
    expect(typeof body.session_hash).toBe("string");
    expect(String(body.session_hash).length).toBeGreaterThan(0);
  });

  it("stringifies numeric properties and drops empty ones", () => {
    track("plan_cta_clicked", { plan: "professional", skipped: undefined });

    const body = JSON.parse(
      String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body),
    ) as { properties: Record<string, string> };

    expect(body.properties).toEqual({ plan: "professional" });
  });

  it("sends trackOnce only for the first matching call", () => {
    trackOnce("simulator_limit_reached", { source: "simulator_hub" });
    trackOnce("simulator_limit_reached", { source: "simulator_hub" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stays silent when the request fails", () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    expect(() => track("pricing_viewed")).not.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends nothing before a consent choice is stored", () => {
    localStorage.clear();

    track("referral_invite_shared");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends nothing when analytics are rejected", () => {
    grantAnalyticsConsent(false);

    track("plan_cta_clicked");

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
