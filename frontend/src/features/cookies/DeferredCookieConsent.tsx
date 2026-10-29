import { lazy, Suspense, useEffect, useState } from "react";

/**
 * The consent banner is not part of the first paint. Loading it after the
 * browser is idle keeps framer-motion and the banner UI out of the initial
 * bundle, while still showing it within two seconds on busy devices.
 */
const CookieConsentBanner = lazy(() =>
    import("./CookieConsentBanner").then((module) => ({
        default: module.CookieConsentBanner,
    })),
);

export function DeferredCookieConsent() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (typeof window.requestIdleCallback === "function") {
            const handle = window.requestIdleCallback(() => setReady(true), {
                timeout: 2000,
            });

            return () => window.cancelIdleCallback(handle);
        }

        const timer = window.setTimeout(() => setReady(true), 1500);

        return () => window.clearTimeout(timer);
    }, []);

    if (!ready) return null;

    return (
        <Suspense fallback={null}>
            <CookieConsentBanner />
        </Suspense>
    );
}
