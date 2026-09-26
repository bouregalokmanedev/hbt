"use client";

import { useEffect } from "react";

/** Registers the offline service worker in production only (10 §14.1). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    // Service workers are blocked inside cross-origin/sandboxed iframes; skip
    // there so we never log a registration error. Top-level deploys still cache.
    try {
      if (window.top !== window.self) return;
    } catch {
      return; // cross-origin access threw → we are framed
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
