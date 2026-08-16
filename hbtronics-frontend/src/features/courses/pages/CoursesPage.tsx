import {
    BookOpen,
    Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

import type {
    CourseListParams,
} from "../api/courses.api";

import { CourseEmptyState } from "../components/CourseEmptyState";
import { CourseErrorState } from "../components/CourseErrorState";
import { CourseFilters } from "../components/CourseFilters";
import { CourseGrid } from "../components/CourseGrid";
import { CourseGridSkeleton } from "../components/CourseGridSkeleton";
import { CoursePagination } from "../components/CoursePagination";
import { CourseSearch } from "../components/CourseSearch";

import { useCourses } from "../hooks/useCourses";

export function CoursesPage() {
    const [filters, setFilters] =
        useState<CourseListParams>({
            per_page: 12,
            page: 1,
        });

    const {
        courses,
        pagination,
        isLoading,
        error,
        reload,
    } = useCourses(filters);

    const hasFilters = useMemo(
        () =>
            Boolean(
                filters.search ||
                    filters.difficulty ||
                    filters.free ||
                    filters.language ||
                    filters.category,
            ),
        [filters],
    );

    function updateFilters(
        next: CourseListParams,
    ) {
        setFilters({
            ...next,
            page: 1,
        });
    }

    function clearFilters() {
        setFilters({
            per_page: 12,
            page: 1,
        });
    }

    return (
        <main className="min-h-screen bg-background">
            {/* Hero */}
            <section className="border-b border-border/60">
                <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
                    <div className="max-w-3xl">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
                            <Sparkles className="h-3.5 w-3.5" />

                            HBT Learning
                        </div>

                        <h1
                            className="
                                text-4xl
                                font-bold
                                tracking-[-0.03em]
                                text-foreground
                                sm:text-5xl
                                lg:text-6xl
                            "
                        >
                            Master automotive
                            diagnostics.
                        </h1>

                        <p
                            className="
                                mt-5
                                max-w-2xl
                                text-base
                                leading-7
                                text-muted-foreground
                                sm:text-lg
                                sm:leading-8
                            "
                        >
                            Build practical diagnostic
                            skills through structured
                            courses, real-world
                            scenarios, and hands-on
                            automotive training.
                        </p>
                    </div>

                    <div className="mt-8 max-w-3xl">
                        <CourseSearch
                            value={
                                filters.search ?? ""
                            }
                            onChange={(search) =>
                                updateFilters({
                                    ...filters,
                                    search:
                                        search ||
                                        undefined,
                                })
                            }
                        />
                    </div>

                    <div className="mt-5">
                        <CourseFilters
                            filters={filters}
                            onChange={
                                updateFilters
                            }
                        />
                    </div>
                </div>
            </section>

            {/* Catalog */}
            <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                {/* Results heading */}
                <div className="mb-8 flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />

                            <h2 className="text-xl font-semibold tracking-tight">
                                Explore courses
                            </h2>
                        </div>

                        {!isLoading &&
                            pagination && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {pagination.total}{" "}
                                    {pagination.total ===
                                    1
                                        ? "course"
                                        : "courses"}{" "}
                                    available
                                </p>
                            )}
                    </div>

                    {!isLoading &&
                        !error &&
                        courses.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                                Showing{" "}
                                {courses.length} of{" "}
                                {
                                    pagination?.total
                                }
                            </p>
                        )}
                </div>

                {/* Loading */}
                {isLoading && (
                    <CourseGridSkeleton />
                )}

                {/* Error */}
                {!isLoading && error && (
                    <CourseErrorState
                        message={error}
                        onRetry={() =>
                            void reload()
                        }
                    />
                )}

                {/* Empty */}
                {!isLoading &&
                    !error &&
                    courses.length === 0 && (
                        <CourseEmptyState
                            hasFilters={
                                hasFilters
                            }
                            onClearFilters={
                                clearFilters
                            }
                        />
                    )}

                {/* Courses */}
                {!isLoading &&
                    !error &&
                    courses.length > 0 && (
                        <div className="space-y-10">
                            <CourseGrid
                                courses={courses}
                            />

                            {pagination && (
                                <CoursePagination
                                    pagination={
                                        pagination
                                    }
                                    onPageChange={(
                                        page,
                                    ) =>
                                        setFilters(
                                            (
                                                current,
                                            ) => ({
                                                ...current,
                                                page,
                                            }),
                                        )
                                    }
                                />
                            )}
                        </div>
                    )}
            </section>
        </main>
    );
}