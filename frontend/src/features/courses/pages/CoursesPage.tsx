import {
    BookOpen,
    Sparkles,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useLocation,
} from "react-router-dom";

import type {
    CourseListParams,
} from "../api/courses.api";

import {
    useMyEnrollments,
} from "@/features/enrollments/hooks/useMyEnrollments";

import {
    CourseEmptyState,
} from "../components/CourseEmptyState";

import {
    CourseErrorState,
} from "../components/CourseErrorState";

import {
    CourseFilters,
} from "../components/CourseFilters";

import {
    CourseGrid,
} from "../components/CourseGrid";

import {
    CourseGridSkeleton,
} from "../components/CourseGridSkeleton";

import {
    CoursePagination,
} from "../components/CoursePagination";

import {
    CourseSearch,
} from "../components/CourseSearch";

import {
    useCourses,
} from "../hooks/useCourses";


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


    const {
        enrollments,
        isLoading: isEnrollmentsLoading,
        error: enrollmentsError,
        reload: reloadEnrollments,
    } = useMyEnrollments();


    const location = useLocation();


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


    /*
     * Reload enrollments when navigating back to
     * the catalog.
     */
    useEffect(() => {
        void reloadEnrollments();
    }, [
        location.key,
        reloadEnrollments,
    ]);


    /*
     * ============================================================
     * MERGE COURSES + USER ENROLLMENTS
     * ============================================================
     */

    const coursesWithEnrollment = useMemo(() => {
        return courses.map((course) => {
            const enrollment =
                enrollments.find(
                    (item) =>
                        String(item.course_id) ===
                        String(course.id),
                );


            if (!enrollment) {
                return {
                    ...course,
                    enrollment:
                        course.enrollment ?? null,
                };
            }


            return {
                ...course,

                enrollment: {
                    ...enrollment,

                    user_id: String(
                        enrollment.user_id,
                    ),
                },
            };
        });
    }, [
        courses,
        enrollments,
    ]);


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


    const showLoading =
        isLoading;


    const showError =
        !isLoading && Boolean(error);


    return (
        <main className="min-h-screen bg-[#F5F5F3]">

            {/* =====================================================
                HERO / CATALOG INTRO
            ====================================================== */}

            {/* =====================================================
    COMPACT CATALOG HEADER
====================================================== */}

<section className="relative overflow-hidden border-b border-black/10 bg-[#F5F5F3]">

    {/* Subtle technical grid */}

    <div
        aria-hidden="true"
        className="
            pointer-events-none
            absolute inset-0
            opacity-[0.025]
            [background-image:linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]
            [background-size:70px_70px]
        "
    />

    <div className="relative mx-auto w-full max-w-[1600px] px-5 pb-10 pt-10 sm:px-8 lg:px-12">

        {/* Top line */}

        <div className="mb-8 flex items-center justify-between">

            <div className="flex items-center gap-2">

                <span className="relative flex h-2 w-2 items-center justify-center">
                    <span className="absolute h-2 w-2 rounded-full bg-hbt-orange" />

                    <span className="absolute h-4 w-4 animate-ping rounded-full border border-hbt-orange/30" />
                </span>

                <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-slate-500">
                    HBT Learning
                </span>

            </div>

            <span className="font-mono text-[9px] tracking-[0.2em] text-slate-400">
                COURSES / 01
            </span>

        </div>


        {/* =================================================
            TITLE
        ================================================== */}

        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">

            <div className="lg:col-span-7">

                <h1
                    className="
                        max-w-3xl
                        text-4xl
                        font-black
                        uppercase
                        leading-[0.88]
                        tracking-[-0.055em]
                        text-hbt-dark
                        sm:text-5xl
                        lg:text-6xl
                    "
                >
                    Learn the
                    <span className="text-hbt-orange">
                        {" "}system.
                    </span>
                </h1>

            </div>


            {/* Description */}

            <div className="lg:col-span-4 lg:col-start-9">

                <p className="max-w-md text-sm leading-6 text-slate-500">
                    Practical automotive diagnostics.
                    Structured learning, real scenarios,
                    and hands-on training.
                </p>

            </div>

        </div>


        {/* =================================================
            SEARCH
        ================================================== */}

        <div className="mt-9">

            <CourseSearch
                value={filters.search ?? ""}
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


        {/* =================================================
            FILTERS
        ================================================== */}

        <div className="mt-4">

            <CourseFilters
                filters={filters}
                onChange={updateFilters}
            />

        </div>

    </div>

</section>


            {/* =====================================================
                CATALOG RESULTS
            ====================================================== */}

            <section
                className={[
                    "relative overflow-hidden",
                    "bg-white",
                ].join(" ")}
            >

                <div
                    className={[
                        "mx-auto w-full max-w-[1600px]",
                        "px-5 py-16",
                        "sm:px-8 sm:py-20",
                        "lg:px-12 lg:py-24",
                        "xl:px-16",
                    ].join(" ")}
                >

                    {/* =================================================
                        RESULTS HEADER
                    ================================================== */}

                    <div
                        className={[
                            "relative mb-12",
                            "flex flex-col gap-6",
                            "border-b border-black/10",
                            "pb-8",
                            "sm:flex-row",
                            "sm:items-end",
                            "sm:justify-between",
                        ].join(" ")}
                    >

                        <div>

                            <div
                                className={[
                                    "flex items-center gap-3",
                                    "mb-4",
                                ].join(" ")}
                            >

                                <div
                                    className={[
                                        "flex h-8 w-8",
                                        "items-center justify-center",
                                        "rounded-full",
                                        "bg-hbt-orange",
                                        "text-white",
                                    ].join(" ")}
                                >
                                    <BookOpen className="h-4 w-4" />
                                </div>


                                <span
                                    className={[
                                        "text-[9px] font-bold uppercase",
                                        "tracking-[0.25em]",
                                        "text-slate-400",
                                    ].join(" ")}
                                >
                                    Available training
                                </span>

                            </div>


                            <h2
                                className={[
                                    "font-black uppercase",
                                    "tracking-[-0.055em]",
                                    "text-4xl",
                                    "sm:text-5xl",
                                    "lg:text-6xl",
                                ].join(" ")}
                            >
                                Explore
                                <span className="text-hbt-orange">
                                    {" "}courses.
                                </span>
                            </h2>


                            {!isLoading &&
                                pagination && (
                                    <p
                                        className={[
                                            "mt-4",
                                            "text-sm",
                                            "text-slate-500",
                                        ].join(" ")}
                                    >
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
                                <div
                                    className={[
                                        "text-right",
                                        "sm:pb-1",
                                    ].join(" ")}
                                >

                                    <p
                                        className={[
                                            "font-mono text-3xl",
                                            "font-bold",
                                            "tracking-[-0.04em]",
                                        ].join(" ")}
                                    >
                                        {String(
                                            courses.length,
                                        ).padStart(2, "0")}
                                    </p>

                                    <p
                                        className={[
                                            "mt-1",
                                            "text-[8px] font-bold uppercase",
                                            "tracking-[0.25em]",
                                            "text-slate-400",
                                        ].join(" ")}
                                    >
                                        Showing results
                                    </p>

                                </div>
                            )}

                    </div>


                    {/* =================================================
                        SIGNAL LINE + CONTENT
                    ================================================== */}

                    <div
                        className={[
                            "relative",
                            "pl-0",
                            "lg:pl-12",
                        ].join(" ")}
                    >

                        {/* Vertical diagnostic line */}

                        <div
                            aria-hidden="true"
                            className={[
                                "absolute left-0 top-0 bottom-0",
                                "hidden w-px",
                                "bg-black/10",
                                "lg:block",
                            ].join(" ")}
                        >

                            <div
                                className={[
                                    "absolute left-0 top-0",
                                    "h-32 w-px",
                                    "bg-hbt-orange",
                                ].join(" ")}
                            />

                        </div>


                        {/* =================================================
                            LOADING
                        ================================================== */}

                        {showLoading && (
                            <CourseGridSkeleton />
                        )}


                        {/* =================================================
                            ERROR
                        ================================================== */}

                        {showError && (
                            <CourseErrorState
                                message={
                                    error ??
                                    "Unable to load courses."
                                }
                                onRetry={() =>
                                    void reload()
                                }
                            />
                        )}


                        {/* =================================================
                            EMPTY
                        ================================================== */}

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


                        {/* =================================================
                            COURSE GRID
                        ================================================== */}

                        {!isLoading &&
                            !error &&
                            courses.length > 0 && (
                                <div className="space-y-12">

                                    <CourseGrid
                                        courses={
                                            coursesWithEnrollment
                                        }
                                    />


                                    {/* =================================================
                                        PAGINATION
                                    ================================================== */}

                                    {pagination && (
                                        <div
                                            className={[
                                                "border-t border-black/10",
                                                "pt-8",
                                            ].join(" ")}
                                        >

                                            <div
                                                className={[
                                                    "mb-5 flex items-center",
                                                    "justify-between",
                                                ].join(" ")}
                                            >

                                                <span
                                                    className={[
                                                        "font-mono text-[8px]",
                                                        "font-bold uppercase",
                                                        "tracking-[0.2em]",
                                                        "text-slate-400",
                                                    ].join(" ")}
                                                >
                                                    Course index
                                                </span>


                                                <span
                                                    className={[
                                                        "h-px flex-1",
                                                        "mx-5",
                                                        "bg-black/10",
                                                    ].join(" ")}
                                                />

                                                <span
                                                    className={[
                                                        "font-mono text-[8px]",
                                                        "text-slate-400",
                                                    ].join(" ")}
                                                >
                                                    {pagination.total}
                                                </span>

                                            </div>


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

                                        </div>
                                    )}

                                </div>
                            )}

                    </div>

                </div>

            </section>


            {/* =====================================================
                BOTTOM STATEMENT
            ====================================================== */}

            <section
                className={[
                    "relative overflow-hidden",
                    "bg-[#F5F5F3]",
                    "border-t border-black/10",
                ].join(" ")}
            >

                <div
                    className={[
                        "mx-auto max-w-[1600px]",
                        "px-5 py-20",
                        "sm:px-8 sm:py-24",
                        "lg:px-12 lg:py-28",
                        "xl:px-16",
                    ].join(" ")}
                >

                    <div
                        className={[
                            "grid gap-10",
                            "lg:grid-cols-12",
                            "lg:items-end",
                        ].join(" ")}
                    >

                        <div className="lg:col-span-8">

                            <p
                                className={[
                                    "text-[9px] font-bold uppercase",
                                    "tracking-[0.3em]",
                                    "text-hbt-orange",
                                ].join(" ")}
                            >
                                Your diagnostic journey
                            </p>


                            <h3
                                className={[
                                    "mt-5",
                                    "font-black uppercase",
                                    "leading-[0.85]",
                                    "tracking-[-0.06em]",
                                    "text-5xl",
                                    "sm:text-6xl",
                                    "lg:text-8xl",
                                ].join(" ")}
                            >
                                Learn.
                                <span className="text-slate-300">
                                    {" "}Practice.
                                </span>
                                <br />
                                Diagnose.
                            </h3>

                        </div>


                        <div
                            className={[
                                "lg:col-span-3",
                                "lg:col-start-10",
                            ].join(" ")}
                        >

                            <p
                                className={[
                                    "text-sm leading-7",
                                    "text-slate-500",
                                ].join(" ")}
                            >
                                Every course is designed to
                                move you from theory to
                                practical diagnostic
                                thinking.
                            </p>

                        </div>

                    </div>

                </div>


                {/* Orange edge */}

                <div
                    aria-hidden="true"
                    className={[
                        "absolute bottom-0 left-0",
                        "h-1 w-1/3",
                        "bg-hbt-orange",
                    ].join(" ")}
                />

            </section>

        </main>
    );
}