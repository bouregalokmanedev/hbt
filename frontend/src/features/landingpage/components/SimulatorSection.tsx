import {
    ArrowRight,
    ChevronRight,
    Gauge,
    MonitorCog,
    Play,
    ScanLine,
    Wrench,
    Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useTranslation } from "react-i18next";

import heroImage from "@/assets/landing/heropic2.jpg";

import {
    Eyebrow,
    LandingContainer,
    LandingSection,
    SectionTitle,
} from "./landing-ui";

/* =====================================================================
   SIMULATOR SECTION
   ---------------------------------------------------------------------
   Purpose:
   - Keep the original simulator concept.
   - Keep one large diagnostic scenario.
   - Keep scenario information + tools + CTA.
   - Visually match the new Courses section.
   - Use a different background from Courses.
===================================================================== */

type SimulatorTool = {
    label: string;
};

type SimulatorStep = {
    title: string;
    description: string;
};

export function SimulatorSection() {
    const { t } = useTranslation();

    const toolItems = t("landingPage.simulator.tools", {
        returnObjects: true,
    }) as SimulatorTool[];

    const stepItems = t("landingPage.simulator.steps", {
        returnObjects: true,
    }) as SimulatorStep[];

    const toolIcons = [MonitorCog, ScanLine, Zap, Wrench];
    const stepIcons = [ScanLine, Wrench, Gauge];

    return (
        <LandingSection className="bg-[#EEEAE4] text-[#3A3A3A]">
            {/* =========================================================
                BACKGROUND
            ========================================================== */}

            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10"
            >
                {/* Technical grid */}

                <div
                    className="absolute inset-0 opacity-[0.018]"
                    style={{
                        backgroundImage:
                            "linear-gradient(#3A3A3A 1px, transparent 1px), linear-gradient(90deg, #3A3A3A 1px, transparent 1px)",
                        backgroundSize: "70px 70px",
                    }}
                />

                {/* Large background word */}

                <span className="absolute -bottom-24 right-[-4%] select-none font-black uppercase leading-none tracking-[-0.12em] text-[#3A3A3A]/[0.025] text-[18rem] sm:text-[27rem] rtl:left-[-4%] rtl:right-auto">
                    SIM
                </span>

                {/* Orange atmosphere */}

                <div className="absolute -left-48 top-[18%] h-[500px] w-[500px] rounded-full bg-[#F47822]/[0.045] blur-[130px] rtl:-right-48 rtl:left-auto" />

                <div className="absolute -right-48 bottom-[8%] h-[450px] w-[450px] rounded-full bg-[#F47822]/[0.035] blur-[120px] rtl:-left-48 rtl:right-auto" />
            </div>

            {/* =========================================================
                CONTAINER
            ========================================================== */}

            <LandingContainer>
                {/* =====================================================
                    TOP LABEL
                ====================================================== */}


                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-end xl:mt-16">
                    <div className="lg:col-span-8">
                        <Eyebrow>
                            {t("landingPage.simulator.eyebrow")}
                        </Eyebrow>

                        <SectionTitle size="display" className="lowercase">
                            {t("landingPage.simulator.titleA")}
                            <span className="block">
                                {t("landingPage.simulator.titleB")}
                            </span>

                            <span className="block text-[#F47822]">
                                {t("landingPage.simulator.titleC")}
                            </span>
                        </SectionTitle>
                    </div>

                    <div className="lg:col-span-3 lg:col-start-10">
                        <p className="border-l-2 border-[#F47822] pl-5 text-sm leading-6 text-[#3A3A3A]/45 rtl:border-l-0 rtl:border-r-2 rtl:pl-0 rtl:pr-5">
                            {t("landingPage.simulator.description")}
                        </p>
                    </div>
                </div>

                {/* =====================================================
                    MAIN WORKSHOP
                ====================================================== */}

                <div className="relative mt-16 lg:mt-24">
                    {/* =================================================
                        OUTER GLASS FRAME
                    ================================================== */}

                    <div className="relative rounded-[34px] border border-[#3A3A3A]/[0.07] bg-white/55 p-2.5 shadow-[0_30px_90px_rgba(58,58,58,0.08)] backdrop-blur-xl sm:p-3">
                        {/* Top reflection */}

                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute left-[25%] right-[10%] top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
                        />

                        <div className="grid overflow-hidden rounded-[28px] bg-[#252525] lg:grid-cols-12">
                            {/* =================================================
                                WORKSHOP IMAGE
                            ================================================== */}

                            <div className="relative min-h-[420px] lg:col-span-8 lg:min-h-[590px]">
                                <img
                                    src={heroImage}
                                    alt={t("landingPage.simulator.imageAlt")}
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 hover:scale-[1.025]"
                                />

                                {/* Image treatment */}

                                <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/30" />

                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

                                {/* =================================================
                                    IMAGE TOP BAR
                                ================================================== */}

                                <div className="absolute left-5 right-5 top-5 flex items-center justify-between sm:left-7 sm:right-7 sm:top-7">
                                    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-2 backdrop-blur-md">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#F47822]" />

                                        <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/70">
                                            {t("landingPage.simulator.scenarioBadge")}
                                        </span>
                                    </div>

                                    <span className="rounded-full border border-white/15 bg-black/25 px-3 py-2 font-mono text-[8px] tracking-[0.15em] text-white/50 backdrop-blur-md">
                                        04 / 04
                                    </span>
                                </div>

                                {/* =================================================
                                    IMAGE CONTENT
                                ================================================== */}

                                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
                                    <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-[#F47822]">
                                        {t("landingPage.simulator.category")}
                                    </p>

                                    <h3 className="mt-3 max-w-3xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
                                        {t("landingPage.simulator.scenarioTitleA")}
                                        <span className="block">
                                            {t("landingPage.simulator.scenarioTitleB")}
                                        </span>
                                    </h3>

                                    {/* Scenario meta */}

                                    <div className="mt-6 flex flex-wrap items-center gap-3">
                                        <ScenarioMeta
                                            icon={Gauge}
                                            label={t("landingPage.simulator.metaEngine")}
                                        />

                                        <span className="h-3 w-px bg-white/20" />

                                        <ScenarioMeta
                                            icon={ScanLine}
                                            label={t("landingPage.simulator.metaLevel")}
                                        />

                                        <span className="h-3 w-px bg-white/20" />

                                        <ScenarioMeta
                                            icon={Wrench}
                                            label={t("landingPage.simulator.metaTools")}
                                        />
                                    </div>
                                </div>

                                {/* =================================================
                                    ORANGE IMAGE INDICATOR
                                ================================================== */}

                                <div className="absolute bottom-0 left-0 h-1 w-32 bg-[#F47822] sm:w-44 rtl:left-auto rtl:right-0" />
                            </div>

                            {/* =================================================
                                DIAGNOSTIC PANEL
                            ================================================== */}

                            <div className="flex flex-col bg-[#202020] lg:col-span-4">
                                {/* Panel header */}

                                <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-5 sm:px-7">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F47822]/10">
                                            <MonitorCog className="h-4 w-4 text-[#F47822]" />
                                        </span>

                                        <div>
                                            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/35">
                                                {t("landingPage.simulator.panelEyebrow")}
                                            </p>

                                            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/75">
                                                {t("landingPage.simulator.panelTitle")}
                                            </p>
                                        </div>
                                    </div>

                                    <span className="font-mono text-[8px] text-white/20">
                                        EMS-04
                                    </span>
                                </div>

                                {/* =================================================
                                    CUSTOMER COMPLAINT
                                ================================================== */}

                                <div className="px-5 py-6 sm:px-7 sm:py-8">
                                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
                                        {t("landingPage.simulator.complaintLabel")}
                                    </p>

                                    <p className="mt-4 text-sm leading-7 text-white/65">
                                        {t("landingPage.simulator.complaintText")}
                                    </p>
                                </div>

                                {/* =================================================
                                    DIAGNOSTIC TOOLS
                                ================================================== */}

                                <div className="border-t border-white/[0.08] px-5 py-6 sm:px-7">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30">
                                            {t("landingPage.simulator.toolsLabel")}
                                        </p>

                                        <span className="font-mono text-[8px] text-white/20">
                                            04
                                        </span>
                                    </div>

                                    <div className="mt-5 space-y-2">
                                        {toolItems.map((tool, index) => {
                                            const Icon = toolIcons[index % toolIcons.length];

                                            return (
                                                <DiagnosticTool
                                                    key={tool.label}
                                                    number={String(index + 1).padStart(2, "0")}
                                                    icon={Icon}
                                                    label={tool.label}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* =================================================
                                    DIAGNOSTIC PRINCIPLE
                                ================================================== */}

                                <div className="mx-5 border-t border-white/[0.08] py-6 sm:mx-7">
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F47822]" />

                                        <p className="text-[10px] leading-5 text-white/35">
                                            {t("landingPage.simulator.principle")}
                                        </p>
                                    </div>
                                </div>

                                {/* =================================================
                                    CTA
                                ================================================== */}

                                <div className="mt-auto p-5 sm:p-7">
                                    <Link
                                        to="/simulator"
                                        className="group flex items-center justify-between rounded-2xl bg-[#F47822] px-5 py-4 text-white transition-all duration-300 hover:bg-[#e96916] hover:shadow-[0_12px_35px_rgba(244,120,34,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822] focus-visible:ring-offset-2 focus-visible:ring-offset-[#202020]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                                                <Play
                                                    className="ml-0.5 h-3.5 w-3.5 rtl:ml-0 rtl:mr-0.5 rtl:-scale-x-100"
                                                    fill="currentColor"
                                                />
                                            </span>

                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-[0.18em]">
                                                    {t("landingPage.simulator.ctaTitle")}
                                                </p>

                                                <p className="mt-0.5 text-[7px] font-medium uppercase tracking-[0.1em] text-white/60">
                                                    {t("landingPage.simulator.ctaSub")}
                                                </p>
                                            </div>
                                        </div>

                                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:group-hover:translate-x-0">
                                            <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* =================================================
                        OFFSET ORANGE FRAME
                    ================================================== */}

                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-4 -right-4 -z-10 hidden h-[70%] w-[45%] rounded-[34px] border border-[#F47822]/40 lg:block rtl:-left-4 rtl:right-auto"
                    />
                </div>

                {/* =====================================================
                    HOW IT WORKS
                ====================================================== */}

                <div className="mt-16 border-y border-[#3A3A3A]/10 xl:mt-20">
                    <div className="grid sm:grid-cols-3">
                        {stepItems.map((step, index) => {
                            const Icon = stepIcons[index % stepIcons.length];

                            return (
                                <ProcessStep
                                    key={step.title}
                                    number={String(index + 1).padStart(2, "0")}
                                    title={step.title}
                                    description={step.description}
                                    icon={Icon}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* =====================================================
                    FOOTER
                ====================================================== */}

                <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#F47822]" />

                        <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#3A3A3A]/30">
                            {t("landingPage.simulator.pathLabel")}
                        </span>
                    </div>

                    <Link
                        to="/simulator"
                        className="group inline-flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.18em] text-[#3A3A3A]"
                    >
                        {t("landingPage.simulator.explore")}

                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3A3A3A]/10 bg-white/60 transition-all duration-300 group-hover:border-[#F47822] group-hover:bg-[#F47822] group-hover:text-white">
                            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1 rtl:group-hover:translate-x-0" />
                        </span>
                    </Link>
                </div>
            </LandingContainer>

            {/* =========================================================
                SECTION ACCENTS
            ========================================================== */}

            <div
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-[2px] w-[24%] bg-[#F47822] rtl:left-auto rtl:right-0"
            />

            <div
                aria-hidden="true"
                className="absolute bottom-0 right-0 h-[2px] w-[10%] bg-[#3A3A3A]/10 rtl:left-0 rtl:right-auto"
            />
        </LandingSection>
    );
}

/* =====================================================================
   SCENARIO META
===================================================================== */

function ScenarioMeta({
    icon: Icon,
    label,
}: {
    icon: typeof Gauge;
    label: string;
}) {
    return (
        <span className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.12em] text-white/55">
            <Icon className="h-3.5 w-3.5 text-[#F47822]" />

            {label}
        </span>
    );
}

/* =====================================================================
   DIAGNOSTIC TOOL
===================================================================== */

function DiagnosticTool({
    number,
    icon: Icon,
    label,
}: {
    number: string;
    icon: typeof Gauge;
    label: string;
}) {
    return (
        <div className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-3 transition-all duration-300 hover:border-[#F47822]/20 hover:bg-[#F47822]/[0.05]">
            <span className="font-mono text-[8px] text-[#F47822]">
                {number}
            </span>

            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04]">
                <Icon className="h-3.5 w-3.5 text-white/40 transition-colors duration-300 group-hover:text-[#F47822]" />
            </span>

            <span className="text-[10px] font-medium text-white/55 transition-colors duration-300 group-hover:text-white/80">
                {label}
            </span>

            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/10 transition-colors duration-300 group-hover:bg-[#F47822] rtl:ml-0 rtl:mr-auto" />
        </div>
    );
}

/* =====================================================================
   PROCESS STEP
===================================================================== */

function ProcessStep({
    number,
    title,
    description,
    icon: Icon,
}: {
    number: string;
    title: string;
    description: string;
    icon: typeof Gauge;
}) {
    return (
        <div className="group border-b border-[#3A3A3A]/10 p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:p-7 lg:p-8 rtl:sm:border-l rtl:sm:border-r-0 rtl:sm:last:border-l-0">
            <div className="flex items-start justify-between">
                <span className="font-mono text-[9px] font-bold text-[#F47822]">
                    {number}
                </span>

                <span className="h-px w-10 bg-[#3A3A3A]/10 transition-all duration-300 group-hover:w-16 group-hover:bg-[#F47822]/40" />
            </div>

            <div className="mt-7 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#3A3A3A]/[0.05]">
                <Icon className="h-4 w-4 text-[#F47822]" />
            </div>

            <h3 className="mt-5 text-2xl font-black uppercase tracking-[-0.04em] text-[#3A3A3A]">
                {title}
            </h3>

            <p className="mt-3 max-w-xs text-xs leading-6 text-[#3A3A3A]/40">
                {description}
            </p>
        </div>
    );
}

export default SimulatorSection;
