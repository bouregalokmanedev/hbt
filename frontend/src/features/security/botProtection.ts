import { env } from "@/config/env";

export interface BotProtectionConfig {
    enabled: boolean;
    siteKey: string | null;
    honeypotField: string;
}

/**
 * Must match BOT_HONEYPOT_FIELD on the backend. Kept as a shared constant
 * so the forms and the request payload never drift.
 */
export const BOT_HONEYPOT_FIELD = "website" as const;

const FALLBACK: BotProtectionConfig = {
    enabled: false,
    siteKey: null,
    honeypotField: BOT_HONEYPOT_FIELD,
};

let configPromise: Promise<BotProtectionConfig> | null = null;

/**
 * Public runtime config. The Turnstile secret stays on the server; this
 * endpoint only exposes the site key and the honeypot field name.
 */
export function loadBotProtectionConfig(): Promise<BotProtectionConfig> {
    // Unit tests mock the API layer and must not hit a real network.
    if (import.meta.env.MODE === "test") {
        return Promise.resolve(FALLBACK);
    }

    configPromise ??= fetch(`${env.apiUrl}/v1/config/bot-protection`, {
        headers: { Accept: "application/json" },
    })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`Bot protection config failed: ${response.status}`);
            }

            const payload = await response.json();
            const data = payload?.data ?? {};

            return {
                enabled: Boolean(data.enabled),
                siteKey:
                    typeof data.site_key === "string" && data.site_key.length > 0
                        ? data.site_key
                        : null,
                honeypotField:
                    typeof data.honeypot_field === "string" &&
                    data.honeypot_field.length > 0
                        ? data.honeypot_field
                        : BOT_HONEYPOT_FIELD,
            };
        })
        .catch(() => FALLBACK);

    return configPromise;
}
