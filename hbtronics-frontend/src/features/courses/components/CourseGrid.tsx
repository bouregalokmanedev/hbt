import type { Course } from "../types/course.types";

import { CourseCard } from "./CourseCard";

interface CourseGridProps {
    courses: Course[];
}

export function CourseGrid({
    courses,
}: CourseGridProps) {
    return (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
                <CourseCard
                    key={course.id}
                    course={course}
                />
            ))}
        </div>
    );
}