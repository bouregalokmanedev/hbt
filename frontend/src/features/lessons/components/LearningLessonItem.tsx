import {
    Check,
    Lock,
    Play,
} from "lucide-react";

import type {
    CurriculumLesson,
} from "@/features/courses/types/course.types";

interface LearningLessonItemProps {
    lesson: CurriculumLesson;
    isCurrent: boolean;
}

function formatDuration(
    minutes: number,
) {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours =
        Math.floor(minutes / 60);

    const remaining =
        minutes % 60;

    if (remaining === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remaining}m`;
}

export function LearningLessonItem({
    lesson,
    isCurrent,
}: LearningLessonItemProps) {
    const locked =
        !lesson.is_preview &&
        lesson.status !==
            "published";

    return (
        <div
            className={[
                "flex items-start gap-3 px-5 py-3",
                "border-t",
                isCurrent
                    ? "bg-primary/5"
                    : "hover:bg-muted/50",
            ].join(" ")}
        >
            <div className="mt-0.5 shrink-0">
                {locked ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                ) : isCurrent ? (
                    <Play className="h-4 w-4 fill-current text-primary" />
                ) : (
                    <Check className="h-4 w-4 text-muted-foreground" />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p
                    className={[
                        "text-sm leading-5",
                        isCurrent
                            ? "font-semibold text-primary"
                            : "font-medium",
                    ].join(" ")}
                >
                    {lesson.title}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                    {formatDuration(
                        lesson.duration_minutes,
                    )}
                </p>
            </div>
        </div>
    );
}