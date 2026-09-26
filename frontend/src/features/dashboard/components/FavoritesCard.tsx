import { ChevronRight, Heart, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { listFavorites } from "@/features/favorites/api/favorites.api";
import type { FavoriteItem } from "@/features/favorites/types";

export function FavoritesCard() {
  const { t } = useTranslation();
  const [items, setItems] = useState<FavoriteItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listFavorites()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const top = useMemo(() => (items ?? []).slice(0, 4), [items]);

  return (
    <section
      data-testid="dashboard-card-favorites-content"
      className="rounded-3xl border border-[#3A3A3A]/10 bg-white p-5 shadow-[0_10px_36px_rgba(58,58,58,0.06)] dark:border-white/10 dark:bg-[#1b1b20] sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 text-rose-500">
            <Heart className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
              {t("dashboard.personalize.favoritesCard.eyebrow")}
            </p>
            <h3 className="mt-0.5 text-base font-semibold text-[#3A3A3A] dark:text-white">
              {t("dashboard.personalize.cards.favorites")}
            </h3>
          </div>
        </div>

        <Link
          to="/favourite"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#F47822] hover:underline"
        >
          {t("dashboard.personalize.viewAll")}
          <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
        </Link>
      </div>

      {items === null ? (
        <div className="mt-5 flex items-center gap-2 py-4 text-xs text-[#3A3A3A]/45 dark:text-white/45">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("favourites.loadingAria")}
        </div>
      ) : top.length === 0 ? (
        <p className="mt-5 text-sm text-[#3A3A3A]/50 dark:text-white/50">
          {t("dashboard.personalize.favoritesCard.empty")}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {top.map((item) => (
            <li
              key={`${item.type}:${item.id}`}
              className="flex items-center gap-3 rounded-2xl border border-[#3A3A3A]/8 bg-[#FCFCFC] px-3 py-2.5 dark:border-white/8 dark:bg-white/[0.04]"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-500">
                <Heart className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#3A3A3A] dark:text-white/90">
                  {item.title}
                </span>
                <span className="block truncate text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                  {item.course_title ?? item.subtitle ?? item.type}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
