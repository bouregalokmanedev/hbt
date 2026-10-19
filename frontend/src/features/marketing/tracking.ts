import { env } from "@/config/env";
import { authStorage } from "@/lib/storage/auth-storage";

const VISITOR_KEY = "hbt-visitor-id";
const CONSENT_KEY = "hbt-cookie-consent";

function uuid(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
}

/** Stable anonymous browser id. Created on first visit, sent with every event. */
export function visitorId(): string {
    try {
        let id = localStorage.getItem(VISITOR_KEY);
        if (!id) {
            id = uuid();
            localStorage.setItem(VISITOR_KEY, id);
        }
        return id;
    } catch {
        return uuid();
    }
}

function consented(): boolean {
    try {
        // "necessary" (default before choosing) still allows first-party
        // product analytics; "declined" disables behavioural tracking.
        return localStorage.getItem(CONSENT_KEY) !== "declined";
    } catch {
        return true;
    }
}

export async function trackEvent(
    event: string,
    options: { page?: string; properties?: Record<string, string>; referrer?: string } = {},
): Promise<void> {
    if (!consented()) return;
    try {
        const token = authStorage.getToken();
        await fetch(`${env.apiUrl}/v1/analytics/events`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
                event,
                page: options.page ?? window.location.pathname,
                properties: options.properties,
                referrer: options.referrer ?? document.referrer ?? undefined,
                visitor_id: visitorId(),
            }),
        });
    } catch {
        // Analytics must never break the product.
    }
}

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function VisitorTracker() {
    const location = useLocation();
    const seconds = useRef(0);
    const page = useRef("");

    useEffect(() => {
        const path = location.pathname;
        if (page.current === path) return;
        if (page.current && seconds.current >= 10) {
            void trackEvent("time_on_page", {
                page: page.current,
                properties: { seconds: String(seconds.current) },
            });
        }
        page.current = path;
        seconds.current = 0;
        void trackEvent("page_view", { referrer: document.referrer || undefined });
    }, [location.pathname]);

    useEffect(() => {
        const id = window.setInterval(() => {
            if (document.visibilityState === "visible") seconds.current += 5;
        }, 5000);
        return () => window.clearInterval(id);
    }, []);

    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            const target = (event.target as HTMLElement).closest?.("[data-track]");
            if (!target) return;
            const label = target.getAttribute("data-track") ?? "cta";
            void trackEvent("cta_click", { properties: { label } });
        };
        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
    }, []);

    return null;
}
