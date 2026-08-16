import {
    Link,
} from "react-router-dom";

import type {
    CourseLesson,
} from "../types/course.types";


interface CourseLessonItemProps {
    lesson: CourseLesson;
}


function formatDuration(
    minutes: number,
): string {
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


export function CourseLessonItem({
    lesson,
}: CourseLessonItemProps) {
    const isPreview =
        lesson.is_preview;

    return (
        <Link
            to={`/lessons/${lesson.id}`}
            className="flex items-center gap-4 border-t px-5 py-4 transition-colors hover:bg-muted/50"
        >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {lesson.position}
            </div>


            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <h4 className="truncate text-sm font-medium">
                        {lesson.title}
                    </h4>


                    {isPreview && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Preview
                        </span>
                    )}
                </div>


                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                        Lesson {lesson.position}
                    </span>

                    <span>•</span>

                    <span>
                        {formatDuration(
                            lesson.duration_minutes,
                        )}
                    </span>
                </div>
            </div>


            <div className="shrink-0 text-sm text-muted-foreground">
                {isPreview
                    ? "Preview"
                    : "Start"}
            </div>
        </Link>
    );
}