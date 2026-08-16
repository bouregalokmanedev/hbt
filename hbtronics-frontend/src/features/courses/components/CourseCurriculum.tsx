
import {
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Lock,
    PlayCircle,
} from "lucide-react";

import { Link } from "react-router-dom";

import type {
    CourseCurriculum as CourseCurriculumType,
} from "../types/course.types";

interface CourseCurriculumProps {
    curriculum: CourseCurriculumType;
}

function formatDuration(
    minutes: number,
): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(
        minutes / 60,
    );

    const remaining =
        minutes % 60;

    if (remaining === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remaining}m`;
}

type LessonState =
    | "completed"
    | "in-progress"
    | "not-started"
    | "locked";

function getLessonState(
    lesson: CourseCurriculumType["sections"][number]["lessons"][number],
): LessonState {
    const isPublished =
        lesson.status === "published";

    const progress =
        lesson.progress;

    if (!isPublished) {
        return "locked";
    }

    if (
        progress?.is_completed ||
        progress?.completed_at
    ) {
        return "completed";
    }

    if (
        progress &&
        progress.progress_percentage > 0
    ) {
        return "in-progress";
    }

    return "not-started";
}

function getStateLabel(
    state: LessonState,
): string | null {
    switch (state) {
        case "completed":
            return "Completed";

        case "in-progress":
            return "In progress";

        case "not-started":
            return null;

        case "locked":
            return "Locked";
    }
}

function getProgressPercentage(
    lesson: CourseCurriculumType["sections"][number]["lessons"][number],
): number {
    if (lesson.progress?.is_completed) {
        return 100;
    }

    return Math.min(
        Math.max(
            lesson.progress?.progress_percentage ?? 0,
            0,
        ),
        100,
    );
}

export function CourseCurriculum({
    curriculum,
}: CourseCurriculumProps) {
    const totalLessons =
        curriculum.sections.reduce(
            (total, section) =>
                total +
                section.lessons.length,
            0,
        );

    const totalDuration =
        curriculum.sections.reduce(
            (total, section) =>
                total +
                section.lessons.reduce(
                    (
                        sectionTotal,
                        lesson,
                    ) =>
                        sectionTotal +
                        lesson.duration_minutes,
                    0,
                ),
            0,
        );

    return (
        <section className="space-y-7">
            {/* =========================================================
                HEADER
            ========================================================== */}

            <div className="flex flex-col gap-5 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F47822]/10">
                            <BookOpen className="h-4.5 w-4.5 text-[#F47822]" />
                        </div>

                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F47822]">
                            Course curriculum
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        What you'll learn
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Follow the lessons in order and
                        track your progress as you learn.
                    </p>
                </div>

                {/* Curriculum stats */}
                <div className="flex flex-wrap gap-2 sm:justify-end">
                    <div className="rounded-xl border border-border bg-card px-3.5 py-2.5">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Sections
                        </p>

                        <p className="mt-0.5 text-sm font-bold text-foreground">
                            {curriculum.sections.length}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card px-3.5 py-2.5">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Lessons
                        </p>

                        <p className="mt-0.5 text-sm font-bold text-foreground">
                            {totalLessons}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card px-3.5 py-2.5">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Duration
                        </p>

                        <p className="mt-0.5 text-sm font-bold text-foreground">
                            {formatDuration(
                                totalDuration,
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* =========================================================
                EMPTY STATE
            ========================================================== */}

            {curriculum.sections.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center shadow-[0_4px_20px_rgba(15,23,42,0.03)] sm:p-10">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F47822]/10">
                        <BookOpen className="h-7 w-7 text-[#F47822]" />
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-foreground">
                        Curriculum coming soon
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                        Lessons for this course haven't
                        been added yet.
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {curriculum.sections.map(
                        (section) => (
                            <div
                                key={
                                    section.id
                                }
                                className="group overflow-hidden rounded-3xl border border-border bg-card shadow-[0_4px_20px_rgba(15,23,42,0.03)] transition-all duration-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.06)]"
                            >
                                {/* =================================================
                                    SECTION HEADER
                                ================================================== */}

                                <div className="border-b border-border bg-muted/20 px-5 py-5 sm:px-6">
                                    <div className="flex items-start gap-4">
                                        {/* Section number */}
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-sm font-bold text-[#F47822]">
                                            {section.position}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                                        Section{" "}
                                                        {
                                                            section.position
                                                        }
                                                    </p>

                                                    <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground">
                                                        {
                                                            section.title
                                                        }
                                                    </h3>

                                                    {section.description && (
                                                        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                                                            {
                                                                section.description
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                                                    {
                                                        section
                                                            .lessons
                                                            .length
                                                    }{" "}
                                                    {section
                                                        .lessons
                                                        .length ===
                                                    1
                                                        ? "lesson"
                                                        : "lessons"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* =================================================
                                    LESSONS
                                ================================================== */}

                                <div className="divide-y divide-border">
                                    {section.lessons.map(
                                        (
                                            lesson,
                                        ) => {
                                            const state =
                                                getLessonState(
                                                    lesson,
                                                );

                                            const progress =
                                                getProgressPercentage(
                                                    lesson,
                                                );

                                            const stateLabel =
                                                getStateLabel(
                                                    state,
                                                );

                                            const isAvailable =
                                                state !==
                                                    "locked" &&
                                                (
                                                    lesson.is_preview ||
                                                    state ===
                                                        "completed" ||
                                                    state ===
                                                        "in-progress"
                                                );

                                            const lessonContent =
                                                (
                                                    <>
                                                        {/* Lesson icon */}
                                                        <div
                                                            className={`
                                                                flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200
                                                                ${
                                                                    state ===
                                                                    "completed"
                                                                        ? "bg-emerald-500/10"
                                                                        : state ===
                                                                            "in-progress"
                                                                          ? "bg-[#F47822]/10"
                                                                          : state ===
                                                                              "not-started"
                                                                            ? "bg-muted"
                                                                            : "bg-muted"
                                                                }
                                                            `}
                                                        >
                                                            {state ===
                                                            "completed" ? (
                                                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                            ) : state ===
                                                              "in-progress" ? (
                                                                <PlayCircle className="h-5 w-5 text-[#F47822]" />
                                                            ) : state ===
                                                              "not-started" ? (
                                                                <PlayCircle className="h-5 w-5 text-muted-foreground" />
                                                            ) : (
                                                                <Lock className="h-5 w-5 text-muted-foreground" />
                                                            )}
                                                        </div>

                                                        {/* Lesson information */}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h4 className="truncate text-sm font-semibold text-foreground">
                                                                    {
                                                                        lesson.title
                                                                    }
                                                                </h4>

                                                                {lesson.is_preview && (
                                                                    <span className="inline-flex rounded-full bg-[#F47822]/10 px-2 py-0.5 text-[11px] font-bold text-[#F47822]">
                                                                        Preview
                                                                    </span>
                                                                )}

                                                                {stateLabel && (
                                                                    <span
                                                                        className={`
                                                                            inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold
                                                                            ${
                                                                                state ===
                                                                                "completed"
                                                                                    ? "bg-emerald-500/10 text-emerald-600"
                                                                                    : state ===
                                                                                        "in-progress"
                                                                                      ? "bg-[#F47822]/10 text-[#F47822]"
                                                                                      : "bg-muted text-muted-foreground"
                                                                            }
                                                                        `}
                                                                    >
                                                                        {
                                                                            stateLabel
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {lesson.description && (
                                                                <p className="mt-1 line-clamp-1 text-sm leading-5 text-muted-foreground">
                                                                    {
                                                                        lesson.description
                                                                    }
                                                                </p>
                                                            )}

                                                            {/* Progress */}
                                                            {state ===
                                                                "in-progress" && (
                                                                <div className="mt-3 flex items-center gap-3">
                                                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                                                        <div
                                                                            className="h-full rounded-full bg-[#F47822] transition-all duration-500"
                                                                            style={{
                                                                                width: `${progress}%`,
                                                                            }}
                                                                        />
                                                                    </div>

                                                                    <span className="shrink-0 text-xs font-bold text-[#F47822]">
                                                                        {
                                                                            progress
                                                                        }
                                                                        %
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Duration */}
                                                        <div className="hidden shrink-0 items-center gap-1.5 text-sm text-muted-foreground sm:flex">
                                                            <Clock3 className="h-4 w-4" />

                                                            <span>
                                                                {formatDuration(
                                                                    lesson.duration_minutes,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </>
                                                );

                                            if (
                                                isAvailable
                                            ) {
                                                return (
                                                    <Link
                                                        key={
                                                            lesson.id
                                                        }
                                                        to={`/courses/${curriculum.course.id}/lessons/${lesson.id}`}
                                                        className="
                                                            group/lesson
                                                            flex
                                                            items-center
                                                            gap-3
                                                            px-5
                                                            py-4
                                                            transition-all
                                                            duration-200
                                                            hover:bg-[#F47822]/[0.025]
                                                            sm:gap-4
                                                            sm:px-6
                                                        "
                                                    >
                                                        {
                                                            lessonContent
                                                        }

                                                        {/* Desktop action */}
                                                        <div className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-[#F47822] opacity-0 transition-all duration-200 group-hover/lesson:translate-x-0.5 group-hover/lesson:opacity-100 sm:flex">
                                                            <span>
                                                                {state ===
                                                                "in-progress"
                                                                    ? "Continue"
                                                                    : state ===
                                                                        "completed"
                                                                      ? "Review"
                                                                      : "Start"}
                                                            </span>

                                                            <ChevronRight className="h-4 w-4" />
                                                        </div>

                                                        {/* Mobile action */}
                                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground sm:hidden" />
                                                    </Link>
                                                );
                                            }

                                            return (
                                                <div
                                                    key={
                                                        lesson.id
                                                    }
                                                    className="flex items-center gap-3 px-5 py-4 opacity-65 sm:gap-4 sm:px-6"
                                                >
                                                    {
                                                        lessonContent
                                                    }

                                                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            </div>
                        ),
                    )}
                </div>
            )}
        </section>
    );
}