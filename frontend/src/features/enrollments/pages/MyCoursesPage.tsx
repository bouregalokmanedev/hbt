import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Layers,
  PlayCircle,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useMyEnrollments } from "../hooks/useMyEnrollments";
import type { Enrollment } from "../types/enrollment.types";

type StatusFilter = "all" | "active" | "completed";

export function MyCoursesPage() {
  const { t } = useTranslation();
  const { enrollments, isLoading, error, reload } = useMyEnrollments();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const formatLearningTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t("myCourses.timeMin", { m: minutes });
    return t("myCourses.timeHours", {
      h: Math.floor(minutes / 60),
      m: minutes % 60,
    });
  };

  const visibleEnrollments = useMemo(
    () => enrollments.filter((e) => e.status !== "cancelled"),
    [enrollments],
  );

  const completedCount = useMemo(
    () => visibleEnrollments.filter((e) => e.status === "completed").length,
    [visibleEnrollments],
  );

  const activeCount = visibleEnrollments.length - completedCount;

  const avgProgress = useMemo(() => {
    if (visibleEnrollments.length === 0) return 0;
    const total = visibleEnrollments.reduce((sum, e) => {
      const p = Math.min(Math.max(e.progress?.progress_percentage ?? 0, 0), 100);
      return sum + (e.status === "completed" ? 100 : p);
    }, 0);
    return Math.round(total / visibleEnrollments.length);
  }, [visibleEnrollments]);

  const filteredEnrollments = useMemo(() => {
    if (statusFilter === "all") return visibleEnrollments;
    return visibleEnrollments.filter((e) => e.status === statusFilter);
  }, [visibleEnrollments, statusFilter]);

  const filters: Array<{
    id: StatusFilter;
    label: string;
    count: number;
  }> = [
    { id: "all", label: t("myCourses.filters.all"), count: visibleEnrollments.length },
    { id: "active", label: t("myCourses.filters.inProgress"), count: activeCount },
    { id: "completed", label: t("myCourses.filters.completed"), count: completedCount },
  ];

  /* ----------------------------------------------------------
     LOADING
  ---------------------------------------------------------- */
  if (isLoading) {
    return (
      <main className="min-h-full bg-[#F3F3F3] dark:bg-[#101013]" data-testid="my-courses-loading">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-6 sm:px-8 sm:py-8">
          <div className="mb-7 h-40 animate-pulse rounded-[32px] bg-[#3A3A3A]/10 dark:bg-white/8" />
          <div className="mb-6 h-12 w-full max-w-md animate-pulse rounded-2xl bg-[#3A3A3A]/8 dark:bg-white/6" />
          <div className="grid gap-5 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-3xl bg-white shadow-[0_10px_36px_rgba(58,58,58,0.06)] dark:bg-[#1b1b20]"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  /* ----------------------------------------------------------
     ERROR
  ---------------------------------------------------------- */
  if (error) {
    return (
      <main className="min-h-full bg-[#F3F3F3] dark:bg-[#101013]" data-testid="my-courses-error">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-6 sm:px-8 sm:py-8">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-red-500">
              <BookOpen className="h-6 w-6" />
            </span>
            <p className="mt-4 text-sm font-semibold text-red-700 dark:text-red-400">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(244,120,34,0.18)] transition hover:bg-[#df6817]"
            >
              <RotateCcw className="h-4 w-4" />
              {t("myCourses.retry")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ----------------------------------------------------------
     EMPTY
  ---------------------------------------------------------- */
  if (visibleEnrollments.length === 0) {
    return (
      <main className="min-h-full bg-[#F3F3F3] dark:bg-[#101013]" data-testid="my-courses-empty">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-6 sm:px-8 sm:py-8">
          <div className="rounded-[32px] border border-dashed border-[#3A3A3A]/15 bg-white px-6 py-16 text-center dark:border-white/15 dark:bg-[#1b1b20]">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F47822]/10">
              <BookOpen className="h-7 w-7 text-[#F47822]" />
            </span>
            <h1 className="mt-5 text-xl font-bold text-[#3A3A3A] dark:text-white">
              {t("myCourses.emptyTitle")}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">
              {t("myCourses.emptyDesc")}
            </p>
            <Link
              to="/catalog"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(244,120,34,0.18)] transition hover:bg-[#df6817]"
            >
              {t("myCourses.exploreBtn")}
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ----------------------------------------------------------
     CONTENT
  ---------------------------------------------------------- */
  return (
    <main className="min-h-full bg-[#F3F3F3] dark:bg-[#101013]" data-testid="my-courses-page">
      <section className="mx-auto w-full max-w-[1280px] px-5 py-6 sm:px-8 sm:py-8">
        {/* Hero */}
        <div
          className="relative mb-6 overflow-hidden rounded-[32px] bg-[#353535] px-6 py-7 text-white shadow-[0_18px_42px_rgba(58,58,58,0.13)] sm:px-8"
          data-testid="my-courses-hero"
        >
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#F47822]/20 blur-3xl rtl:-left-20 rtl:right-auto"
          />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">
                <Trophy className="h-3.5 w-3.5" />
                {t("myCourses.hero.eyebrow")}
              </p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                {t("myCourses.hero.title")}
              </h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/60">
                {t("myCourses.hero.description")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3" data-testid="my-courses-stats">
              <StatTile
                icon={<BookOpen className="h-4 w-4" />}
                label={t("myCourses.hero.inProgress")}
                value={activeCount}
                tone="glass"
                testId="stat-in-progress"
              />
              <StatTile
                icon={<Trophy className="h-4 w-4" />}
                label={t("myCourses.hero.completed")}
                value={completedCount}
                tone="orange"
                testId="stat-completed"
              />
              <StatTile
                icon={<Layers className="h-4 w-4" />}
                label={t("myCourses.hero.total")}
                value={visibleEnrollments.length}
                tone="glass"
                testId="stat-total"
              />
              <StatTile
                icon={<Award className="h-4 w-4" />}
                label={t("myCourses.hero.avgProgress")}
                value={`${avgProgress}%`}
                tone="glass"
                testId="stat-avg"
              />
            </div>
          </div>
        </div>

        {/* Status filters */}
        <div
          className="mb-6 flex flex-wrap gap-2"
          role="tablist"
          aria-label={t("myCourses.filters.aria")}
          data-testid="my-courses-filters"
        >
          {filters.map((filter) => {
            const active = statusFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-pressed={active}
                data-testid={`my-courses-filter-${filter.id}`}
                onClick={() => setStatusFilter(filter.id)}
                className={[
                  "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-bold transition-all",
                  active
                    ? "border-[#F47822]/40 bg-[#F47822]/12 text-[#F47822] shadow-[0_0_0_1px_rgba(244,120,34,0.12)]"
                    : "border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/55 hover:border-[#F47822]/30 hover:text-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/55",
                ].join(" ")}
              >
                {filter.label}
                <span
                  className={[
                    "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold",
                    active
                      ? "bg-[#F47822] text-white"
                      : "bg-[#3A3A3A]/8 text-[#3A3A3A]/60 dark:bg-white/10 dark:text-white/60",
                  ].join(" ")}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {filteredEnrollments.length === 0 ? (
          <div
            className="rounded-3xl border border-dashed border-[#3A3A3A]/15 bg-white px-6 py-12 text-center dark:border-white/15 dark:bg-[#1b1b20]"
            data-testid="my-courses-filter-empty"
          >
            <p className="text-sm text-[#3A3A3A]/55 dark:text-white/55">
              {t("myCourses.filters.empty")}
            </p>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className="mt-4 text-sm font-bold text-[#F47822] hover:underline"
            >
              {t("myCourses.filters.showAll")}
            </button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2" data-testid="my-courses-grid">
            {filteredEnrollments.map((enrollment) => (
              <EnrollmentCard
                key={enrollment.id}
                enrollment={enrollment}
                formatLearningTime={formatLearningTime}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: "glass" | "orange";
  testId: string;
}) {
  const orange = tone === "orange";
  return (
    <div
      data-testid={testId}
      className={[
        "flex min-w-[118px] items-center gap-3 rounded-2xl px-3.5 py-3",
        orange
          ? "bg-[#F47822] shadow-[0_8px_20px_rgba(244,120,34,0.20)]"
          : "border border-white/10 bg-white/[0.07] backdrop-blur-sm",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-9 w-9 place-items-center rounded-xl",
          orange ? "bg-white/15 text-white" : "bg-white/10 text-[#F47822]",
        ].join(" ")}
      >
        {icon}
      </span>
      <div>
        <p
          className={[
            "text-[9px] font-bold uppercase tracking-[0.12em]",
            orange ? "text-white/70" : "text-white/45",
          ].join(" ")}
        >
          {label}
        </p>
        <p className="mt-0.5 text-lg font-bold leading-none text-white">{value}</p>
      </div>
    </div>
  );
}

function EnrollmentCard({
  enrollment,
  formatLearningTime,
}: {
  enrollment: Enrollment;
  formatLearningTime: (seconds: number) => string;
}) {
  const { t } = useTranslation();

  const progress = Math.min(Math.max(enrollment.progress?.progress_percentage ?? 0, 0), 100);
  const completed = enrollment.status === "completed";
  const course = enrollment.course;
  const lessonsDone = enrollment.completed_lessons ?? 0;
  const lessonsTotal = enrollment.total_lessons ?? 0;
  const displayProgress = completed ? 100 : progress;

  return (
    <article
      data-testid="my-courses-card"
      className="group overflow-hidden rounded-3xl border border-[#3A3A3A]/10 bg-white shadow-[0_10px_36px_rgba(58,58,58,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#F47822]/35 hover:shadow-[0_20px_50px_rgba(244,120,34,0.12)] dark:border-white/10 dark:bg-[#1b1b20]"
    >
      <div className="grid sm:grid-cols-[160px_1fr]">
        {/* Visual */}
        <div
          className={[
            "relative flex min-h-[140px] items-center justify-center overflow-hidden p-6",
            completed
              ? "bg-gradient-to-br from-emerald-600 to-emerald-700"
              : "bg-gradient-to-br from-[#3A3A3A] to-[#2a2a2a]",
          ].join(" ")}
        >
          {course?.thumbnail ? (
            <img
              src={course.thumbnail}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />

          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur-sm">
            {completed ? (
              <GraduationCapIcon />
            ) : (
              <BookOpen className="h-7 w-7" />
            )}
          </div>

          <span
            className={[
              "absolute bottom-3 start-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur-md",
              completed ? "bg-emerald-600/80" : "bg-black/45",
            ].join(" ")}
            data-testid="my-courses-card-status"
          >
            {completed ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <PlayCircle className="h-3 w-3 text-[#F47822]" />
            )}
            {completed ? t("myCourses.card.complete") : t("myCourses.card.learning")}
          </span>

          {!completed && (
            <span className="absolute bottom-3 end-3 rounded-full bg-black/45 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-md">
              {progress}%
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={[
                  "text-[10px] font-bold uppercase tracking-[0.15em]",
                  completed
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-[#F47822]",
                ].join(" ")}
              >
                {completed ? t("myCourses.card.certEligible") : t("myCourses.card.continueCourse")}
              </p>
              <h2
                className="mt-1.5 line-clamp-2 text-base font-semibold leading-snug text-[#3A3A3A] dark:text-white"
                data-testid="my-courses-card-title"
              >
                {course?.title ?? t("myCourses.card.fallbackTitle")}
              </h2>
            </div>

            {completed ? (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            ) : null}
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold">
              <span className="text-[#3A3A3A]/45 dark:text-white/45">
                {t("myCourses.card.progressLabel")}
              </span>
              <span
                className={completed ? "text-emerald-600 dark:text-emerald-400" : "text-[#F47822]"}
                data-testid="my-courses-card-progress"
              >
                {displayProgress}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#3A3A3A]/8 dark:bg-white/8">
              <div
                className={[
                  "h-full rounded-full transition-all duration-500",
                  completed
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-[#F47822] to-[#ff9a55]",
                ].join(" ")}
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#3A3A3A]/50 dark:text-white/50">
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[#F47822]" />
              {t("myCourses.card.lessonsDone", {
                done: lessonsDone,
                total: lessonsTotal,
              })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 text-[#F47822]" />
              {formatLearningTime(enrollment.progress?.time_spent ?? 0)}
            </span>
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
            <Link
              to={`/courses/${enrollment.course_id}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(244,120,34,0.18)] transition hover:bg-[#df6817]"
            >
              {completed ? (
                <>
                  <RotateCcw className="h-4 w-4" />
                  {t("myCourses.card.reviewCourse")}
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  {t("myCourses.card.continueLearning")}
                </>
              )}
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function GraduationCapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </svg>
  );
}
