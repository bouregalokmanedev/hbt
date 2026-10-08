
import {
    BookOpen,
    CheckCircle2,
    Loader2,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    useTranslation,
} from "react-i18next";

import { getAssessments, type Assessment } from "@/features/assessments/api/assessments.api";
import { ClipboardCheck, LockKeyhole, PlayCircle } from "lucide-react";

import type {
    CourseCurriculum,
    CourseLesson,
} from "@/features/courses/types/course.types";

import {
    LessonCurriculumSection,
} from "./LessonCurriculumSection";

interface LearningCurriculumProps {
    courseId: string;
    currentLessonId: string;
    curriculum: CourseCurriculum | null;
    isLoading: boolean;
    error: string | null;
    onReload: () => void;
}

export function LessonCurriculum({
    courseId,
    currentLessonId,
    curriculum,
    isLoading,
    error,
    onReload,
}: LearningCurriculumProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [assessments, setAssessments] = useState<Assessment[]>([]);

    useEffect(() => { void getAssessments().then(setAssessments).catch(() => setAssessments([])); }, []);

    const handleLessonSelect = (
        lesson: CourseLesson,
    ) => {
        /*
         * Unpublished lessons are locked.
         */
        if (lesson.status !== "published") {
            return;
        }

        /*
         * Navigate to the selected lesson.
         */
        navigate(
            `/courses/${courseId}/lessons/${lesson.id}`,
        );
    };

    if (isLoading) {
        return (
            <aside className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex h-20 items-center justify-center">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2
                            className="h-4 w-4 animate-spin text-[#F47822]"
                            strokeWidth={2}
                        />

                        {t("lessonPlayer.curriculum.loading")}
                    </div>
                </div>
            </aside>
        );
    }

    if (error) {
        return (
            <aside className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                        <BookOpen className="h-4 w-4 text-red-500" />
                    </div>

                    <h3 className="mt-2 text-sm font-semibold text-foreground">
                        {t("lessonPlayer.curriculum.unavailable")}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={onReload}
                        className="mt-3 rounded-lg bg-[#F47822] px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-[#df6817]"
                    >
                        {t("lessonPlayer.curriculum.retry")}
                    </button>
                </div>
            </aside>
        );
    }

    if (!curriculum) {
        return null;
    }

    const allLessons =
        curriculum.sections.flatMap(
            (section) =>
                section.lessons,
        );

    /*
     * A lesson is completed when either
     * backend completion field confirms it.
     */
    const completedLessons =
        allLessons.filter(
            (lesson) =>
                lesson.progress?.is_completed === true ||
                lesson.progress?.completed_at != null,
        ).length;

    const totalLessons =
        allLessons.length;

    const courseCompleted =
        totalLessons > 0 &&
        completedLessons === totalLessons;

    const courseProgress =
        totalLessons > 0
            ? Math.round(
                  allLessons.reduce(
                      (total, lesson) =>
                          total +
                          (lesson.progress?.is_completed ||
                          lesson.progress?.completed_at
                              ? 100
                              : lesson.progress?.progress_percentage ?? 0),
                      0,
                  ) / totalLessons,
              )
            : 0;

    const lockedLessonIds = new Set<string>();
    let canStartNextLesson = true;

    allLessons.forEach((lesson) => {
        const completed =
            lesson.progress?.is_completed === true ||
            lesson.progress?.completed_at != null;
        const inProgress =
            (lesson.progress?.progress_percentage ?? 0) > 0;
        const available =
            lesson.status === "published" &&
            (lesson.is_preview || completed || inProgress || canStartNextLesson);

        if (!available) {
            lockedLessonIds.add(lesson.id);
        }

        if (!completed && !lesson.is_preview) {
            canStartNextLesson = false;
        }
    });

    return (
        <aside className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            {/* Header */}
            <div className="border-b border-border">
                <div className="bg-gradient-to-br from-[#F47822]/8 to-transparent px-3.5 py-3">
                    <div className="flex items-center gap-2.5">
                        <div
                            className={`
                                flex h-7 w-7 shrink-0
                                items-center justify-center
                                rounded-lg
                                ${
                                    courseCompleted
                                        ? "bg-emerald-500/10"
                                        : "bg-[#F47822]/10"
                                }
                            `}
                        >
                            {courseCompleted ? (
                                <CheckCircle2
                                    className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                                    strokeWidth={2.2}
                                />
                            ) : (
                                <BookOpen
                                    className="h-4 w-4 text-[#F47822]"
                                    strokeWidth={2}
                                />
                            )}
                        </div>

                        <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#F47822]">
                                {t("lessonPlayer.curriculum.eyebrow")}
                            </p>

                            <h2 className="truncate text-[13px] font-semibold text-foreground">
                                {curriculum.course.title}
                            </h2>
                        </div>
                    </div>

                    {/* Overall progress */}
                    <div className="mt-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-muted-foreground">
                                {t("lessonPlayer.curriculum.progress")}
                            </span>

                            <span
                                className={`
                                    text-[10px] font-bold
                                    ${
                                        courseCompleted
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-[#F47822]"
                                    }
                                `}
                            >
                                {courseProgress}%
                            </span>
                        </div>

                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                            <div
                                className={`
                                    h-full rounded-full
                                    transition-[width]
                                    duration-500
                                    ${
                                        courseCompleted
                                            ? "bg-emerald-500"
                                            : "bg-[#F47822]"
                                    }
                                `}
                                style={{
                                    width: `${courseProgress}%`,
                                }}
                            />
                        </div>

                        <p className="mt-1 text-[10px] text-muted-foreground">
                            {t("lessonPlayer.curriculum.ofCompleted", { done: completedLessons, total: totalLessons })}
                        </p>
                    </div>

                    {courseCompleted && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-2">
                            <CheckCircle2
                                className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                                strokeWidth={2.2}
                            />

                            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                {t("lessonPlayer.curriculum.courseCompleted")}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Sections */}
            <div className="max-h-[calc(100vh-9rem)] overflow-y-auto overscroll-contain">
                {curriculum.sections.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <BookOpen className="mx-auto h-7 w-7 text-muted-foreground" />

                        <p className="mt-2 text-xs font-semibold text-foreground">
                            {t("lessonPlayer.curriculum.noLessons")}
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                            {t("lessonPlayer.curriculum.noLessonsDesc")}
                        </p>
                    </div>
                ) : (
                    <div>
                        {curriculum.sections.map(
                            (section) => (
                                <LessonCurriculumSection
                                    key={section.id}
                                    courseId={courseId}
                                    section={section}
                                    currentLessonId={
                                        currentLessonId
                                    }
                                    lockedLessonIds={lockedLessonIds}
                                    onLessonSelect={
                                        handleLessonSelect
                                    }
                                />
                            ),
                        )}
                        {assessments.filter((assessment) => assessment.course_title === curriculum.course.title).map((assessment) => <div key={assessment.id} className="border-t border-[#3A3A3A]/8 dark:border-white/8 bg-[#3A3A3A]/[.025] dark:bg-white/[.025] p-3"><div className="flex items-start gap-2.5"><div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${assessment.eligibility.eligible ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-[#3A3A3A]/8 dark:bg-white/8 text-[#3A3A3A]/45 dark:text-white/45"}`}>{assessment.eligibility.eligible ? <ClipboardCheck className="h-4 w-4"/> : <LockKeyhole className="h-3.5 w-3.5"/>}</div><div className="min-w-0 flex-1"><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#F47822]">{t("lessonPlayer.curriculum.finalAssessment")}</p><p className="mt-0.5 truncate text-[12px] font-semibold text-foreground">{assessment.title}</p><p className={`mt-0.5 text-[10px] font-medium ${assessment.eligibility.eligible ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>{assessment.eligibility.eligible ? t("lessonPlayer.curriculum.ready") : t("lessonPlayer.curriculum.needs", { done: assessment.eligibility.lessons.completed, req: assessment.eligibility.lessons.required, qdone: assessment.eligibility.quizzes.completed, qreq: assessment.eligibility.quizzes.required })}</p></div>{assessment.eligibility.eligible && <button onClick={() => navigate(`/assessments/${assessment.id}/exam`)} className="rounded-lg bg-[#F47822] p-2 text-white"><PlayCircle className="h-3.5 w-3.5"/></button>}</div></div>)}
                    </div>
                )}
            </div>
        </aside>
    );
}
