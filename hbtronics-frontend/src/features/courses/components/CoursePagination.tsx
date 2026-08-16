import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import type {
    CoursePaginationMeta,
} from "../api/courses.api";

interface CoursePaginationProps {
    pagination: CoursePaginationMeta | null;

    onPageChange: (
        page: number,
    ) => void;
}

export function CoursePagination({
    pagination,
    onPageChange,
}: CoursePaginationProps) {
    if (!pagination) {
        return null;
    }

    if (pagination.last_page <= 1) {
        return null;
    }

    return (
        <nav
            className="flex items-center justify-center gap-2 pt-4"
            aria-label="Course pagination"
        >
            <button
                type="button"
                disabled={
                    pagination.current_page <= 1
                }
                onClick={() =>
                    onPageChange(
                        pagination.current_page - 1,
                    )
                }
                className="
                    inline-flex
                    h-10
                    items-center
                    gap-1
                    rounded-xl
                    border
                    border-border/70
                    px-3
                    text-sm
                    font-medium
                    transition
                    hover:bg-muted
                    disabled:pointer-events-none
                    disabled:opacity-40
                "
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">
                    Previous
                </span>
            </button>

            <div className="flex items-center gap-1">
                {pagination.links.map(
                    (link, index) => {
                        if (
                            link.page === null
                        ) {
                            return null;
                        }

                        return (
                            <button
                                key={`${link.page}-${index}`}
                                type="button"
                                aria-current={
                                    link.active
                                        ? "page"
                                        : undefined
                                }
                                onClick={() =>
                                    onPageChange(
                                        link.page!,
                                    )
                                }
                                className={`
                                    flex
                                    h-10
                                    min-w-10
                                    items-center
                                    justify-center
                                    rounded-xl
                                    text-sm
                                    font-medium
                                    transition

                                    ${
                                        link.active
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "border border-transparent text-muted-foreground hover:border-border/70 hover:bg-muted hover:text-foreground"
                                    }
                                `}
                            >
                                {link.page}
                            </button>
                        );
                    },
                )}
            </div>

            <button
                type="button"
                disabled={
                    pagination.current_page >=
                    pagination.last_page
                }
                onClick={() =>
                    onPageChange(
                        pagination.current_page + 1,
                    )
                }
                className="
                    inline-flex
                    h-10
                    items-center
                    gap-1
                    rounded-xl
                    border
                    border-border/70
                    px-3
                    text-sm
                    font-medium
                    transition
                    hover:bg-muted
                    disabled:pointer-events-none
                    disabled:opacity-40
                "
            >
                <span className="hidden sm:inline">
                    Next
                </span>
                <ChevronRight className="h-4 w-4" />
            </button>
        </nav>
    );
}