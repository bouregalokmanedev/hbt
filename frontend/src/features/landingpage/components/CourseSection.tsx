import { useEffect, useRef, useState } from "react";
import {
    ArrowUpRight,
    ChevronRight,
    Clock3,
    Play,
} from "lucide-react";
import { Link } from "react-router-dom";

const courses = [
    {
        id: "01",
        level: "LEVEL 02",
        category: "ENGINE MANAGEMENT",
        title: "Engine Management Diagnostics",
        description:
            "Learn how modern engine management systems work and develop a structured diagnostic process.",
        duration: "8h 30m",
        lessons: "12 lessons",
        accent: "ECU / EMS",
    },
    {
        id: "02",
        level: "LEVEL 01",
        category: "VEHICLE NETWORKS",
        title: "CAN Bus Fundamentals",
        description:
            "Understand communication between control units and diagnose network-level faults.",
        duration: "6h 15m",
        lessons: "10 lessons",
        accent: "CAN / LIN",
    },
    {
        id: "03",
        level: "LEVEL 02",
        category: "SIGNAL ANALYSIS",
        title: "Oscilloscope Mastery",
        description:
            "Read automotive waveforms and turn electrical signals into diagnostic evidence.",
        duration: "9h 20m",
        lessons: "14 lessons",
        accent: "SCOPE",
    },
    {
        id: "04",
        level: "LEVEL 01",
        category: "DIAGNOSTICS",
        title: "EMS Diagnostics",
        description:
            "Build the foundations required to approach engine management faults systematically.",
        duration: "5h 40m",
        lessons: "9 lessons",
        accent: "DIAG",
    },
];

