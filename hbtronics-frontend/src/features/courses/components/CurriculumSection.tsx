import type {
    CurriculumSection as CurriculumSectionType,
} from "../types/course.types";

import {
    CurriculumLesson,
} from "./CurriculumLesson";

interface CurriculumSectionProps {
    section: CurriculumSectionType;
}

export function CurriculumSection({
    section,
}: CurriculumSectionProps) {
    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            <div className="border-b px-5 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold">
                            {section.title}
                        </h3>

                        {section.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                {
                                    section.description
                                }
                            </p>
                        )}
                    </div>

                    <span className="text-sm text-muted-foreground">
                        {
                            section.lessons
                                .length
                        }{" "}
                        {section.lessons
                            .length === 1
                            ? "lesson"
                            : "lessons"}
                    </span>
                </div>
            </div>

            <div>
                {section.lessons.map(
                    (lesson) => (
                        <CurriculumLesson
                            key={lesson.id}
                            lesson={lesson}
                        />
                    ),
                )}
            </div>
        </div>
    );
}