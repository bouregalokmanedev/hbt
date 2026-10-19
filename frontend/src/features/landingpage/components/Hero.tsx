import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, BookOpen, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import scannerImage from "@/assets/landing/scanner.webp";
import ScannerScreenUI from "@/features/landingpage/components/ScannerScreenUI";

const clampUnit = (value: number) => Math.min(1, Math.max(0, value));

const HeroSection = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const sectionRef = useRef<HTMLElement | null>(null);

    const [scrollY, setScrollY] = useState(0);
    const [viewportH, setViewportH] = useState(0);
    const [dismissed, setDismissed] = useState(false);

    /* How far the hero extends past the fold at rest (sticky header offset).
       The scanner is anchored against the fold, not the section edge, so
       exactly half of it peeks above the bottom of the screen. */
    const [restGap, setRestGap] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        const handleResize = () => {
            setViewportH(window.innerHeight);

            const section = sectionRef.current;

            if (section) {
                const bottom = section.getBoundingClientRect().bottom + window.scrollY;

                setRestGap(Math.max(0, bottom - window.innerHeight));
            }
        };

        handleScroll();
        handleResize();

        window.addEventListener("scroll", handleScroll, {
            passive: true,
        });

        window.addEventListener("resize", handleResize);
        window.addEventListener("load", handleResize);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("load", handleResize);
        };
    }, []);

    const scrollToCourses = () => {
        const element = document.getElementById("courses");

        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        } else {
            window.location.href = "/catalog";
        }
    };

    const scrollToSimulator = () => {
        const element = document.getElementById("simulator");

        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        } else {
            window.location.href = "/simulator";
        }
    };

    /*
     * Scroll-driven handoff: the copy fades/lifts away while the scanner
     * rises from the bottom edge (half cropped) and grows to full size.
     * 0 = resting state, 1 = scanner only.
     */
    const grow = viewportH > 0 ? clampUnit(scrollY / (viewportH * 0.32)) : 0;

    /*
     * Phase two: a real DOM rebuild of the scanner screen (same buttons,
     * icons and colors — no upscaled screenshot) fades in at a fixed size,
     * centered in the layout. It holds there (clickable) while the hero is
     * still on screen, then releases as the hero scrolls away.
     */
    const take = viewportH > 0
        ? clampUnit((scrollY - viewportH * 0.3) / (viewportH * 0.22))
        : 0;

    const heroBottom = restGap + viewportH;
    const holdEnd = heroBottom - viewportH * 0.34;
    const releaseEnd = heroBottom - viewportH * 0.04;
    const release = viewportH > 0 && releaseEnd > holdEnd
        ? clampUnit((releaseEnd - scrollY) / (releaseEnd - holdEnd))
        : 0;

    const takeOver = Math.min(take, release);
    const isLive = takeOver >= 0.99 && !dismissed;

    useEffect(() => {
        if (takeOver < 0.99) {
            return;
        }

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setDismissed(true);
            }
        };

        window.addEventListener("keydown", handleKey);

        return () => window.removeEventListener("keydown", handleKey);
    }, [takeOver]);

    const openHotspot = (to: string) => {
        setDismissed(true);
        navigate(to);
    };

    return (
        <section
            ref={sectionRef}
            className="
                relative
                isolate
                min-h-[100svh]
                overflow-hidden
                bg-[#111111]
                text-white
            "
        >
            {/* =====================================================
                VIDEO BACKGROUND
            ====================================================== */}

            <div className="absolute inset-0 -z-20 overflow-hidden">
                <video
                    className="
                        h-full
                        w-full
                        object-cover
                        object-center
                        will-change-transform
                    "
                    style={{
                        transform: `translate3d(0, ${-scrollY * 0.08}px, 0) scale(1.1)`,
                    }}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    aria-hidden="true"
                >
                    <source
                        src="/videos/hero-video.mp4"
                        type="video/mp4"
                    />

                    {t("landingPage.hero.videoFallback")}
                </video>
            </div>

            {/* =====================================================
                OVERLAYS
            ====================================================== */}

            <div
                className="
                    absolute
                    inset-0
                    -z-10
                    bg-black/50
                "
            />

            <div
                className="
                    absolute
                    inset-0
                    -z-10
                    bg-gradient-to-r
                    from-black/95
                    via-black/60
                    to-black/20
                "
            />

            <div
                className="
                    absolute
                    inset-0
                    -z-10
                    bg-gradient-to-t
                    from-black
                    via-transparent
                    to-black/25
                "
            />

            {/* =====================================================
                MAIN CONTENT — headline + actions
            ====================================================== */}

            <div
                className="
                    relative
                    z-20
                    mx-auto
                    flex
                    min-h-[100svh]
                    w-full
                    max-w-[1440px]
                    flex-col
                    justify-center
                    px-5
                    pb-[30vh]
                    pt-12
                    sm:px-8
                    lg:px-12
                "
                style={{
                    opacity: 1 - grow,
                    transform: `translate3d(0, ${-56 * grow}px, 0)`,
                    pointerEvents: grow > 0.5 ? "none" : "auto",
                }}
            >
                <div
                    className="
                        flex
                        flex-col
                        items-center
                        text-center
                    "
                >
                    {/* =================================================
                        HEADLINE
                    ================================================== */}

                    <h1
                        className="
                            animate-hero-drop-in
                            max-w-4xl
                            text-balance
                            text-[2.5rem]
                            font-black
                            leading-[1.03]
                            tracking-[-0.035em]
                            [text-shadow:0_2px_34px_rgba(0,0,0,0.55)]
                            sm:text-5xl
                            md:text-6xl
                            lg:text-[4.7rem]
                        "
                    >
                        {t("landingPage.hero.headline")}
                    </h1>

                    {/* =================================================
                        ACTIONS
                    ================================================== */}

                    <div
                        className="
                            animate-hero-drop-in
                            mt-8
                            flex
                            flex-col
                            gap-3
                            sm:flex-row
                            sm:items-center
                        "
                        style={{ animationDelay: "240ms" }}
                    >
                        {/* Courses */}

                        <button
                            type="button"
                            onClick={scrollToCourses}
                            className="
                                group
                                inline-flex
                                h-12
                                items-center
                                justify-center
                                gap-2.5
                                rounded-xl
                                bg-[#F47822]
                                px-5
                                text-xs
                                font-bold
                                text-white
                                shadow-[0_12px_35px_rgba(244,120,34,0.22)]
                                transition-all
                                duration-300
                                hover:-translate-y-0.5
                                hover:bg-[#ff812b]
                                hover:shadow-[0_16px_45px_rgba(244,120,34,0.30)]
                            "
                        >
                            <BookOpen
                                size={16}
                                strokeWidth={2.2}
                            />

                            <span>
                                {t(
                                    "landingPage.hero.exploreCourses",
                                )}
                            </span>

                            <ArrowUpRight
                                size={16}
                                className="
                                    transition-transform
                                    duration-300
                                    group-hover:translate-x-0.5
                                    group-hover:-translate-y-0.5
                                    rtl:-scale-x-100
                                    rtl:group-hover:-translate-x-0.5
                                    rtl:group-hover:translate-y-0
                                "
                            />
                        </button>

                        {/* Simulator */}

                        <button
                            type="button"
                            onClick={scrollToSimulator}
                            className="
                                group
                                inline-flex
                                h-12
                                items-center
                                justify-center
                                gap-2.5
                                rounded-xl
                                border
                                border-white/20
                                bg-white/10
                                px-5
                                text-xs
                                font-bold
                                text-white
                                backdrop-blur-xl
                                transition-all
                                duration-300
                                hover:-translate-y-0.5
                                hover:border-white/30
                                hover:bg-white/15
                            "
                        >
                            <span
                                className="
                                    flex
                                    h-6
                                    w-6
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-white dark:bg-[#1b1b20]
                                    text-black dark:text-white
                                    transition-transform
                                    duration-300
                                    group-hover:scale-105
                                "
                            >
                                <Play
                                    size={10}
                                    fill="currentColor"
                                />
                            </span>

                            <span>
                                {t(
                                    "landingPage.hero.launchSimulator",
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* =====================================================
                SCANNER — half cropped at rest, grows on scroll
            ====================================================== */}

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    inset-x-0
                    z-10
                    flex
                    justify-center
                "
                style={{
                    bottom: `${restGap * (1 - grow)}px`,
                    transform: `translate3d(0, ${50 * (1 - grow)}%, 0) scale(${1 + 0.42 * grow})`,
                    transformOrigin: "bottom center",
                    opacity: 1 - takeOver,
                    willChange: "transform",
                }}
            >
                <div className="animate-hero-fade-in w-[min(720px,70vw,62vh)]">
                    <img
                        src={scannerImage}
                        alt=""
                        className="
                            animate-hero-float
                            drop-shadow-[0_30px_50px_rgba(0,0,0,0.55)]
                            w-full
                            h-auto
                        "
                    />
                </div>
            </div>

            {/* =====================================================
                SCREEN TAKEOVER — DOM rebuild of the scanner screen,
                fixed size, centered in the layout, clickable
            ====================================================== */}

            {createPortal(
                <div
                    data-takeover=""
                    className="
                        fixed
                        inset-0
                        z-[70]
                        flex
                        items-center
                        justify-center
                        overflow-hidden
                        bg-black/50
                    "
                    style={{
                        opacity: takeOver,
                        visibility:
                            takeOver <= 0.002 || dismissed ? "hidden" : "visible",
                        pointerEvents: isLive ? "auto" : "none",
                    }}
                >
                    <ScannerScreenUI onOpen={openHotspot} />
                </div>,
                document.body,
            )}
        </section>
    );
};

export default HeroSection;
