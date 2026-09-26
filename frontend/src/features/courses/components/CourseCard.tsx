import { ArrowRight, CheckCircle2, Clock3, Globe2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { FavoriteButton } from "@/features/favorites/components/FavoriteButton";
import type { Course } from "../types/course.types";
import type { Enrollment } from "@/features/enrollments/types/enrollment.types";
import heropic from "@/assets/landing/heropic.jpg";
import heropic2 from "@/assets/landing/heropic2.jpg";

interface CourseCardProps {
  course: Course;
  enrollment?: Enrollment | null;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}

const difficultyTone: Record<string, string> = {
  beginner: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  intermediate: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  advanced: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25",
};

export function CourseCard({ course, enrollment = null }: CourseCardProps) {
  const { t } = useTranslation();

  const difficultyLabels: Record<string, string> = {
    beginner: t("catalogPage.difficulty.beginner"),
    intermediate: t("catalogPage.difficulty.intermediate"),
    advanced: t("catalogPage.difficulty.advanced"),
  };

  const difficultyLabel =
    difficultyLabels[course.difficulty] ?? course.difficulty;

  const hasDiscount =
    !course.is_free &&
    course.discount_price !== null &&
    course.discount_price !== undefined &&
    course.price !== null &&
    course.price !== undefined &&
    course.discount_price < course.price;

  const enrollmentStatus = enrollment?.status?.toLowerCase() ?? null;
  const isCompleted = enrollmentStatus === "completed";
  const isEnrolled = enrollmentStatus === "active";
  const progressPercent =
    enrollment?.progress?.progress_percentage !== undefined &&
    enrollment?.progress?.progress_percentage !== null
      ? Math.max(0, Math.min(100, enrollment.progress.progress_percentage))
      : null;

  const cardImage =
    course.thumbnail ??
    (course.title.toLowerCase().includes("can bus") ? heropic : heropic2);

  const priceLabel = course.is_free
    ? t("catalogPage.card.free")
    : hasDiscount
      ? `${course.discount_price} ${course.currency ?? ""}`.trim()
      : `${course.price ?? ""} ${course.currency ?? ""}`.trim();

  const ctaLabel = isCompleted
    ? t("catalogPage.card.reviewCourse")
    : isEnrolled
      ? t("catalogPage.card.continueLearning")
      : course.is_free
        ? t("catalogPage.card.startLearning")
        : t("catalogPage.card.enrollNow");

  return (
    <article
      data-testid="course-card"
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#3A3A3A]/10 bg-white shadow-[0_10px_36px_rgba(58,58,58,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#F47822]/35 hover:shadow-[0_20px_50px_rgba(244,120,34,0.14)] focus-within:ring-2 focus-within:ring-[#F47822]/35 dark:border-white/10 dark:bg-[#1b1b20] dark:hover:border-[#F47822]/40"
    >
      <Link
        to={`/courses/${course.id}`}
        className="flex h-full flex-col outline-none"
        data-testid="course-card-link"
      >
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-[#222]">
          {cardImage ? (
            <img
              src={cardImage}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#242424]">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <span className="text-xl font-black text-[#F47822]">H</span>
                </div>
                <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.22em] text-white/40">
                  {t("catalogPage.card.brand")}
                </p>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/5" />

          {/* Top row: difficulty + favorite */}
          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] backdrop-blur-md ${difficultyTone[course.difficulty] ?? "border-white/20 bg-black/30 text-white"}`}
              data-testid="course-card-difficulty"
            >
              {difficultyLabel}
            </span>

            <FavoriteButton
              type="course"
              id={course.id}
              title={course.title}
              size="sm"
              variant="glass"
              className="relative z-10"
            />
          </div>

          {/* Bottom badges */}
          <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-2">
            {isCompleted ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-md"
                data-testid="course-card-status"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                {t("catalogPage.card.completed")}
              </span>
            ) : isEnrolled ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-md"
                data-testid="course-card-status"
              >
                <CheckCircle2 className="h-3 w-3 text-[#F47822]" />
                {t("catalogPage.card.enrolled")}
              </span>
            ) : null}

            {course.is_free && (
              <span
                className="inline-flex items-center rounded-full bg-[#F47822] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white shadow-lg"
                data-testid="course-card-free"
              >
                {t("catalogPage.card.free")}
              </span>
            )}
          </div>

          {/* Hover arrow */}
          <div className="absolute bottom-3 end-3 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-white text-[#3A3A3A] opacity-0 shadow-xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 dark:bg-[#1b1b20] dark:text-white">
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F47822]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
              {t("catalogPage.card.category")}
            </span>
          </div>

          <h3
            className="line-clamp-2 min-h-[2.75rem] text-[17px] font-semibold leading-snug tracking-tight text-[#3A3A3A] transition-colors duration-300 group-hover:text-[#F47822] dark:text-white"
            data-testid="course-card-title"
          >
            {course.title}
          </h3>

          {course.short_description ? (
            <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">
              {course.short_description}
            </p>
          ) : (
            <div className="min-h-[2.5rem]" />
          )}

          {/* Progress when enrolled */}
          {progressPercent !== null && (isEnrolled || isCompleted) && (
            <div className="mt-4" data-testid="course-card-progress">
              <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold">
                <span className="text-[#3A3A3A]/45 dark:text-white/45">
                  {t("catalogPage.card.progress")}
                </span>
                <span className="text-[#F47822]">{progressPercent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/8 dark:bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#F47822] to-[#ff9a55] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-auto pt-5">
            <div className="flex items-center gap-4 text-[11px] font-medium text-[#3A3A3A]/45 dark:text-white/45">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-[#F47822]" />
                {formatDuration(course.duration_minutes)}
              </span>
              <span className="h-1 w-1 rounded-full bg-[#3A3A3A]/20 dark:bg-white/20" />
              <span className="inline-flex items-center gap-1.5">
                <Globe2 className="h-3.5 w-3.5 text-[#F47822]" />
                {course.language.toUpperCase()}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#3A3A3A]/8 pt-4 dark:border-white/8">
              <div className="min-w-0">
                {course.is_free ? (
                  <span className="text-sm font-bold text-[#F47822]">
                    {t("catalogPage.card.free")}
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#3A3A3A] dark:text-white">
                      {priceLabel}
                    </span>
                    {hasDiscount && (
                      <span className="text-[11px] text-[#3A3A3A]/40 line-through dark:text-white/40">
                        {course.price} {course.currency}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#3A3A3A] transition-colors duration-300 group-hover:text-[#F47822] dark:text-white">
                {ctaLabel}
                <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
