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
  "/support-desk/messages": "messages",
  "/support-desk/announcements": "announcements",
  "/favourite": "favourite",
  "/subscription": "subscription",
};

/**
 * Per-role routes that the flat map above cannot express. Checked in order, so
 * the more specific prefix must come first. Every value must be one of the
 * backend's CATEGORIES — `markCategoryRead` rejects anything else with a 422.
 */
const prefixToCategory: [string, string][] = [
  ["/admin/staff-hub/news", "announcements"],
  ["/admin/staff-hub/room", "messages"],
  ["/support-desk/staff-hub/news", "announcements"],
  ["/support-desk/staff-hub/room", "messages"],
  ["/instructor/staff-hub/news", "announcements"],
  ["/instructor/staff-hub/room", "messages"],
  ["/admin/messages/announcements", "announcements"],
  ["/admin/messages", "messages"],
  ["/instructor/announcements", "announcements"],
  ["/instructor/messages", "messages"],
];

/**
 * Categories whose count is derived from conversation read state rather than
 * from notification rows. `markCategoryRead` can only clear rows, so calling it
 * here would leave the count untouched while the optimistic delete below makes
 * this effect believe it changed — an 800 ms/30 s request loop for as long as
 * the reader stays on `/messages` or `/announcements`. These badges clear when
 * the conversations themselves are read.
 */
const conversationDerived = new Set(["messages", "announcements"]);

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
    const category = getCategoryForPath(location.pathname);
    if (!category || conversationDerived.has(category)) return;
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
  const exact = pathToCategory[pathname];
  if (exact) return exact;

  const prefix = prefixToCategory.find(([candidate]) => pathname === candidate || pathname.startsWith(`${candidate}/`));
  return prefix?.[1] ?? null;
}
