import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Loader2,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    useTranslation,
} from "react-i18next";

import {
    getCourseCurriculum,
} from "@/features/courses/api/courses.api";

import type {
    CourseCurriculum,
} from "@/features/courses/types/course.types";

import {
    completeLesson,
} from "../api/lessons.api";

import {
    nextStepPath,
    resolveNextStep,
} from "../utils/lesson-navigation";

import type {
    Lesson,
} from "../types/lesson.types";


interface LessonNavigationProps {
    lesson: Lesson;
    courseId: string;
}

export function LessonNavigation({
    lesson,
    courseId,
}: LessonNavigationProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [
        curriculum,
        setCurriculum,
    ] = useState<CourseCurriculum | null>(
        null,
    );

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        isCompleting,
        setIsCompleting,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null,
    );

    const [
        isCompleted,
        setIsCompleted,
    ] = useState(
        lesson.progress?.is_completed === true ||
            lesson.progress?.completed_at !== null,
    );


    /*
     * Load curriculum.
     */
    useEffect(() => {
        let cancelled = false;

        async function loadCurriculum() {
            try {
                setIsLoading(true);
                setError(null);

                const data =
                    await getCourseCurriculum(
                        courseId,
                    );

                if (!cancelled) {
                    setCurriculum(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : t("lessonPlayer.nav.loadFail"),
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        void loadCurriculum();

        return () => {
            cancelled = true;
        };
    }, [courseId]);


    /*
     * Keep completion state synchronized
     * when navigating between lessons.
     */
    useEffect(() => {
        setIsCompleted(
            lesson.progress?.is_completed === true ||
                lesson.progress?.completed_at !== null,
        );
    }, [
        lesson.id,
        lesson.progress?.is_completed,
        lesson.progress?.completed_at,
    ]);


    /*
     * Flatten curriculum into one ordered
     * lesson list.
     */
    const lessons = useMemo(() => {
        if (!curriculum) {
            return [];
        }

        return curriculum.sections
            .slice()
            .sort(
                (a, b) =>
                    a.position -
                    b.position,
            )
            .flatMap(
                (section) =>
                    section.lessons
                        .slice()
                        .sort(
                            (a, b) =>
                                a.position -
                                b.position,
                        ),
            );
    }, [curriculum]);


    /*
     * Find current lesson.
     */
    const currentIndex =
        lessons.findIndex(
            (item) =>
                item.id === lesson.id,
        );


    const previousLesson =
        currentIndex > 0
            ? lessons[
                  currentIndex - 1
              ]
            : null;


    const nextLesson =
        currentIndex >= 0 &&
        currentIndex <
            lessons.length - 1
            ? lessons[
                  currentIndex + 1
              ]
            : null;


    /*
     * Navigate to another lesson.
     */
    function goToLesson(
        lessonId: string,
    ) {
        navigate(
            `/courses/${courseId}/lessons/${lessonId}`,
        );
    }


    /*
     * Complete current lesson.
     */
    async function handleCompleteLesson() {
        if (
            isCompleting ||
            isCompleted
        ) {
            return;
        }

        try {
            setIsCompleting(true);
            setError(null);

            await completeLesson(
                lesson.id,
            );

            setIsCompleted(true);

            /*
             * Section-aware routing: a finished section goes to its
             * quiz checkpoint instead of jumping to the next section.
             * The curriculum reload keeps per-lesson statuses truthful
             * on the page we land on.
             */
            try {
                const fresh = await getCourseCurriculum(courseId);
                setCurriculum(fresh);
                const step = resolveNextStep(fresh, lesson.id);
                if (step) {
                    navigate(nextStepPath(courseId, step));
                    return;
                }
            } catch {
                // Fall back to plain next-lesson navigation below.
            }

            if (nextLesson) {
                goToLesson(
                    nextLesson.id,
                );
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : t("lessonPlayer.nav.completeFail"),
            );
        } finally {
            setIsCompleting(false);
        }
    }


    /*
     * Loading.
     */
    if (isLoading) {
        return (
            <div className="mx-auto mt-10 flex max-w-4xl items-center justify-center border-t border-border pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-[#F47822]" />

                    {t("lessonPlayer.nav.loading")}
                </div>
            </div>
        );
    }


    /*
     * Error loading curriculum.
     */
    if (error && !curriculum) {
        return (
            <div className="mx-auto mt-10 max-w-4xl border-t border-border pt-6">
                <p className="text-center text-sm text-red-500">
                    {error}
                </p>
            </div>
        );
    }


    return (
        <div className="mt-8 rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-4 shadow-[0_8px_28px_rgba(15,23,42,0.045)] sm:p-5">
            {/* Navigation */}
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-1 pb-3 text-[11px] font-medium text-muted-foreground">
                <span>{t("lessonPlayer.nav.lessonOf", { cur: currentIndex + 1, total: lessons.length })}</span>
                <span className={isCompleted ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-[#F47822]"}>{isCompleted ? t("lessonPlayer.nav.completed") : t("lessonPlayer.nav.keepGoing")}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
                {/* Previous */}
                <button
                    type="button"
                    disabled={!previousLesson}
                    onClick={() => {
                        if (
                            previousLesson
                        ) {
                            goToLesson(
                                previousLesson.id,
                            );
                        }
                    }}
                    className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-3.5 py-2.5
                        text-xs
                        font-medium
                        text-foreground
                        transition-all hover:border-[#F47822]/25 hover:bg-[#F47822]/5 hover:text-[#F47822]
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                    "
                >
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" />

                    {t("lessonPlayer.nav.prev")}
                </button>


                {/* Complete / Next */}
                {isCompleted ? (
                    nextLesson ? (
                        <button
                            type="button"
                            onClick={() => {
                                const step = resolveNextStep(curriculum, lesson.id);
                                if (step) {
                                    navigate(nextStepPath(courseId, step));
                                } else {
                                    goToLesson(nextLesson.id);
                                }
                            }}
                            className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                bg-[#F47822]
                                px-4
                                py-2.5
                                text-xs
                                font-medium
                                text-white
                                transition-all
                                hover:bg-[#df6819] hover:shadow-md
                            "
                        >
                            {t("lessonPlayer.nav.next")}

                            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                        </button>
                    ) : (
                        <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />

                            {t("lessonPlayer.nav.courseComplete")}
                        </div>
                    )
                ) : (
                    <button
                        type="button"
                        disabled={
                            isCompleting
                        }
                        onClick={() =>
                            void handleCompleteLesson()
                        }
                        className="
                            inline-flex
                            items-center
                            gap-2
                        rounded-xl bg-[#F47822] px-4 py-2.5
                        text-xs
                            font-semibold
                            text-white
                            transition-all
                            hover:bg-[#df6819]
                            hover:shadow-md
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >
                        {isCompleting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />

                                {t("lessonPlayer.nav.completing")}
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4" />

                                {t("lessonPlayer.nav.complete")}
                            </>
                        )}
                    </button>
                )}
            </div>


            {/* Error */}
            {error && (
                <p className="mt-4 text-center text-sm text-red-500">
                    {error}
                </p>
            )}


            {/* Lesson information */}
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-gray-100 dark:border-white/10 pt-3 text-[11px] text-muted-foreground">
                <span className="min-w-0 truncate">
                    {previousLesson
                        ? t("lessonPlayer.nav.prevLabel", { title: previousLesson.title })
                        : t("lessonPlayer.nav.first")}
                </span>

                <span className="shrink-0">
                    {currentIndex >=
                        0 &&
                    lessons.length > 0
                        ? `${currentIndex + 1} / ${lessons.length}`
                        : ""}
                </span>

                <span className="min-w-0 truncate text-right">
                    {nextLesson
                        ? t("lessonPlayer.nav.nextLabel", { title: nextLesson.title })
                        : t("lessonPlayer.nav.last")}
                </span>
            </div>
        </div>
    );
}
