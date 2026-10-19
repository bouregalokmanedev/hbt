import { useEffect, useRef, useState } from "react";

import { useTranslation } from "react-i18next";

/* =====================================================
   STATS — company page "by the numbers" band
   Big count-up figures on a dark band, animated once
   when the grid scrolls into view.
===================================================== */

type StatItem = {
    value: number;
    suffix: string;
    label: string;
};

const COUNT_DURATION = 1600;
const STAGGER_MS = 120;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function prefersReducedMotion(): boolean {
    return (
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

export function StatsSection() {
    const { t } = useTranslation();

    const items = t("companyPage.stats.items", {
        returnObjects: true,
    }) as StatItem[];

    const gridRef = useRef<HTMLDivElement | null>(null);

    /* null = waiting for the grid to enter the viewport. */
    const [elapsed, setElapsed] = useState<number | null>(null);

    useEffect(() => {
        const grid = gridRef.current;

        if (!grid) {
            return;
        }

        if (prefersReducedMotion()) {
            setElapsed(COUNT_DURATION + items.length * STAGGER_MS);
            return;
        }

        let raf = 0;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) {
                        continue;
                    }

                    observer.disconnect();

                    const start = performance.now();

                    const tick = (now: number) => {
                        const e = now - start;

                        setElapsed(e);

                        if (e < COUNT_DURATION + (items.length - 1) * STAGGER_MS) {
                            raf = requestAnimationFrame(tick);
                        }
                    };

                    raf = requestAnimationFrame(tick);
                }
            },
            { threshold: 0.35 },
        );

        observer.observe(grid);

        return () => {
            observer.disconnect();
            cancelAnimationFrame(raf);
        };
    }, [items.length]);

    const revealed = elapsed !== null;

    return (
        <section className="relative overflow-hidden bg-hbt-dark text-white">

            {/* =================================================
                DECORATIONS
            ================================================== */}

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    inset-0
                    opacity-[0.35]
                    [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]
                    [background-size:48px_48px]
                "
            />

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    left-1/2
                    top-0
                    h-[360px]
                    w-[720px]
                    -translate-x-1/2
                    rounded-full
                    bg-hbt-orange/10
                    blur-[120px]
                "
            />

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    bottom-[-160px]
                    right-[-160px]
                    h-[420px]
                    w-[420px]
                    rounded-full
                    border
                    border-hbt-orange/10
                    rtl:right-auto
                    rtl:left-[-160px]
                "
            />

            {/* =================================================
                CONTENT
            ================================================== */}

            <div
                className="
                    relative
                    mx-auto
                    w-full
                    max-w-[1600px]
                    px-5
                    py-20
                    sm:px-8
                    lg:px-12
                    lg:py-24
                "
            >

                <div className="text-center">

                    <span
                        className="
                            font-mono
                            text-[9px]
                            font-bold
                            uppercase
                            tracking-[0.25em]
                            text-hbt-orange
                        "
                    >
                        {t("companyPage.stats.eyebrow")}
                    </span>

                    <h2
                        className="
                            mx-auto
                            mt-5
                            max-w-4xl
                            text-3xl
                            font-semibold
                            leading-tight
                            tracking-[-0.035em]
                            sm:text-4xl
                            lg:text-5xl
                        "
                    >
                        {t("companyPage.stats.title")}
                    </h2>

                    <p
                        className="
                            mx-auto
                            mt-5
                            max-w-2xl
                            text-base
                            leading-7
                            text-white/55
                        "
                    >
                        {t("companyPage.stats.description")}
                    </p>

                </div>

                <div
                    ref={gridRef}
                    className={[
                        "mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
                        "transition-all duration-700 ease-out",
                        revealed
                            ? "translate-y-0 opacity-100"
                            : "translate-y-6 opacity-0",
                    ].join(" ")}
                >
                    {items.map((item, index) => {
                        const localProgress =
                            elapsed === null
                                ? 0
                                : Math.min(
                                      1,
                                      Math.max(
                                          0,
                                          (elapsed - index * STAGGER_MS) /
                                              COUNT_DURATION,
                                      ),
                                  );

                        const display = Math.round(
                            easeOutCubic(localProgress) * item.value,
                        );

                        return (
                            <div
                                key={item.label}
                                className="
                                    group
                                    rounded-2xl
                                    border
                                    border-white/10
                                    bg-white/[0.04]
                                    p-7
                                    text-center
                                    transition-all
                                    duration-300
                                    hover:-translate-y-1
                                    hover:border-hbt-orange/40
                                    hover:bg-white/[0.07]
                                "
                            >
                                <span
                                    aria-hidden="true"
                                    className="
                                        mx-auto
                                        mb-6
                                        block
                                        h-px
                                        w-10
                                        bg-hbt-orange/60
                                        transition-all
                                        duration-300
                                        group-hover:w-20
                                        group-hover:bg-hbt-orange
                                    "
                                />

                                <p
                                    className="
                                        text-5xl
                                        font-semibold
                                        tracking-[-0.04em]
                                        text-hbt-orange
                                        tabular-nums
                                        sm:text-[3.4rem]
                                        sm:leading-none
                                    "
                                    aria-hidden="true"
                                >
                                    {display}

                                    <span className="text-[0.55em] font-medium tracking-normal">
                                        {item.suffix}
                                    </span>
                                </p>

                                <p
                                    className="
                                        mt-4
                                        text-sm
                                        leading-6
                                        text-white/60
                                    "
                                    aria-hidden="true"
                                >
                                    {item.label}
                                </p>

                                <span className="sr-only">
                                    {`${item.value}${item.suffix} — ${item.label}`}
                                </span>
                            </div>
                        );
                    })}
                </div>

            </div>

        </section>
    );
}
