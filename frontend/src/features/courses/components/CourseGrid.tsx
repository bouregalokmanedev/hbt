import type { Course } from "../types/course.types";
import { CourseCard } from "./CourseCard";

interface CourseGridProps {
    courses: Course[];
}

export function CourseGrid({
    courses,
}: CourseGridProps) {
    return (
        <div
            className="
                grid
                grid-cols-1
                gap-6
                sm:grid-cols-2
                lg:grid-cols-3
            "
        >
            {courses.map((course) => (
                <CourseCard
                    key={course.id}
                    course={course}
                    enrollment={course.enrollment ?? null}
                />
            ))}
        </div>
    );
}