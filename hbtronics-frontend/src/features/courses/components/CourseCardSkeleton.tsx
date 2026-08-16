export function CourseCardSkeleton() {
    return (
        <div className="overflow-hidden rounded-2xl border">
            <div className="aspect-[16/9] animate-pulse bg-muted" />

            <div className="space-y-4 p-5">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />

                <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />

                <div className="h-4 w-full animate-pulse rounded bg-muted" />

                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />

                <div className="border-t pt-4">
                    <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                </div>
            </div>
        </div>
    );
}