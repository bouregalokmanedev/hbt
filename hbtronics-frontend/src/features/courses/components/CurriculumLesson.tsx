import type {
    CurriculumLesson as CurriculumLessonType,
} from "../types/course.types";

interface CurriculumLessonProps {
    lesson: CurriculumLessonType;
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

export function CurriculumLesson({
    lesson,
}: CurriculumLessonProps) {
    const locked =
        !lesson.is_preview &&
        lesson.status !== "published";

    return (
        <div className="flex items-center justify-between border-t px-4 py-4">
            <div className="flex items-center gap-3">
                <span className="text-sm">
                    {locked ? "🔒" : "▶"}
                </span>

                <div>
                    <p className="text-sm font-medium">
                        {lesson.title}
                    </p>

                    <p className="text-xs text-muted-foreground">
                        {formatDuration(
                            lesson.duration_minutes,
                        )}
                    </p>
                </div>
            </div>

            <div>
                {lesson.is_preview ? (
                    <span className="text-xs font-medium">
                        Preview
                    </span>
                ) : locked ? (
                    <span className="text-xs text-muted-foreground">
                        Locked
                    </span>
                ) : null}
            </div>
        </div>
    );
}