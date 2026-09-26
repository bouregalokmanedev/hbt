import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { notificationsApi } from "../api/notifications.api";

const pathToCategory: Record<string, string> = {
  "/dashboard": "dashboard",
  "/my-courses": "my-courses",
  "/catalog": "catalog",
  "/assessments": "assessments",
  "/diagnostics": "diagnostics",
  "/achievements": "achievements",
  "/certificates": "certificates",
  "/simulator": "simulator",
  "/ai-mentor": "ai-mentor",
  "/messages": "messages",
  "/support": "support",
  "/announcements": "announcements",
  "/favourite": "favourite",
  "/subscription": "subscription",
};

export function useSidebarBadges() {
  const [badges, setBadges] = useState<Record<string, number>>({});
  const location = useLocation();

  const load = useCallback(async () => {
    try {
      const data = await notificationsApi.sidebarBadges();
      setBadges(data ?? {});
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 30000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    window.addEventListener("hbt:refresh-badges", load as EventListener);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("hbt:refresh-badges", load as EventListener);
    };
  }, [load]);

  useEffect(() => {
    const category = pathToCategory[location.pathname];
    if (!category) return;
    const count = badges[category];
    if (!count || count === 0) return;

    const timeout = window.setTimeout(async () => {
      try {
        await notificationsApi.markCategoryRead(category);
        setBadges((prev) => {
          const next = { ...prev };
          delete next[category];
          return next;
        });
        window.dispatchEvent(new CustomEvent("hbt:refresh-badges"));
      } catch {
        // ignore
      }
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [location.pathname, badges]);

  const refresh = useCallback(() => void load(), [load]);

  return { badges, refresh, reload: load };
}

export function getCategoryForPath(pathname: string): string | null {
  return pathToCategory[pathname] ?? null;
}
