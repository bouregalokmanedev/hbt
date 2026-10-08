import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Globe2,
  GraduationCap,
  PlayCircle,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { env } from "@/config/env";
import { useAuth } from "@/features/auth/hooks/useAuth";

import { FavoriteButton } from "@/features/favorites/components/FavoriteButton";
import { ContinueLearningCard } from "../components/ContinueLearningCard";
import { CourseCertificate } from "../components/CourseCertificate";
import { CourseCurriculum } from "../components/CourseCurriculum";
import { CourseDiagnostics } from "../components/CourseDiagnostics";
import { CourseInstructor } from "../components/CourseInstructor";
import { CourseQuizzes } from "../components/CourseQuizzes";
import { CourseThumbnail } from "../components/CourseThumbnail";
import { useCourse } from "../hooks/useCourse";
import { useCourseCurriculum } from "../hooks/useCourseCurriculum";
import { useCourseEnrollment } from "../hooks/useCourseEnrollment";
import { submitCourseFeedback } from "@/features/lessons/api/feedback.api";
import {
  getCourseReviews,
  type CourseReviewsResponse,
} from "../api/courses.api";

function formatDuration(minutes: number, t: TFunction): string {
  if (minutes < 60) {
    return `${minutes} ${t("courseDetails.common.durMin")}`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (remaining === 0) {
    return `${hours}${t("courseDetails.common.durHour")}`;
  }

  return `${hours}${t("courseDetails.common.durHour")} ${remaining}${t("courseDetails.common.durHourMin")}`;
}

function formatPrice(
  price: number | null | undefined,
  discountPrice: number | null | undefined,
  isFree: boolean,
  currency: string,
  t: TFunction,
  locale?: string,
): string {
  if (isFree) {
    return t("courseDetails.common.free");
  }

  const amount = discountPrice !== null && discountPrice !== undefined
    ? discountPrice
    : price;

  if (amount === null || amount === undefined) {
    return t("courseDetails.page.viewCourse");
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function getDifficultyLabel(difficulty: string, t: TFunction): string {
  const key = difficulty.toLowerCase();
  if (key === "beginner" || key === "intermediate" || key === "advanced") {
    return t(`courseDetails.common.difficulty.${key}`);
  }
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

export function CourseDetailsPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "ar" ? "ar" : undefined;
  const { id } = useParams<{
    id: string;
  }>();

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isInitialized } = useAuth();
  const { course, isLoading, error, reload } = useCourse(id);

  const {
    enrollment,
    isEnrolling,
    error: enrollmentError,
    enroll,
  } = useCourseEnrollment(id, course?.enrollment ?? null, Boolean(user));
  const [duplicateEnrollment, setDuplicateEnrollment] = useState(false);
  const [reviews, setReviews] = useState<CourseReviewsResponse | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSending, setReviewSending] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSent, setReviewSent] = useState(false);

  const loadReviews = useCallback(() => {
    if (!id) return;
    void getCourseReviews(id)
      .then(setReviews)
      .catch(() => setReviews(null));
  }, [id]);

  useEffect(() => {
    if (enrollmentError?.toLowerCase().includes("already")) {
      setDuplicateEnrollment(true);
    }
  }, [enrollmentError]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const submitReview = async () => {
    if (!id || !reviewRating || reviewSending) return;
    setReviewSending(true);
    setReviewError(null);
    try {
      await submitCourseFeedback(id, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setReviewSent(true);
      setReviewRating(0);
      setReviewComment("");
      loadReviews();
    } catch (reason) {
      setReviewError(reason instanceof Error ? reason.message : t("courseDetails.page.reviewFail"));
    } finally {
      setReviewSending(false);
    }
  };

  const isEnrolled = enrollment?.status === "active";

  const isCompleted = enrollment?.status === "completed";

  const hasFullAccess = isEnrolled || isCompleted;

  const {
    curriculum,
    isLoading: isCurriculumLoading,
    error: curriculumError,
    reload: reloadCurriculum,
  } = useCourseCurriculum(id);

  const handleStartLearning = async () => {
    if (!course?.id || isEnrolling) {
      return;
    }

    if (isInitialized && !user) {
      const returnTo = `${location.pathname}${location.search}${location.hash}`;

      sessionStorage.setItem("hbt:auth-return-to", returnTo);
      navigate(`/login?next=${encodeURIComponent(returnTo)}`);
      return;
    }

    // Enrolling twice returns an "already enrolled" API error. Existing
    // students should always continue from the first incomplete lesson.
    // Paid courses go through Stripe checkout first; free courses enroll directly.
    if (!isEnrolled && !isCompleted && !course.is_free) {
      navigate(`/checkout?course=${course.id}`);
      return;
    }
    if (!isEnrolled && !isCompleted) {
      setDuplicateEnrollment(false);
      const createdEnrollment = await enroll();

      if (!createdEnrollment) {
        return;
      }

      await Promise.all([reload(), reloadCurriculum()]);
    }

    const lessons =
      curriculum?.sections.flatMap((section) => section.lessons) ?? [];
    const nextLesson =
      lessons.find(
        (lesson) =>
          !lesson.progress?.is_completed &&
          lesson.progress?.completed_at == null,
      ) ?? lessons[0];

    if (nextLesson) {
      navigate(`/courses/${course.id}/lessons/${nextLesson.id}`);
    }
  };

  /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-9 w-40 rounded-full bg-muted" />

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="space-y-7">
                <div className="space-y-4">
                  <div className="h-6 w-32 rounded-full bg-muted" />
                  <div className="h-12 w-4/5 rounded-lg bg-muted" />
                  <div className="h-6 w-3/4 rounded-lg bg-muted" />
                </div>

                <div className="aspect-video rounded-3xl bg-muted" />

                <div className="grid gap-3 sm:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-24 rounded-2xl bg-muted" />
                  ))}
                </div>

                <div className="h-64 rounded-3xl bg-muted" />

                <div className="h-96 rounded-3xl bg-muted" />
              </div>

              <div className="h-[520px] rounded-3xl bg-muted" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
    |--------------------------------------------------------------------------
    | Error
    |--------------------------------------------------------------------------
    */

  if (error || !course) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F47822]/10">
              <BookOpen className="h-7 w-7 text-[#F47822]" />
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
              {t("courseDetails.page.errorTitle")}
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              {error ?? t("courseDetails.page.errorFallback")}
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void reload()}
                className="inline-flex items-center justify-center rounded-xl bg-[#F47822] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#e96b17] hover:shadow-md"
              >
                {t("courseDetails.page.retry")}
              </button>

              <Link
                to="/catalog"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                {t("courseDetails.page.back")}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const hasDiscount =
    !course.is_free &&
    course.discount_price !== null &&
    course.discount_price !== undefined &&
    course.price !== null &&
    course.price !== undefined &&
    course.discount_price < course.price;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pb-20">
        {/* =====================================================
                    BACK
                ====================================================== */}

        <div className="mb-8">
          <Link
            to="/catalog"
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-[#F47822]/40 hover:bg-[#F47822]/5 hover:text-[#F47822] rtl:hover:translate-x-0.5"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-[#F47822]/10">
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
            </span>
            {t("courseDetails.page.back")}
          </Link>
        </div>

        {/* =====================================================
                    HERO
                ====================================================== */}

        <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          {/* Left column uses flex order so the highest-intent blocks
              (curriculum first, reviews last) lead on every screen size. */}
          <div className="flex min-w-0 flex-col gap-8">
            {/* Heading */}

            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F47822]/20 bg-[#F47822]/10 px-3 py-1.5 text-xs font-semibold text-[#F47822]">
                  <GraduationCap className="h-3.5 w-3.5" />

                  {getDifficultyLabel(course.difficulty, t)}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Globe2 className="h-3.5 w-3.5" />

                  {course.language}
                </span>

                {course.is_free && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F47822] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("courseDetails.common.free")}
                  </span>
                )}
              </div>

              <div>
                <div className="flex max-w-4xl items-start gap-4">
                  <h1 className="flex-1 text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl lg:leading-[1.08]">
                    {course.title}
                  </h1>

                  <FavoriteButton
                    type="course"
                    id={course.id}
                    title={course.title}
                    size="md"
                    variant="solid"
                    className="mt-1 shrink-0 sm:mt-2"
                  />
                </div>

                {course.short_description && (
                  <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                    {course.short_description}
                  </p>
                )}
              </div>
            </div>

            {/* Course image */}

            <div className="group relative overflow-hidden rounded-3xl border border-border bg-muted shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
              <CourseThumbnail
                title={course.title}
                image={course.thumbnail}
                video={
                  course.title.toLowerCase().includes("can bus")
                    ? (course.preview_video ??
                      `${env.apiUrl.replace(/\/api\/?$/, "")}/storage/lessons/prev.mp4`)
                    : null
                }
                showMute={course.title.toLowerCase().includes("can bus")}
              />
            </div>

            {/* Stats */}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="group rounded-2xl border border-border bg-card p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                    <Clock3 className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("courseDetails.page.duration")}
                    </p>

                    <p className="mt-0.5 text-sm font-bold text-foreground">
                      {formatDuration(course.duration_minutes, t)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="group rounded-2xl border border-border bg-card p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3A3A3A]/10 dark:bg-white/10 text-[#3A3A3A] dark:text-[#ececef]">
                    <GraduationCap className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("courseDetails.page.difficulty")}
                    </p>

                    <p className="mt-0.5 text-sm font-bold capitalize text-foreground">
                      {course.difficulty}
                    </p>
                  </div>
                </div>
              </div>

              <div className="group rounded-2xl border border-border bg-card p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                    <Globe2 className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("courseDetails.page.language")}
                    </p>

                    <p className="mt-0.5 text-sm font-bold uppercase text-foreground">
                      {course.language}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* About */}

            <article
              id="course-description"
              className="rounded-3xl border border-border bg-card p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] sm:p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                  <BookOpen className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F47822]">
                    {t("courseDetails.page.overviewEyebrow")}
                  </p>

                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                    {t("courseDetails.page.aboutTitle")}
                  </h2>
                </div>
              </div>

              <p className="whitespace-pre-line text-base leading-8 text-muted-foreground">
                {course.description}
              </p>
            </article>

            <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] sm:p-8">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F47822]">
                    {t("courseDetails.page.reqEyebrow")}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                    {t("courseDetails.page.reqTitle")}
                  </h2>
                </div>
              </div>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {(course.metadata?.requirements?.length
                  ? course.metadata.requirements
                  : (t("courseDetails.page.reqDefaults", { returnObjects: true }) as string[])
                ).map((requirement) => (
                  <li
                    key={requirement}
                    className="flex items-start gap-3 rounded-2xl bg-muted/45 px-4 py-3 text-sm leading-6 text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F47822]" />
                    {requirement}
                  </li>
                ))}
              </ul>
            </section>

            <section className="order-6 rounded-3xl border border-border bg-card p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F47822]">
                      {t("courseDetails.page.reviewsEyebrow")}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                      {t("courseDetails.page.reviewsTitle")}
                    </h2>
                  </div>
                </div>
                {reviews && (
                  <div className="rounded-2xl bg-[#FFF8F4] dark:bg-[#F47822]/[0.08] px-4 py-2.5">
                    <div className="flex items-center gap-1 text-sm font-bold text-[#F47822]">
                      <Star className="h-4 w-4 fill-current" />
                      {reviews.summary.average_rating || "—"}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t("courseDetails.page.reviewsCount", { count: reviews.summary.count })}
                    </p>
                  </div>
                )}
              </div>
              {reviews?.reviews.length ? (
                <div className="mt-6 grid gap-3">
                  {reviews.reviews
                    .slice(0, showAllReviews ? undefined : 3)
                    .map((review) => (
                      <article
                        key={review.id}
                        className="rounded-2xl border border-border bg-muted/25 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-bold text-foreground">
                            {review.reviewer}
                          </p>
                          <div className="flex items-center gap-0.5 text-[#F47822]">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={index}
                                className={`h-3.5 w-3.5 ${index < review.rating ? "fill-current" : "text-border"}`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {review.comment}
                          </p>
                        )}
                        {review.created_at && (
                          <p className="mt-3 text-[11px] text-muted-foreground">
                            {new Intl.DateTimeFormat(dateLocale, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }).format(new Date(review.created_at))}
                          </p>
                        )}
                      </article>
                    ))}
                  {reviews.reviews.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllReviews((value) => !value)}
                      className="mt-2 inline-flex w-fit items-center rounded-xl border border-[#F47822]/20 bg-[#FFF8F4] dark:bg-[#F47822]/[0.08] px-4 py-2.5 text-sm font-bold text-[#D96319] transition hover:border-[#F47822]/40 hover:bg-[#FDEEE5]"
                    >
                      {showAllReviews
                        ? t("courseDetails.page.showFewer")
                        : t("courseDetails.page.seeAll", { n: reviews.reviews.length })}
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
                  <Star className="mx-auto h-5 w-5 text-[#F47822]" />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {t("courseDetails.page.noReviews")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("courseDetails.page.noReviewsDesc")}
                  </p>
                </div>
              )}

              {hasFullAccess && (
                <div className="mt-6 rounded-2xl border border-border bg-muted/25 p-4 sm:p-5">
                  <p className="text-sm font-bold text-foreground">
                    {t("courseDetails.page.writeReview")}
                  </p>
                  <div className="mt-3 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setReviewRating(value)}
                        aria-label={t("courseDetails.page.rateStars", { n: value })}
                      >
                        <Star
                          className={`h-6 w-6 transition ${value <= reviewRating ? "fill-[#F47822] text-[#F47822]" : "text-border hover:text-[#F47822]"}`}
                        />
                      </button>
                    ))}
                    {reviewRating === 0 && (
                      <span className="ms-2 text-xs text-muted-foreground">
                        {t("courseDetails.page.rateHint")}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder={t("courseDetails.page.reviewPh")}
                    rows={3}
                    maxLength={2000}
                    className="mt-3 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-[#F47822]"
                  />
                  {reviewError && (
                    <p role="alert" className="mt-2 text-xs font-semibold text-red-600">
                      {reviewError}
                    </p>
                  )}
                  {reviewSent && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600">
                      {t("courseDetails.page.reviewThanks")}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={!reviewRating || reviewSending}
                    onClick={() => void submitReview()}
                    className="mt-3 inline-flex items-center rounded-xl bg-[#F47822] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#e96b17] disabled:opacity-50"
                  >
                    {reviewSending ? t("courseDetails.page.reviewSending") : t("courseDetails.page.reviewSend")}
                  </button>
                </div>
              )}
            </section>

            <CourseQuizzes
              courseId={course.id}
              enrolled={isEnrolled || isCompleted}
              className="order-2"
            />

            <CourseInstructor instructor={course.instructor} className="order-3" />

            <CourseDiagnostics
              courseId={course.id}
              authenticated={Boolean(user)}
              enrolled={hasFullAccess}
              className="order-4"
            />

            <CourseCertificate
              courseId={course.id}
              courseTitle={course.title}
              authenticated={Boolean(user)}
              className="order-5"
            />

            {/* Curriculum — highest intent, leads the page */}

            <div className="order-1 pt-2">
              {isCurriculumLoading ? (
                <section className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 w-32 animate-pulse rounded bg-muted" />

                      <div className="mt-3 h-8 w-56 animate-pulse rounded bg-muted" />
                    </div>

                    <div className="hidden h-5 w-32 animate-pulse rounded bg-muted sm:block" />
                  </div>

                  <div className="space-y-4">
                    {[1, 2].map((item) => (
                      <div
                        key={item}
                        className="overflow-hidden rounded-2xl border border-border"
                      >
                        <div className="h-20 animate-pulse bg-muted" />

                        <div className="space-y-3 p-5">
                          <div className="h-12 animate-pulse rounded-xl bg-muted" />

                          <div className="h-12 animate-pulse rounded-xl bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : curriculumError ? (
                <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F47822]/10">
                    <BookOpen className="h-6 w-6 text-[#F47822]" />
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-foreground">
                    {t("courseDetails.page.curriculumErrorTitle")}
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    {curriculumError}
                  </p>

                  <button
                    type="button"
                    onClick={() => void reloadCurriculum()}
                    className="mt-5 rounded-xl bg-[#F47822] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#e96b17] hover:shadow-md"
                  >
                    {t("courseDetails.page.retry")}
                  </button>
                </div>
              ) : curriculum ? (
                <div className="space-y-6">
                  {hasFullAccess && (
                    <ContinueLearningCard
                      curriculum={curriculum}
                      isCourseCompleted={isCompleted}
                    />
                  )}

                  <CourseCurriculum
                    curriculum={curriculum}
                    isCourseCompleted={isCompleted}
                    hasFullAccess={hasFullAccess}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {/* =====================================================
                        SIDEBAR
                    ====================================================== */}

          <aside className="h-fit lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
              <div className="h-1.5 bg-[#F47822]" />

              <div className="p-6 sm:p-7">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-[#F47822]" />
                  {t("courseDetails.page.sidebarEyebrow")}
                </div>

                <div className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("courseDetails.page.priceLabel")}
                  </p>

                  <div className="mt-2 flex flex-wrap items-end gap-3">
                    <p className="text-4xl font-black tracking-tight text-foreground">
                      {formatPrice(
                        course.price,
                        course.discount_price,
                        course.is_free,
                        course.currency,
                        t,
                        dateLocale,
                      )}
                    </p>

                    {hasDiscount && (
                      <span className="pb-1 text-sm text-muted-foreground line-through">
                        {course.price} {course.currency}
                      </span>
                    )}
                  </div>

                  {hasDiscount && (
                    <span className="mt-2 inline-flex rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-600">
                      {t("courseDetails.page.specialPrice")}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleStartLearning()}
                  disabled={isEnrolling || duplicateEnrollment}

                  className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F47822] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e96b17] hover:shadow-[0_12px_28px_rgba(244,120,34,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlayCircle className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />

                  {isEnrolling
                    ? t("courseDetails.page.cta.enrolling")
                    : duplicateEnrollment
                      ? t("courseDetails.page.cta.alreadyEnrolled")
                      : isCompleted
                        ? t("courseDetails.page.cta.review")
                        : isEnrolled
                          ? t("courseDetails.page.cta.continue")
                          : course.is_free
                            ? t("courseDetails.page.cta.start")
                            : t("courseDetails.page.cta.enroll")}
                </button>

                {enrollmentError && (
                  <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">
                    {enrollmentError}
                  </p>
                )}

                <div className="mt-7 border-t border-border pt-6">
                  <p className="text-sm font-bold text-foreground">
                    {t("courseDetails.page.includes")}
                  </p>

                  <div className="mt-4 space-y-3.5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F47822]" />

                      <span className="text-sm leading-5 text-muted-foreground">
                        {t("courseDetails.page.includesCurriculum")}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#F47822]" />

                      <span className="text-sm leading-5 text-muted-foreground">
                        {t("courseDetails.page.includesDuration", { dur: formatDuration(course.duration_minutes, t) })}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-[#F47822]" />

                      <span className="text-sm leading-5 text-muted-foreground">
                        {t("courseDetails.page.levelTraining", { label: getDifficultyLabel(course.difficulty, t) })}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F47822]" />

                      <span className="text-sm leading-5 text-muted-foreground">
                        {t("courseDetails.page.includesLang", { lang: course.language.toUpperCase() })}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#F47822]" />

                      <span className="text-sm leading-5 text-muted-foreground">
                        {t("courseDetails.page.includesPace")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3 border-t border-border pt-6">
                  <div className="rounded-xl bg-muted/60 p-3.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("courseDetails.page.duration")}
                    </p>

                    <p className="mt-1 text-sm font-bold text-foreground">
                      {formatDuration(course.duration_minutes, t)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-muted/60 p-3.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("courseDetails.page.level")}
                    </p>

                    <p className="mt-1 text-sm font-bold capitalize text-foreground">
                      {course.difficulty}
                    </p>
                  </div>

                  <div className="rounded-xl bg-muted/60 p-3.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("courseDetails.page.language")}
                    </p>

                    <p className="mt-1 text-sm font-bold uppercase text-foreground">
                      {course.language}
                    </p>
                  </div>

                  <div className="rounded-xl bg-muted/60 p-3.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("courseDetails.page.access")}
                    </p>

                    <p className="mt-1 text-sm font-bold text-foreground">
                      {t("courseDetails.page.lifetime")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>

      {/* Sticky mobile CTA — the sidebar stacks far down on small screens,
          so price + primary action stay reachable while scrolling. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("courseDetails.page.priceLabel")}
            </p>
            <p className="truncate text-lg font-black tracking-tight text-foreground">
              {formatPrice(course.price, course.discount_price, course.is_free, course.currency, t, dateLocale)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleStartLearning()}
            disabled={isEnrolling || duplicateEnrollment}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#F47822] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.22)] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isEnrolling
              ? t("courseDetails.page.cta.enrolling")
              : duplicateEnrollment
                ? t("courseDetails.page.cta.alreadyEnrolled")
                : isCompleted
                  ? t("courseDetails.page.cta.review")
                  : isEnrolled
                    ? t("courseDetails.page.cta.continue")
                    : course.is_free
                      ? t("courseDetails.page.cta.start")
                      : t("courseDetails.page.cta.enroll")}
          </button>
        </div>
      </div>
    </main>
  );
}
