import { SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CourseEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function CourseEmptyState({ hasFilters, onClearFilters }: CourseEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="course-empty"
      className="rounded-3xl border border-dashed border-[#3A3A3A]/15 bg-white px-6 py-16 text-center dark:border-white/15 dark:bg-[#1b1b20]"
    >
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
        <SearchX className="h-6 w-6" />
      </span>

      <h3 className="mt-4 text-lg font-semibold text-[#3A3A3A] dark:text-white">
        {t("catalogPage.empty.title")}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#3A3A3A]/50 dark:text-white/50">
        {hasFilters ? t("catalogPage.empty.filtered") : t("catalogPage.empty.emptyAll")}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-5 rounded-xl bg-[#F47822] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(244,120,34,0.18)] transition hover:bg-[#df6817]"
        >
          {t("catalogPage.empty.clear")}
        </button>
      )}
    </div>
  );
}
