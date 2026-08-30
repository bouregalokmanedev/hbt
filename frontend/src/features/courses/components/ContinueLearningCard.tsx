
import {
    ArrowRight,
    CheckCircle2,
    PlayCircle,
} from "lucide-react";

import { Link } from "react-router-dom";

import type {
    CourseCurriculum,
} from "../types/course.types";

interface ContinueLearningCardProps {
    curriculum: CourseCurriculum;
    isCourseCompleted?: boolean;
}

interface NextLesson {
    id: string;
    title: string;
    duration_minutes: number;
    progress: number;
}

function getFirstIncompleteLesson(
    curriculum: CourseCurriculum,
): NextLesson | null {
    for (const section of curriculum.sections) {
        for (const lesson of section.lessons) {
            const progress =
                lesson.progress?.progress_percentage ?? 0;

            const isCompleted =
                lesson.progress?.is_completed === true ||
                lesson.progress?.completed_at != null;

            if (!isCompleted) {
                return {
                    id: lesson.id,
                    title: lesson.title,
                    duration_minutes:
                        lesson.duration_minutes,
                    progress,
                };
            }
        }
    }

    return null;
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

export function ContinueLearningCard({
    curriculum,
    isCourseCompleted = false,
}: ContinueLearningCardProps) {
    const nextLesson = isCourseCompleted
    ? null
    : getFirstIncompleteLesson(
          curriculum,
      );

    /*
     * No incomplete lesson means
     * the entire course is completed.
     */
    if (!nextLesson) {
        return (
            <section className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
                {/* Accent */}
                <div className="h-1.5 bg-[#F47822]" />

                <div className="relative p-6 sm:p-7">
                    {/* Subtle background glow */}
                    <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#F47822]/5 blur-3xl" />

                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
                        {/* Icon */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F47822]/10">
                            <CheckCircle2 className="h-6 w-6 text-[#F47822]" />
                        </div>

                        {/* Content */}
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F47822]">
                                    Course completed
                                </p>

                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                                    100% complete
                                </span>
                            </div>

                            <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                You've completed this course
                            </h2>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                Great work. You can review any
                                lesson from the curriculum below
                                whenever you want.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
            {/* Orange accent */}
            <div className="h-1.5 bg-[#F47822]" />

            <div className="relative p-6 sm:p-7">
                {/* Decorative background */}
                <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#F47822]/5 blur-3xl transition-all duration-500 group-hover:bg-[#F47822]/10" />

                <div className="relative">
                    {/* Header */}
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        {/* Lesson information */}
                        <div className="flex min-w-0 items-start gap-4">
                            {/* Lesson icon */}
                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F47822]/10">
                                <PlayCircle className="h-6 w-6 text-[#F47822]" />

                                {nextLesson.progress > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-[#F47822]" />
                                )}
                            </div>

                            {/* Text */}
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F47822]">
                                    Continue learning
                                </p>

                                <h2 className="mt-1.5 line-clamp-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                    {nextLesson.title}
                                </h2>

                                <div className="mt-2 flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
                                    <span>
                                        {formatDuration(
                                            nextLesson.duration_minutes,
                                        )}
                                    </span>

                                    {nextLesson.progress > 0 && (
                                        <>
                                            <span className="h-1 w-1 rounded-full bg-border" />

                                            <span className="font-medium text-foreground">
                                                {
                                                    nextLesson.progress
                                                }
                                                % complete
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <Link
                            to={`/courses/${curriculum.course.id}/lessons/${nextLesson.id}`}
                            className="
                                group/button
                                inline-flex
                                shrink-0
                                items-center
                                justify-center
                                gap-2
                                rounded-2xl
                                bg-[#F47822]
                                px-5
                                py-3
                                text-sm
                                font-bold
                                text-white
                                shadow-[0_8px_20px_rgba(244,120,34,0.20)]
                                transition-all
                                duration-200
                                hover:-translate-y-0.5
                                hover:bg-[#e96b17]
                                hover:shadow-[0_12px_28px_rgba(244,120,34,0.28)]
                                lg:px-6
                            "
                        >
                            {nextLesson.progress > 0
                                ? "Continue"
                                : "Start lesson"}

                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/button:translate-x-0.5" />
                        </Link>
                    </div>

                    {/* Progress */}
                    {nextLesson.progress > 0 && (
                        <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Your progress
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        Keep going
                                    </p>
                                </div>

                                <span className="text-sm font-bold text-[#F47822]">
                                    {nextLesson.progress}%
                                </span>
                            </div>

                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-[#F47822] transition-all duration-500"
                                    style={{
                                        width: `${nextLesson.progress}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Starting state */}
                    {nextLesson.progress === 0 && (
                        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F47822]/10">
                                <PlayCircle className="h-4 w-4 text-[#F47822]" />
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Ready to start this lesson?
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}