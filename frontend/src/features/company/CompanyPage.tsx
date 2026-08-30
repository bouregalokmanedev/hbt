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

import { Footer } from "../landingpage/components/FooterSection";
import { Navbar } from "./../../components/navigation/Navbar";


/* =============================================================
   DATA
============================================================= */

const principles = [
    {
        number: "01",
        title: "Learn the system",
        description:
            "We focus on how automotive systems actually work, so technicians can understand the cause behind a fault.",
        icon: Cpu,
    },
    {
        number: "02",
        title: "Practice the diagnosis",
        description:
            "Knowledge becomes useful when you can apply it. Our training connects theory with realistic diagnostic situations.",
        icon: Wrench,
    },
    {
        number: "03",
        title: "Prove your skills",
        description:
            "Structured assessments and certifications help technicians measure their progress and demonstrate what they know.",
        icon: Award,
    },
];

const platformFeatures = [
    {
        title: "Structured courses",
        description:
            "Follow a clear learning path instead of jumping between disconnected tutorials.",
        icon: BookOpen,
    },
    {
        title: "Diagnostic simulation",
        description:
            "Work through realistic automotive scenarios and make diagnostic decisions step by step.",
        icon: Gauge,
    },
    {
        title: "Technical assessments",
        description:
            "Test your understanding through quizzes, scenarios and practical diagnostic challenges.",
        icon: ShieldCheck,
    },
    {
        title: "Professional certification",
        description:
            "Build a verifiable record of your learning and technical progression.",
        icon: GraduationCap,
    },
];

const audiences = [
    "Automotive technicians",
    "Diagnostic technicians",
    "Workshop professionals",
    "Automotive students",
    "Technical trainers",
    "Automotive businesses",
];


/* =============================================================
   COMPANY PAGE
============================================================= */

export function CompanyPage() {
    return (
        <div className="min-h-screen bg-white text-hbt-dark">

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
                                        About HBTronics
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
                                    Training the
                                    <br />

                                    <span className="text-hbt-orange">
                                        technicians
                                    </span>

                                    <br />

                                    behind the diagnosis.
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
                                    HBTronics is an automotive
                                    education platform built to
                                    make technical knowledge
                                    practical, structured and
                                    measurable.
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
                                        Explore the platform

                                        <ArrowUpRight
                                            className="
                                                h-4
                                                w-4
                                                transition-transform
                                                duration-300
                                                group-hover:-translate-y-0.5
                                                group-hover:translate-x-0.5
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
                                        Talk to us
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
                                            HBT SYSTEM
                                        </span>

                                        <span className="mt-1 text-xs font-semibold text-white">
                                            Learn · Diagnose
                                        </span>

                                    </div>


                                    {/* Floating labels */}

                                    <TechnicalLabel
                                        className="left-0 top-[20%]"
                                        number="01"
                                        label="Knowledge"
                                    />

                                    <TechnicalLabel
                                        className="right-0 top-[32%]"
                                        number="02"
                                        label="Practice"
                                    />

                                    <TechnicalLabel
                                        className="bottom-[20%] left-[8%]"
                                        number="03"
                                        label="Assessment"
                                    />

                                    <TechnicalLabel
                                        className="bottom-[14%] right-[5%]"
                                        number="04"
                                        label="Certification"
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
                                What is HBT?
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
                                Automotive technology is
                                becoming more complex.
                                Training shouldn't.
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
                                Modern vehicles combine electronics,
                                sensors, networks, software and
                                mechanical systems. Diagnosing them
                                requires more than knowing what a
                                component does.
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
                                HBTronics exists to help technicians
                                develop the reasoning, practical
                                experience and confidence required to
                                diagnose those systems correctly.
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
                                    Our approach
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
                                    Learn differently.
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
                                Every part of the platform is
                                designed around one principle:
                                technical knowledge should lead
                                to better decisions.
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
                                    The platform
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
                                    Everything needed
                                    to build diagnostic
                                    confidence.
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
                                    From your first lesson to
                                    professional certification,
                                    HBT brings the learning
                                    experience into one place.
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
                                    Explore courses

                                    <ArrowRight
                                        className="
                                            h-4
                                            w-4
                                            transition-transform
                                            duration-300
                                            group-hover:translate-x-1
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
                                Built for the field
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
                                For people who
                                work with real
                                vehicles.
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
                                Whether you're starting your
                                automotive career or sharpening
                                years of workshop experience,
                                HBT is designed around practical
                                diagnostic work.
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
                                                ml-auto
                                                h-4
                                                w-4
                                                text-slate-300
                                                transition-all
                                                duration-300
                                                group-hover:-translate-y-0.5
                                                group-hover:translate-x-0.5
                                                group-hover:text-hbt-orange
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
                            Our mission
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
                            Make technical education
                            <span className="text-hbt-orange">
                                {" "}
                                useful.
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
                            We believe the best technicians aren't
                            the ones who memorize the most.
                            They're the ones who know how to think
                            when the answer isn't obvious.
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
                                    Ready to take your
                                    diagnostics further?
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
                                    Start learning with HBT and
                                    turn technical knowledge into
                                    practical diagnostic ability.
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
                                        Start learning

                                        <ArrowUpRight
                                            className="
                                                h-4
                                                w-4
                                                transition-transform
                                                duration-300
                                                group-hover:-translate-y-0.5
                                                group-hover:translate-x-0.5
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
                                        Contact HBT
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