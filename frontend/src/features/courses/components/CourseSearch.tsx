import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CourseSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function CourseSearch({ value, onChange }: CourseSearchProps) {
  const { t } = useTranslation();

  return (
    <div className="relative w-full" data-testid="course-search">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45"
      />

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("catalogPage.search.placeholder")}
        aria-label={t("catalogPage.search.aria")}
        className="h-14 w-full rounded-2xl border border-white/12 bg-white/[0.07] ps-12 pe-12 text-sm text-white outline-none transition-all placeholder:text-white/40 hover:border-white/20 focus:border-[#F47822] focus:bg-white/[0.1] focus:ring-4 focus:ring-[#F47822]/15"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("catalogPage.search.clear")}
          className="absolute end-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
