import {
    ArrowRight,
    ChevronRight,
    CircleAlert,
    Gauge,
    Play,
    ScanLine,
    Wrench,
} from "lucide-react";

import { Link } from "react-router-dom";


export function SimulatorSection() {
    return (
        <section
            className={[
                "relative isolate overflow-hidden",
                "bg-[#191919]",
                "text-white",
            ].join(" ")}
        >

            {/* =========================================================
                BACKGROUND
            ========================================================== */}

            <div
                aria-hidden="true"
                className={[
                    "pointer-events-none absolute inset-0 -z-10",
                ].join(" ")}
            >

                <div
                    className={[
                        "absolute inset-0 opacity-[0.035]",
                        "[background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]",
                        "[background-size:64px_64px]",
                    ].join(" ")}
                />


                <span
                    className={[
                        "absolute -bottom-16 right-[-4%]",
                        "select-none font-black uppercase",
                        "leading-none tracking-[-0.1em]",
                        "text-[18rem] text-white/[0.025]",
                        "sm:text-[26rem]",
                    ].join(" ")}
                >
                    SIM
                </span>

            </div>


            <div
                className={[
                    "mx-auto max-w-[1600px]",
                    "px-5 py-20",
                    "sm:px-8 sm:py-24",
                    "lg:px-12 lg:py-32",
                    "xl:px-16",
                ].join(" ")}
            >

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div
                    className={[
                        "flex items-center justify-between",
                        "border-b border-white/10",
                        "pb-4",
                    ].join(" ")}
                >

                    <div className="flex items-center gap-3">

                        <span className="h-2 w-2 rounded-full bg-hbt-orange" />

                        <span
                            className={[
                                "text-[9px] font-bold uppercase",
                                "tracking-[0.3em]",
                            ].join(" ")}
                        >
                            The Simulator
                        </span>

                    </div>


                    <span
                        className={[
                            "font-mono text-[9px]",
                            "tracking-widest text-white/30",
                        ].join(" ")}
                    >
                        04 / 04
                    </span>

                </div>


                {/* =====================================================
                    TITLE
                ====================================================== */}

                <div
                    className={[
                        "mt-12 grid gap-10",
                        "lg:grid-cols-12 lg:items-end",
                        "xl:mt-16",
                    ].join(" ")}
                >

                    <div className="lg:col-span-8">

                        <p
                            className={[
                                "mb-5 text-[9px] font-bold uppercase",
                                "tracking-[0.3em] text-hbt-orange",
                            ].join(" ")}
                        >
                            Theory meets practice
                        </p>


                        <h2
                            className={[
                                "font-black uppercase",
                                "leading-[0.8]",
                                "tracking-[-0.07em]",
                                "text-[4.5rem]",
                                "sm:text-[6rem]",
                                "md:text-[7rem]",
                                "lg:text-[8rem]",
                                "xl:text-[9rem]",
                            ].join(" ")}
                        >
                            The Workshop
                            <span className="block">
                                Is Your
                            </span>

                            <span className="ml-[10%] block text-hbt-orange">
                                Classroom.
                            </span>
                        </h2>

                    </div>


                    <div
                        className={[
                            "lg:col-span-3 lg:col-start-10",
                            "border-l border-white/15",
                            "pl-5 sm:pl-7",
                        ].join(" ")}
                    >

                        <p
                            className={[
                                "text-sm font-medium leading-7",
                                "text-white/80",
                            ].join(" ")}
                        >
                            Step into realistic diagnostic cases
                            and make the decisions yourself.
                        </p>

                    </div>

                </div>


                {/* =====================================================
                    MAIN SIMULATOR EXPERIENCE
                ====================================================== */}

                <div
                    className={[
                        "mt-14",
                        "grid",
                        "lg:grid-cols-12",
                        "lg:gap-6",
                        "xl:mt-20",
                    ].join(" ")}
                >

                    {/* =================================================
                        IMAGE / SCENARIO
                    ================================================== */}

                    <div
                        className={[
                            "relative",
                            "lg:col-span-8",
                        ].join(" ")}
                    >

                        <div
                            className={[
                                "relative aspect-[16/10]",
                                "overflow-hidden",
                                "bg-[#222]",
                            ].join(" ")}
                        >

                            <img
                                src="/src/assets/landing/heropic2.jpg"
                                alt="Automotive diagnostic workshop"
                                className={[
                                    "h-full w-full object-cover",
                                    "grayscale",
                                    "transition-all duration-700",
                                    "hover:scale-[1.02]",
                                    "hover:grayscale-0",
                                ].join(" ")}
                            />


                            <div
                                className={[
                                    "absolute inset-0",
                                    "bg-gradient-to-t",
                                    "from-black via-black/10 to-transparent",
                                ].join(" ")}
                            />


                            {/* Scenario marker */}

                            <div
                                className={[
                                    "absolute left-5 top-5",
                                    "sm:left-7 sm:top-7",
                                ].join(" ")}
                            >

                                <div
                                    className={[
                                        "flex items-center gap-2",
                                        "border border-white/20",
                                        "bg-black/50 backdrop-blur-sm",
                                        "px-3 py-2",
                                    ].join(" ")}
                                >

                                    <span className="h-1.5 w-1.5 rounded-full bg-hbt-orange" />

                                    <span
                                        className={[
                                            "text-[8px] font-bold uppercase",
                                            "tracking-[0.2em]",
                                        ].join(" ")}
                                    >
                                        Scenario 04
                                    </span>

                                </div>

                            </div>


                            {/* Scenario content */}

                            <div
                                className={[
                                    "absolute bottom-0 left-0 right-0",
                                    "p-5 sm:p-8",
                                ].join(" ")}
                            >

                                <p
                                    className={[
                                        "text-[8px] font-bold uppercase",
                                        "tracking-[0.25em]",
                                        "text-hbt-orange",
                                    ].join(" ")}
                                >
                                    Engine Management
                                </p>


                                <h3
                                    className={[
                                        "mt-2 max-w-2xl",
                                        "font-black uppercase",
                                        "leading-none tracking-[-0.05em]",
                                        "text-3xl text-white",
                                        "sm:text-5xl",
                                    ].join(" ")}
                                >
                                    Intermittent
                                    <span className="block">
                                        Engine Hesitation
                                    </span>
                                </h3>


                                <div
                                    className={[
                                        "mt-5 flex flex-wrap",
                                        "items-center gap-4",
                                    ].join(" ")}
                                >

                                    <span
                                        className={[
                                            "flex items-center gap-2",
                                            "text-[8px] font-bold uppercase",
                                            "tracking-wider text-white/60",
                                        ].join(" ")}
                                    >
                                        <Gauge className="h-3.5 w-3.5 text-hbt-orange" />
                                        Engine management
                                    </span>

                                    <span className="h-3 w-px bg-white/20" />

                                    <span
                                        className={[
                                            "flex items-center gap-2",
                                            "text-[8px] font-bold uppercase",
                                            "tracking-wider text-white/60",
                                        ].join(" ")}
                                    >
                                        <ScanLine className="h-3.5 w-3.5 text-hbt-orange" />
                                        Level 02
                                    </span>

                                </div>

                            </div>

                        </div>


                        {/* Orange frame */}

                        <div
                            aria-hidden="true"
                            className={[
                                "absolute",
                                "-bottom-4",
                                "-right-4",
                                "h-full",
                                "w-full",
                                "border",
                                "border-hbt-orange",
                                "-z-10",
                            ].join(" ")}
                        />

                    </div>


                    {/* =================================================
                        CASE PANEL
                    ================================================== */}

                    <div
                        className={[
                            "flex flex-col",
                            "border border-white/10",
                            "bg-[#202020]",
                            "lg:col-span-4",
                        ].join(" ")}
                    >

                        {/* Panel header */}

                        <div
                            className={[
                                "flex items-center justify-between",
                                "border-b border-white/10",
                                "px-5 py-4",
                            ].join(" ")}
                        >

                            <div className="flex items-center gap-3">

                                <Wrench className="h-4 w-4 text-hbt-orange" />

                                <span
                                    className={[
                                        "text-[8px] font-bold uppercase",
                                        "tracking-[0.2em]",
                                    ].join(" ")}
                                >
                                    Diagnostic Case
                                </span>

                            </div>

                            <span className="font-mono text-[8px] text-white/30">
                                04
                            </span>

                        </div>


                        {/* Complaint */}

                        <div className="p-5 sm:p-7">

                            <p
                                className={[
                                    "text-[8px] font-bold uppercase",
                                    "tracking-[0.2em]",
                                    "text-hbt-orange",
                                ].join(" ")}
                            >
                                Customer complaint
                            </p>


                            <p
                                className={[
                                    "mt-4 text-sm leading-7",
                                    "text-white/70",
                                ].join(" ")}
                            >
                                “The engine hesitates when
                                accelerating and occasionally
                                runs rough after warming up.”
                            </p>


                            {/* Divider */}

                            <div className="my-7 h-px bg-white/10" />


                            {/* What you can inspect */}

                            <p
                                className={[
                                    "text-[8px] font-bold uppercase",
                                    "tracking-[0.2em]",
                                    "text-white/30",
                                ].join(" ")}
                            >
                                Available tools
                            </p>


                            <div className="mt-4 space-y-3">

                                <Tool
                                    number="01"
                                    label="Live Data"
                                />

                                <Tool
                                    number="02"
                                    label="Fault Codes"
                                />

                                <Tool
                                    number="03"
                                    label="Oscilloscope"
                                />

                                <Tool
                                    number="04"
                                    label="Component Tests"
                                />

                            </div>

                        </div>


                        {/* Start */}

                        <div
                            className={[
                                "mt-auto",
                                "border-t border-white/10",
                                "p-5 sm:p-7",
                            ].join(" ")}
                        >

                            <Link
                                to="/simulator"
                                className={[
                                    "group flex items-center",
                                    "justify-between",
                                    "bg-hbt-orange",
                                    "px-5 py-4",
                                    "transition-all duration-200",
                                    "hover:bg-[#e96916]",
                                ].join(" ")}
                            >

                                <div className="flex items-center gap-3">

                                    <span
                                        className={[
                                            "flex h-8 w-8",
                                            "items-center justify-center",
                                            "rounded-full",
                                            "bg-white/15",
                                        ].join(" ")}
                                    >
                                        <Play
                                            className={[
                                                "ml-0.5 h-3.5 w-3.5",
                                                "fill-white",
                                            ].join(" ")}
                                        />
                                    </span>

                                    <span
                                        className={[
                                            "text-[9px] font-bold uppercase",
                                            "tracking-[0.2em]",
                                        ].join(" ")}
                                    >
                                        Start Scenario
                                    </span>

                                </div>


                                <ArrowRight
                                    className={[
                                        "h-4 w-4",
                                        "transition-transform",
                                        "group-hover:translate-x-1",
                                    ].join(" ")}
                                />

                            </Link>

                        </div>

                    </div>

                </div>


                {/* =====================================================
                    PROCESS
                ====================================================== */}

                <div
                    className={[
                        "mt-14",
                        "grid",
                        "border-y border-white/10",
                        "sm:grid-cols-3",
                        "xl:mt-20",
                    ].join(" ")}
                >

                    <Process
                        number="01"
                        title="Observe"
                        description="Understand the symptoms and inspect the available data."
                    />

                    <Process
                        number="02"
                        title="Test"
                        description="Choose the right diagnostic path and perform the tests."
                    />

                    <Process
                        number="03"
                        title="Diagnose"
                        description="Make your decision and discover whether your reasoning was correct."
                    />

                </div>


                {/* =====================================================
                    BOTTOM LINE
                ====================================================== */}

                <div
                    className={[
                        "mt-8 flex items-center",
                        "justify-between",
                    ].join(" ")}
                >

                    <span
                        className={[
                            "text-[8px] font-bold uppercase",
                            "tracking-[0.25em] text-white/30",
                        ].join(" ")}
                    >
                        Learn → Practice → Diagnose
                    </span>


                    <Link
                        to="/simulator"
                        className={[
                            "group flex items-center gap-3",
                            "text-[8px] font-bold uppercase",
                            "tracking-[0.2em]",
                        ].join(" ")}
                    >

                        Explore simulator

                        <ChevronRight
                            className={[
                                "h-3.5 w-3.5 text-hbt-orange",
                                "transition-transform",
                                "group-hover:translate-x-1",
                            ].join(" ")}
                        />

                    </Link>

                </div>

            </div>


            <div
                aria-hidden="true"
                className="absolute bottom-0 right-0 h-1 w-[28%] bg-hbt-orange"
            />

        </section>
    );
}


