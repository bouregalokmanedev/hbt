import { useCallback, useRef, useState } from "react";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  Loader2,
  NotebookPen,
  PlayCircle,
  UserRound,
} from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  completeLesson,
  updateLessonProgress,
  getLearningCurriculum,
} from "../api/lessons.api";
import {
  nextStepPath,
  resolveNextStep,
} from "../utils/lesson-navigation";

import { FavoriteButton } from "@/features/favorites/components/FavoriteButton";
import { useLesson } from "../hooks/useLesson";
import { useLearningCurriculum } from "../hooks/useLearningCurriculum";

import { LessonVideoPlayer } from "../components/LessonVideoPlayer";

import { LessonNavigation } from "../components/LessonNavigation";

import { LessonCurriculum } from "../components/LessonCurriculum";
import { LessonResources } from "../components/LessonResources";
import { LessonNotes } from "../components/LessonNotes";
import { LessonFeedback } from "../components/LessonFeedback";
import { LessonDiagnostics } from "../components/LessonDiagnostics";
import { LessonInstructor } from "../components/LessonInstructor";
import { LessonMentorPopup } from "../components/LessonMentorPopup";
import { sanitizeHtml } from "@/lib/sanitize-html";

export function LessonPlayerPage() {
  const { t } = useTranslation();
  const { lessonId, courseId } = useParams<{
    lessonId: string;
    courseId: string;
  }>();

  /*
   * Never pass an undefined courseId
   * to components that require string.
   */
  if (!lessonId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F7] dark:bg-[#101013] px-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-8 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F47822]/10">
            <BookOpen className="h-8 w-8 text-[#F47822]" />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#F47822]">
            {t("lessonPlayer.page.learning")}
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
            {t("lessonPlayer.page.lessonNotFound")}
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            {t("lessonPlayer.page.lessonNotFoundDesc")}
          </p>

          <Link
            to="/courses"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#df6819] hover:shadow-[0_12px_28px_rgba(244,120,34,0.25)]"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("lessonPlayer.page.backCourses")}
          </Link>
        </div>
      </div>
    );
  }

  if (!courseId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F7] dark:bg-[#101013] px-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-8 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F47822]/10">
            <BookOpen className="h-8 w-8 text-[#F47822]" />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#F47822]">
            {t("lessonPlayer.page.learning")}
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
            {t("lessonPlayer.page.courseNotFound")}
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            {t("lessonPlayer.page.courseNotFoundDesc")}
          </p>

          <Link
            to="/courses"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#df6819] hover:shadow-[0_12px_28px_rgba(244,120,34,0.25)]"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("lessonPlayer.page.backCourses")}
          </Link>
        </div>
      </div>
    );
  }

  return <LessonPlayerContent lessonId={lessonId} courseId={courseId} />;
}

interface LessonPlayerContentProps {
  lessonId: string;
  courseId: string;
}

