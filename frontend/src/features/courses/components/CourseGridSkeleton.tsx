import { CourseCardSkeleton } from "./CourseCardSkeleton";

export function CourseGridSkeleton() {
  return (
    <div
      data-testid="course-grid-skeleton"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <CourseCardSkeleton key={index} />
      ))}
    </div>
  );
}
