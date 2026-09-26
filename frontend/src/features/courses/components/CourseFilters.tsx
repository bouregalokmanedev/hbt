import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api/client";

import type { CourseListParams } from "../api/courses.api";

interface CourseFiltersProps {
  filters: CourseListParams;
  onChange: (filters: CourseListParams) => void;
}

const difficulties = [
  "all",
  "beginner",
  "intermediate",
  "advanced",
] as const;

export function CourseFilters({ filters, onChange }: CourseFiltersProps) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  const difficultyLabels: Record<string, string> = {
    all: t("catalogPage.filters.all"),
    beginner: t("catalogPage.difficulty.beginner"),
    intermediate: t("catalogPage.difficulty.intermediate"),
    advanced: t("catalogPage.difficulty.advanced"),
  };

  useEffect(() => {
    void api<Array<{ id: string; name: string }>>("/v1/categories/active")
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!categoryOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node)
      ) {
        setCategoryOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [categoryOpen]);

  const chipClass = (active: boolean) =>
    [
      "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-all",
      active
        ? "border-[#F47822]/40 bg-[#F47822]/15 text-[#F47822] shadow-[0_0_0_1px_rgba(244,120,34,0.15)]"
        : "border-white/12 bg-white/[0.06] text-white/65 hover:border-white/25 hover:bg-white/[0.1] hover:text-white",
    ].join(" ");

  const activeCategory = categories.find(
    (category) => category.id === filters.category,
  );

  return (
    <div className="flex flex-col gap-3" data-testid="course-filters">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
        <SlidersHorizontal className="h-3.5 w-3.5 text-[#F47822]" />
        <span>{t("catalogPage.filters.title")}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {difficulties.map((difficulty) => {
          const active =
            difficulty === "all" ? !filters.difficulty : filters.difficulty === difficulty;
          const label = difficultyLabels[difficulty] ?? difficulty;

          return (
            <button
              key={difficulty}
              type="button"
              data-testid={`course-filter-${difficulty}`}
              aria-pressed={active}
              onClick={() =>
                onChange({
                  ...filters,
                  difficulty: difficulty === "all" ? undefined : difficulty,
                  page: 1,
                })
              }
              className={chipClass(active)}
            >
              {active && <Check className="h-3.5 w-3.5" />}
              {label}
            </button>
          );
        })}

        <button
          type="button"
          data-testid="course-filter-free"
          aria-pressed={Boolean(filters.free)}
          onClick={() =>
            onChange({
              ...filters,
              free: filters.free ? undefined : true,
              page: 1,
            })
          }
          className={chipClass(Boolean(filters.free))}
        >
          {filters.free && <Check className="h-3.5 w-3.5" />}
          {t("catalogPage.filters.free")}
        </button>

        <div ref={categoryRef} className="relative">
          <button
            type="button"
            data-testid="course-filter-category"
            aria-label={t("catalogPage.filters.categoryAria")}
            aria-haspopup="listbox"
            aria-expanded={categoryOpen}
            onClick={() => setCategoryOpen((open) => !open)}
            className={chipClass(Boolean(filters.category))}
          >
            {filters.category && <Check className="h-3.5 w-3.5" />}
            <span className="max-w-[160px] truncate">
              {activeCategory?.name ?? t("catalogPage.filters.allCategories")}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${categoryOpen ? "rotate-180" : ""}`}
            />
          </button>

          {categoryOpen && (
            <div
              role="listbox"
              aria-label={t("catalogPage.filters.categoryAria")}
              className="absolute start-0 top-full z-30 mt-2 max-h-64 w-56 overflow-y-auto rounded-2xl border border-white/12 bg-[#2a2a2a] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] dark:border-white/12 dark:bg-[#1b1b20]"
            >
              <button
                key="all"
                type="button"
                role="option"
                aria-selected={!filters.category}
                data-testid="course-filter-category-option"
                onClick={() => {
                  onChange({ ...filters, category: undefined, page: 1 });
                  setCategoryOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-xs font-semibold transition ${
                  !filters.category
                    ? "bg-[#F47822]/15 text-[#F47822]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {!filters.category && <Check className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">
                  {t("catalogPage.filters.allCategories")}
                </span>
              </button>

              {categories.map((category) => {
                const selected = filters.category === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    data-testid="course-filter-category-option"
                    onClick={() => {
                      onChange({
                        ...filters,
                        category: category.id,
                        page: 1,
                      });
                      setCategoryOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-xs font-semibold transition ${
                      selected
                        ? "bg-[#F47822]/15 text-[#F47822]"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    <span className="truncate">{category.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {filters.category && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-white/50">
          <span>{t("catalogPage.filters.active")}</span>
          <button
            type="button"
            onClick={() => onChange({ ...filters, category: undefined, page: 1 })}
            className="rounded-full bg-[#F47822]/15 px-2.5 py-1 font-semibold text-[#F47822]"
          >
            {t("catalogPage.filters.categoryBadge")}
          </button>
        </div>
      )}
    </div>
  );
}
