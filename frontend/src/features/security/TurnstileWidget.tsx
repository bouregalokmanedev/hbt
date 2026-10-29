import { useEffect, useId, useRef, useState } from "react";

import { loadBotProtectionConfig } from "./botProtection";

interface TurnstileApi {
    render: (
        container: HTMLElement,
        options: {
            sitekey: string;
            theme?: "auto" | "light" | "dark";
            callback: (token: string) => void;
            "expired-callback"?: () => void;
            "error-callback"?: () => void;
        },
    ) => string;
    remove: (widgetId: string) => void;
}

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

const SCRIPT_ID = "hbt-turnstile-script";
const SCRIPT_URL =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileScript(): Promise<void> {
    if (window.turnstile) {
        return Promise.resolve();
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (existing) {
        return new Promise((resolve, reject) => {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error("Turnstile failed to load")), {
                once: true,
            });
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Turnstile failed to load"));
        document.head.appendChild(script);
    });
}

interface TurnstileWidgetProps {
    onToken: (token: string | null) => void;
}

/**
 * Cloudflare Turnstile widget. Renders nothing until the backend reports
 * that bot protection is enabled, so local development and the default
 * deployment need no Cloudflare account.
 */
export function TurnstileWidget({ onToken }: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [siteKey, setSiteKey] = useState<string | null>(null);
    const fallbackId = useId();

    useEffect(() => {
        let cancelled = false;

        loadBotProtectionConfig().then((config) => {
            if (!cancelled && config.enabled && config.siteKey) {
                setSiteKey(config.siteKey);
            }
        });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!siteKey) return;

        let disposed = false;

        loadTurnstileScript()
            .then(() => {
                if (disposed || !containerRef.current || !window.turnstile) {
                    return;
                }

                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    theme: "auto",
                    callback: (token) => onToken(token),
                    "expired-callback": () => onToken(null),
                    "error-callback": () => onToken(null),
                });
            })
            .catch(() => onToken(null));

        return () => {
            disposed = true;
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [siteKey, onToken]);

    if (!siteKey) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            id={`turnstile-${fallbackId}`}
            className="flex min-h-[65px] justify-center"
            aria-label="Human verification"
        />
    );
}
