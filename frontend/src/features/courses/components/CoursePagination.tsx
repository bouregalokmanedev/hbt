import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { CoursePaginationMeta } from "../api/courses.api";

interface CoursePaginationProps {
  pagination: CoursePaginationMeta | null;
  onPageChange: (page: number) => void;
}

export function CoursePagination({ pagination, onPageChange }: CoursePaginationProps) {
  const { t } = useTranslation();

  if (!pagination || pagination.last_page <= 1) return null;

  const btnClass =
    "inline-flex h-10 items-center gap-1 rounded-xl border border-[#3A3A3A]/12 bg-white px-3 text-sm font-semibold text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822] disabled:pointer-events-none disabled:opacity-40 dark:border-white/12 dark:bg-white/[0.04] dark:text-white dark:hover:border-[#F47822]/40";

  return (
    <nav
      data-testid="course-pagination"
      className="flex items-center justify-center gap-2 pt-4"
      aria-label={t("catalogPage.pagination.aria")}
    >
      <button
        type="button"
        disabled={pagination.current_page <= 1}
        onClick={() => onPageChange(pagination.current_page - 1)}
        className={btnClass}
      >
        <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
        <span className="hidden sm:inline">{t("catalogPage.pagination.previous")}</span>
      </button>

      <div className="flex items-center gap-1">
        {pagination.links.map((link, index) => {
          if (link.page === null) return null;

          return (
            <button
              key={`${link.page}-${index}`}
              type="button"
              aria-current={link.active ? "page" : undefined}
              onClick={() => onPageChange(link.page!)}
              className={[
                "flex h-10 min-w-10 items-center justify-center rounded-xl text-sm font-semibold transition",
                link.active
                  ? "bg-[#F47822] text-white shadow-[0_8px_18px_rgba(244,120,34,0.18)]"
                  : "text-[#3A3A3A]/55 hover:bg-[#F47822]/10 hover:text-[#F47822] dark:text-white/55",
              ].join(" ")}
            >
              {link.page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={pagination.current_page >= pagination.last_page}
        onClick={() => onPageChange(pagination.current_page + 1)}
        className={btnClass}
      >
        <span className="hidden sm:inline">{t("catalogPage.pagination.next")}</span>
        <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
      </button>
    </nav>
  );
}
