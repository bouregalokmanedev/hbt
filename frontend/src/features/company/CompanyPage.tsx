import {
    ArrowRight,
    ArrowUpRight,
    Award,
    BookOpen,
    Check,
    ChevronRight,
    Cpu,
    Gauge,
    GraduationCap,
    Layers3,
    Play,
    ShieldCheck,
    Sparkles,
    Target,
    Users,
    Wrench,
} from "lucide-react";

import { Link } from "react-router-dom";

import { useTranslation } from "react-i18next";

import { Footer } from "../landingpage/components/FooterSection";
import { Navbar } from "./../../components/navigation/Navbar";


/* =============================================================
   DATA
============================================================= */








/* =============================================================
   COMPANY PAGE
============================================================= */

export function CompanyPage() {
    const { t } = useTranslation();

    const principles = (
        t("companyPage.principles.items", { returnObjects: true }) as Array<{
            title: string;
            description: string;
        }>
    ).map((item, index) => ({
        ...item,
        number: `0${index + 1}`,
        icon: [Cpu, Wrench, Award][index] ?? Cpu,
    }));

    const platformFeatures = (
        t("companyPage.platform.items", { returnObjects: true }) as Array<{
            title: string;
            description: string;
        }>
    ).map((item, index) => ({
        ...item,
        icon: [BookOpen, Gauge, ShieldCheck, GraduationCap][index] ?? BookOpen,
    }));

    const audiences = t("companyPage.audiences.items", {
        returnObjects: true,
    }) as string[];

    const heroLabels = t("companyPage.hero.labels", {
        returnObjects: true,
    }) as string[];

    return (
        <div className="company-page-ar min-h-screen bg-white text-hbt-dark">

            <Navbar />

            <main>

                {/* =================================================
                    HERO
                ================================================== */}

                <section
                    className="
                        relative
                        overflow-hidden
                        border-b
                        border-slate-200
                        bg-[#F7F7F7]
                    "
                >

                    {/* Grid */}

                    <div
                        aria-hidden="true"
                        className="
                            pointer-events-none
                            absolute
                            inset-0
                            opacity-[0.45]
                            [background-image:linear-gradient(to_right,#d9d9d9_1px,transparent_1px),linear-gradient(to_bottom,#d9d9d9_1px,transparent_1px)]
                            [background-size:64px_64px]
                        "
                    />

                    {/* Orange technical line */}

                    <div
                        aria-hidden="true"
                        className="
                            absolute
                            left-0
                            top-0
                            h-px
                            w-full
                            bg-gradient-to-r
                            from-transparent
                            via-hbt-orange
                            to-transparent
                        "
                    />

                    <div
                        className="
                            relative
                            mx-auto
                            flex
                            min-h-[680px]
                            w-full
                            max-w-[1600px]
                            items-center
                            px-5
                            pb-20
                            pt-36
                            sm:px-8
                            lg:px-12
                            lg:pt-10
                        "
                    >

                        <div className="grid w-full gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">

                            {/* Left */}

                            <div>

                                <div
                                    className="
                                        mb-7
                                        inline-flex
                                        items-center
                                        gap-2
                                        rounded-full
                                        border
                                        border-hbt-orange/20
                                        bg-white
                                        px-3
                                        py-1.5
                                        shadow-sm
                                    "
                                >
                                    <span
                                        className="
                                            h-1.5
                                            w-1.5
                                            rounded-full
                                            bg-hbt-orange
                                        "
                                    />

                                    <span
                                        className="
                                            font-mono
                                            text-[9px]
                                            font-bold
                                            uppercase
                                            tracking-[0.2em]
                                            text-hbt-orange
                                        "
                                    >
                                        {t("companyPage.hero.badge")}
                                    </span>
                                </div>


                                <h1
                                    className="
                                        max-w-4xl
                                        text-5xl
                                        font-bold
                                        leading-[0.95]
                                        tracking-[-0.055em]
                                        text-hbt-dark
                                        sm:text-6xl
                                        lg:text-8xl
                                    "
                                >
                                    {t("companyPage.hero.titleA")}
                                    <br />

                                    <span className="text-hbt-orange">
                                        {t("companyPage.hero.titleMid")}
                                    </span>

                                    <br />

                                    {t("companyPage.hero.titleB")}
                                </h1>


                                <p
                                    className="
                                        mt-8
                                        max-w-2xl
                                        text-base
                                        leading-7
                                        text-slate-500
                                        sm:text-lg
                                    "
                                >
                                    {t("companyPage.hero.description")}
                                </p>


                                <div className="mt-9 flex flex-wrap gap-3">

                                    <Link
                                        to="/catalog"
                                        className="
                                            group
                                            inline-flex
                                            items-center
                                            gap-2
                                            rounded-xl
                                            bg-hbt-orange
                                            px-5
                                            py-3.5
                                            text-sm
                                            font-bold
                                            text-white
                                            shadow-[0_10px_30px_rgba(244,120,34,0.2)]
                                            transition-all
                                            duration-300
                                            hover:-translate-y-0.5
                                            hover:bg-[#e96916]
                                        "
                                    >
                                        {t("companyPage.hero.catalogBtn")}

                                        <ArrowUpRight
                                            className="
                                                h-4
                                                w-4
                                                transition-transform
                                                duration-300
                                                group-hover:-translate-y-0.5
                                                group-hover:translate-x-0.5
                                                rtl:-scale-x-100
                                                rtl:group-hover:-translate-x-0.5
                                                rtl:group-hover:translate-x-0
                                            "
                                        />
                                    </Link>


                                    <Link
                                        to="/contact"
                                        className="
                                            inline-flex
                                            items-center
                                            gap-2
                                            rounded-xl
                                            border
                                            border-slate-300
                                            bg-white
                                            px-5
                                            py-3.5
                                            text-sm
                                            font-semibold
                                            text-hbt-dark
                                            transition-all
                                            duration-300
                                            hover:border-slate-400
                                            hover:bg-slate-50
                                        "
                                    >
                                        {t("companyPage.hero.contactBtn")}
                                    </Link>

                                </div>

                            </div>


                            {/* Right technical panel */}

                            <div
                                className="
                                    relative
                                    hidden
                                    lg:block
                                "
                            >

                                <div
                                    className="
                                        relative
                                        mx-auto
                                        aspect-square
                                        max-w-[480px]
                                    "
                                >

                                    {/* Outer rings */}

                                    <div
                                        className="
                                            absolute
                                            inset-0
                                            rounded-full
                                            border
                                            border-slate-300
                                        "
                                    />

                                    <div
                                        className="
                                            absolute
                                            inset-[12%]
                                            rounded-full
                                            border
                                            border-dashed
                                            border-slate-300
                                        "
                                    />

                                    <div
                                        className="
                                            absolute
                                            inset-[24%]
                                            rounded-full
                                            border
                                            border-slate-300
                                        "
                                    />


                                    {/* Center */}

                                    <div
                                        className="
                                            absolute
                                            left-1/2
                                            top-1/2
                                            flex
                                            h-40
                                            w-40
                                            -translate-x-1/2
                                            -translate-y-1/2
                                            flex-col
                                            items-center
                                            justify-center
                                            rounded-full
                                            bg-hbt-dark
                                            text-center
                                            shadow-[0_30px_80px_rgba(0,0,0,0.18)]
                                        "
                                    >

                                        <Cpu className="h-7 w-7 text-hbt-orange" />

                                        <span
                                            className="
                                                mt-3
                                                font-mono
                                                text-[9px]
                                                font-bold
                                                uppercase
                                                tracking-[0.2em]
                                                text-white/40
                                            "
                                        >
                                            {t("companyPage.hero.systemLabel")}
                                        </span>

                                        <span className="mt-1 text-xs font-semibold text-white">
                                            {t("companyPage.hero.systemSub")}
                                        </span>

                                    </div>


                                    {/* Floating labels */}

                                    <TechnicalLabel
                                        className="left-0 top-[20%] rtl:left-auto rtl:right-0"
                                        number="01"
                                        label={heroLabels[0] ?? "Knowledge"}
                                    />

                                    <TechnicalLabel
                                        className="right-0 top-[32%] rtl:left-0 rtl:right-auto"
                                        number="02"
                                        label={heroLabels[1] ?? "Practice"}
                                    />

                                    <TechnicalLabel
                                        className="bottom-[20%] left-[8%] rtl:left-auto rtl:right-[8%]"
                                        number="03"
                                        label={heroLabels[2] ?? "Assessment"}
                                    />

                                    <TechnicalLabel
                                        className="bottom-[14%] right-[5%] rtl:left-[5%] rtl:right-auto"
                                        number="04"
                                        label={heroLabels[3] ?? "Certification"}
                                    />

                                </div>

                            </div>

                        </div>

                    </div>
                </section>


                {/* =================================================
                    INTRO
                ================================================== */}

                <section className="border-b border-slate-200 bg-white">

                    <div
                        className="
                            mx-auto
                            grid
                            w-full
                            max-w-[1600px]
                            gap-12
                            px-5
                            py-20
                            sm:px-8
                            lg:grid-cols-[0.75fr_1.25fr]
                            lg:px-12
                            lg:py-28
                        "
                    >

                        <div>

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
                                {t("companyPage.intro.eyebrow")}
                            </span>

                        </div>


                        <div>

                            <h2
                                className="
                                    max-w-4xl
                                    text-3xl
                                    font-semibold
                                    leading-tight
                                    tracking-[-0.035em]
                                    text-hbt-dark
                                    sm:text-4xl
                                    lg:text-5xl
                                "
                            >
                                {t("companyPage.intro.title")}
                            </h2>


                            <p
                                className="
                                    mt-7
                                    max-w-3xl
                                    text-base
                                    leading-7
                                    text-slate-500
                                    sm:text-lg
                                    sm:leading-8
                                "
                            >
                                {t("companyPage.intro.paraA")}
                            </p>


                            <p
                                className="
                                    mt-5
                                    max-w-3xl
                                    text-base
                                    leading-7
                                    text-slate-500
                                    sm:text-lg
                                    sm:leading-8
                                "
                            >
                                {t("companyPage.intro.paraB")}
                            </p>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    PRINCIPLES
                ================================================== */}

                <section className="bg-[#F7F7F7]">

                    <div
                        className="
                            mx-auto
                            w-full
                            max-w-[1600px]
                            px-5
                            py-20
                            sm:px-8
                            lg:px-12
                            lg:py-28
                        "
                    >

                        <div
                            className="
                                mb-14
                                flex
                                flex-col
                                justify-between
                                gap-6
                                lg:flex-row
                                lg:items-end
                            "
                        >

                            <div>

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
                                    {t("companyPage.principles.eyebrow")}
                                </span>

                                <h2
                                    className="
                                        mt-4
                                        text-3xl
                                        font-semibold
                                        tracking-[-0.04em]
                                        text-hbt-dark
                                        sm:text-4xl
                                    "
                                >
                                    {t("companyPage.principles.title")}
                                </h2>

                            </div>


                            <p
                                className="
                                    max-w-md
                                    text-sm
                                    leading-6
                                    text-slate-500
                                "
                            >
                                {t("companyPage.principles.side")}
                            </p>

                        </div>


                        <div
                            className="
                                grid
                                gap-px
                                overflow-hidden
                                rounded-2xl
                                border
                                border-slate-200
                                bg-slate-200
                                md:grid-cols-3
                            "
                        >

                            {principles.map(
                                (item) => {
                                    const Icon =
                                        item.icon;

                                    return (
                                        <article
                                            key={item.number}
                                            className="
                                                group
                                                bg-white
                                                p-7
                                                transition-colors
                                                duration-300
                                                hover:bg-[#FCFCFC]
                                                sm:p-9
                                            "
                                        >

                                            <div
                                                className="
                                                    flex
                                                    items-start
                                                    justify-between
                                                "
                                            >

                                                <div
                                                    className="
                                                        flex
                                                        h-11
                                                        w-11
                                                        items-center
                                                        justify-center
                                                        rounded-xl
                                                        bg-orange-50
                                                        text-hbt-orange
                                                        transition-transform
                                                        duration-300
                                                        group-hover:scale-105
                                                    "
                                                >
                                                    <Icon className="h-5 w-5" />
                                                </div>

                                                <span
                                                    className="
                                                        font-mono
                                                        text-[10px]
                                                        text-slate-300
                                                    "
                                                >
                                                    {item.number}
                                                </span>

                                            </div>


                                            <h3
                                                className="
                                                    mt-8
                                                    text-lg
                                                    font-semibold
                                                    text-hbt-dark
                                                "
                                            >
                                                {item.title}
                                            </h3>


                                            <p
                                                className="
                                                    mt-3
                                                    text-sm
                                                    leading-6
                                                    text-slate-500
                                                "
                                            >
                                                {
                                                    item.description
                                                }
                                            </p>

                                        </article>
                                    );
                                },
                            )}

                        </div>

                    </div>

                </section>


                {/* =================================================
                    PLATFORM
                ================================================== */}

                <section className="bg-hbt-dark text-white">

                    <div
                        className="
                            mx-auto
                            w-full
                            max-w-[1600px]
                            px-5
                            py-20
                            sm:px-8
                            lg:px-12
                            lg:py-28
                        "
                    >

                        <div
                            className="
                                grid
                                gap-16
                                lg:grid-cols-[0.7fr_1.3fr]
                            "
                        >

                            <div>

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
                                    {t("companyPage.platform.eyebrow")}
                                </span>


                                <h2
                                    className="
                                        mt-5
                                        max-w-md
                                        text-3xl
                                        font-semibold
                                        leading-tight
                                        tracking-[-0.04em]
                                        sm:text-4xl
                                    "
                                >
                                    {t("companyPage.platform.title")}
                                </h2>


                                <p
                                    className="
                                        mt-6
                                        max-w-md
                                        text-sm
                                        leading-6
                                        text-white/40
                                    "
                                >
                                    {t("companyPage.platform.description")}
                                </p>


                                <Link
                                    to="/catalog"
                                    className="
                                        group
                                        mt-8
                                        inline-flex
                                        items-center
                                        gap-2
                                        text-sm
                                        font-semibold
                                        text-white
                                        transition-colors
                                        hover:text-hbt-orange
                                    "
                                >
                                    {t("companyPage.platform.catalogBtn")}

                                    <ArrowRight
                                        className="
                                            h-4
                                            w-4
                                            transition-transform
                                            duration-300
                                            group-hover:translate-x-1
                                            rtl:-scale-x-100
                                            rtl:group-hover:-translate-x-1
                                            rtl:group-hover:translate-x-0
                                        "
                                    />
                                </Link>

                            </div>


                            <div
                                className="
                                    grid
                                    gap-px
                                    overflow-hidden
                                    rounded-2xl
                                    border
                                    border-white/10
                                    bg-white/10
                                    sm:grid-cols-2
                                "
                            >

                                {platformFeatures.map(
                                    (item) => {
                                        const Icon =
                                            item.icon;

                                        return (
                                            <div
                                                key={item.title}
                                                className="
                                                    group
                                                    bg-[#1D1D1D]
                                                    p-7
                                                    transition-colors
                                                    duration-300
                                                    hover:bg-[#222222]
                                                    sm:p-8
                                                "
                                            >

                                                <Icon
                                                    className="
                                                        h-5
                                                        w-5
                                                        text-hbt-orange
                                                        transition-transform
                                                        duration-300
                                                        group-hover:scale-110
                                                    "
                                                />


                                                <h3
                                                    className="
                                                        mt-7
                                                        text-base
                                                        font-semibold
                                                    "
                                                >
                                                    {
                                                        item.title
                                                    }
                                                </h3>


                                                <p
                                                    className="
                                                        mt-3
                                                        text-sm
                                                        leading-6
                                                        text-white/35
                                                    "
                                                >
                                                    {
                                                        item.description
                                                    }
                                                </p>

                                            </div>
                                        );
                                    },
                                )}

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    WHO IT'S FOR
                ================================================== */}

                <section className="border-b border-slate-200 bg-white">

                    <div
                        className="
                            mx-auto
                            grid
                            w-full
                            max-w-[1600px]
                            gap-14
                            px-5
                            py-20
                            sm:px-8
                            lg:grid-cols-[0.8fr_1.2fr]
                            lg:px-12
                            lg:py-28
                        "
                    >

                        <div>

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
                                {t("companyPage.audiences.eyebrow")}
                            </span>


                            <h2
                                className="
                                    mt-5
                                    max-w-md
                                    text-3xl
                                    font-semibold
                                    leading-tight
                                    tracking-[-0.04em]
                                    text-hbt-dark
                                    sm:text-4xl
                                "
                            >
                                {t("companyPage.audiences.title")}
                            </h2>


                            <p
                                className="
                                    mt-6
                                    max-w-md
                                    text-sm
                                    leading-6
                                    text-slate-500
                                "
                            >
                                {t("companyPage.audiences.description")}
                            </p>

                        </div>


                        <div
                            className="
                                grid
                                gap-3
                                sm:grid-cols-2
                            "
                        >

                            {audiences.map(
                                (audience) => (
                                    <div
                                        key={audience}
                                        className="
                                            group
                                            flex
                                            items-center
                                            gap-4
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            p-5
                                            transition-all
                                            duration-300
                                            hover:-translate-y-0.5
                                            hover:border-hbt-orange/30
                                            hover:shadow-sm
                                        "
                                    >

                                        <span
                                            className="
                                                flex
                                                h-8
                                                w-8
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-full
                                                bg-orange-50
                                                text-hbt-orange
                                            "
                                        >
                                            <Check className="h-4 w-4" />
                                        </span>


                                        <span
                                            className="
                                                text-sm
                                                font-semibold
                                                text-hbt-dark
                                            "
                                        >
                                            {audience}
                                        </span>


                                        <ArrowUpRight
                                            className="
                                                ms-auto
                                                h-4
                                                w-4
                                                text-slate-300
                                                transition-all
                                                duration-300
                                                group-hover:-translate-y-0.5
                                                group-hover:translate-x-0.5
                                                group-hover:text-hbt-orange
                                                rtl:-scale-x-100
                                                rtl:group-hover:-translate-x-0.5
                                                rtl:group-hover:translate-x-0
                                            "
                                        />

                                    </div>
                                ),
                            )}

                        </div>

                    </div>

                </section>


                {/* =================================================
                    MISSION
                ================================================== */}

                <section className="relative overflow-hidden bg-[#F7F7F7]">

                    <div
                        aria-hidden="true"
                        className="
                            pointer-events-none
                            absolute
                            right-[-120px]
                            top-[-120px]
                            h-[420px]
                            w-[420px]
                            rounded-full
                            border
                            border-hbt-orange/10
                            rtl:left-[-120px]
                            rtl:right-auto
                        "
                    />

                    <div
                        aria-hidden="true"
                        className="
                            pointer-events-none
                            absolute
                            right-[-40px]
                            top-[-40px]
                            h-[260px]
                            w-[260px]
                            rounded-full
                            border
                            border-hbt-orange/10
                            rtl:left-[-40px]
                            rtl:right-auto
                        "
                    />


                    <div
                        className="
                            relative
                            mx-auto
                            w-full
                            max-w-[1600px]
                            px-5
                            py-24
                            text-center
                            sm:px-8
                            lg:px-12
                            lg:py-32
                        "
                    >

                        <Target
                            className="
                                mx-auto
                                h-7
                                w-7
                                text-hbt-orange
                            "
                        />


                        <span
                            className="
                                mt-5
                                block
                                font-mono
                                text-[9px]
                                font-bold
                                uppercase
                                tracking-[0.25em]
                                text-hbt-orange
                            "
                        >
                            {t("companyPage.mission.eyebrow")}
                        </span>


                        <h2
                            className="
                                mx-auto
                                mt-6
                                max-w-5xl
                                text-4xl
                                font-semibold
                                leading-[1.05]
                                tracking-[-0.045em]
                                text-hbt-dark
                                sm:text-5xl
                                lg:text-6xl
                            "
                        >
                            {t("companyPage.mission.titleA")}
                            <span className="text-hbt-orange">
                                {" "}
                                {t("companyPage.mission.titleB")}
                            </span>
                        </h2>


                        <p
                            className="
                                mx-auto
                                mt-7
                                max-w-2xl
                                text-base
                                leading-7
                                text-slate-500
                                sm:text-lg
                            "
                        >
                            {t("companyPage.mission.description")}
                        </p>

                    </div>

                </section>


                {/* =================================================
                    CTA
                ================================================== */}

                <section className="bg-white">

                    <div
                        className="
                            mx-auto
                            w-full
                            max-w-[1600px]
                            px-5
                            py-20
                            sm:px-8
                            lg:px-12
                            lg:py-28
                        "
                    >

                        <div
                            className="
                                relative
                                overflow-hidden
                                rounded-3xl
                                bg-hbt-orange
                                px-7
                                py-12
                                sm:px-12
                                sm:py-16
                                lg:px-16
                                lg:py-20
                            "
                        >

                            {/* Lines */}

                            <div
                                aria-hidden="true"
                                className="
                                    absolute
                                    right-[-100px]
                                    top-[-100px]
                                    h-[400px]
                                    w-[400px]
                                    rounded-full
                                    border
                                    border-white/15
                                    rtl:left-[-100px]
                                    rtl:right-auto
                                "
                            />

                            <div
                                aria-hidden="true"
                                className="
                                    absolute
                                    right-[-30px]
                                    top-[-30px]
                                    h-[260px]
                                    w-[260px]
                                    rounded-full
                                    border
                                    border-white/15
                                    rtl:left-[-30px]
                                    rtl:right-auto
                                "
                            />


                            <div className="relative max-w-3xl">

                                <Sparkles className="h-6 w-6 text-white/70" />


                                <h2
                                    className="
                                        mt-6
                                        text-3xl
                                        font-bold
                                        leading-tight
                                        tracking-[-0.04em]
                                        text-white
                                        sm:text-4xl
                                        lg:text-5xl
                                    "
                                >
                                    {t("companyPage.cta.title")}
                                </h2>


                                <p
                                    className="
                                        mt-5
                                        max-w-xl
                                        text-sm
                                        leading-6
                                        text-white/70
                                        sm:text-base
                                    "
                                >
                                    {t("companyPage.cta.description")}
                                </p>


                                <div className="mt-8 flex flex-wrap gap-3">

                                    <Link
                                        to="/catalog"
                                        className="
                                            group
                                            inline-flex
                                            items-center
                                            gap-2
                                            rounded-xl
                                            bg-white
                                            px-5
                                            py-3.5
                                            text-sm
                                            font-bold
                                            text-hbt-dark
                                            transition-all
                                            duration-300
                                            hover:-translate-y-0.5
                                            hover:shadow-xl
                                        "
                                    >
                                        {t("companyPage.cta.startBtn")}

                                        <ArrowUpRight
                                            className="
                                                h-4
                                                w-4
                                                transition-transform
                                                duration-300
                                                group-hover:-translate-y-0.5
                                                group-hover:translate-x-0.5
                                                rtl:-scale-x-100
                                                rtl:group-hover:-translate-x-0.5
                                                rtl:group-hover:translate-x-0
                                            "
                                        />
                                    </Link>


                                    <Link
                                        to="/contact"
                                        className="
                                            inline-flex
                                            items-center
                                            rounded-xl
                                            border
                                            border-white/30
                                            px-5
                                            py-3.5
                                            text-sm
                                            font-semibold
                                            text-white
                                            transition-colors
                                            duration-300
                                            hover:bg-white/10
                                        "
                                    >
                                        {t("companyPage.cta.contactBtn")}
                                    </Link>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>

            </main>


            <Footer />

        </div>
    );
}


/* =============================================================
   TECHNICAL LABEL
============================================================= */

interface TechnicalLabelProps {
    number: string;
    label: string;
    className?: string;
}

function TechnicalLabel({
    number,
    label,
    className = "",
}: TechnicalLabelProps) {
    return (
        <div
            className={`
                absolute
                ${className}
                flex
                items-center
                gap-2
                rounded-lg
                border
                border-slate-200
                bg-white
                px-3
                py-2
                shadow-sm
            `}
        >

            <span
                className="
                    font-mono
                    text-[8px]
                    font-bold
                    text-hbt-orange
                "
            >
                {number}
            </span>

            <span
                className="
                    text-[10px]
                    font-semibold
                    text-hbt-dark
                "
            >
                {label}
            </span>

        </div>
    );
}