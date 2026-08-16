import type {
    CourseSection,
} from "../types/course.types";

import {
    CourseLessonItem,
} from "./CourseLessonItem";


interface CourseCurriculumSectionProps {
    section: CourseSection;
}


export function CourseCurriculumSection({
    section,
}: CourseCurriculumSectionProps) {
    return (
        <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Section{" "}
                            {section.position}
                        </p>

                        <h3 className="mt-1 text-lg font-semibold">
                            {section.title}
                        </h3>

                        {section.description && (
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                {
                                    section.description
                                }
                            </p>
                        )}
                    </div>


                    <span className="shrink-0 text-sm text-muted-foreground">
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
                        <CourseLessonItem
                            key={
                                lesson.id
                            }
                            lesson={
                                lesson
                            }
                        />
                    ),
                )}
            </div>
        </div>
    );
}