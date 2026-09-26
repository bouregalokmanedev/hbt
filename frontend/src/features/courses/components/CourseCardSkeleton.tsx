export function CourseCardSkeleton() {
  return (
    <div
      data-testid="course-card-skeleton"
      className="overflow-hidden rounded-3xl border border-[#3A3A3A]/10 bg-white shadow-[0_10px_36px_rgba(58,58,58,0.06)] dark:border-white/10 dark:bg-[#1b1b20]"
    >
      <div className="aspect-[16/10] animate-pulse bg-[#3A3A3A]/8 dark:bg-white/8" />

      <div className="space-y-4 p-5">
        <div className="h-3 w-24 animate-pulse rounded-full bg-[#3A3A3A]/8 dark:bg-white/8" />
        <div className="h-5 w-4/5 animate-pulse rounded bg-[#3A3A3A]/8 dark:bg-white/8" />
        <div className="h-4 w-full animate-pulse rounded bg-[#3A3A3A]/8 dark:bg-white/8" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-[#3A3A3A]/8 dark:bg-white/8" />
        <div className="border-t border-[#3A3A3A]/8 pt-4 dark:border-white/8">
          <div className="h-4 w-1/3 animate-pulse rounded bg-[#3A3A3A]/8 dark:bg-white/8" />
        </div>
      </div>
    </div>
  );
}
