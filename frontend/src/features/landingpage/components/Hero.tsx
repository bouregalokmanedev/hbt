import { useEffect, useState } from "react";
import {
    ArrowDown,
    ArrowUpRight,
    BookOpen,
    Play,
    Star,
    Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { useFitToViewport } from "../hooks/useFitToViewport";

const HeroSection = () => {
    const { t } = useTranslation();
    const { sectionRef, contentRef, scale } = useFitToViewport();

    const slideWords = t("landingPage.hero.slideWords", {
        returnObjects: true,
    }) as string[];

    const [activeWord, setActiveWord] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        setIsVisible(true);

        const wordInterval = window.setInterval(() => {
            setActiveWord((current) => (current + 1) % slideWords.length);
        }, 2600);

        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener("scroll", handleScroll, {
            passive: true,
        });

        return () => {
            window.clearInterval(wordInterval);
            window.removeEventListener("scroll", handleScroll);
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
                md:flex
                md:h-[calc(100svh-5rem)]
                md:min-h-0
                md:flex-col
                md:items-center
                md:justify-center
                md:snap-start
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

            {/* =================================================
                TECH GRID PATTERN
            ================================================== */}

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    inset-0
                    -z-10
                    opacity-[0.12]
                "
                style={{
                    backgroundImage:
                        "linear-gradient(to right, rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.7) 1px, transparent 1px)",
                    backgroundSize: "72px 72px",
                    maskImage:
                        "radial-gradient(ellipse at 50% 45%, black 0%, transparent 78%)",
                    WebkitMaskImage:
                        "radial-gradient(ellipse at 50% 45%, black 0%, transparent 78%)",
                }}
            />

            {/* =================================================
                WARM BOTTOM BLOOM
            ================================================== */}

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    bottom-[-18%]
                    left-[-12%]
                    -z-10
                    h-[520px]
                    w-[520px]
                    rounded-full
                    bg-[#F47822]/18
                    blur-[150px]
                    rtl:left-auto
                    rtl:right-[-12%]
                "
            />

            {/* =================================================
                ORANGE LIGHT
            ====================================================== */}

            <div
                className="
                    pointer-events-none
                    absolute
                    right-[-15%]
                    top-[20%]
                    -z-10
                    h-[420px]
                    w-[420px]
                    rounded-full
                    bg-[#F47822]/12
                    blur-[130px]
                    rtl:left-[-15%]
                    rtl:right-auto
                "
            />

            {/* =====================================================
                MAIN CONTENT
            ====================================================== */}

            <div
                ref={contentRef}
                className="w-full"
                style={
                    scale < 1
                        ? {
                              transform: `scale(${scale})`,
                              transformOrigin: "center center",
                          }
                        : undefined
                }
            >
            <div
                className="
                    mx-auto
                    flex
                    min-h-[100svh]
                    w-full
                    max-w-[1440px]
                    flex-col
                    justify-center
                    px-5
                    pb-16
                    pt-14
                    sm:px-8
                    lg:px-12
                    md:min-h-0
                "
            >
                <div
                    className={[
                        "max-w-4xl",
                        "transition-all",
                        "duration-1000",
                        "ease-out",
                        isVisible
                            ? "translate-y-0 opacity-100"
                            : "translate-y-6 opacity-0",
                    ].join(" ")}
                >
                    {/* =================================================
                        EYEBROW
                    ================================================== */}

                    <div
                        className="
                            mb-6
                            inline-flex
                            items-center
                            gap-2.5
                            rounded-full
                            border
                            border-white/15
                            bg-white/10
                            px-3.5
                            py-1.5
                            backdrop-blur-xl
                        "
                    >
                        <span
                            className="
                                relative
                                flex
                                h-1.5
                                w-1.5
                            "
                        >
                            <span
                                className="
                                    absolute
                                    inline-flex
                                    h-full
                                    w-full
                                    animate-ping
                                    rounded-full
                                    bg-[#F47822]
                                    opacity-75
                                "
                            />

                            <span
                                className="
                                    relative
                                    inline-flex
                                    h-1.5
                                    w-1.5
                                    rounded-full
                                    bg-[#F47822]
                                "
                            />
                        </span>

                        <span
                            className="
                                text-[9px]
                                font-semibold
                                uppercase
                                tracking-[0.22em]
                                text-white/75
                                sm:text-[10px]
                            "
                        >
                            {t("landingPage.hero.badge")}
                        </span>
                    </div>

                    {/* =================================================
                        HEADLINE
                    ================================================== */}

                    <h1
                        className="
                            max-w-5xl
                            text-[2.75rem]
                            font-black
                            leading-[0.92]
                            tracking-[-0.045em]
                            [text-shadow:0_2px_34px_rgba(0,0,0,0.55)]
                            sm:text-5xl
                            md:text-5xl
                            lg:text-[4.5rem]
                            xl:text-[5rem]
                        "
                    >
                        <span className="block">
                            {t("landingPage.hero.titleA")}
                        </span>

                        <span
                            className="
                                relative
                                mt-1
                                block
                                min-h-[0.95em]
                                overflow-hidden
                            "
                        >
                            {slideWords.map((word, index) => (
                                <span
                                    key={word}
                                    className={[
                                        "absolute",
                                        "left-0",
                                        "top-0",
                                        "block",
                                        "transition-all",
                                        "duration-700",
                                        "ease-[cubic-bezier(0.22,1,0.36,1)]",
                                        "rtl:left-auto",
                                        "rtl:right-0",
                                        index === activeWord
                                            ? "translate-y-0 opacity-100"
                                            : index < activeWord
                                              ? "-translate-y-full opacity-0"
                                              : "translate-y-full opacity-0",
                                        index === activeWord
                                            ? "text-[#F47822]"
                                            : "",
                                    ].join(" ")}
                                >
                                    {word}
                                </span>
                            ))}

                            <span className="invisible">
                                {t("landingPage.hero.slideFallback")}
                            </span>
                        </span>
                    </h1>

                    {/* =================================================
                        DESCRIPTION
                    ================================================== */}

                    <p
                        className="
                            mt-6
                            max-w-xl
                            text-sm
                            font-normal
                            leading-6
                            text-white/65
                            sm:text-base
                            sm:leading-7
                        "
                    >
                        {t("landingPage.hero.description")}
                    </p>

                    {/* =================================================
                        ACTIONS
                    ================================================== */}

                    <div
                        className="
                            mt-7
                            flex
                            flex-col
                            gap-3
                            sm:flex-row
                            sm:items-center
                        "
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
                                    rtl:group-hover:translate-x-0
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
                                    bg-white
                                    text-black
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

                {/* =====================================================
                    PLATFORM STATS
                ====================================================== */}

                <div
                    className="
                        mt-8
                        flex
                        w-fit
                        max-w-full
                        flex-col
                        gap-5
                        rounded-3xl
                        border
                        border-white/15
                        bg-white/[0.07]
                        px-6
                        py-5
                        backdrop-blur-xl
                        shadow-[0_24px_60px_rgba(0,0,0,0.35)]
                        sm:mt-10
                        sm:flex-row
                        sm:items-center
                        sm:gap-0
                    "
                >
                    {/* Students */}

                    <div
                        className="
                            flex
                            items-center
                            gap-3
                            sm:pr-8
                        "
                    >
                        <div
                            className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-white/10
                                bg-white/10
                                backdrop-blur-xl
                            "
                        >
                            <Users
                                size={16}
                                className="text-[#F47822]"
                            />
                        </div>

                        <div>
                            <p
                                className="
                                    text-lg
                                    font-bold
                                    tracking-tight
                                "
                            >
                                2,500+
                            </p>

                            <p
                                className="
                                    text-[9px]
                                    font-medium
                                    uppercase
                                    tracking-[0.16em]
                                    text-white/45
                                "
                            >
                                {t("landingPage.hero.stats.students")}
                            </p>
                        </div>
                    </div>

                    {/* Divider */}

                    <div
                        className="
                            hidden
                            h-8
                            w-px
                            bg-white/15
                            sm:block
                        "
                    />

                    {/* Courses */}

                    <div
                        className="
                            flex
                            items-center
                            gap-3
                            sm:px-8
                        "
                    >
                        <div
                            className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-white/10
                                bg-white/10
                                backdrop-blur-xl
                            "
                        >
                            <BookOpen
                                size={16}
                                className="text-[#F47822]"
                            />
                        </div>

                        <div>
                            <p
                                className="
                                    text-lg
                                    font-bold
                                    tracking-tight
                                "
                            >
                                50+
                            </p>

                            <p
                                className="
                                    text-[9px]
                                    font-medium
                                    uppercase
                                    tracking-[0.16em]
                                    text-white/45
                                "
                            >
                                {t("landingPage.hero.stats.courses")}
                            </p>
                        </div>
                    </div>

                    {/* Divider */}

                    <div
                        className="
                            hidden
                            h-8
                            w-px
                            bg-white/15
                            sm:block
                        "
                    />

                    {/* Reviews */}

                    <div
                        className="
                            flex
                            items-center
                            gap-3
                            sm:pl-8
                        "
                    >
                        <div
                            className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-white/10
                                bg-white/10
                                backdrop-blur-xl
                            "
                        >
                            <Star
                                size={16}
                                fill="currentColor"
                                className="text-[#F47822]"
                            />
                        </div>

                        <div>
                            <p
                                className="
                                    text-lg
                                    font-bold
                                    tracking-tight
                                "
                            >
                                4.9/5
                            </p>

                            <p
                                className="
                                    text-[9px]
                                    font-medium
                                    uppercase
                                    tracking-[0.16em]
                                    text-white/45
                                "
                            >
                                {t("landingPage.hero.stats.reviews")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            </div>

            {/* =====================================================
                ORANGE SCROLL PROGRESS
            ====================================================== */}

            <div
                className="
                    pointer-events-none
                    absolute
                    bottom-0
                    left-0
                    right-0
                    h-[2px]
                    bg-white/10
                "
            >
                <div
                    className="
                        h-full
                        origin-left
                        bg-[#F47822]
                        transition-transform
                        duration-150
                        rtl:origin-right
                    "
                    style={{
                        transform: `scaleX(${Math.min(
                            1,
                            Math.max(0, scrollY / 900),
                        )})`,
                    }}
                />
            </div>
        </section>
    );
};

export default HeroSection;