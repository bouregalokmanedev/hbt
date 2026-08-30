import {
    ArrowRight,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Play,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type {
    CurrentLearningItem,
} from "../types/dashboard.types";

interface CurrentLearningProps {
    courses: CurrentLearningItem[];
}

export function CurrentLearning({
    courses,
}: CurrentLearningProps) {
    const [page, setPage] = useState(0);
    const pageSize = 2;
    const totalPages = Math.max(1, Math.ceil(courses.length / pageSize));
    const visibleCourses = useMemo(
        () => courses.slice(page * pageSize, page * pageSize + pageSize),
        [courses, page],
    );

    useEffect(() => {
        setPage((currentPage) => Math.min(currentPage, totalPages - 1));
    }, [totalPages]);

    return (
        <section className="relative overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_8px_30px_rgba(58,58,58,0.05)]">
            {/* Subtle background glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#F47822]/8 blur-3xl" />

            <div className="relative p-5 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
                            Your learning
                        </p>

                        <h2 className="mt-1 text-base font-semibold text-[#3A3A3A] sm:text-lg">
                            Continue learning
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        {courses.length > 0 && (
                            <Link
                                to="/my-courses"
                                className="text-[11px] font-semibold text-[#F47822] hover:underline"
                            >
                                View all
                            </Link>
                        )}
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F47822]/8">
                            <BookOpen className="h-4 w-4 text-[#F47822]" />
                        </div>
                    </div>
                </div>

                {/* Empty state */}
                {courses.length === 0 ? (
                    <div className="mt-5 rounded-xl border border-dashed border-[#3A3A3A]/10 bg-[#F8F8F8] px-5 py-8 text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                            <BookOpen className="h-5 w-5 text-[#3A3A3A]/35" />
                        </div>

                        <h3 className="mt-4 text-sm font-semibold text-[#3A3A3A]">
                            Start your learning journey
                        </h3>

                        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#3A3A3A]/50">
                            Enroll in a course and your active learning
                            progress will appear here.
                        </p>

                        <Link
                            to="/catalog"
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(244,120,34,0.20)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#df6817] hover:shadow-[0_10px_22px_rgba(244,120,34,0.28)]"
                        >
                            Explore courses

                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                ) : (
                    <div className="mt-5">
                        <div className="space-y-3">
                        {visibleCourses.map((course) => {
                            const progress = Math.min(
                                Math.max(course.progress, 0),
                                100,
                            );

                            return (
                                <div
                                    key={course.id}
                                    className="group rounded-xl border border-[#3A3A3A]/7 bg-[#FAFAFA] p-4 transition duration-200 hover:border-[#F47822]/20 hover:bg-white hover:shadow-[0_8px_24px_rgba(58,58,58,0.05)]"
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Course icon */}
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3A3A3A] transition group-hover:bg-[#F47822]">
                                            <BookOpen className="h-4 w-4 text-white" />
                                        </div>

                                        {/* Course information */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h3 className="truncate text-sm font-semibold text-[#3A3A3A]">
                                                        {course.title}
                                                    </h3>

                                                    <p className="mt-1 text-[11px] text-[#3A3A3A]/45">
                                                        {progress}% completed
                                                    </p>
                                                </div>

                                                <span className="shrink-0 text-xs font-bold text-[#F47822]">
                                                    {progress}%
                                                </span>
                                            </div>

                                            {/* Progress */}
                                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/8">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-[#F47822] to-[#ff9a55] transition-all duration-700"
                                                    style={{
                                                        width: `${progress}%`,
                                                    }}
                                                />
                                            </div>

                                            {/* Continue */}
                                            <Link
                                                to={`/courses/${course.id}`}
                                                className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#3A3A3A]/55 transition hover:text-[#F47822]"
                                            >
                                                <Play className="h-3 w-3 fill-current" />

                                                Continue course

                                                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        </div>

                        {courses.length > pageSize && (
                            <div className="mt-4 flex items-center justify-between border-t border-[#3A3A3A]/6 pt-4">
                                <p className="text-[11px] text-[#3A3A3A]/45">
                                    Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, courses.length)} of {courses.length} courses
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
                                        disabled={page === 0}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#3A3A3A]/10 text-[#3A3A3A]/55 transition hover:border-[#F47822]/25 hover:bg-[#F47822]/8 hover:text-[#F47822] disabled:cursor-not-allowed disabled:opacity-35"
                                        aria-label="Show previous courses"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="min-w-10 text-center text-[11px] font-semibold text-[#3A3A3A]/55">{page + 1} / {totalPages}</span>
                                    <button
                                        type="button"
                                        onClick={() => setPage((currentPage) => Math.min(totalPages - 1, currentPage + 1))}
                                        disabled={page === totalPages - 1}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#3A3A3A]/10 text-[#3A3A3A]/55 transition hover:border-[#F47822]/25 hover:bg-[#F47822]/8 hover:text-[#F47822] disabled:cursor-not-allowed disabled:opacity-35"
                                        aria-label="Show next courses"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
