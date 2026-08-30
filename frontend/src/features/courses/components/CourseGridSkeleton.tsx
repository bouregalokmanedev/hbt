import { CourseCardSkeleton } from "./CourseCardSkeleton";

export function CourseGridSkeleton() {
    return (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map(
                (_, index) => (
                    <CourseCardSkeleton
                        key={index}
                    />
                ),
            )}
        </div>
    );
}