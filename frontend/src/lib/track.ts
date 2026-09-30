import { env } from "@/config/env";
import { hasAnalyticsConsent } from "@/features/cookies/consent";
import { authStorage } from "@/lib/storage/auth-storage";

/**
 * Conversion funnel telemetry. Deliberately fire-and-forget: analytics must
 * never block navigation or surface an error to the learner.
 */
export type FunnelEvent =
  | "pricing_viewed"
  | "plan_cta_clicked"
  | "simulator_limit_reached"
  | "referral_invite_shared";

export type FunnelProperties = Record<
  string,
  string | number | boolean | undefined
>;

const MAX_PROPERTIES = 12;

let sessionHash: string | undefined;

function getSessionHash(): string {
  if (sessionHash) return sessionHash;

  try {
    sessionHash =
      typeof window !== "undefined" && window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  } catch {
    sessionHash = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  return sessionHash;
}

function toProperties(
  properties?: FunnelProperties,
): Record<string, string> | undefined {
  if (!properties) return undefined;

  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined || value === null) continue;
    if (Object.keys(sanitized).length >= MAX_PROPERTIES) break;
    sanitized[key] = String(value).slice(0, 255);
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export function track(
  event: FunnelEvent,
  properties?: FunnelProperties,
): void {
  // No analytics until the visitor opts in from the cookie banner.
  if (!hasAnalyticsConsent()) return;

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const token = authStorage.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const body = JSON.stringify({
      event,
      page: typeof window !== "undefined" ? window.location.pathname : null,
      session_hash: getSessionHash(),
      properties: toProperties(properties),
    });

    void fetch(`${env.apiUrl}/v1/analytics/events`, {
      method: "POST",
      headers,
      body,
      // Survives the page unload that follows a CTA click.
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Telemetry failures are invisible on purpose.
  }
}

const firedOnce = new Set<string>();

/** Same as track(), but only the first call per event+properties wins. */
export function trackOnce(
  event: FunnelEvent,
  properties?: FunnelProperties,
): void {
  const key = `${event}:${JSON.stringify(properties ?? {})}`;

  if (firedOnce.has(key)) return;

  firedOnce.add(key);
  track(event, properties);
}
