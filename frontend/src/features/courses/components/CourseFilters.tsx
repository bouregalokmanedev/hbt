import {
    Check,
    SlidersHorizontal,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";

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
    const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
    useEffect(() => { void api<Array<{ id: string; name: string }>>("/v1/categories/active").then(setCategories).catch(() => setCategories([])); }, []);
    return (
        <div className="flex flex-col gap-3">
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
                <select aria-label="Filter by category" value={filters.category ?? ""} onChange={(event) => onChange({ ...filters, category: event.target.value || undefined, page: 1 })} className="h-9 rounded-lg border border-border/70 bg-background px-3 text-sm text-muted-foreground outline-none transition focus:border-primary">
                    <option value="">All categories</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
            </div>
            {filters.category && <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground"><span>Active:</span><button type="button" onClick={() => onChange({ ...filters, category: undefined, page: 1 })} className="rounded-full bg-primary/10 px-2 py-1 text-primary">Category ×</button></div>}
        </div>
    );
}
