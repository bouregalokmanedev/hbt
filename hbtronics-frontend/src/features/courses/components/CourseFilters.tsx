import {
    Check,
    SlidersHorizontal,
} from "lucide-react";

import type {
    CourseListParams,
} from "../api/courses.api";

interface CourseFiltersProps {
    filters: CourseListParams;

    onChange: (
        filters: CourseListParams,
    ) => void;
}

const difficulties = [
    "all",
    "beginner",
    "intermediate",
    "advanced",
] as const;

export function CourseFilters({
    filters,
    onChange,
}: CourseFiltersProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filter</span>
            </div>

            <div className="flex flex-wrap gap-2">
                {difficulties.map(
                    (difficulty) => {
                        const active =
                            difficulty === "all"
                                ? !filters.difficulty
                                : filters.difficulty ===
                                  difficulty;

                        const label =
                            difficulty === "all"
                                ? "All"
                                : difficulty
                                      .charAt(0)
                                      .toUpperCase() +
                                  difficulty.slice(1);

                        return (
                            <button
                                key={difficulty}
                                type="button"
                                onClick={() =>
                                    onChange({
                                        ...filters,
                                        difficulty:
                                            difficulty ===
                                            "all"
                                                ? undefined
                                                : difficulty,
                                        page: 1,
                                    })
                                }
                                className={`
                                    inline-flex
                                    h-9
                                    items-center
                                    gap-1.5
                                    rounded-lg
                                    border
                                    px-3
                                    text-sm
                                    font-medium
                                    transition-all

                                    ${
                                        active
                                            ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                                            : "border-border/70 bg-background text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
                                    }
                                `}
                            >
                                {active && (
                                    <Check className="h-3.5 w-3.5" />
                                )}

                                {label}
                            </button>
                        );
                    },
                )}

                <button
                    type="button"
                    onClick={() =>
                        onChange({
                            ...filters,
                            free: filters.free
                                ? undefined
                                : true,
                            page: 1,
                        })
                    }
                    className={`
                        inline-flex
                        h-9
                        items-center
                        gap-1.5
                        rounded-lg
                        border
                        px-3
                        text-sm
                        font-medium
                        transition-all

                        ${
                            filters.free
                                ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                                : "border-border/70 bg-background text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
                        }
                    `}
                >
                    {filters.free && (
                        <Check className="h-3.5 w-3.5" />
                    )}

                    Free
                </button>
            </div>
        </div>
    );
}