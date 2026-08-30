import {
    ArrowUpRight,
    CheckCircle2,
    Clock3,
    Globe2,
} from "lucide-react";

import { Link } from "react-router-dom";

import type { Course } from "../types/course.types";
import type { Enrollment } from "@/features/enrollments/types/enrollment.types";
import heropic from "@/assets/landing/heropic.jpg";
import heropic2 from "@/assets/landing/heropic2.jpg";

interface CourseCardProps {
    course: Course;
    enrollment?: Enrollment | null;
}

function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
}

function formatPrice(course: Course): string {
    if (course.is_free) {
        return "Free";
    }

    if (
        course.discount_price !== null &&
        course.discount_price !== undefined
    ) {
        return `${course.discount_price} ${
            course.currency ?? ""
        }`;
    }

    if (
        course.price !== null &&
        course.price !== undefined
    ) {
        return `${course.price} ${
            course.currency ?? ""
        }`;
    }

    return "View course";
}

function formatDifficulty(
    difficulty: Course["difficulty"],
): string {
    return (
        difficulty.charAt(0).toUpperCase() +
        difficulty.slice(1)
    );
}

export function CourseCard({
    course,
    enrollment = null,
}: CourseCardProps) {
    const hasDiscount =
        !course.is_free &&
        course.discount_price !== null &&
        course.discount_price !== undefined &&
        course.price !== null &&
        course.price !== undefined &&
        course.discount_price < course.price;

    /*
    |--------------------------------------------------------------------------
    | Enrollment state
    |--------------------------------------------------------------------------
    |
    | Enrollment from /api/v1/enrollments is the source of truth.
    |
    | active     -> Continue Learning
    | completed  -> Review Course
    | null       -> Start Learning / Enroll Now
    |
    */

    const enrollmentStatus =
        enrollment?.status?.toLowerCase() ?? null;

    const isCompleted =
        enrollmentStatus === "completed";

    const isEnrolled =
        enrollmentStatus === "active";
    const cardImage = course.thumbnail ?? (course.title.toLowerCase().includes("can bus") ? heropic : heropic2);

   return (
    <article
        className="
            group
            relative
            flex
            h-full
            flex-col
            overflow-hidden
            rounded-[22px]
            border
            border-black/[0.08]
            bg-[#F5F5F3]
            transition-all
            duration-500
            ease-out
            hover:-translate-y-1.5
            hover:border-black/[0.14]
            hover:shadow-[0_24px_60px_rgba(15,23,42,0.10)]
            focus-within:ring-2
            focus-within:ring-hbt-orange/30
        "
    >
        <Link
            to={`/courses/${course.id}`}
            className="
                flex
                h-full
                flex-col
                outline-none
            "
        >

            {/* =====================================================
                IMAGE
            ====================================================== */}

            <div className="relative aspect-[16/10] overflow-hidden bg-[#222]">

                {/* Image */}

                {cardImage ? <img src={cardImage} alt={course.title} className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]" /> : (
                    <div
                        className="
                            flex
                            h-full
                            w-full
                            items-center
                            justify-center
                            bg-[#242424]
                        "
                    >
                        <div className="text-center">

                            <div
                                className="
                                    mx-auto
                                    flex
                                    h-14
                                    w-14
                                    items-center
                                    justify-center
                                    rounded-2xl
                                    border
                                    border-white/10
                                    bg-white/5
                                "
                            >
                                <span
                                    className="
                                        text-xl
                                        font-black
                                        text-hbt-orange
                                    "
                                >
                                    H
                                </span>
                            </div>

                            <p
                                className="
                                    mt-3
                                    text-[9px]
                                    font-bold
                                    uppercase
                                    tracking-[0.22em]
                                    text-white/40
                                "
                            >
                                HBT Learning
                            </p>

                        </div>
                    </div>
                )}


                {/* =================================================
                    IMAGE OVERLAY
                ================================================== */}

                <div
                    className="
                        absolute
                        inset-0
                        bg-gradient-to-t
                        from-black/75
                        via-black/10
                        to-black/5
                    "
                />


                {/* Subtle orange glow */}

                <div
                    className="
                        pointer-events-none
                        absolute
                        -bottom-20
                        -left-20
                        h-40
                        w-40
                        rounded-full
                        bg-hbt-orange/20
                        blur-3xl
                        transition-all
                        duration-700
                        group-hover:scale-150
                    "
                />


                {/* =================================================
                    TOP META
                ================================================== */}

                <div
                    className="
                        absolute
                        left-4
                        right-4
                        top-4
                        flex
                        items-start
                        justify-between
                    "
                >

                    {/* Course number */}

                    <span
                        className="
                            font-mono
                            text-[8px]
                            font-bold
                            uppercase
                            tracking-[0.2em]
                            text-white/60
                        "
                    >
                        
                    </span>


                    {/* Difficulty */}

                    <span
                        className="
                            inline-flex
                            items-center
                            rounded-full
                            border
                            border-white/20
                            bg-black/20
                            px-2.5
                            py-1.5
                            text-[8px]
                            font-bold
                            uppercase
                            tracking-[0.12em]
                            text-white
                            backdrop-blur-md
                        "
                    >
                        {formatDifficulty(
                            course.difficulty,
                        )}
                    </span>

                </div>


                {/* =================================================
                    FREE BADGE
                ================================================== */}

                {course.is_free && (
                    <div
                        className="
                            absolute
                            bottom-4
                            right-4
                        "
                    >
                        <span
                            className="
                                inline-flex
                                items-center
                                rounded-full
                                bg-hbt-orange
                                px-3
                                py-1.5
                                text-[8px]
                                font-bold
                                uppercase
                                tracking-[0.12em]
                                text-white
                                shadow-lg
                            "
                        >
                            Free
                        </span>
                    </div>
                )}


                {/* =================================================
                    ENROLLMENT STATUS
                ================================================== */}

                {isCompleted ? (
                    <div
                        className="
                            absolute
                            bottom-4
                            left-4
                        "
                    >
                        <span
                            className="
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-full
                                border
                                border-white/15
                                bg-black/55
                                px-3
                                py-1.5
                                text-[8px]
                                font-bold
                                uppercase
                                tracking-[0.12em]
                                text-white
                                backdrop-blur-md
                            "
                        >
                            <CheckCircle2 className="h-3 w-3" />

                            Completed
                        </span>
                    </div>
                ) : isEnrolled ? (
                    <div
                        className="
                            absolute
                            bottom-4
                            left-4
                        "
                    >
                        <span
                            className="
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-full
                                border
                                border-white/15
                                bg-black/55
                                px-3
                                py-1.5
                                text-[8px]
                                font-bold
                                uppercase
                                tracking-[0.12em]
                                text-white
                                backdrop-blur-md
                            "
                        >
                            <CheckCircle2 className="h-3 w-3" />

                            Enrolled
                        </span>
                    </div>
                ) : null}


                {/* =================================================
                    HOVER ARROW
                ================================================== */}

                <div
                    className="
                        absolute
                        bottom-4
                        right-4
                        flex
                        h-10
                        w-10
                        translate-y-3
                        items-center
                        justify-center
                        rounded-full
                        bg-white
                        text-hbt-dark
                        opacity-0
                        shadow-xl
                        transition-all
                        duration-400
                        group-hover:translate-y-0
                        group-hover:opacity-100
                    "
                >
                    <ArrowUpRight
                        className="
                            h-4
                            w-4
                            transition-transform
                            duration-300
                            group-hover:rotate-0
                        "
                    />
                </div>

            </div>


            {/* =====================================================
                CONTENT
            ====================================================== */}

            <div
                className="
                    flex
                    flex-1
                    flex-col
                    px-5
                    pb-5
                    pt-5
                "
            >

                {/* =================================================
                    SMALL CATEGORY LINE
                ================================================== */}

                <div
                    className="
                        mb-3
                        flex
                        items-center
                        gap-2
                    "
                >

                    <span
                        className="
                            h-1.5
                            w-1.5
                            rounded-full
                            bg-hbt-orange
                        "
                    />

                    <span
                        className="
                            text-[8px]
                            font-bold
                            uppercase
                            tracking-[0.22em]
                            text-slate-400
                        "
                    >
                        Automotive Diagnostics
                    </span>

                </div>


                {/* =================================================
                    TITLE
                ================================================== */}

                <h3
                    className="
                        line-clamp-2
                        min-h-[3.25rem]
                        text-[19px]
                        font-bold
                        leading-[1.15]
                        tracking-[-0.035em]
                        text-hbt-dark
                        transition-colors
                        duration-300
                        group-hover:text-hbt-orange
                    "
                >
                    {course.title}
                </h3>


                {/* =================================================
                    DESCRIPTION
                ================================================== */}

                {course.short_description ? (
                    <p
                        className="
                            mt-2.5
                            line-clamp-2
                            min-h-[2.75rem]
                            text-xs
                            leading-5
                            text-slate-500
                        "
                    >
                        {course.short_description}
                    </p>
                ) : (
                    <div className="min-h-[2.75rem]" />
                )}


                {/* =================================================
                    METADATA
                ================================================== */}

                <div
                    className="
                        mt-5
                        flex
                        items-center
                        gap-4
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.08em]
                        text-slate-400
                    "
                >

                    <span
                        className="
                            inline-flex
                            items-center
                            gap-1.5
                        "
                    >
                        <Clock3 className="h-3.5 w-3.5" />

                        {formatDuration(
                            course.duration_minutes,
                        )}
                    </span>


                    <span
                        className="
                            h-1
                            w-1
                            rounded-full
                            bg-slate-300
                        "
                    />


                    <span
                        className="
                            inline-flex
                            items-center
                            gap-1.5
                        "
                    >
                        <Globe2 className="h-3.5 w-3.5" />

                        {course.language.toUpperCase()}
                    </span>

                </div>


                {/* =================================================
                    BOTTOM
                ================================================== */}

                <div
                    className="
                        mt-5
                        border-t
                        border-black/[0.08]
                        pt-4
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            justify-between
                            gap-4
                        "
                    >

                        {/* Price */}

                        <div className="min-w-0">

                            {course.is_free ? (

                                <span
                                    className="
                                        text-sm
                                        font-bold
                                        text-hbt-orange
                                    "
                                >
                                    Free
                                </span>

                            ) : (

                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >

                                    <span
                                        className="
                                            text-sm
                                            font-bold
                                            text-hbt-dark
                                        "
                                    >
                                        {formatPrice(
                                            course,
                                        )}
                                    </span>

                                    {hasDiscount && (
                                        <span
                                            className="
                                                text-[10px]
                                                text-slate-400
                                                line-through
                                            "
                                        >
                                            {
                                                course.price
                                            }{" "}
                                            {
                                                course.currency
                                            }
                                        </span>
                                    )}

                                </div>

                            )}

                        </div>


                        {/* CTA */}

                        <span
                            className="
                                inline-flex
                                shrink-0
                                items-center
                                gap-1.5
                                text-[10px]
                                font-bold
                                uppercase
                                tracking-[0.08em]
                                text-hbt-dark
                                transition-colors
                                duration-300
                                group-hover:text-hbt-orange
                            "
                        >

                            {isCompleted
                                ? "Review Course"
                                : isEnrolled
                                  ? "Continue Learning"
                                  : course.is_free
                                    ? "Start Learning"
                                    : "Enroll Now"}

                            <ArrowUpRight
                                className="
                                    h-3.5
                                    w-3.5
                                    transition-all
                                    duration-300
                                    group-hover:-translate-y-0.5
                                    group-hover:translate-x-0.5
                                "
                            />

                        </span>

                    </div>


                    {/* =================================================
                        ANIMATED DIAGNOSTIC LINE
                    ================================================== */}

                    <div
                        className="
                            mt-4
                            flex
                            items-center
                            gap-3
                        "
                    >

                        <div
                            className="
                                h-px
                                flex-1
                                overflow-hidden
                                bg-black/[0.08]
                            "
                        >
                            <div
                                className="
                                    h-full
                                    w-1/4
                                    bg-hbt-orange
                                    transition-all
                                    duration-700
                                    ease-out
                                    group-hover:w-full
                                "
                            />
                        </div>


                        <span
                            className="
                                font-mono
                                text-[7px]
                                font-bold
                                tracking-[0.15em]
                                text-slate-300
                            "
                        >
                            HBT
                        </span>

                    </div>

                </div>

            </div>

        </Link>
    </article>
);
}
