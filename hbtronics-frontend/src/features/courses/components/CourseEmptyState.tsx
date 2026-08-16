interface CourseEmptyStateProps {
    hasFilters: boolean;
    onClearFilters: () => void;
}

export function CourseEmptyState({
    hasFilters,
    onClearFilters,
}: CourseEmptyStateProps) {
    return (
        <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
            <h3 className="text-lg font-semibold">
                No courses found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {hasFilters
                    ? "Try changing your search or filters."
                    : "There are no courses available right now."}
            </p>

            {hasFilters && (
                <button
                    type="button"
                    onClick={onClearFilters}
                    className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                >
                    Clear filters
                </button>
            )}
        </div>
    );
}