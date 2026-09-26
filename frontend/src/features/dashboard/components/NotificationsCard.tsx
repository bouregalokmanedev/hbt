import { Bell, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  notificationsApi,
  type StudentNotification,
} from "@/features/notifications/api/notifications.api";

export function NotificationsCard() {
  const { t } = useTranslation();
  const [items, setItems] = useState<StudentNotification[] | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    notificationsApi
      .list()
      .then((data) => {
        if (cancelled) return;
        setItems(data.items ?? []);
        setUnread(data.unread_count ?? 0);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const top = (items ?? []).slice(0, 4);

  return (
    <section
      data-testid="dashboard-card-notifications-content"
      className="rounded-3xl border border-[#3A3A3A]/10 bg-white p-5 shadow-[0_10px_36px_rgba(58,58,58,0.06)] dark:border-white/10 dark:bg-[#1b1b20] sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-[#1F6AE1]/10 text-[#1F6AE1]">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span
                className="absolute -end-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#F47822] px-1 text-[9px] font-black text-white"
                dir="ltr"
              >
                {unread}
              </span>
            )}
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
              {t("dashboard.personalize.notificationsCard.eyebrow")}
            </p>
            <h3 className="mt-0.5 text-base font-semibold text-[#3A3A3A] dark:text-white">
              {t("dashboard.personalize.cards.notifications")}
            </h3>
          </div>
        </div>

        <Link
          to="/announcements"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#F47822] hover:underline"
        >
          {t("dashboard.personalize.viewAll")}
          <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
        </Link>
      </div>

      {items === null ? (
        <div className="mt-5 flex items-center gap-2 py-4 text-xs text-[#3A3A3A]/45 dark:text-white/45">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("notifications.menu.loading")}
        </div>
      ) : top.length === 0 ? (
        <p className="mt-5 text-sm text-[#3A3A3A]/50 dark:text-white/50">
          {t("dashboard.personalize.notificationsCard.empty")}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {top.map((item) => (
            <li
              key={item.id}
              className={[
                "rounded-2xl border px-3 py-2.5",
                item.read_at
                  ? "border-[#3A3A3A]/8 bg-[#FCFCFC] dark:border-white/8 dark:bg-white/[0.04]"
                  : "border-[#F47822]/30 bg-[#FFF8F4] dark:border-[#F47822]/30 dark:bg-[#F47822]/[0.08]",
              ].join(" ")}
            >
              <p
                className={[
                  "truncate text-sm",
                  item.read_at
                    ? "font-semibold text-[#3A3A3A]/70 dark:text-white/70"
                    : "font-bold text-[#3A3A3A] dark:text-white",
                ].join(" ")}
              >
                {item.title}
              </p>
              <p className="mt-0.5 line-clamp-1 text-xs text-[#3A3A3A]/45 dark:text-white/45">
                {item.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
