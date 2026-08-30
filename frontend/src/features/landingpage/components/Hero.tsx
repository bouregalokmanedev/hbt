import {
    ArrowDownRight,
    ArrowRight,
    Play,
} from "lucide-react";

import { Link } from "react-router-dom";

export function Hero() {
    return (
        <section
            className={[
                "relative isolate overflow-hidden",
                "min-h-screen",
                "bg-[#F3F3F3]",
            ].join(" ")}
        >
            {/* =========================================================
                BACKGROUND
            ========================================================== */}

            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10"
            >
                {/* Large typography detail */}

                <span
                    className={[
                        "absolute",
                        "-bottom-20 -left-8",
                        "select-none",
                        "text-[18rem]",
                        "font-black",
                        "leading-none",
                        "tracking-[-0.08em]",
                        "text-black/[0.025]",
                        "sm:text-[24rem]",
                        "lg:text-[32rem]",
                    ].join(" ")}
                >
                    HBT
                </span>

                {/* Fine grid */}

                <div
                    className={[
                        "absolute inset-0",
                        "opacity-[0.025]",
                        "[background-image:linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)]",
                        "[background-size:64px_64px]",
                    ].join(" ")}
                />
            </div>


            {/* =========================================================
                MAIN
            ========================================================== */}

            <div
                className={[
                    "mx-auto",
                    "max-w-[1600px]",
                    "px-5",
                    "sm:px-8",
                    "lg:px-12",
                    "xl:px-16",
                ].join(" ")}
            >
                <div
                    className={[
                        "relative",
                        "min-h-[calc(100vh-88px)]",
                        "py-10",
                        "sm:py-14",
                        "lg:py-16",
                    ].join(" ")}
                >

                    {/* =================================================
                        TOP META
                    ================================================== */}

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
                                    "h-2 w-2",
                                    "rounded-full",
                                    "bg-hbt-orange",
                                ].join(" ")}
                            />

                            <span
                                className={[
                                    "text-[10px]",
                                    "font-bold",
                                    "uppercase",
                                    "tracking-[0.25em]",
                                    "text-hbt-dark",
                                ].join(" ")}
                            >
                                HBTronics Learning
                            </span>
                        </div>

                        <span
                            className={[
                                "hidden sm:block",
                                "font-mono",
                                "text-[10px]",
                                "tracking-widest",
                                "text-slate-400",
                            ].join(" ")}
                        >
                            EDUCATION / 01
                        </span>
                    </div>


                    {/* =================================================
                        HERO CONTENT
                    ================================================== */}

                    <div
                        className={[
                            "relative",
                            "mt-10",
                            "lg:mt-14",
                        ].join(" ")}
                    >

                        {/* Small vertical label */}

                        <div
                            className={[
                                "absolute",
                                "left-0 top-2",
                                "hidden xl:flex",
                                "items-center gap-3",
                                "[writing-mode:vertical-rl]",
                                "rotate-180",
                            ].join(" ")}
                        >
                            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400">
                                Learn / Practice / Certify
                            </span>

                            <span className="h-16 w-px bg-black/10" />
                        </div>


                        {/* Main grid */}

                        <div
                            className={[
                                "grid",
                                "lg:grid-cols-12",
                                "lg:gap-8",
                            ].join(" ")}
                        >

                            {/* =========================================
                                HEADLINE
                            ========================================== */}

                            <div
                                className={[
                                    "relative z-20",
                                    "lg:col-span-8",
                                    "xl:col-span-7",
                                ].join(" ")}
                            >

                                <p
                                    className={[
                                        "mb-5",
                                        "text-[10px]",
                                        "font-bold",
                                        "uppercase",
                                        "tracking-[0.3em]",
                                        "text-hbt-orange",
                                    ].join(" ")}
                                >
                                    Professional Learning Platform
                                </p>


                                <h1
                                    className={[
                                        "font-black",
                                        "uppercase",
                                        "leading-[0.84]",
                                        "tracking-[-0.065em]",
                                        "text-hbt-dark",
                                        "text-[4.5rem]",
                                        "sm:text-[6.5rem]",
                                        "md:text-[8rem]",
                                        "lg:text-[8rem]",
                                        "xl:text-[10rem]",
                                    ].join(" ")}
                                >
                                    <span className="block">
                                        Learn.
                                    </span>

                                    <span className="block">
                                        Practice.
                                    </span>

                                    <span
                                        className={[
                                            "block",
                                            "text-hbt-orange",
                                        ].join(" ")}
                                    >
                                        Master.
                                    </span>
                                </h1>

                            </div>


                            {/* =========================================
                                SIDE DESCRIPTION
                            ========================================== */}

                            <div
                                className={[
                                    "relative z-20",
                                    "mt-8",
                                    "flex flex-col",
                                    "lg:col-span-4",
                                    "lg:mt-28",
                                    "xl:col-span-4",
                                    "xl:col-start-9",
                                ].join(" ")}
                            >

                                <div
                                    className={[
                                        "max-w-sm",
                                        "border-l-2",
                                        "border-hbt-orange",
                                        "pl-5",
                                    ].join(" ")}
                                >
                                    <p
                                        className={[
                                            "text-base",
                                            "font-medium",
                                            "leading-7",
                                            "text-hbt-dark",
                                            "sm:text-lg",
                                            "sm:leading-8",
                                        ].join(" ")}
                                    >
                                        Build real technical skills through
                                        structured learning, practical
                                        diagnostics, and professional
                                        certification.
                                    </p>

                                    <p
                                        className={[
                                            "mt-4",
                                            "text-sm",
                                            "leading-6",
                                            "text-slate-500",
                                        ].join(" ")}
                                    >
                                        From your first lesson to your next
                                        certification, everything you need
                                        to become better at what you do.
                                    </p>
                                </div>


                                {/* CTA */}

                                <div
                                    className={[
                                        "mt-8",
                                        "flex flex-wrap items-center gap-5",
                                    ].join(" ")}
                                >
                                    <Link
                                        to="/register"
                                        className={[
                                            "group",
                                            "inline-flex",
                                            "items-center",
                                            "gap-3",
                                            "rounded-full",
                                            "bg-hbt-orange",
                                            "px-6 py-3.5",
                                            "text-xs",
                                            "font-bold",
                                            "uppercase",
                                            "tracking-wider",
                                            "text-white",
                                            "transition-all duration-200",
                                            "hover:-translate-y-0.5",
                                            "hover:bg-[#e96916]",
                                            "hover:shadow-[0_12px_30px_rgba(244,120,34,0.25)]",
                                        ].join(" ")}
                                    >
                                        Start Learning

                                        <ArrowRight
                                            className={[
                                                "h-4 w-4",
                                                "transition-transform",
                                                "duration-200",
                                                "group-hover:translate-x-1",
                                            ].join(" ")}
                                        />
                                    </Link>


                                    <Link
                                        to="/catalog"
                                        className={[
                                            "group",
                                            "inline-flex",
                                            "items-center gap-2",
                                            "text-xs",
                                            "font-bold",
                                            "uppercase",
                                            "tracking-wider",
                                            "text-hbt-dark",
                                        ].join(" ")}
                                    >
                                        <span
                                            className={[
                                                "flex h-8 w-8",
                                                "items-center justify-center",
                                                "rounded-full",
                                                "border border-black/15",
                                                "transition-all duration-200",
                                                "group-hover:border-hbt-orange",
                                                "group-hover:bg-hbt-orange",
                                                "group-hover:text-white",
                                            ].join(" ")}
                                        >
                                            <Play className="ml-0.5 h-3 w-3 fill-current" />
                                        </span>

                                        Explore courses
                                    </Link>
                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            IMAGE COMPOSITION
                        ================================================== */}

                        <div
                            className={[
                                "relative",
                                "z-10",
                                "mt-10",
                                "lg:-mt-12",
                                "lg:ml-[12%]",
                                "lg:w-[82%]",
                                "xl:-mt-20",
                                "xl:ml-[13%]",
                                "xl:w-[78%]",
                            ].join(" ")}
                        >

                            {/* Orange frame */}

                            <div
                                aria-hidden="true"
                                className={[
                                    "absolute",
                                    "-right-3 -top-3",
                                    "h-full w-full",
                                    "border-2 border-hbt-orange",
                                    "sm:-right-5 sm:-top-5",
                                ].join(" ")}
                            />


                            {/* Image */}

                            <div
                                className={[
                                    "relative",
                                    "aspect-[16/8]",
                                    "overflow-hidden",
                                    "bg-[#292929]",
                                ].join(" ")}
                            >

                                <img
                                    src="/src/assets/landing/heropic.jpg"
                                    alt="Automotive technician working on vehicle diagnostics"
                                    className={[
                                        "h-full w-full",
                                        "object-cover",
                                        "object-center",
                                        "grayscale",
                                        "transition-all duration-700",
                                        "hover:scale-[1.02]",
                                        "hover:grayscale-0",
                                    ].join(" ")}
                                />


                                {/* Image overlay */}

                                <div
                                    className={[
                                        "absolute inset-0",
                                        "bg-gradient-to-r",
                                        "from-black/50 via-black/10 to-transparent",
                                    ].join(" ")}
                                />


                                {/* Image label */}

                                <div
                                    className={[
                                        "absolute",
                                        "bottom-5 left-5",
                                        "sm:bottom-7 sm:left-7",
                                    ].join(" ")}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="h-px w-8 bg-white/60" />

                                        <span
                                            className={[
                                                "text-[9px]",
                                                "font-bold",
                                                "uppercase",
                                                "tracking-[0.25em]",
                                                "text-white",
                                            ].join(" ")}
                                        >
                                            Learn by doing
                                        </span>
                                    </div>
                                </div>


                                {/* Image number */}

                                <div
                                    className={[
                                        "absolute",
                                        "right-5 top-5",
                                        "sm:right-7 sm:top-7",
                                    ].join(" ")}
                                >
                                    <span
                                        className={[
                                            "font-mono",
                                            "text-[10px]",
                                            "tracking-widest",
                                            "text-white/70",
                                        ].join(" ")}
                                    >
                                        HBT / 001
                                    </span>
                                </div>

                            </div>


                            {/* =================================================
                                FLOATING IMAGE CAPTION
                            ================================================== */}

                            <div
                                className={[
                                    "absolute",
                                    "-bottom-7 right-4",
                                    "z-20",
                                    "hidden sm:block",
                                    "bg-hbt-dark",
                                    "px-5 py-4",
                                    "text-white",
                                    "shadow-xl",
                                ].join(" ")}
                            >
                                <div className="flex items-center gap-4">

                                    <div>
                                        <p
                                            className={[
                                                "text-[9px]",
                                                "font-bold",
                                                "uppercase",
                                                "tracking-[0.2em]",
                                                "text-hbt-orange",
                                            ].join(" ")}
                                        >
                                            Practical
                                        </p>

                                        <p className="mt-1 text-xs font-medium">
                                            Knowledge that works.
                                        </p>
                                    </div>

                                    <ArrowDownRight className="h-5 w-5 text-hbt-orange" />

                                </div>
                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        BOTTOM INFORMATION
                    ================================================== */}

                    <div
                        className={[
                            "mt-14",
                            "flex flex-col gap-5",
                            "border-t border-black/10",
                            "pt-5",
                            "sm:flex-row sm:items-center sm:justify-between",
                        ].join(" ")}
                    >

                        <div
                            className={[
                                "flex flex-wrap",
                                "items-center",
                                "gap-x-6 gap-y-2",
                            ].join(" ")}
                        >
                            <span
                                className={[
                                    "text-[9px]",
                                    "font-bold",
                                    "uppercase",
                                    "tracking-[0.2em]",
                                    "text-slate-400",
                                ].join(" ")}
                            >
                                Courses
                            </span>

                            <span className="h-1 w-1 rounded-full bg-hbt-orange" />

                            <span
                                className={[
                                    "text-[9px]",
                                    "font-bold",
                                    "uppercase",
                                    "tracking-[0.2em]",
                                    "text-slate-400",
                                ].join(" ")}
                            >
                                Practical Training
                            </span>

                            <span className="h-1 w-1 rounded-full bg-hbt-orange" />

                            <span
                                className={[
                                    "text-[9px]",
                                    "font-bold",
                                    "uppercase",
                                    "tracking-[0.2em]",
                                    "text-slate-400",
                                ].join(" ")}
                            >
                                Certification
                            </span>
                        </div>


                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-[9px] font-medium uppercase tracking-wider">
                                Discover your next skill
                            </span>

                            <ArrowDownRight className="h-4 w-4 text-hbt-orange" />
                        </div>

                    </div>

                </div>
            </div>


            {/* =========================================================
                MOBILE IMAGE SPACING / DECORATION
            ========================================================== */}

            <div
                aria-hidden="true"
                className={[
                    "absolute",
                    "bottom-0 right-0",
                    "h-1",
                    "w-1/3",
                    "bg-hbt-orange",
                ].join(" ")}
            />
        </section>
    );
}