function LessonPlayerContent({ lessonId, courseId }: LessonPlayerContentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeContentTab, setActiveContentTab] = useState<
    "overview" | "notes" | "documentation" | "feedback" | "instructor"
  >("overview");
  const [theaterMode, setTheaterMode] = useState(false);
  const { curriculum, reload: reloadCurriculum } =
    useLearningCurriculum(courseId);
  const { lesson, isLoading, error, reload, applyProgress } = useLesson(lessonId);

  /*
   * Ambient glow layer behind the video. Mutated directly (no re-render)
   * a few times per second while the video plays.
   */
  const videoAmbientRef = useRef<HTMLDivElement | null>(null);

  const handleAmbientColor = useCallback((color: string) => {
    const node = videoAmbientRef.current;

    if (node) {
      node.style.backgroundColor = `rgba(${color}, 0.45)`;
    }
  }, []);

  const handleProgress = useCallback(
    async (percentage: number, timeSpent: number) => {
      try {
        const serverProgress = await updateLessonProgress(lessonId, {
          progress_percentage: percentage,
          time_spent: timeSpent,
        });
        // Keep the session header live — the player only reports, the
        // server response is the source of truth.
        applyProgress(serverProgress);
      } catch (error) {
        console.error("Failed to update lesson progress:", error);
      }
    },
    [lessonId, applyProgress],
  );

  const handleComplete = useCallback(async () => {
    try {
      const serverProgress = await completeLesson(lessonId);
      applyProgress(serverProgress);

      // Refresh the lesson after the server has synchronized
      // lesson, section, course, and enrollment completion data.
      await reload();

      // Keep the curriculum sidebar in sync before navigating. The
      // curriculum endpoint is also used by Course Details, so a
      // fresh response here prevents stale play/locked icons.
      await reloadCurriculum();

      const freshCurriculum = await getLearningCurriculum(courseId);
      // Section-aware: a finished section routes to its quiz checkpoint
      // instead of jumping straight into the next section.
      const step = resolveNextStep(freshCurriculum, lessonId);

      if (step) {
        navigate(nextStepPath(courseId, step));
      }
    } catch (error) {
      console.error("Failed to complete lesson:", error);
    }
  }, [courseId, lessonId, navigate, reload, reloadCurriculum, applyProgress]);

  /*
   * Loading state.
   */
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F7] dark:bg-[#101013] px-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-[#1b1b20] shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            <Loader2 className="h-7 w-7 animate-spin text-[#F47822]" />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#F47822]">
            {t("lessonPlayer.page.brand")}
          </p>

          <p className="mt-2 text-sm font-medium text-[#3A3A3A] dark:text-[#ececef]">
            {t("lessonPlayer.page.loadingLesson")}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {t("lessonPlayer.page.loadingDesc")}
          </p>
        </div>
      </div>
    );
  }

  /*
   * Error state.
   */
  if (error || !lesson) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F7] dark:bg-[#101013] px-6">
        <div className="w-full max-w-lg rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-8 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500">
            <BookOpen className="h-7 w-7" />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#F47822]">
            {t("lessonPlayer.page.learning")}
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
            {t("lessonPlayer.page.loadFail")}
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
            {error ?? t("lessonPlayer.page.loadFailFallback")}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void reload()}
              className="inline-flex items-center justify-center rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#df6819]"
            >
              {t("lessonPlayer.page.retry")}
            </button>

            <Link
              to={`/courses/${courseId}`}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-5 py-3 text-sm font-bold text-[#3A3A3A] dark:text-[#ececef] transition-all hover:border-[#F47822]/30 hover:bg-[#F47822]/5 hover:text-[#F47822]"
            >
              {t("lessonPlayer.page.backCourse")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navigationLessons =
    curriculum?.sections.flatMap((section) => section.lessons) ?? [];
  const currentLessonIndex = navigationLessons.findIndex(
    (item) => item.id === lesson.id,
  );
  const previousLesson = navigationLessons[currentLessonIndex - 1];
  const nextLesson = navigationLessons[currentLessonIndex + 1];
  const progressPercentage = Math.min(
    100,
    Math.max(0, lesson.progress?.progress_percentage ?? 0),
  );
  const isCompleted =
    lesson.progress?.is_completed === true ||
    lesson.progress?.completed_at != null;

  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-[#101013]">
      <LessonMentorPopup
        lessonTitle={lesson.title}
        lessonId={lesson.id}
        courseId={courseId}
      />
      {/* =====================================================
                LEARNING HEADER
            ====================================================== */}

      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-white/10 dark:bg-[#1b1b20]/95">
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to={`/courses/${courseId}`}
            className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] text-gray-500 transition-all hover:-translate-x-0.5 hover:border-[#F47822]/30 hover:bg-[#F47822]/5 hover:text-[#F47822] rtl:hover:translate-x-0.5"
            aria-label={t("lessonPlayer.page.backCourse")}
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
          </Link>

          <div className="h-8 w-px bg-gray-200 dark:bg-white/10" />

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
              {t("lessonPlayer.page.brand")}
            </p>

            <h1 className="mt-0.5 truncate text-sm font-bold text-[#3A3A3A] dark:text-[#ececef] sm:text-base">
              {lesson.title}
            </h1>
          </div>

          {lesson.is_preview && (
            <span className="hidden shrink-0 items-center rounded-full bg-[#F47822]/10 px-3 py-1.5 text-xs font-bold text-[#F47822] sm:inline-flex">
              {t("lessonPlayer.page.preview")}
            </span>
          )}

          <FavoriteButton
            type="lesson"
            id={lesson.id}
            title={lesson.title}
            meta={{ course_id: courseId }}
            size="sm"
            variant="solid"
            className="shrink-0"
          />
        </div>
      </header>

      {/* =====================================================
                MAIN LEARNING AREA
            ====================================================== */}

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className={`grid gap-6 xl:gap-8 ${theaterMode ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_390px]"}`}>
          {/* =================================================
                        LEFT — LESSON
                    ================================================== */}

          <section className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-4 py-3 shadow-[0_5px_20px_rgba(15,23,42,0.035)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isCompleted ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-[#F47822]/10 text-[#F47822]"}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <PlayCircle className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F47822]">
                    {t("lessonPlayer.page.sessionEyebrow")}
                  </p>
                  <p className="truncate text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                    {isCompleted
                      ? t("lessonPlayer.page.completedMsg")
                      : progressPercentage > 0
                        ? t("lessonPlayer.page.inProgressMsg")
                        : t("lessonPlayer.page.readyMsg")}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-gray-500 sm:border-l sm:border-gray-100 dark:sm:border-white/10 sm:pl-4">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-[#F47822]" />
                  {lesson.duration_minutes} {t("lessonPlayer.page.min")}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 font-bold ${isCompleted ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-[#F47822]/10 text-[#F47822]"}`}
                >
                  {isCompleted
                    ? t("lessonPlayer.page.completed")
                    : t("lessonPlayer.page.pctComplete", { pct: progressPercentage })}
                </span>
              </div>
            </div>

            {/* Video — capped width in theater mode so lower-resolution
                videos pillarbox on black instead of blowing up. */}
            <div className={`relative ${theaterMode ? "mx-auto w-full max-w-5xl" : ""}`}>
              <div
                ref={videoAmbientRef}
                aria-hidden="true"
                className="pointer-events-none absolute -inset-3 rounded-[28px] bg-[#F47822]/25 blur-2xl transition-colors duration-700"
              />
              <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-black shadow-[0_12px_40px_rgba(15,23,42,0.10)]">
                <LessonVideoPlayer
                  lesson={lesson}
                  progress={lesson.progress}
                  onProgress={handleProgress}
                  onComplete={handleComplete}
                  theaterMode={theaterMode}
                  onToggleTheater={() => setTheaterMode((value) => !value)}
                  onAmbientColor={handleAmbientColor}
                onPreviousLesson={
                  previousLesson
                    ? () =>
                        navigate(
                          `/courses/${courseId}/lessons/${previousLesson.id}`,
                        )
                    : undefined
                }
                onNextLesson={
                  (() => {
                    const step = resolveNextStep(curriculum, lesson.id);
                    if (step) {
                      return () => navigate(nextStepPath(courseId, step));
                    }
                    return nextLesson
                      ? () =>
                          navigate(
                            `/courses/${courseId}/lessons/${nextLesson.id}`,
                          )
                      : undefined;
                  })()
                }
              />
              </div>
            </div>

            <section className="mt-6 overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
              <nav
                className="flex overflow-x-auto border-b border-gray-100 dark:border-white/10 px-3 sm:px-5"
                aria-label={t("lessonPlayer.page.contentSections")}
              >
                {(
                  [
                    ["overview", t("lessonPlayer.page.tabs.overview"), Info],
                    ["notes", t("lessonPlayer.page.tabs.notes"), NotebookPen],
                    ["documentation", t("lessonPlayer.page.tabs.documentation"), FileText],
                    ["feedback", t("lessonPlayer.page.tabs.feedback"), CheckCircle2],
                    ["instructor", t("lessonPlayer.page.tabs.instructor"), UserRound],
                  ] as const
                ).map(([tab, label, Icon]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveContentTab(tab)}
                    className={`relative inline-flex shrink-0 items-center gap-2 px-3 py-4 text-xs font-bold transition-colors sm:px-4 ${activeContentTab === tab ? "text-[#F47822]" : "text-gray-400 hover:text-[#3A3A3A] dark:hover:text-[#ececef]"}`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                    {activeContentTab === tab && (
                      <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[#F47822] sm:inset-x-4" />
                    )}
                  </button>
                ))}
              </nav>
              {activeContentTab === "overview" && (
                <>
                  {/* Lesson information */}
                  <article>
                    <div className="border-b border-gray-100 dark:border-white/10 px-5 py-5 sm:px-7 sm:py-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10">
                              <BookOpen className="h-4.5 w-4.5 text-[#F47822]" />
                            </div>

                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#F47822]">
                              {t("lessonPlayer.page.lessonN", { n: lesson.position })}
                            </p>
                          </div>

                          <h2 className="mt-4 text-xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef] sm:text-2xl">
                            {lesson.title}
                          </h2>
                        </div>

                        {lesson.is_preview && (
                          <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-[#F47822]/20 bg-[#F47822]/10 px-3 py-1.5 text-xs font-bold text-[#F47822]">
                            {t("lessonPlayer.page.preview")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="px-5 py-6 sm:px-7 sm:py-7">
                      {lesson.description && (
                        <p className="text-sm leading-7 text-gray-600 dark:text-gray-300 sm:text-base">
                          {lesson.description}
                        </p>
                      )}

                      {lesson.content && (
                        <div
                          className="prose prose-sm mt-6 max-w-none text-gray-700 prose-headings:text-[#3A3A3A] dark:prose-headings:text-[#ececef] prose-a:text-[#F47822] prose-strong:text-[#3A3A3A] dark:prose-strong:text-[#ececef] sm:prose-base dark:text-gray-300 dark:prose-invert"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(lesson.content),
                          }}
                        />
                      )}
                    </div>
                  </article>
                </>
              )}

              {activeContentTab === "notes" && (
                <LessonNotes lessonId={lesson.id} />
              )}
              {activeContentTab === "documentation" && (
                <LessonResources media={lesson.media} />
              )}
              {activeContentTab === "feedback" && (
                <LessonFeedback courseId={courseId} lessonId={lesson.id} />
              )}
              {activeContentTab === "instructor" && (
                <LessonInstructor courseId={courseId} />
              )}
            </section>

            <LessonDiagnostics courseId={courseId} />
          </section>

          {/* =================================================
                        RIGHT — CURRICULUM
                    ================================================== */}

          <aside className={theaterMode ? "" : "lg:sticky lg:top-[96px] lg:self-start"}>
            <div className="overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
              <LessonCurriculum
                key={`${courseId}-${lesson.progress?.completed_at ?? "active"}-${lesson.progress?.progress_percentage ?? 0}`}
                courseId={courseId}
                currentLessonId={lesson.id}
              />
            </div>
          </aside>
        </div>
      </main>

      {/* =====================================================
                LESSON NAVIGATION
            ====================================================== */}

      <div className="mx-auto max-w-[1600px] px-4 pb-10 sm:px-6 lg:px-8">
        <LessonNavigation courseId={courseId} lesson={lesson} />
      </div>
    </div>
  );
}
