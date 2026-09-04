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

const SLIDE_WORDS = [
    "DIAGNOSE.",
    "LEARN.",
    "MASTER.",
    "BUILD.",
];

const HeroSection = () => {
    const { t } = useTranslation();

    const [activeWord, setActiveWord] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        setIsVisible(true);

        const wordInterval = window.setInterval(() => {
            setActiveWord((current) => (current + 1) % SLIDE_WORDS.length);
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

            <div className="absolute inset-0 -z-20">
                <video
                    className="
                        h-full
                        w-full
                        object-cover
                        object-center
                    "
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

                    Your browser does not support the video tag.
                </video>
            </div>

            {/* =====================================================
                VIDEO OVERLAY
            ====================================================== */}

            <div
                className="
                    absolute
                    inset-0
                    -z-10
                    bg-black/55
                "
            />

            <div
                className="
                    absolute
                    inset-0
                    -z-10
                    bg-gradient-to-r
                    from-black/90
                    via-black/65
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
                    to-black/30
                "
            />

            {/* =====================================================
                SUBTLE ORANGE LIGHT
            ====================================================== */}

            <div
                className="
                    pointer-events-none
                    absolute
                    right-[-15%]
                    top-[15%]
                    -z-10
                    h-[500px]
                    w-[500px]
                    rounded-full
                    bg-[#F47822]/15
                    blur-[140px]
                "
            />

            {/* =====================================================
                MAIN CONTENT
            ====================================================== */}

            <div
                className="
                    mx-auto
                    flex
                    min-h-[100svh]
                    w-full
                    max-w-[1600px]
                    flex-col
                    justify-center
                    px-6
                    pb-24
                    pt-12
                    sm:px-10
                    lg:px-16
                    xl:px-20
                "
            >
                <div
                    className={[
                        "max-w-5xl",
                        "transition-all",
                        "duration-1000",
                        "ease-out",
                        isVisible
                            ? "translate-y-0 opacity-100"
                            : "translate-y-8 opacity-0",
                    ].join(" ")}
                >
                    {/* =================================================
                        EYEBROW
                    ================================================== */}

                    <div
                        className="
                            mb-7
                            inline-flex
                            items-center
                            gap-3
                            rounded-full
                            border
                            border-white/15
                            bg-white/10
                            px-4
                            py-2
                            backdrop-blur-xl
                        "
                    >
                        <span
                            className="
                                relative
                                flex
                                h-2
                                w-2
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
                                    h-2
                                    w-2
                                    rounded-full
                                    bg-[#F47822]
                                "
                            />
                        </span>

                        <span
                            className="
                                text-[10px]
                                font-bold
                                uppercase
                                tracking-[0.25em]
                                text-white/80
                                sm:text-xs
                            "
                        >
                            HBTronics Learning Platform
                        </span>
                    </div>

                    {/* =================================================
                        MAIN HEADLINE
                    ================================================== */}

                    <h1
                        className="
                            max-w-6xl
                            text-5xl
                            font-black
                            leading-[0.9]
                            tracking-[-0.055em]
                            sm:text-7xl
                            md:text-8xl
                            lg:text-[7.8rem]
                            xl:text-[9rem]
                        "
                    >
                        <span className="block">
                            AUTOMOTIVE
                        </span>

                        <span
                            className="
                                relative
                                mt-2
                                block
                                min-h-[0.95em]
                                overflow-hidden
                            "
                        >
                            {SLIDE_WORDS.map((word, index) => (
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
                                        index === activeWord
                                            ? "translate-y-0 opacity-100"
                                            : index <
                                                activeWord
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

                            {/* Keeps the headline height stable */}
                            <span className="invisible">
                                MASTER.
                            </span>
                        </span>
                    </h1>

                    {/* =================================================
                        DESCRIPTION
                    ================================================== */}

                    <p
                        className="
                            mt-8
                            max-w-2xl
                            text-base
                            font-medium
                            leading-7
                            text-white/70
                            sm:text-lg
                            sm:leading-8
                        "
                    >
                        Master modern automotive diagnostics through
                        hands-on simulation, professional courses,
                        and real diagnostic workflows.
                    </p>

                    {/* =================================================
                        ACTION BUTTONS
                    ================================================== */}

                    <div
                        className="
                            mt-9
                            flex
                            flex-col
                            gap-3
                            sm:flex-row
                            sm:items-center
                        "
                    >
                        <button
                            type="button"
                            onClick={scrollToCourses}
                            className="
                                group
                                inline-flex
                                h-14
                                items-center
                                justify-center
                                gap-3
                                rounded-2xl
                                bg-[#F47822]
                                px-7
                                text-sm
                                font-bold
                                text-white
                                shadow-[0_15px_50px_rgba(244,120,34,0.25)]
                                transition-all
                                duration-300
                                hover:-translate-y-1
                                hover:bg-[#ff812b]
                                hover:shadow-[0_20px_60px_rgba(244,120,34,0.35)]
                            "
                        >
                            <BookOpen
                                size={18}
                                strokeWidth={2.2}
                            />

                            <span>
                                {t(
                                    "hero.exploreCourses",
                                    "Explore Courses",
                                )}
                            </span>

                            <ArrowUpRight
                                size={18}
                                className="
                                    transition-transform
                                    duration-300
                                    group-hover:translate-x-1
                                    group-hover:-translate-y-1
                                "
                            />
                        </button>

                        <button
                            type="button"
                            onClick={scrollToSimulator}
                            className="
                                group
                                inline-flex
                                h-14
                                items-center
                                justify-center
                                gap-3
                                rounded-2xl
                                border
                                border-white/20
                                bg-white/10
                                px-7
                                text-sm
                                font-bold
                                text-white
                                backdrop-blur-xl
                                transition-all
                                duration-300
                                hover:-translate-y-1
                                hover:border-white/35
                                hover:bg-white/15
                            "
                        >
                            <span
                                className="
                                    flex
                                    h-7
                                    w-7
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-white
                                    text-black
                                    transition-transform
                                    duration-300
                                    group-hover:scale-110
                                "
                            >
                                <Play
                                    size={12}
                                    fill="currentColor"
                                />
                            </span>

                            <span>
                                {t(
                                    "hero.launchSimulator",
                                    "Launch Simulator",
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
                        mt-16
                        flex
                        flex-col
                        gap-4
                        border-t
                        border-white/15
                        pt-6
                        sm:mt-20
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
                            gap-4
                            sm:pr-10
                        "
                    >
                        <div
                            className="
                                flex
                                h-11
                                w-11
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                border
                                border-white/10
                                bg-white/10
                                backdrop-blur-xl
                            "
                        >
                            <Users
                                size={19}
                                className="text-[#F47822]"
                            />
                        </div>

                        <div>
                            <p
                                className="
                                    text-xl
                                    font-black
                                    tracking-tight
                                "
                            >
                                2,500+
                            </p>

                            <p
                                className="
                                    text-[10px]
                                    font-semibold
                                    uppercase
                                    tracking-[0.18em]
                                    text-white/50
                                "
                            >
                                Students
                            </p>
                        </div>
                    </div>

                    {/* Divider */}

                    <div
                        className="
                            hidden
                            h-10
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
                            gap-4
                            sm:px-10
                        "
                    >
                        <div
                            className="
                                flex
                                h-11
                                w-11
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                border
                                border-white/10
                                bg-white/10
                                backdrop-blur-xl
                            "
                        >
                            <BookOpen
                                size={19}
                                className="text-[#F47822]"
                            />
                        </div>

                        <div>
                            <p
                                className="
                                    text-xl
                                    font-black
                                    tracking-tight
                                "
                            >
                                50+
                            </p>

                            <p
                                className="
                                    text-[10px]
                                    font-semibold
                                    uppercase
                                    tracking-[0.18em]
                                    text-white/50
                                "
                            >
                                Courses
                            </p>
                        </div>
                    </div>

                    {/* Divider */}

                    <div
                        className="
                            hidden
                            h-10
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
                            gap-4
                            sm:pl-10
                        "
                    >
                        <div
                            className="
                                flex
                                h-11
                                w-11
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                border
                                border-white/10
                                bg-white/10
                                backdrop-blur-xl
                            "
                        >
                            <Star
                                size={19}
                                fill="currentColor"
                                className="text-[#F47822]"
                            />
                        </div>

                        <div>
                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                "
                            >
                                <p
                                    className="
                                        text-xl
                                        font-black
                                        tracking-tight
                                    "
                                >
                                    4.9/5
                                </p>
                            </div>

                            <p
                                className="
                                    text-[10px]
                                    font-semibold
                                    uppercase
                                    tracking-[0.18em]
                                    text-white/50
                                "
                            >
                                Student Reviews
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* =====================================================
                SCROLL INDICATOR
            ====================================================== */}

            <button
                type="button"
                onClick={scrollToCourses}
                aria-label="Scroll to courses"
                className="
                    absolute
                    bottom-7
                    right-6
                    hidden
                    flex-col
                    items-center
                    gap-3
                    text-white/50
                    transition-colors
                    hover:text-white
                    sm:flex
                    lg:right-10
                "
            >
                <span
                    className="
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.3em]
                    "
                >
                    Scroll
                </span>

                <span
                    className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-white/20
                        bg-black/20
                        backdrop-blur-md
                    "
                >
                    <ArrowDown
                        size={15}
                        className="animate-bounce"
                    />
                </span>
            </button>

            {/* =====================================================
                ORANGE SCROLL LINE
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
                    "
                    style={{
                        transform: `scaleX(
                            ${Math.min(
                                1,
                                Math.max(
                                    0,
                                    scrollY / 900,
                                ),
                            )}
                        )`,
                    }}
                />
            </div>
        </section>
    );
};

export default HeroSection;