import { BookOpen, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type { CourseListParams } from "../api/courses.api";
import { useMyEnrollments } from "@/features/enrollments/hooks/useMyEnrollments";
import { CourseEmptyState } from "../components/CourseEmptyState";
import { CourseErrorState } from "../components/CourseErrorState";
import { CourseFilters } from "../components/CourseFilters";
import { CourseGrid } from "../components/CourseGrid";
import { CourseGridSkeleton } from "../components/CourseGridSkeleton";
import { CoursePagination } from "../components/CoursePagination";
import { CourseSearch } from "../components/CourseSearch";
import { useCourses } from "../hooks/useCourses";

export function CoursesPage() {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<CourseListParams>({
    per_page: 12,
    page: 1,
  });

  const { courses, pagination, isLoading, error, reload } = useCourses(filters);

  const {
    enrollments,
    reload: reloadEnrollments,
  } = useMyEnrollments();

  const location = useLocation();

  const hasFilters = useMemo(
    () =>
      Boolean(
        filters.search ||
          filters.difficulty ||
          filters.free ||
          filters.language ||
          filters.category,
      ),
    [filters],
  );

  useEffect(() => {
    void reloadEnrollments();
  }, [location.key, reloadEnrollments]);

  const coursesWithEnrollment = useMemo(() => {
    return courses.map((course) => {
      const enrollment = enrollments.find(
        (item) => String(item.course_id) === String(course.id),
      );

      if (!enrollment) {
        return { ...course, enrollment: course.enrollment ?? null };
      }

      return {
        ...course,
        enrollment: { ...enrollment, user_id: String(enrollment.user_id) },
      };
    });
  }, [courses, enrollments]);

  function updateFilters(next: CourseListParams) {
    setFilters({ ...next, page: 1 });
  }

  function clearFilters() {
    setFilters({ per_page: 12, page: 1 });
  }

  const showLoading = isLoading;
  const showError = !isLoading && Boolean(error);

  return (
    <main className="catalog-page-ar min-h-screen bg-[#F3F3F3] dark:bg-[#101013]">
      {/* =====================================================
          HERO / SEARCH / FILTERS
      ====================================================== */}
      <section className="relative z-20 px-5 pt-6 sm:px-8 sm:pt-8">
        <div className="relative mx-auto max-w-[1280px] rounded-[32px] bg-[#353535] px-6 py-8 text-white shadow-[0_18px_42px_rgba(58,58,58,0.13)] sm:px-8 sm:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]"
          >
            <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#F47822]/20 blur-3xl rtl:-left-24 rtl:right-auto" />
            <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:56px_56px]" />
          </div>

          <div className="relative">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("catalogPage.hero.badge")}
                </p>

                <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  {t("catalogPage.hero.titleA")}{" "}
                  <span className="text-[#F47822]">{t("catalogPage.hero.titleMid")}</span>
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
                  {t("catalogPage.hero.description")}
                </p>
              </div>

              <span className="hidden font-mono text-[10px] tracking-[0.2em] text-white/35 sm:block">
                {t("catalogPage.hero.code")}
              </span>
            </div>

            <div className="mt-8">
              <CourseSearch
                value={filters.search ?? ""}
                onChange={(search) =>
                  updateFilters({ ...filters, search: search || undefined })
                }
              />
            </div>

            <div className="mt-5">
              <CourseFilters filters={filters} onChange={updateFilters} />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          RESULTS
      ====================================================== */}
      <section className="px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-8 flex flex-col gap-5 border-b border-[#3A3A3A]/10 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-white/10">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                  <BookOpen className="h-4.5 w-4.5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3A3A3A]/45 dark:text-white/45">
                  {t("catalogPage.results.eyebrow")}
                </span>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-[#3A3A3A] sm:text-3xl dark:text-white">
                {t("catalogPage.results.titleA")}{" "}
                <span className="text-[#F47822]">{t("catalogPage.results.titleB")}</span>
              </h2>

              {!isLoading && pagination && (
                <p className="mt-2 text-sm text-[#3A3A3A]/50 dark:text-white/50">
                  {t("catalogPage.results.count", { count: pagination.total })}
                </p>
              )}
            </div>

            {!isLoading && !error && courses.length > 0 && (
              <div className="flex items-center gap-3 rounded-2xl border border-[#3A3A3A]/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#1b1b20]">
                <span className="text-2xl font-bold text-[#F47822]">
                  {String(courses.length).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/45 dark:text-white/45">
                  {t("catalogPage.results.showing")}
                </span>
              </div>
            )}
          </div>

          <div className="relative lg:ps-10">
            <div
              aria-hidden="true"
              className="absolute start-0 top-0 bottom-0 hidden w-px bg-[#3A3A3A]/10 lg:block dark:bg-white/10"
            >
              <div className="absolute start-0 top-0 h-24 w-px bg-[#F47822]" />
            </div>

            {showLoading && <CourseGridSkeleton />}

            {showError && (
              <CourseErrorState
                message={error ?? t("catalogPage.error.fallback")}
                onRetry={() => void reload()}
              />
            )}

            {!isLoading && !error && courses.length === 0 && (
              <CourseEmptyState
                hasFilters={hasFilters}
                onClearFilters={clearFilters}
              />
            )}

            {!isLoading && !error && courses.length > 0 && (
              <div className="space-y-10">
                <CourseGrid courses={coursesWithEnrollment} />

                {pagination && (
                  <div className="border-t border-[#3A3A3A]/10 pt-8 dark:border-white/10">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40 dark:text-white/40">
                        {t("catalogPage.results.index")}
                      </span>
                      <span className="h-px flex-1 bg-[#3A3A3A]/10 dark:bg-white/10" />
                      <span className="font-mono text-[11px] text-[#3A3A3A]/40 dark:text-white/40">
                        {pagination.total}
                      </span>
                    </div>

                    <CoursePagination
                      pagination={pagination}
                      onPageChange={(page) =>
                        setFilters((current) => ({ ...current, page }))
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          STATEMENT
      ====================================================== */}
      <section className="relative overflow-hidden border-t border-[#3A3A3A]/10 bg-white px-5 py-16 sm:px-8 sm:py-20 dark:border-white/10 dark:bg-[#1b1b20]">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
                {t("catalogPage.statement.eyebrow")}
              </p>

              <h3 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#3A3A3A] sm:text-4xl lg:text-5xl dark:text-white">
                {t("catalogPage.statement.titleA")}{" "}
                <span className="text-[#3A3A3A]/25 dark:text-white/25">
                  {t("catalogPage.statement.titleB")}
                </span>{" "}
                {t("catalogPage.statement.titleC")}
              </h3>
            </div>

            <div className="lg:col-span-4 lg:col-start-9">
              <p className="text-sm leading-7 text-[#3A3A3A]/55 dark:text-white/55">
                {t("catalogPage.statement.description")}
              </p>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-1 w-1/3 bg-[#F47822] rtl:left-auto rtl:right-0"
        />
      </section>
    </main>
  );
}
