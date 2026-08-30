import type {
    Lesson,
} from "../types/lesson.types";

interface LessonContentProps {
    lesson: Lesson;
}

export function LessonContent({
    lesson,
}: LessonContentProps) {
    return (
        <section className="mx-auto max-w-4xl">
            <div className="border-b pb-6">
                <p className="mb-2 text-sm text-muted-foreground">
                    Lesson {lesson.position}
                </p>

                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {lesson.title}
                </h2>
            </div>

            {lesson.description && (
                <div className="border-b py-6">
                    <h3 className="mb-3 text-lg font-semibold">
                        About this lesson
                    </h3>

                    <p className="leading-7 text-muted-foreground">
                        {lesson.description}
                    </p>
                </div>
            )}

            {lesson.content && (
                <div className="py-8">
                    <div
                        className="prose prose-neutral max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{
                            __html:
                                lesson.content,
                        }}
                    />
                </div>
            )}
        </section>
    );
}