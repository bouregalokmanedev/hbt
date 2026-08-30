import {
    ArrowUpRight,
    Crosshair,
    Gauge,
    Radio,
    Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const LAUNCH_DATE = new Date(
    new Date().setMonth(new Date().getMonth() + 5),
);

interface Countdown {
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function getCountdown(target: Date): Countdown {
    const now = new Date();

    if (target.getTime() <= now.getTime()) {
        return {
            months: 0,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
        };
    }

    let months =
        (target.getFullYear() - now.getFullYear()) * 12 +
        target.getMonth() -
        now.getMonth();

    const anchor = new Date(now);
    anchor.setMonth(anchor.getMonth() + months);

    if (anchor > target) {
        months -= 1;
        anchor.setMonth(anchor.getMonth() - 1);
    }

    const remaining = target.getTime() - anchor.getTime();

    const days = Math.floor(
        remaining / (1000 * 60 * 60 * 24),
    );

    const hours = Math.floor(
        (remaining / (1000 * 60 * 60)) % 24,
    );

    const minutes = Math.floor(
        (remaining / (1000 * 60)) % 60,
    );

    const seconds = Math.floor(
        (remaining / 1000) % 60,
    );

    return {
        months,
        days,
        hours,
        minutes,
        seconds,
    };
}

function pad(value: number): string {
    return value.toString().padStart(2, "0");
}

export function ComingSoonPage() {
    const [countdown, setCountdown] =
        useState<Countdown>(() =>
            getCountdown(LAUNCH_DATE),
        );

    useEffect(() => {
        const timer = window.setInterval(() => {
            setCountdown(
                getCountdown(LAUNCH_DATE),
            );
        }, 1000);

        return () => {
            window.clearInterval(timer);
        };
    }, []);

    const countdownItems = useMemo(
        () => [
            {
                value: countdown.months,
                label: "Months",
            },
            {
                value: countdown.days,
                label: "Days",
            },
            {
                value: countdown.hours,
                label: "Hours",
            },
            {
                value: countdown.minutes,
                label: "Minutes",
            },
            {
                value: countdown.seconds,
                label: "Seconds",
            },
        ],
        [countdown],
    );

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#101010] text-white">
            {/* =====================================================
                BACKGROUND
            ====================================================== */}

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    inset-0
                    opacity-[0.055]
                    [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]
                    [background-size:72px_72px]
                "
            />

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    left-1/2
                    top-1/2
                    h-[700px]
                    w-[700px]
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    bg-[#F47822]/[0.055]
                    blur-[120px]
                "
            />

            {/* =====================================================
                SCANNING LINE
            ====================================================== */}

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    left-0
                    right-0
                    top-0
                    z-20
                    h-px
                    bg-[#F47822]
                    shadow-[0_0_25px_rgba(244,120,34,0.8)]
                    animate-[scan_7s_linear_infinite]
                "
            />

            {/* =====================================================
                HEADER
            ====================================================== */}

            <header className="relative z-30 mx-auto flex max-w-[1600px] items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
                <Link
                    to="/"
                    className="group flex items-center"
                >
                </Link>

                <div className="flex items-center gap-3 font-mono text-[8px] font-semibold uppercase tracking-[0.2em] text-white/35">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F47822]/50" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F47822]" />
                    </span>

                    System building
                </div>
            </header>

            {/* =====================================================
                TECHNICAL CORNERS
            ====================================================== */}

            <div className="pointer-events-none absolute left-5 top-24 h-10 w-10 border-l border-t border-white/10 sm:left-8 lg:left-12" />

            <div className="pointer-events-none absolute right-5 top-24 h-10 w-10 border-r border-t border-white/10 sm:right-8 lg:right-12" />

            <div className="pointer-events-none absolute bottom-8 left-5 h-10 w-10 border-b border-l border-white/10 sm:left-8 lg:left-12" />

            <div className="pointer-events-none absolute bottom-8 right-5 h-10 w-10 border-b border-r border-white/10 sm:right-8 lg:right-12" />

            {/* =====================================================
                MAIN
            ====================================================== */}

            <section className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] max-w-[1500px] flex-col items-center justify-center px-5 pb-28 pt-12 text-center sm:px-8 lg:px-12">
                {/* Status */}

                <div className="mb-8 flex items-center gap-3 opacity-0 animate-[fadeUp_0.8s_0.1s_ease-out_forwards]">
                    <Radio className="h-3.5 w-3.5 text-[#F47822]" />

                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">
                        HBT / SYSTEM INITIALIZATION
                    </span>

                    <span className="h-px w-10 bg-[#F47822]/40" />
                </div>

                {/* Heading */}

                <h1
                    className="
                        max-w-6xl
                        text-[clamp(3.4rem,9vw,9rem)]
                        font-black
                        uppercase
                        leading-[0.8]
                        tracking-[-0.07em]
                        text-white
                        opacity-0
                        animate-[fadeUp_0.9s_0.2s_ease-out_forwards]
                    "
                >
                    The next

                    <br />

                    <span className="text-[#F47822]">
                        diagnosis
                    </span>

                    <br />

                    starts soon.
                </h1>

                {/* Slogan */}

                <p
                    className="
                        mt-8
                        max-w-xl
                        text-sm
                        leading-6
                        text-white/45
                        opacity-0
                        animate-[fadeUp_0.9s_0.35s_ease-out_forwards]
                        sm:text-base
                    "
                >
                    Train smarter. Diagnose deeper.
                    <br className="hidden sm:block" />
                    Become unstoppable.
                </p>

                {/* =================================================
                    COUNTDOWN
                ================================================== */}

                <div
                    className="
                        mt-12
                        grid
                        w-full
                        max-w-4xl
                        grid-cols-2
                        gap-px
                        overflow-hidden
                        border
                        border-white/10
                        bg-white/10
                        opacity-0
                        animate-[fadeUp_0.9s_0.5s_ease-out_forwards]
                        sm:grid-cols-5
                    "
                >
                    {countdownItems.map(
                        ({ value, label }, index) => (
                            <div
                                key={label}
                                className="
                                    group/countdown
                                    relative
                                    bg-[#151515]
                                    px-4
                                    py-6
                                    transition-colors
                                    duration-300
                                    hover:bg-[#1a1a1a]
                                    sm:px-5
                                    sm:py-8
                                "
                            >
                                <div
                                    aria-hidden="true"
                                    className="
                                        absolute
                                        left-0
                                        top-0
                                        h-px
                                        w-0
                                        bg-[#F47822]
                                        transition-all
                                        duration-500
                                        group-hover/countdown:w-full
                                    "
                                />

                                <p className="font-mono text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
                                    {pad(value)}
                                </p>

                                <p className="mt-2 font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-white/30">
                                    {label}
                                </p>

                                {index <
                                    countdownItems.length -
                                        1 && (
                                    <span className="absolute -right-0.5 top-1/2 hidden h-1 w-1 -translate-y-1/2 rounded-full bg-[#F47822] sm:block" />
                                )}
                            </div>
                        ),
                    )}
                </div>

                {/* =================================================
                    SYSTEM INFO
                ================================================== */}

                <div
                    className="
                        mt-10
                        flex
                        flex-wrap
                        items-center
                        justify-center
                        gap-x-7
                        gap-y-3
                        font-mono
                        text-[8px]
                        font-semibold
                        uppercase
                        tracking-[0.18em]
                        text-white/25
                        opacity-0
                        animate-[fadeUp_0.9s_0.65s_ease-out_forwards]
                    "
                >
                    <span className="flex items-center gap-2">
                        <Gauge className="h-3 w-3 text-[#F47822]" />
                        Training engine
                    </span>

                    <span className="hidden h-3 w-px bg-white/10 sm:block" />

                    <span className="flex items-center gap-2">
                        <Crosshair className="h-3 w-3 text-[#F47822]" />
                        Diagnostic intelligence
                    </span>

                    <span className="hidden h-3 w-px bg-white/10 sm:block" />

                    <span className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-[#F47822]" />
                        AI-powered learning
                    </span>
                </div>

                {/* =================================================
                    CTA
                ================================================== */}

                <div
                    className="
                        mt-10
                        opacity-0
                        animate-[fadeUp_0.9s_0.8s_ease-out_forwards]
                    "
                >
                    <Link
                        to="/catalog"
                        className="
                            group/cta
                            relative
                            inline-flex
                            items-center
                            gap-3
                            overflow-hidden
                            rounded-full
                            bg-[#F47822]
                            px-6
                            py-3.5
                            text-sm
                            font-bold
                            text-white
                            shadow-[0_15px_45px_rgba(244,120,34,0.2)]
                            transition-all
                            duration-300
                            hover:-translate-y-1
                            hover:bg-[#ff873b]
                            hover:shadow-[0_20px_55px_rgba(244,120,34,0.3)]
                        "
                    >
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
                                group-hover/cta:left-[130%]
                            "
                        />

                        <span className="relative">
                            Explore HBTronics
                        </span>

                        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5" />
                        </span>
                    </Link>
                </div>
            </section>

            {/* =====================================================
                FOOTER TECHNICAL BAR
            ====================================================== */}

            <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/[0.06] px-5 py-4 sm:px-8 lg:px-12">
                <div className="mx-auto flex max-w-[1600px] items-center justify-between font-mono text-[7px] font-semibold uppercase tracking-[0.2em] text-white/20">
                    <span>HBTRONICS / 2026</span>

                    <span className="hidden sm:block">
                        DIAGNOSIS // TRAINING // CERTIFICATION
                    </span>

                    <span className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#F47822] shadow-[0_0_10px_rgba(244,120,34,0.7)]" />
                        BUILD IN PROGRESS
                    </span>
                </div>
            </div>
        </main>
    );
}