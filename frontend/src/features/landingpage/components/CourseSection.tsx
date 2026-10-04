import { useEffect, useRef, useState } from "react";
import {
    ArrowRight,
    ArrowUpRight,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Play,
    Radio,
    ScanLine,
    Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useTranslation } from "react-i18next";

import heroImage from "@/assets/landing/heropic.webp";

import {
    Eyebrow,
    LandingContainer,
    LandingSection,
    SectionTitle,
} from "./landing-ui";

/* ================================================================
   COURSE DATA
   Translatable card fields come from `landingPage.courses.items`;
   the artwork stays local and is merged in by index.
================================================================ */

type CourseItem = {
    id: string;
    level: string;
    difficulty: string;
    category: string;
    title: string;
    duration: string;
    lessons: string;
    accent: string;
};

/* ================================================================
   COURSE SECTION
================================================================ */

export function CoursesSection() {
    const { t } = useTranslation();

    const courseItems = t("landingPage.courses.items", {
        returnObjects: true,
    }) as CourseItem[];

    const courses = courseItems.map((item) => ({
        ...item,
        image: heroImage,
    }));

    const sectionRef = useRef<HTMLElement | null>(null);

    const [activeCourse, setActiveCourse] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    /* ============================================================
       INTERSECTION
    ============================================================ */

    useEffect(() => {
        const section = sectionRef.current;

        if (!section) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                threshold: 0.12,
            },
        );

        observer.observe(section);

        return () => observer.disconnect();
    }, []);

    /* ============================================================
       KEYBOARD NAVIGATION
    ============================================================ */

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowRight") {
                setActiveCourse((current) =>
                    Math.min(current + 1, courses.length - 1),
                );
            }

            if (event.key === "ArrowLeft") {
                setActiveCourse((current) =>
                    Math.max(current - 1, 0),
                );
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const active = courses[activeCourse];

    const nextCourse = () => {
        setActiveCourse((current) =>
            current === courses.length - 1 ? 0 : current + 1,
        );
    };

    const previousCourse = () => {
        setActiveCourse((current) =>
            current === 0 ? courses.length - 1 : current - 1,
        );
    };

    return (
        <LandingSection
            id="courses"
            sectionRef={sectionRef}
            className="bg-[#F4F3F0] text-[#181818]"
        >
            {/* =====================================================
                BACKGROUND SYSTEM
            ====================================================== */}

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    inset-0
                "
            >
                {/* Technical grid */}

                <div
                    className="
                        absolute
                        inset-0
                        opacity-[0.035]
                    "
                    style={{
                        backgroundImage: `
                            linear-gradient(
                                to right,
                                #181818 1px,
                                transparent 1px
                            ),
                            linear-gradient(
                                to bottom,
                                #181818 1px,
                                transparent 1px
                            )
                        `,
                        backgroundSize: "64px 64px",
                    }}
                />

                {/* Orange atmosphere */}

                <div
                    className="
                        absolute
                        -right-[180px]
                        top-[18%]
                        h-[600px]
                        w-[600px]
                        rounded-full
                        bg-[#F47822]/[0.035]
                        blur-[120px]
                        rtl:-left-[180px]
                        rtl:right-auto
                    "
                />

                <div
                    className="
                        absolute
                        -left-[200px]
                        bottom-[10%]
                        h-[500px]
                        w-[500px]
                        rounded-full
                        bg-black/[0.025]
                        blur-[120px]
                        rtl:-right-[200px]
                        rtl:left-auto
                    "
                />

                {/* Technical circles */}

                <div
                    className="
                        absolute
                        right-[8%]
                        top-[12%]
                        h-32
                        w-32
                        rounded-full
                        border
                        border-[#181818]/[0.07]
                        rtl:left-[8%]
                        rtl:right-auto
                    "
                />

                <div
                    className="
                        absolute
                        right-[10%]
                        top-[14%]
                        h-20
                        w-20
                        rounded-full
                        border
                        border-[#F47822]/15
                        rtl:left-[10%]
                        rtl:right-auto
                    "
                />
            </div>

            {/* =====================================================
                CONTAINER
            ====================================================== */}

            <LandingContainer className="relative z-10">
                {/* =================================================
                    HEADER
                ================================================== */}

                <div
                    className={`
                        transition-all
                        duration-1000
                        ${
                            isVisible
                                ? "translate-y-0 opacity-100"
                                : "translate-y-8 opacity-0"
                        }
                    `}
                >
                   

                    {/* Heading */}

                    <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
                        <div className="lg:col-span-7">
                            <div className="flex items-center gap-3">
                                <span className="h-px w-10 bg-[#F47822]" />

                                <Eyebrow>
                                    {t("landingPage.courses.eyebrow")}
                                </Eyebrow>
                            </div>

                            <SectionTitle size="display" className="lowercase">
                                {t("landingPage.courses.titleA")}
                                <span className="text-[#F47822]">
                                    {" "}{t("landingPage.courses.titleHighlight")}
                                </span>

                                <br />

                                {t("landingPage.courses.titleB")}
                            </SectionTitle>
                        </div>

                        <div className="lg:col-span-4 lg:col-start-9">
                            <div
                                className="
                                    border-l-2
                                    border-[#F47822]
                                    pl-5
                                    rtl:border-l-0
                                    rtl:border-r-2
                                    rtl:pl-0
                                    rtl:pr-5
                                "
                            >
                                <p className="text-sm leading-7 text-[#181818]/55 sm:text-base">
                                    {t("landingPage.courses.description")}
                                </p>

                                <div className="mt-5 flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-[#F47822]" />

                                    <span className="font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-[#181818]/35">
                                        {t("landingPage.courses.practicalBadge")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =================================================
                    COURSE EXPERIENCE
                ================================================== */}

                <div
                    className={`
                        mt-6
                        grid
                        gap-6
                        transition-all
                        delay-150
                        duration-1000
                        lg:mt-8
                        lg:grid-cols-[220px_minmax(0,1fr)]
                        ${
                            isVisible
                                ? "translate-y-0 opacity-100"
                                : "translate-y-10 opacity-0"
                        }
                    `}
                >
                    {/* =================================================
                        COURSE NAVIGATION
                    ================================================== */}

                    <div className="relative">
                        <div>
                            <div className="mb-4 flex items-center justify-between lg:block">
                                <div>
                                    <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#181818]/30">
                                        {t("landingPage.courses.navLabel")}
                                    </span>

                                    <p className="mt-2 text-xl font-bold tracking-[-0.03em]">
                                        {t("landingPage.courses.navTitle")}
                                    </p>
                                </div>

                                <div className="font-mono text-[8px] text-[#181818]/25 lg:mt-4">
                                    {String(activeCourse + 1).padStart(
                                        2,
                                        "0",
                                    )}
                                    {" / "}
                                    {String(courses.length).padStart(
                                        2,
                                        "0",
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1.5 lg:overflow-visible">
                                {courses.map((course, index) => {
                                    const isActive =
                                        activeCourse === index;

                                    return (
                                        <button
                                            key={course.id}
                                            type="button"
                                            onClick={() =>
                                                setActiveCourse(index)
                                            }
                                            className={`
                                                group
                                                relative
                                                min-w-[180px]
                                                overflow-hidden
                                                rounded-xl
                                                border
                                                p-4
                                                text-left
                                                transition-all
                                                duration-300
                                                lg:w-full
                                                rtl:text-right
                                                ${
                                                    isActive
                                                        ? `
                                                            border-[#F47822]/30
                                                            bg-[#181818]
                                                            text-white
                                                            shadow-[0_15px_35px_rgba(24,24,24,0.12)]
                                                          `
                                                        : `
                                                            border-[#181818]/[0.08]
                                                            bg-white/45
                                                            text-[#181818]
                                                            hover:border-[#F47822]/25
                                                            hover:bg-white
                                                          `
                                                }
                                            `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`
                                                        font-mono
                                                        text-[8px]
                                                        font-bold
                                                        tracking-[0.15em]
                                                        ${
                                                            isActive
                                                                ? "text-[#F47822]"
                                                                : "text-[#181818]/25"
                                                        }
                                                    `}
                                                >
                                                    {course.id}
                                                </span>

                                                <ArrowUpRight
                                                    className={`
                                                        h-3.5
                                                        w-3.5
                                                        transition-all
                                                        duration-300
                                                        rtl:-scale-x-100
                                                        ${
                                                            isActive
                                                                ? "text-[#F47822]"
                                                                : "text-[#181818]/15 group-hover:text-[#F47822]"
                                                        }
                                                    `}
                                                />
                                            </div>

                                            <p
                                                className={`
                                                    mt-4
                                                    text-[9px]
                                                    font-bold
                                                    uppercase
                                                    leading-4
                                                    tracking-[0.08em]
                                                    ${
                                                        isActive
                                                            ? "text-white"
                                                            : "text-[#181818]/65"
                                                    }
                                                `}
                                            >
                                                {course.title}
                                            </p>

                                            <p
                                                className={`
                                                    mt-2
                                                    font-mono
                                                    text-[7px]
                                                    uppercase
                                                    tracking-[0.12em]
                                                    ${
                                                        isActive
                                                            ? "text-white/35"
                                                            : "text-[#181818]/25"
                                                    }
                                                `}
                                            >
                                                {course.category}
                                            </p>

                                            <div
                                                className={`
                                                    absolute
                                                    bottom-0
                                                    left-0
                                                    h-[2px]
                                                    bg-[#F47822]
                                                    transition-all
                                                    duration-300
                                                    rtl:left-auto
                                                    rtl:right-0
                                                    ${
                                                        isActive
                                                            ? "w-full"
                                                            : "w-0"
                                                    }
                                                `}
                                            />
                                        </button>
                                    );
                                })}
                            </div>

                            {/* navigation */}

                            <div className="mt-4 hidden gap-2 lg:flex">
                                <button
                                    type="button"
                                    onClick={previousCourse}
                                    className="
                                        flex
                                        h-10
                                        w-10
                                        items-center
                                        justify-center
                                        rounded-xl
                                        border
                                        border-[#181818]/10
                                        bg-white/50
                                        transition-all
                                        hover:border-[#F47822]/30
                                        hover:bg-white
                                    "
                                    aria-label={t("landingPage.courses.prevCourse")}
                                >
                                    <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
                                </button>

                                <button
                                    type="button"
                                    onClick={nextCourse}
                                    className="
                                        flex
                                        h-10
                                        w-10
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-[#181818]
                                        text-white
                                        transition-all
                                        hover:bg-[#F47822]
                                    "
                                    aria-label={t("landingPage.courses.nextCourse")}
                                >
                                    <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* =================================================
                        ACTIVE COURSE
                    ================================================== */}

                    <div className="min-w-0">
                        <div
                            className="
                                relative
                                overflow-hidden
                                rounded-[30px]
                                border
                                border-[#181818]/[0.08]
                                bg-white/65
                                shadow-[0_30px_80px_rgba(24,24,24,0.08)]
                                backdrop-blur-xl
                            "
                        >
                            {/* top technical strip */}

                            <div className="flex items-center justify-between border-b border-[#181818]/[0.07] px-5 py-3 sm:px-7">
                                <div className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#F47822]" />

                                    <span className="font-mono text-[7px] font-bold uppercase tracking-[0.2em] text-[#181818]/35">
                                        {t("landingPage.courses.activeModule")}
                                    </span>
                                </div>

                                <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-[#181818]/25">
                                    HBT / LMS / {active.id}
                                </span>
                            </div>

                            {/* =================================================
                                IMAGE
                            ================================================== */}

                            <div className="p-2.5 sm:p-3">
                                <div className="relative aspect-[16/7] overflow-hidden rounded-[23px] bg-[#181818]">
                                    <img
                                        key={active.id}
                                        src={active.image}
                                        alt={t("landingPage.courses.courseImageAlt", {
                                            title: active.title,
                                        })}
                                        className="
                                            absolute
                                            inset-0
                                            h-full
                                            w-full
                                            object-cover
                                            object-center
                                            animate-[courseImageIn_700ms_ease-out]
                                        "
                                    />

                                    {/* image overlays */}

                                    <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-black/50" />

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                    {/* scan grid */}

                                    <div
                                        aria-hidden="true"
                                        className="
                                            absolute
                                            inset-0
                                            opacity-[0.12]
                                        "
                                        style={{
                                            backgroundImage: `
                                                linear-gradient(
                                                    rgba(255,255,255,0.25) 1px,
                                                    transparent 1px
                                                ),
                                                linear-gradient(
                                                    90deg,
                                                    rgba(255,255,255,0.25) 1px,
                                                    transparent 1px
                                                )
                                            `,
                                            backgroundSize: "50px 50px",
                                        }}
                                    />

                                    {/* image information */}

                                    <div className="absolute inset-x-5 bottom-5 sm:inset-x-7 sm:bottom-7">
                                        <div className="flex flex-wrap items-end justify-between gap-5">
                                            <div>
                                                <div className="mb-3 flex items-center gap-2">
                                                    <span className="rounded-full border border-[#F47822]/40 bg-[#F47822]/15 px-3 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.15em] text-[#F47822] backdrop-blur-md">
                                                        {active.accent}
                                                    </span>

                                                    <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 font-mono text-[7px] font-bold uppercase tracking-[0.15em] text-white/60 backdrop-blur-md">
                                                        {active.level}
                                                    </span>
                                                </div>

                                                <p className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/40">
                                                    {active.category}
                                                </p>

                                                <h3 className="mt-2 max-w-3xl text-2xl font-black uppercase leading-[0.9] tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">
                                                    {active.title}
                                                </h3>
                                            </div>

                                            <div className="hidden shrink-0 sm:block">
                                                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md">
                                                    <Play
                                                        className="ml-0.5 h-5 w-5 rtl:ml-0 rtl:mr-0.5 rtl:-scale-x-100"
                                                        fill="currentColor"
                                                    />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* =================================================
                                INFORMATION
                            ================================================== */}

                            <div className="grid border-t border-[#181818]/[0.07] md:grid-cols-[1fr_auto]">
                                {/* details */}

                                <div className="grid grid-cols-2 divide-x divide-[#181818]/[0.07] sm:grid-cols-3 rtl:divide-x-reverse">
                                    <div className="p-5 sm:p-6">
                                        <span className="font-mono text-[7px] font-bold uppercase tracking-[0.16em] text-[#181818]/30">
                                            {t("landingPage.courses.lessonsLabel")}
                                        </span>

                                        <div className="mt-3 flex items-center gap-2">
                                            <Play
                                                className="h-3.5 w-3.5 text-[#F47822]"
                                                fill="currentColor"
                                            />

                                            <span className="text-sm font-bold">
                                                {active.lessons}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5 sm:p-6">
                                        <span className="font-mono text-[7px] font-bold uppercase tracking-[0.16em] text-[#181818]/30">
                                            {t("landingPage.courses.durationLabel")}
                                        </span>

                                        <div className="mt-3 flex items-center gap-2">
                                            <Clock3 className="h-3.5 w-3.5 text-[#F47822]" />

                                            <span className="text-sm font-bold">
                                                {active.duration}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-span-2 p-5 sm:col-span-1 sm:p-6">
                                        <span className="font-mono text-[7px] font-bold uppercase tracking-[0.16em] text-[#181818]/30">
                                            {t("landingPage.courses.difficultyLabel")}
                                        </span>

                                        <div className="mt-3 flex items-center gap-2">
                                            <Sparkles className="h-3.5 w-3.5 text-[#F47822]" />

                                            <span className="text-sm font-bold">
                                                {active.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA */}

                                <div className="flex items-center border-t border-[#181818]/[0.07] p-3 md:w-[210px] md:border-l md:border-t-0 md:rtl:border-l-0 md:rtl:border-r">
                                    <Link
                                        to="/catalog"
                                        className="
                                            group
                                            flex
                                            w-full
                                            items-center
                                            justify-between
                                            rounded-2xl
                                            bg-[#181818]
                                            px-4
                                            py-3.5
                                            text-white
                                            transition-all
                                            duration-300
                                            hover:-translate-y-0.5
                                            hover:bg-[#F47822]
                                            hover:shadow-[0_15px_30px_rgba(244,120,34,0.22)]
                                        "
                                    >
                                        <div>
                                            <span className="block text-[9px] font-bold uppercase tracking-[0.13em]">
                                                {t("landingPage.courses.exploreCourse")}
                                            </span>

                                            <span className="mt-1 block font-mono text-[6px] uppercase tracking-[0.14em] text-white/35">
                                                {t("landingPage.courses.viewCurriculum")}
                                            </span>
                                        </div>

                                        <span className="
                                            flex
                                            h-8
                                            w-8
                                            items-center
                                            justify-center
                                            rounded-full
                                            bg-white/10
                                            transition-transform
                                            duration-300
                                            group-hover:translate-x-0.5
                                            rtl:group-hover:-translate-x-0.5
                                            rtl:group-hover:translate-x-0
                                        ">
                                            <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                                        </span>
                                    </Link>
                                </div>
                            </div>

                            {/* active edge */}

                            <div className="absolute bottom-0 left-0 h-[3px] w-1/3 bg-[#F47822] rtl:left-auto rtl:right-0" />
                        </div>

                        {/* =================================================
                            MOBILE NAVIGATION
                        ================================================== */}

                        <div className="mt-4 flex items-center justify-between lg:hidden">
                            <button
                                type="button"
                                onClick={previousCourse}
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    rounded-full
                                    border
                                    border-[#181818]/10
                                    bg-white/60
                                    px-4
                                    py-2.5
                                    text-[8px]
                                    font-bold
                                    uppercase
                                    tracking-[0.14em]
                                "
                            >
                                <ChevronLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />

                                {t("landingPage.courses.previous")}
                            </button>

                            <div className="flex gap-1.5">
                                {courses.map((course, index) => (
                                    <button
                                        key={course.id}
                                        type="button"
                                        onClick={() =>
                                            setActiveCourse(index)
                                        }
                                        aria-label={t("landingPage.courses.selectCourse", {
                                            index: index + 1,
                                        })}
                                        className={`
                                            h-1.5
                                            rounded-full
                                            transition-all
                                            duration-300
                                            ${
                                                activeCourse === index
                                                    ? "w-7 bg-[#F47822]"
                                                    : "w-1.5 bg-[#181818]/15"
                                            }
                                        `}
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={nextCourse}
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    rounded-full
                                    bg-[#181818]
                                    px-4
                                    py-2.5
                                    text-[8px]
                                    font-bold
                                    uppercase
                                    tracking-[0.14em]
                                    text-white
                                    transition-colors
                                    hover:bg-[#F47822]
                                "
                            >
                                {t("landingPage.courses.next")}

                                <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* =================================================
                    BOTTOM SYSTEM CTA
                ================================================== */}

                <div
                    className="
                        mt-6
                        grid
                        gap-6
                        border-t
                        border-[#181818]/10
                        pt-6
                        sm:grid-cols-[1fr_auto]
                        sm:items-center
                        lg:mt-8
                    "
                >
                    <div>
                        <div className="flex items-center gap-2">
                            <ScanLine className="h-3.5 w-3.5 text-[#F47822]" />

                            <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#181818]/30">
                                {t("landingPage.courses.pathLabel")}
                            </span>
                        </div>

                        <p className="mt-3 text-xl font-black uppercase tracking-[-0.035em] sm:text-2xl">
                            {t("landingPage.courses.pathTitle")}
                        </p>
                    </div>

                    <Link
                        to="/catalog"
                        className="
                            group
                            inline-flex
                            items-center
                            justify-center
                            gap-4
                            rounded-full
                            bg-[#F47822]
                            px-6
                            py-3.5
                            text-[9px]
                            font-bold
                            uppercase
                            tracking-[0.18em]
                            text-white
                            shadow-[0_10px_30px_rgba(244,120,34,0.18)]
                            transition-all
                            duration-300
                            hover:-translate-y-0.5
                            hover:bg-[#181818]
                            hover:shadow-[0_15px_35px_rgba(24,24,24,0.15)]
                        "
                    >
                        {t("landingPage.courses.viewAll")}

                        <span className="
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-full
                            bg-white/15
                        ">
                            <ArrowRight
                                className="
                                    h-3.5
                                    w-3.5
                                    transition-transform
                                    duration-300
                                    group-hover:translate-x-1
                                    rtl:-scale-x-100
                                    rtl:group-hover:-translate-x-1
                                "
                            />
                        </span>
                    </Link>
                </div>
            </LandingContainer>

            {/* =====================================================
                BOTTOM ORANGE SIGNAL
            ====================================================== */}

            <div
                aria-hidden="true"
                className="
                    absolute
                    bottom-0
                    left-0
                    h-[2px]
                    w-[38%]
                    bg-[#F47822]
                    rtl:left-auto
                    rtl:right-0
                "
            />

            {/* =====================================================
                ANIMATION
            ====================================================== */}

            <style>{`
                @keyframes courseImageIn {
                    from {
                        opacity: 0;
                        transform: scale(1.08);
                    }

                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        scroll-behavior: auto !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>
        </LandingSection>
    );
}

export default CoursesSection;