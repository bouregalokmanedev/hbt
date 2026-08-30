import {
    ArrowUpRight,
    Crosshair,
    Sparkles,
} from "lucide-react";

import { Link } from "react-router-dom";

export function FinalCTA() {
    return (
        <section
            className="
                group
                relative
                isolate
                min-h-[720px]
                overflow-hidden
                bg-[#F3F3F1]
                text-hbt-dark
            "
        >
            {/* =====================================================
                TECHNICAL GRID
            ====================================================== */}

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    inset-0
                    opacity-[0.045]
                    [background-image:linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]
                    [background-size:64px_64px]
                "
            />

            {/* Larger secondary grid */}
            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    inset-0
                    opacity-[0.025]
                    [background-image:linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]
                    [background-size:320px_320px]
                "
            />

            {/* =====================================================
                CENTER RADAR / CROSSHAIR
            ====================================================== */}

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    left-1/2
                    top-1/2
                    h-[520px]
                    w-[520px]
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    border
                    border-black/[0.055]
                    transition-transform
                    duration-[1800ms]
                    ease-out
                    group-hover:scale-[1.08]
                    sm:h-[620px]
                    sm:w-[620px]
                "
            />

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    left-1/2
                    top-1/2
                    h-[380px]
                    w-[380px]
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    border
                    border-black/[0.07]
                    transition-transform
                    duration-[1800ms]
                    ease-out
                    group-hover:scale-[0.9]
                    sm:h-[460px]
                    sm:w-[460px]
                "
            />

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    left-1/2
                    top-1/2
                    h-[280px]
                    w-[280px]
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    border
                    border-dashed
                    border-hbt-orange/20
                    animate-[spin_35s_linear_infinite]
                    sm:h-[340px]
                    sm:w-[340px]
                "
            />

            {/* =====================================================
                ORANGE RADIAL GLOW
            ====================================================== */}

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    left-1/2
                    top-1/2
                    h-[280px]
                    w-[280px]
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    bg-hbt-orange/[0.06]
                    blur-[100px]
                    transition-all
                    duration-1000
                    group-hover:bg-hbt-orange/[0.1]
                    group-hover:blur-[120px]
                    sm:h-[420px]
                    sm:w-[420px]
                "
            />

            {/* =====================================================
                HORIZONTAL TECHNICAL AXIS
            ====================================================== */}

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    left-0
                    right-0
                    top-1/2
                    h-px
                    bg-black/[0.08]
                "
            />

            {/* Moving orange signal */}
            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    left-[-25%]
                    top-1/2
                    h-[2px]
                    w-[25%]
                    bg-hbt-orange
                    shadow-[0_0_25px_rgba(244,120,34,0.5)]
                    animate-[signal_5s_ease-in-out_infinite]
                "
            />

            {/* =====================================================
                VERTICAL AXIS
            ====================================================== */}

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    bottom-0
                    left-1/2
                    top-0
                    w-px
                    bg-black/[0.055]
                "
            />

            {/* =====================================================
                TECHNICAL NODES
            ====================================================== */}

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    left-[12%]
                    top-[27%]
                    h-2
                    w-2
                    rounded-full
                    bg-hbt-orange
                    shadow-[0_0_0_7px_rgba(244,120,34,0.08)]
                    animate-[pulse_3s_ease-in-out_infinite]
                "
            />

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    right-[14%]
                    top-[31%]
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-black/25
                    animate-[pulse_4s_ease-in-out_infinite]
                "
            />

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    bottom-[24%]
                    left-[20%]
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-black/20
                    animate-[pulse_5s_ease-in-out_infinite]
                "
            />

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    bottom-[20%]
                    right-[23%]
                    h-2
                    w-2
                    rounded-full
                    border
                    border-hbt-orange/60
                    animate-[pulse_4s_ease-in-out_infinite]
                "
            />

            {/* =====================================================
                MAIN CONTENT
            ====================================================== */}

            <div
                className="
                    relative
                    z-10
                    mx-auto
                    flex
                    min-h-[720px]
                    w-full
                    max-w-[1600px]
                    flex-col
                    items-center
                    justify-center
                    px-5
                    py-24
                    text-center
                    sm:px-8
                    lg:px-12
                "
            >
                {/* =================================================
                    TOP STATUS
                ================================================== */}

                <div
                    className="
                        mb-9
                        flex
                        items-center
                        gap-3
                        opacity-0
                        animate-[fadeUp_0.8s_0.1s_ease-out_forwards]
                    "
                >
                    <span
                        className="
                            relative
                            flex
                            h-2
                            w-2
                            items-center
                            justify-center
                        "
                    >
                        <span className="absolute h-2 w-2 rounded-full bg-hbt-orange/30 animate-ping" />

                        <span className="relative h-1.5 w-1.5 rounded-full bg-hbt-orange" />
                    </span>

                    <span
                        className="
                            text-[9px]
                            font-bold
                            uppercase
                            tracking-[0.32em]
                            text-slate-400
                            sm:text-[10px]
                        "
                    >
                        System ready / Start your journey
                    </span>
                </div>

                {/* =================================================
                    MAIN HEADING
                ================================================== */}

                <h2
                    className="
                        max-w-[1200px]
                        text-[clamp(4rem,9.5vw,10rem)]
                        font-black
                        uppercase
                        leading-[0.79]
                        tracking-[-0.07em]
                        text-hbt-dark
                        opacity-0
                        animate-[fadeUp_0.9s_0.2s_ease-out_forwards]
                    "
                >
                    Ready to

                    <br />

                    <span className="relative inline-block text-hbt-orange">
                        diagnose
                    </span>

                    <br />

                    <span className="relative">
                        differently
                        <span className="text-hbt-orange">?</span>
                    </span>
                </h2>

                {/* =================================================
                    DESCRIPTION
                ================================================== */}

                <p
                    className="
                        mt-9
                        max-w-xl
                        text-sm
                        leading-7
                        text-slate-500
                        opacity-0
                        animate-[fadeUp_0.9s_0.35s_ease-out_forwards]
                        sm:text-base
                        sm:leading-8
                    "
                >
                    Learn the systems. Practice the diagnosis.
                    Build the confidence to solve problems that
                    actually matter.
                </p>

                {/* =================================================
                    ACTIONS
                ================================================== */}

                <div
                    className="
                        mt-10
                        flex
                        flex-col
                        items-center
                        gap-3
                        opacity-0
                        animate-[fadeUp_0.9s_0.5s_ease-out_forwards]
                        sm:flex-row
                    "
                >
                    {/* Primary CTA */}

                    <Link
                        to="/catalog"
                        className="
                            group/cta
                            relative
                            inline-flex
                            items-center
                            gap-4
                            overflow-hidden
                            rounded-full
                            bg-hbt-orange
                            px-7
                            py-4
                            text-sm
                            font-bold
                            text-white
                            shadow-[0_15px_40px_rgba(244,120,34,0.22)]
                            transition-all
                            duration-300
                            hover:-translate-y-1
                            hover:shadow-[0_20px_55px_rgba(244,120,34,0.35)]
                            active:translate-y-0
                        "
                    >
                        {/* Shine */}

                        <span
                            aria-hidden="true"
                            className="
                                absolute
                                inset-y-0
                                -left-full
                                w-1/2
                                skew-x-[-20deg]
                                bg-white/20
                                transition-all
                                duration-700
                                group-hover/cta:left-[120%]
                            "
                        />

                        <span className="relative">
                            Start learning
                        </span>

                        <span
                            className="
                                relative
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-full
                                bg-white/15
                                transition-transform
                                duration-300
                                group-hover/cta:translate-x-1
                            "
                        >
                            <ArrowUpRight className="h-4 w-4" />
                        </span>
                    </Link>

                    {/* Secondary CTA */}

                    <Link
                        to="/courses"
                        className="
                            group/explore
                            inline-flex
                            items-center
                            gap-2
                            rounded-full
                            border
                            border-black/10
                            bg-white/40
                            px-6
                            py-4
                            text-sm
                            font-semibold
                            text-hbt-dark
                            backdrop-blur-sm
                            transition-all
                            duration-300
                            hover:-translate-y-1
                            hover:border-hbt-orange/30
                            hover:bg-white/70
                        "
                    >
                        Explore platform

                        <ArrowUpRight
                            className="
                                h-4
                                w-4
                                transition-transform
                                duration-300
                                group-hover/explore:translate-x-0.5
                                group-hover/explore:-translate-y-0.5
                            "
                        />
                    </Link>
                </div>

                {/* =================================================
                    CENTER CROSSHAIR
                ================================================== */}

                <div
                    aria-hidden="true"
                    className="
                        pointer-events-none
                        absolute
                        left-1/2
                        top-1/2
                        z-[-1]
                        flex
                        h-14
                        w-14
                        -translate-x-1/2
                        -translate-y-1/2
                        items-center
                        justify-center
                        text-black/[0.08]
                        transition-transform
                        duration-[1500ms]
                        group-hover:scale-125
                    "
                >
                    <Crosshair className="h-10 w-10" />
                </div>

                {/* =================================================
                    SMALL CENTER MARK
                ================================================== */}

                <div
                    aria-hidden="true"
                    className="
                        pointer-events-none
                        absolute
                        left-1/2
                        top-1/2
                        h-1.5
                        w-1.5
                        -translate-x-1/2
                        -translate-y-1/2
                        rounded-full
                        bg-hbt-orange
                        shadow-[0_0_0_8px_rgba(244,120,34,0.06)]
                    "
                />
            </div>

            {/* =====================================================
                BOTTOM TECHNICAL STATUS BAR
            ====================================================== */}

            <div
                className="
                    absolute
                    bottom-7
                    left-5
                    right-5
                    z-20
                    flex
                    items-center
                    justify-between
                    border-t
                    border-black/[0.07]
                    pt-4
                    font-mono
                    text-[7px]
                    uppercase
                    tracking-[0.18em]
                    text-slate-300
                    sm:left-8
                    sm:right-8
                    sm:text-[8px]
                    lg:left-12
                    lg:right-12
                "
            >
                <span>
                    HBT / LEARNING
                </span>

                <span className="hidden sm:block">
                    LEARN // PRACTICE // DIAGNOSE
                </span>

                <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-hbt-orange" />

                    SYSTEM READY
                </span>
            </div>

            {/* =====================================================
                CORNER MARKERS
            ====================================================== */}

            <div
                aria-hidden="true"
                className="
                    absolute
                    left-5
                    top-5
                    h-9
                    w-9
                    border-l
                    border-t
                    border-black/10
                    sm:left-8
                    sm:top-8
                "
            />

            <div
                aria-hidden="true"
                className="
                    absolute
                    right-5
                    top-5
                    h-9
                    w-9
                    border-r
                    border-t
                    border-black/10
                    sm:right-8
                    sm:top-8
                "
            />

            <div
                aria-hidden="true"
                className="
                    absolute
                    bottom-5
                    left-5
                    h-9
                    w-9
                    border-b
                    border-l
                    border-black/10
                    sm:bottom-8
                    sm:left-8
                "
            />

            <div
                aria-hidden="true"
                className="
                    absolute
                    bottom-5
                    right-5
                    h-9
                    w-9
                    border-b
                    border-r
                    border-black/10
                    sm:bottom-8
                    sm:right-8
                "
            />

            {/* =====================================================
                TOP CORNER LABELS
            ====================================================== */}

            <div
                aria-hidden="true"
                className="
                    absolute
                    left-8
                    top-8
                    hidden
                    items-center
                    gap-2
                    font-mono
                    text-[7px]
                    uppercase
                    tracking-[0.2em]
                    text-slate-300
                    lg:flex
                "
            >
                <Sparkles className="h-3 w-3 text-hbt-orange" />

                HBT / 05
            </div>

            <div
                aria-hidden="true"
                className="
                    absolute
                    right-8
                    top-8
                    hidden
                    font-mono
                    text-[7px]
                    uppercase
                    tracking-[0.2em]
                    text-slate-300
                    lg:block
                "
            >
                FINAL DIAGNOSTIC
            </div>

            {/* =====================================================
                ORANGE BOTTOM ACCENT
            ====================================================== */}

            <div
                aria-hidden="true"
                className="
                    absolute
                    bottom-0
                    left-0
                    h-1
                    w-full
                    bg-hbt-orange
                "
            />
        </section>
    );
}