export function CoursesSection() {
    const sectionRef = useRef<HTMLElement | null>(null);

    const [activeCourse, setActiveCourse] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const section = sectionRef.current;

            if (!section) {
                return;
            }

            const rect = section.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            const start = viewportHeight * 0.8;
            const end = -rect.height * 0.2;

            const raw =
                (start - rect.top) /
                (start - end);

            const nextProgress = Math.min(
                1,
                Math.max(0, raw),
            );

            setProgress(nextProgress);

            const courseIndex = Math.min(
                courses.length - 1,
                Math.floor(
                    nextProgress * courses.length,
                ),
            );

            setActiveCourse(courseIndex);
        };

        handleScroll();

        window.addEventListener(
            "scroll",
            handleScroll,
            { passive: true },
        );

        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll,
            );
        };
    }, []);

    return (
        <section
            ref={sectionRef}
            className={[
                "relative overflow-hidden",
                "bg-[#F5F5F3]",
                "text-hbt-dark",
            ].join(" ")}
        >

            {/* =========================================================
                DECORATIVE BACKGROUND
            ========================================================== */}

            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
            >

                <div
                    className={[
                        "absolute inset-0 opacity-[0.025]",
                        "[background-image:linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]",
                        "[background-size:80px_80px]",
                    ].join(" ")}
                />

                <div
                    className={[
                        "absolute -right-40 top-20",
                        "h-[600px] w-[600px]",
                        "rounded-full",
                        "border border-black/[0.04]",
                    ].join(" ")}
                />

                <div
                    className={[
                        "absolute -right-20 top-40",
                        "h-[400px] w-[400px]",
                        "rounded-full",
                        "border border-black/[0.04]",
                    ].join(" ")}
                />

            </div>


            <div
                className={[
                    "relative mx-auto max-w-[1600px]",
                    "px-5 py-24",
                    "sm:px-8 sm:py-28",
                    "lg:px-12 lg:py-36",
                    "xl:px-16",
                ].join(" ")}
            >

                {/* =====================================================
                    TOP META
                ====================================================== */}

                <div
                    className={[
                        "flex items-center justify-between",
                        "border-b border-black/10",
                        "pb-4",
                    ].join(" ")}
                >

                    <div className="flex items-center gap-3">

                        <span
                            className={[
                                "relative flex h-2 w-2",
                                "items-center justify-center",
                            ].join(" ")}
                        >
                            <span className="absolute h-2 w-2 rounded-full bg-hbt-orange" />

                            <span
                                className={[
                                    "absolute h-4 w-4 rounded-full",
                                    "border border-hbt-orange/40",
                                    "animate-ping",
                                ].join(" ")}
                            />
                        </span>

                        <span
                            className={[
                                "text-[9px] font-bold uppercase",
                                "tracking-[0.3em]",
                            ].join(" ")}
                        >
                            Learning system
                        </span>

                    </div>


                    <span
                        className={[
                            "font-mono text-[9px]",
                            "tracking-[0.2em]",
                            "text-slate-400",
                        ].join(" ")}
                    >
                        03 / 04
                    </span>

                </div>


                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div
                    className={[
                        "relative mt-12",
                        "grid gap-10",
                        "lg:grid-cols-12",
                        "lg:items-end",
                    ].join(" ")}
                >

                    <div className="lg:col-span-8">

                        <p
                            className={[
                                "mb-6",
                                "text-[9px] font-bold uppercase",
                                "tracking-[0.35em]",
                                "text-hbt-orange",
                            ].join(" ")}
                        >
                            Technical education
                        </p>


                        <h2
                            className={[
                                "font-black uppercase",
                                "leading-[0.78]",
                                "tracking-[-0.08em]",
                                "text-[5rem]",
                                "sm:text-[7rem]",
                                "md:text-[8rem]",
                                "lg:text-[9rem]",
                                "xl:text-[11rem]",
                            ].join(" ")}
                        >
                            Learn
                            <span className="ml-[12%] block">
                                The
                            </span>

                            <span className="block text-hbt-orange">
                                System.
                            </span>
                        </h2>

                    </div>


                    <div
                        className={[
                            "lg:col-span-3 lg:col-start-10",
                            "border-l border-black/10",
                            "pl-6",
                        ].join(" ")}
                    >

                        <p
                            className={[
                                "text-sm leading-7",
                                "text-slate-600",
                            ].join(" ")}
                        >
                            Structured courses designed
                            around the systems, signals and
                            diagnostic decisions technicians
                            deal with every day.
                        </p>


                        <div
                            className={[
                                "mt-7 flex items-center gap-3",
                            ].join(" ")}
                        >

                            <div
                                className={[
                                    "h-px w-10",
                                    "bg-hbt-orange",
                                ].join(" ")}
                            />

                            <span
                                className={[
                                    "text-[8px] font-bold uppercase",
                                    "tracking-[0.2em]",
                                    "text-slate-400",
                                ].join(" ")}
                            >
                                Follow the signal
                            </span>

                        </div>

                    </div>

                </div>


                {/* =====================================================
                    COURSE SYSTEM
                ====================================================== */}

                <div
                    className={[
                        "relative mt-20",
                        "lg:mt-28",
                    ].join(" ")}
                >

                    {/* =================================================
                        MAIN SIGNAL LINE
                    ================================================== */}

                    <div
                        aria-hidden="true"
                        className={[
                            "absolute left-[19px] top-0 bottom-0",
                            "w-px",
                            "bg-black/10",
                            "sm:left-[27px]",
                        ].join(" ")}
                    >

                        <div
                            className={[
                                "absolute left-0 top-0",
                                "w-px",
                                "bg-hbt-orange",
                                "transition-[height]",
                                "duration-100",
                            ].join(" ")}
                            style={{
                                height: `${progress * 100}%`,
                            }}
                        />

                    </div>


                    {/* Animated signal travelling along line */}

                    <div
                        aria-hidden="true"
                        className={[
                            "absolute left-[16px] z-20",
                            "h-2 w-2",
                            "rounded-full",
                            "bg-hbt-orange",
                            "shadow-[0_0_0_5px_rgba(244,120,34,0.12),0_0_20px_rgba(244,120,34,0.6)]",
                            "transition-[top]",
                            "duration-100",
                            "sm:left-[24px]",
                        ].join(" ")}
                        style={{
                            top: `${progress * 100}%`,
                        }}
                    />


                    {/* =================================================
                        COURSES
                    ================================================== */}

                    <div className="space-y-6">

                        {courses.map(
                            (course, index) => {
                                const isActive =
                                    activeCourse === index;

                                const isPast =
                                    index < activeCourse;

                                return (
                                    <article
                                        key={course.id}
                                        onMouseEnter={() =>
                                            setActiveCourse(
                                                index,
                                            )
                                        }
                                        className={[
                                            "group relative",
                                            "pl-12",
                                            "sm:pl-16",
                                            "transition-all duration-500",
                                            isActive
                                                ? "opacity-100"
                                                : isPast
                                                    ? "opacity-75"
                                                    : "opacity-45",
                                        ].join(" ")}
                                    >

                                        {/* =================================================
                                            NODE
                                        ================================================== */}

                                        <div
                                            className={[
                                                "absolute left-0 top-8",
                                                "flex h-10 w-10",
                                                "items-center justify-center",
                                                "sm:h-14 sm:w-14",
                                                "transition-all duration-500",
                                                isActive
                                                    ? [
                                                        "border-2",
                                                        "border-hbt-orange",
                                                        "bg-hbt-orange",
                                                        "text-white",
                                                        "shadow-[0_0_0_8px_rgba(244,120,34,0.08)]",
                                                    ].join(" ")
                                                    : [
                                                        "border",
                                                        "border-black/15",
                                                        "bg-[#F5F5F3]",
                                                        "text-slate-400",
                                                    ].join(" "),
                                            ].join(" ")}
                                        >

                                            <span
                                                className={[
                                                    "font-mono text-[8px]",
                                                    "font-bold",
                                                    "sm:text-[9px]",
                                                ].join(" ")}
                                            >
                                                {course.id}
                                            </span>

                                        </div>


                                        {/* =================================================
                                            COURSE CARD
                                        ================================================== */}

                                        <div
                                            className={[
                                                "relative overflow-hidden",
                                                "border border-black/10",
                                                "bg-white",
                                                "transition-all duration-500",
                                                isActive
                                                    ? [
                                                        "translate-x-2",
                                                        "border-black/20",
                                                        "shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
                                                    ].join(" ")
                                                    : "shadow-none",
                                            ].join(" ")}
                                        >

                                            {/* Top orange line */}

                                            <div
                                                className={[
                                                    "absolute left-0 right-0 top-0",
                                                    "h-[2px]",
                                                    "origin-left",
                                                    "bg-hbt-orange",
                                                    "transition-transform duration-500",
                                                    isActive
                                                        ? "scale-x-100"
                                                        : "scale-x-0",
                                                ].join(" ")}
                                            />


                                            <div
                                                className={[
                                                    "grid",
                                                    "lg:grid-cols-12",
                                                ].join(" ")}
                                            >

                                                {/* =================================================
                                                    COURSE NUMBER / CATEGORY
                                                ================================================== */}

                                                <div
                                                    className={[
                                                        "border-b border-black/10",
                                                        "p-6",
                                                        "lg:col-span-3",
                                                        "lg:border-b-0",
                                                        "lg:border-r",
                                                        "lg:p-8",
                                                    ].join(" ")}
                                                >

                                                    <div
                                                        className={[
                                                            "flex items-center",
                                                            "justify-between",
                                                        ].join(" ")}
                                                    >

                                                        <span
                                                            className={[
                                                                "font-mono text-[10px]",
                                                                "text-slate-400",
                                                            ].join(" ")}
                                                        >
                                                            COURSE / {course.id}
                                                        </span>


                                                        <span
                                                            className={[
                                                                "text-[8px] font-bold",
                                                                "tracking-[0.15em]",
                                                                "text-hbt-orange",
                                                            ].join(" ")}
                                                        >
                                                            {course.accent}
                                                        </span>

                                                    </div>


                                                    <div
                                                        className={[
                                                            "mt-12",
                                                            "flex items-center gap-2",
                                                        ].join(" ")}
                                                    >

                                                        <span className="h-1.5 w-1.5 rounded-full bg-hbt-orange" />

                                                        <span
                                                            className={[
                                                                "text-[8px] font-bold",
                                                                "uppercase tracking-[0.2em]",
                                                            ].join(" ")}
                                                        >
                                                            {course.category}
                                                        </span>

                                                    </div>


                                                    <div
                                                        className={[
                                                            "mt-4 h-px",
                                                            "w-16",
                                                            "bg-black/10",
                                                            "transition-all duration-500",
                                                            isActive
                                                                ? "w-28 bg-hbt-orange"
                                                                : "",
                                                        ].join(" ")}
                                                    />

                                                </div>


                                                {/* =================================================
                                                    TITLE
                                                ================================================== */}

                                                <div
                                                    className={[
                                                        "p-6",
                                                        "lg:col-span-6",
                                                        "lg:p-8",
                                                    ].join(" ")}
                                                >

                                                    <h3
                                                        className={[
                                                            "max-w-xl",
                                                            "font-black uppercase",
                                                            "leading-[0.9]",
                                                            "tracking-[-0.055em]",
                                                            "text-3xl",
                                                            "sm:text-4xl",
                                                            "lg:text-5xl",
                                                            "transition-transform duration-500",
                                                            isActive
                                                                ? "translate-x-2"
                                                                : "",
                                                        ].join(" ")}
                                                    >
                                                        {course.title}
                                                    </h3>


                                                    <p
                                                        className={[
                                                            "mt-5 max-w-lg",
                                                            "text-xs leading-6",
                                                            "text-slate-500",
                                                            "sm:text-sm",
                                                        ].join(" ")}
                                                    >
                                                        {course.description}
                                                    </p>


                                                    <div
                                                        className={[
                                                            "mt-7 flex flex-wrap",
                                                            "items-center gap-5",
                                                        ].join(" ")}
                                                    >

                                                        <span
                                                            className={[
                                                                "flex items-center gap-2",
                                                                "text-[8px] font-bold uppercase",
                                                                "tracking-wider",
                                                                "text-slate-400",
                                                            ].join(" ")}
                                                        >
                                                            <Play className="h-3 w-3 text-hbt-orange" />

                                                            {course.lessons}
                                                        </span>


                                                        <span className="h-3 w-px bg-black/10" />


                                                        <span
                                                            className={[
                                                                "flex items-center gap-2",
                                                                "text-[8px] font-bold uppercase",
                                                                "tracking-wider",
                                                                "text-slate-400",
                                                            ].join(" ")}
                                                        >
                                                            <Clock3 className="h-3 w-3 text-hbt-orange" />

                                                            {course.duration}
                                                        </span>


                                                        <span className="h-3 w-px bg-black/10" />


                                                        <span
                                                            className={[
                                                                "text-[8px] font-bold uppercase",
                                                                "tracking-wider",
                                                                "text-slate-400",
                                                            ].join(" ")}
                                                        >
                                                            {course.level}
                                                        </span>

                                                    </div>

                                                </div>


                                                {/* =================================================
                                                    ACTION
                                                ================================================== */}

                                                <div
                                                    className={[
                                                        "flex items-end",
                                                        "border-t border-black/10",
                                                        "p-6",
                                                        "lg:col-span-3",
                                                        "lg:border-l",
                                                        "lg:border-t-0",
                                                        "lg:p-8",
                                                    ].join(" ")}
                                                >

                                                    <Link
                                                        to="/catalog"
                                                        className={[
                                                            "group/link flex w-full",
                                                            "items-center justify-between",
                                                            "border border-black/10",
                                                            "px-4 py-3",
                                                            "transition-all duration-300",
                                                            "hover:border-hbt-orange",
                                                            "hover:bg-hbt-orange",
                                                            "hover:text-white",
                                                        ].join(" ")}
                                                    >

                                                        <span
                                                            className={[
                                                                "text-[8px] font-bold uppercase",
                                                                "tracking-[0.2em]",
                                                            ].join(" ")}
                                                        >
                                                            Explore course
                                                        </span>


                                                        <ArrowUpRight
                                                            className={[
                                                                "h-4 w-4",
                                                                "transition-transform",
                                                                "group-hover/link:-translate-y-0.5",
                                                                "group-hover/link:translate-x-0.5",
                                                            ].join(" ")}
                                                        />

                                                    </Link>

                                                </div>

                                            </div>

                                        </div>

                                    </article>
                                );
                            },
                        )}

                    </div>

                </div>


                {/* =====================================================
                    BOTTOM CTA
                ====================================================== */}

                <div
                    className={[
                        "mt-16",
                        "flex flex-col gap-6",
                        "border-t border-black/10",
                        "pt-8",
                        "sm:flex-row sm:items-center",
                        "sm:justify-between",
                    ].join(" ")}
                >

                    <div>

                        <p
                            className={[
                                "text-[8px] font-bold uppercase",
                                "tracking-[0.25em]",
                                "text-slate-400",
                            ].join(" ")}
                        >
                            Your path
                        </p>

                        <p
                            className={[
                                "mt-2 font-black uppercase",
                                "tracking-[-0.03em]",
                                "text-xl",
                            ].join(" ")}
                        >
                            Learn → Practice → Diagnose
                        </p>

                    </div>


                    <Link
                        to="/catalog"
                        className={[
                            "group flex items-center gap-4",
                            "text-[9px] font-bold uppercase",
                            "tracking-[0.2em]",
                        ].join(" ")}
                    >

                        View all courses

                        <span
                            className={[
                                "flex h-10 w-10",
                                "items-center justify-center",
                                "rounded-full",
                                "bg-hbt-dark text-white",
                                "transition-all duration-300",
                                "group-hover:bg-hbt-orange",
                            ].join(" ")}
                        >
                            <ChevronRight
                                className={[
                                    "h-4 w-4",
                                    "transition-transform",
                                    "group-hover:translate-x-0.5",
                                ].join(" ")}
                            />
                        </span>

                    </Link>

                </div>

            </div>


            {/* =========================================================
                ORANGE EDGE
            ========================================================== */}

            <div
                aria-hidden="true"
                className={[
                    "absolute bottom-0 left-0",
                    "h-1 w-[35%]",
                    "bg-hbt-orange",
                ].join(" ")}
            />

        </section>
    );
}