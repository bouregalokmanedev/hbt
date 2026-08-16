
import { ArrowUpRight, Clock3, Globe2 } from "lucide-react";
import { Link } from "react-router-dom";

import type { Course } from "../types/course.types";

interface CourseCardProps {
    course: Course;
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
        return `${course.discount_price} ${course.currency ?? ""}`;
    }

    if (
        course.price !== null &&
        course.price !== undefined
    ) {
        return `${course.price} ${course.currency ?? ""}`;
    }

    return "View course";
}

function formatDifficulty(
    difficulty: Course["difficulty"],
): string {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

export function CourseCard({
    course,
}: CourseCardProps) {
    const hasDiscount =
        !course.is_free &&
        course.discount_price !== null &&
        course.discount_price !== undefined &&
        course.price !== null &&
        course.price !== undefined &&
        course.discount_price < course.price;

    return (
        <article
            className="
                group
                flex
                h-full
                flex-col
                overflow-hidden
                rounded-2xl
                border
                border-border
                bg-card
                shadow-[var(--shadow-card)]
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-[var(--shadow-lg)]
                focus-within:ring-2
                focus-within:ring-primary/30
            "
        >
            <Link
                to={`/courses/${course.id}`}
                className="flex h-full flex-col outline-none"
            >
                {/* =====================================================
                    IMAGE
                   ===================================================== */}

                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    {course.thumbnail ? (
                        <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="
                                h-full
                                w-full
                                object-cover
                                transition-transform
                                duration-700
                                ease-out
                                group-hover:scale-105
                            "
                        />
                    ) : (
                        <div
                            className="
                                flex
                                h-full
                                w-full
                                items-center
                                justify-center
                                bg-hbt-surface
                            "
                        >
                            <div className="text-center">
                                <div
                                    className="
                                        mx-auto
                                        flex
                                        h-12
                                        w-12
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-primary/10
                                        text-primary
                                    "
                                >
                                    <span className="text-lg font-bold">
                                        H
                                    </span>
                                </div>

                                <p className="mt-2 text-xs font-medium text-muted-foreground">
                                    HBT Learning
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Image overlay */}
                    <div
                        className="
                            absolute
                            inset-0
                            bg-gradient-to-t
                            from-black/25
                            via-transparent
                            to-transparent
                            opacity-0
                            transition-opacity
                            duration-300
                            group-hover:opacity-100
                        "
                    />

                    {/* Difficulty */}
                    <div className="absolute left-4 top-4">
                        <span
                            className="
                                inline-flex
                                items-center
                                rounded-full
                                border
                                border-white/60
                                bg-white/90
                                px-3
                                py-1.5
                                text-xs
                                font-semibold
                                text-hbt-dark
                                shadow-sm
                                backdrop-blur-md
                            "
                        >
                            {formatDifficulty(course.difficulty)}
                        </span>
                    </div>

                    {/* Free */}
                    {course.is_free && (
                        <div className="absolute right-4 top-4">
                            <span
                                className="
                                    inline-flex
                                    items-center
                                    rounded-full
                                    bg-primary
                                    px-3
                                    py-1.5
                                    text-xs
                                    font-semibold
                                    text-primary-foreground
                                    shadow-sm
                                "
                            >
                                Free
                            </span>
                        </div>
                    )}

                    {/* Hover action */}
                    <div
                        className="
                            absolute
                            bottom-4
                            right-4
                            flex
                            h-9
                            w-9
                            translate-y-2
                            items-center
                            justify-center
                            rounded-full
                            bg-white
                            text-hbt-dark
                            opacity-0
                            shadow-lg
                            transition-all
                            duration-300
                            group-hover:translate-y-0
                            group-hover:opacity-100
                        "
                    >
                        <ArrowUpRight className="h-4 w-4" />
                    </div>
                </div>

                {/* =====================================================
                    CONTENT
                   ===================================================== */}

                <div className="flex flex-1 flex-col p-5">
                    {/* Title + description */}
                    <div>
                        <h3
                            className="
                                line-clamp-2
                                min-h-[3rem]
                                text-[17px]
                                font-semibold
                                leading-6
                                tracking-tight
                                text-foreground
                                transition-colors
                                group-hover:text-primary
                            "
                        >
                            {course.title}
                        </h3>

                        {course.short_description ? (
                            <p
                                className="
                                    mt-2
                                    line-clamp-2
                                    min-h-[3rem]
                                    text-sm
                                    leading-6
                                    text-muted-foreground
                                "
                            >
                                {course.short_description}
                            </p>
                        ) : (
                            <div className="min-h-[3rem]" />
                        )}
                    </div>

                    {/* Metadata */}
                    <div
                        className="
                            mt-5
                            flex
                            flex-wrap
                            items-center
                            gap-x-4
                            gap-y-2
                            text-xs
                            font-medium
                            text-muted-foreground
                        "
                    >
                        <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5" />

                            {formatDuration(
                                course.duration_minutes,
                            )}
                        </span>

                        <span className="h-1 w-1 rounded-full bg-border-strong" />

                        <span className="inline-flex items-center gap-1.5">
                            <Globe2 className="h-3.5 w-3.5" />

                            {course.language.toUpperCase()}
                        </span>
                    </div>

                    {/* Bottom */}
                    <div
                        className="
                            mt-5
                            flex
                            items-center
                            justify-between
                            gap-4
                            border-t
                            border-border
                            pt-4
                        "
                    >
                        {/* Price */}
                        <div className="min-w-0">
                            {course.is_free ? (
                                <span className="text-base font-bold text-primary">
                                    Free
                                </span>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-bold text-foreground">
                                        {formatPrice(course)}
                                    </span>

                                    {hasDiscount && (
                                        <span className="text-xs text-muted-foreground line-through">
                                            {course.price}{" "}
                                            {course.currency ?? ""}
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
                                text-sm
                                font-semibold
                                text-hbt-dark
                                transition-colors
                                group-hover:text-primary
                            "
                        >
                            View course

                            <ArrowUpRight
                                className="
                                    h-4
                                    w-4
                                    transition-transform
                                    duration-300
                                    group-hover:-translate-y-0.5
                                    group-hover:translate-x-0.5
                                "
                            />
                        </span>
                    </div>
                </div>
            </Link>
        </article>
    );
}