/* =====================================================================
   TOOL
===================================================================== */

interface ToolProps {
    number: string;
    label: string;
}

function Tool({
    number,
    label,
}: ToolProps) {
    return (
        <div
            className={[
                "flex items-center gap-3",
                "border-b border-white/5",
                "pb-3",
            ].join(" ")}
        >

            <span
                className={[
                    "font-mono text-[8px]",
                    "text-hbt-orange",
                ].join(" ")}
            >
                {number}
            </span>

            <span
                className={[
                    "text-xs font-medium",
                    "text-white/70",
                ].join(" ")}
            >
                {label}
            </span>

        </div>
    );
}


/* =====================================================================
   PROCESS
===================================================================== */

interface ProcessProps {
    number: string;
    title: string;
    description: string;
}

function Process({
    number,
    title,
    description,
}: ProcessProps) {
    return (
        <div
            className={[
                "border-b border-white/10",
                "p-6",
                "sm:border-b-0",
                "sm:border-r",
                "sm:last:border-r-0",
                "sm:p-7",
                "lg:p-8",
            ].join(" ")}
        >

            <div className="flex items-start justify-between">

                <span
                    className={[
                        "font-mono text-[9px]",
                        "text-hbt-orange",
                    ].join(" ")}
                >
                    {number}
                </span>


                <span className="h-px w-12 bg-white/10" />

            </div>


            <h3
                className={[
                    "mt-8 font-black uppercase",
                    "tracking-[-0.04em]",
                    "text-2xl",
                ].join(" ")}
            >
                {title}
            </h3>


            <p
                className={[
                    "mt-3 max-w-xs",
                    "text-xs leading-6",
                    "text-white/35",
                ].join(" ")}
            >
                {description}
            </p>

        </div>
    );
}