import { useCallback, useState } from "react";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  Loader2,
  PlayCircle,
} from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";

import {
  completeLesson,
  updateLessonProgress,
  getLearningCurriculum,
} from "../api/lessons.api";

import { useLesson } from "../hooks/useLesson";
import { useLearningCurriculum } from "../hooks/useLearningCurriculum";

import { LessonVideoPlayer } from "../components/LessonVideoPlayer";

import { LessonNavigation } from "../components/LessonNavigation";

import { LessonCurriculum } from "../components/LessonCurriculum";
import { LessonResources } from "../components/LessonResources";
import { LessonNotes } from "../components/LessonNotes";
import { LessonFeedback } from "../components/LessonFeedback";
import { LessonMentorPopup } from "../components/LessonMentorPopup";

export function LessonPlayerPage() {
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
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F7] px-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F47822]/10">
            <BookOpen className="h-8 w-8 text-[#F47822]" />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#F47822]">
            Learning
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A]">
            Lesson not found
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            The lesson ID is missing or invalid.
          </p>

          <Link
            to="/courses"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#df6819] hover:shadow-[0_12px_28px_rgba(244,120,34,0.25)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  if (!courseId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F7] px-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F47822]/10">
            <BookOpen className="h-8 w-8 text-[#F47822]" />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#F47822]">
            Learning
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A]">
            Course not found
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            This lesson does not have a valid course ID.
          </p>

          <Link
            to="/courses"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#df6819] hover:shadow-[0_12px_28px_rgba(244,120,34,0.25)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to courses
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
  const navigate = useNavigate();
  const [activeContentTab, setActiveContentTab] = useState<
    "overview" | "notes" | "documentation" | "feedback"
  >("overview");
  const { curriculum, reload: reloadCurriculum } =
    useLearningCurriculum(courseId);
  const { lesson, isLoading, error, reload } = useLesson(lessonId);

  const handleProgress = useCallback(
    async (percentage: number, timeSpent: number) => {
      try {
        await updateLessonProgress(lessonId, {
          progress_percentage: percentage,
          time_spent: timeSpent,
        });
      } catch (error) {
        console.error("Failed to update lesson progress:", error);
      }
    },
    [lessonId],
  );

  const handleComplete = useCallback(async () => {
    try {
      await completeLesson(lessonId);

      // Refresh the lesson after the server has synchronized
      // lesson, section, course, and enrollment completion data.
      await reload();

      // Keep the curriculum sidebar in sync before navigating. The
      // curriculum endpoint is also used by Course Details, so a
      // fresh response here prevents stale play/locked icons.
      await reloadCurriculum();

      const curriculum = await getLearningCurriculum(courseId);
      const lessons = curriculum.sections.flatMap((section) => section.lessons);
      const currentIndex = lessons.findIndex((item) => item.id === lessonId);
      const nextLesson = lessons[currentIndex + 1];

      if (nextLesson) {
        navigate(`/courses/${courseId}/lessons/${nextLesson.id}`);
      }
    } catch (error) {
      console.error("Failed to complete lesson:", error);
    }
  }, [courseId, lessonId, navigate, reload, reloadCurriculum]);

  /*
   * Loading state.
   */
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F7] px-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            <Loader2 className="h-7 w-7 animate-spin text-[#F47822]" />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#F47822]">
            HBT Learning
          </p>

          <p className="mt-2 text-sm font-medium text-[#3A3A3A]">
            Loading lesson...
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Preparing your learning experience
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
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F7] px-6">
        <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <BookOpen className="h-7 w-7" />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#F47822]">
            Learning
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A]">
            Unable to load lesson
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
            {error ?? "Something went wrong while loading this lesson."}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void reload()}
              className="inline-flex items-center justify-center rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#df6819]"
            >
              Try again
            </button>

            <Link
              to={`/courses/${courseId}`}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-[#3A3A3A] transition-all hover:border-[#F47822]/30 hover:bg-[#F47822]/5 hover:text-[#F47822]"
            >
              Back to course
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
    <div className="min-h-screen bg-[#F7F7F7]">
      <LessonMentorPopup
        lessonTitle={lesson.title}
        lessonId={lesson.id}
        courseId={courseId}
      />
      {/* =====================================================
                LEARNING HEADER
            ====================================================== */}

      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to={`/courses/${courseId}`}
            className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:-translate-x-0.5 hover:border-[#F47822]/30 hover:bg-[#F47822]/5 hover:text-[#F47822]"
            aria-label="Back to course"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          </Link>

          <div className="h-8 w-px bg-gray-200" />

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
              HBT Learning
            </p>

            <h1 className="mt-0.5 truncate text-sm font-bold text-[#3A3A3A] sm:text-base">
              {lesson.title}
            </h1>
          </div>

          {lesson.is_preview && (
            <span className="hidden shrink-0 items-center rounded-full bg-[#F47822]/10 px-3 py-1.5 text-xs font-bold text-[#F47822] sm:inline-flex">
              Preview
            </span>
          )}
        </div>
      </header>

      {/* =====================================================
                MAIN LEARNING AREA
            ====================================================== */}

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px] xl:gap-8">
          {/* =================================================
                        LEFT — LESSON
                    ================================================== */}

          <section className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-[0_5px_20px_rgba(15,23,42,0.035)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isCompleted ? "bg-emerald-50 text-emerald-600" : "bg-[#F47822]/10 text-[#F47822]"}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <PlayCircle className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F47822]">
                    Your learning session
                  </p>
                  <p className="truncate text-sm font-semibold text-[#3A3A3A]">
                    {isCompleted
                      ? "Lesson completed — review anytime"
                      : progressPercentage > 0
                        ? "In progress — pick up where you left off"
                        : "Ready when you are"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-gray-500 sm:border-l sm:border-gray-100 sm:pl-4">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-[#F47822]" />
                  {lesson.duration_minutes} min
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 font-bold ${isCompleted ? "bg-emerald-50 text-emerald-700" : "bg-[#F47822]/10 text-[#F47822]"}`}
                >
                  {isCompleted
                    ? "Completed"
                    : `${progressPercentage}% complete`}
                </span>
              </div>
            </div>

            {/* Video */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-black shadow-[0_12px_40px_rgba(15,23,42,0.10)]">
              <LessonVideoPlayer
                lesson={lesson}
                progress={lesson.progress}
                onProgress={handleProgress}
                onComplete={handleComplete}
                onPreviousLesson={
                  previousLesson
                    ? () =>
                        navigate(
                          `/courses/${courseId}/lessons/${previousLesson.id}`,
                        )
                    : undefined
                }
                onNextLesson={
                  nextLesson
                    ? () =>
                        navigate(
                          `/courses/${courseId}/lessons/${nextLesson.id}`,
                        )
                    : undefined
                }
              />
            </div>

            <section className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
              <nav
                className="flex overflow-x-auto border-b border-gray-100 px-3 sm:px-5"
                aria-label="Lesson content sections"
              >
                {(
                  [
                    ["overview", "Overview", Info],
                    ["notes", "Notes", FileText],
                    ["documentation", "Documentation", FileText],
                    ["feedback", "Feedback", CheckCircle2],
                  ] as const
                ).map(([tab, label, Icon]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveContentTab(tab)}
                    className={`relative inline-flex shrink-0 items-center gap-2 px-3 py-4 text-xs font-bold transition-colors sm:px-4 ${activeContentTab === tab ? "text-[#F47822]" : "text-gray-400 hover:text-[#3A3A3A]"}`}
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
                    <div className="border-b border-gray-100 px-5 py-5 sm:px-7 sm:py-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10">
                              <BookOpen className="h-4.5 w-4.5 text-[#F47822]" />
                            </div>

                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#F47822]">
                              Lesson {lesson.position}
                            </p>
                          </div>

                          <h2 className="mt-4 text-xl font-bold tracking-tight text-[#3A3A3A] sm:text-2xl">
                            {lesson.title}
                          </h2>
                        </div>

                        {lesson.is_preview && (
                          <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-[#F47822]/20 bg-[#F47822]/10 px-3 py-1.5 text-xs font-bold text-[#F47822]">
                            Preview
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="px-5 py-6 sm:px-7 sm:py-7">
                      {lesson.description && (
                        <p className="text-sm leading-7 text-gray-600 sm:text-base">
                          {lesson.description}
                        </p>
                      )}

                      {lesson.content && (
                        <div
                          className="prose prose-sm mt-6 max-w-none text-gray-700 prose-headings:text-[#3A3A3A] prose-a:text-[#F47822] prose-strong:text-[#3A3A3A] sm:prose-base"
                          dangerouslySetInnerHTML={{
                            __html: lesson.content,
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
            </section>
          </section>

          {/* =================================================
                        RIGHT — CURRICULUM
                    ================================================== */}

          <aside className="lg:sticky lg:top-[96px] lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
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
