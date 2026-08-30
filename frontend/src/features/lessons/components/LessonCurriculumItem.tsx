
import {
    CheckCircle2,
    ChevronRight,
    CirclePlay,
    LockKeyhole,
} from "lucide-react";

import type {
    CourseLesson,
} from "@/features/courses/types/course.types";

interface LessonCurriculumItemProps {
    lesson: CourseLesson;
    active: boolean;
    locked: boolean;
    onClick: () => void;
}

export function LessonCurriculumItem({
    lesson,
    active,
    locked,
    onClick,
}: LessonCurriculumItemProps) {
    const isCompleted =
        lesson.progress?.is_completed === true ||
        lesson.progress?.completed_at != null;

    const progress = Math.min(
        Math.max(
            lesson.progress?.progress_percentage ?? 0,
            0,
        ),
        100,
    );

    const isInProgress =
        !isCompleted && progress > 0;

    const isLocked =
        locked || lesson.status !== "published";

    const isClickable =
        !isLocked;

    const handleClick = () => {
        if (!isClickable) {
            return;
        }

        onClick();
    };

    return (
        <button
            type="button"
            disabled={!isClickable}
            onClick={handleClick}
            aria-current={active ? "page" : undefined}
            className={`
                group relative flex w-full items-center gap-3
                px-3 py-2.5 text-left
                transition-colors duration-150
                ${
                    active
                        ? "bg-[#F47822]/[0.07]"
                        : "hover:bg-muted/40"
                }
                ${
                    isLocked
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                }
            `}
        >
            {/* Active lesson indicator */}
            {active && !isLocked && (
                <span
                    className="
                        absolute inset-y-0 left-0
                        w-[3px] rounded-r-full
                        bg-[#F47822]
                    "
                />
            )}

            {/* Status icon */}
            <div
                className={`
                    flex h-7 w-7 shrink-0 items-center
                    justify-center rounded-lg
                    ${
                        isCompleted
                            ? "bg-emerald-500/10"
                            : isInProgress
                              ? "bg-[#F47822]/10"
                              : isLocked
                                ? "bg-muted"
                                : active
                                  ? "bg-[#F47822]/10"
                                  : "bg-muted/70"
                    }
                `}
            >
                {isCompleted ? (
                    <CheckCircle2
                        className="h-[17px] w-[17px] text-emerald-600"
                        strokeWidth={2.2}
                    />
                ) : isLocked ? (
                    <LockKeyhole
                        className="h-4 w-4 text-muted-foreground"
                        strokeWidth={2}
                    />
                ) : isInProgress ? (
                    <CirclePlay
                        className="h-[17px] w-[17px] text-[#F47822]"
                        strokeWidth={2}
                    />
                ) : (
                    <CirclePlay
                        className={`
                            h-[17px] w-[17px]
                            ${
                                active
                                    ? "text-[#F47822]"
                                    : "text-muted-foreground"
                            }
                        `}
                        strokeWidth={2}
                    />
                )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p
                        className={`
                            min-w-0 flex-1 truncate
                            text-[12px] leading-4
                            ${
                                active
                                    ? "font-semibold text-[#F47822]"
                                    : isCompleted
                                      ? "font-medium text-foreground"
                                      : "font-medium text-foreground"
                            }
                        `}
                    >
                        {lesson.title}
                    </p>

                    {!isLocked && (
                        <ChevronRight
                            className="
                                h-3.5 w-3.5 shrink-0
                                text-muted-foreground/50
                                opacity-0
                                transition-all
                                duration-150
                                group-hover:translate-x-0.5
                                group-hover:opacity-100
                            "
                        />
                    )}
                </div>

                <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground">
                        {lesson.duration_minutes} min
                    </span>

                    {isCompleted && (
                        <>
                            <span className="h-0.5 w-0.5 rounded-full bg-border" />

                            <span className="text-[11px] font-medium text-emerald-600">
                                Completed
                            </span>
                        </>
                    )}

                    {isInProgress && (
                        <>
                            <span className="h-0.5 w-0.5 rounded-full bg-border" />

                            <span className="text-[11px] font-medium text-[#F47822]">
                                {progress}%
                            </span>
                        </>
                    )}

                    {isLocked && (
                        <>
                            <span className="h-0.5 w-0.5 rounded-full bg-border" />

                            <span className="text-[11px] text-muted-foreground">
                                Locked
                            </span>
                        </>
                    )}
                </div>

            </div>
        </button>
    );
}
