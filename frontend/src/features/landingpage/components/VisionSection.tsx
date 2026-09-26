import {
    Award,
    BadgeCheck,
    BookOpen,
    Gauge,
    MessageSquareCheck,
    Target,
    Wrench,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    Eyebrow,
    LandingContainer,
    LandingSection,
    SectionLead,
    SectionTitle,
} from "./landing-ui";

const PILLAR_ICONS = [Target, Gauge, Award];

const STEP_ICONS = [BookOpen, Wrench, MessageSquareCheck, BadgeCheck];

export default function VisionSection() {
    const { t } = useTranslation();

    const pillars = [
        {
            title: t("landingPage.vision.pillar1Title"),
            text: t("landingPage.vision.pillar1Text"),
        },
        {
            title: t("landingPage.vision.pillar2Title"),
            text: t("landingPage.vision.pillar2Text"),
        },
        {
            title: t("landingPage.vision.pillar3Title"),
            text: t("landingPage.vision.pillar3Text"),
        },
    ];

    const steps = [
        {
            title: t("landingPage.way.step1Title"),
            text: t("landingPage.way.step1Text"),
        },
        {
            title: t("landingPage.way.step2Title"),
            text: t("landingPage.way.step2Text"),
        },
        {
            title: t("landingPage.way.step3Title"),
            text: t("landingPage.way.step3Text"),
        },
        {
            title: t("landingPage.way.step4Title"),
            text: t("landingPage.way.step4Text"),
        },
    ];

    return (
        <>
            {/* =================================================
                OUR VISION — dark hero-style band
            ================================================== */}

            <LandingSection id="our-vision" className="bg-[#111111] text-white">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 opacity-[0.10]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.7) 1px, transparent 1px)",
                        backgroundSize: "72px 72px",
                        maskImage:
                            "radial-gradient(ellipse at 50% 35%, black 0%, transparent 75%)",
                        WebkitMaskImage:
                            "radial-gradient(ellipse at 50% 35%, black 0%, transparent 75%)",
                    }}
                />

                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-[12%] top-[8%] -z-10 h-[460px] w-[460px] rounded-full bg-[#F47822]/14 blur-[140px] rtl:-left-[12%] rtl:right-auto"
                />

                <LandingContainer>
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur-xl">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#F47822]" />

                            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75">
                                {t("landingPage.vision.badge")}
                            </span>
                        </div>

                        <SectionTitle
                            tone="white"
                            size="display"
                            className="mt-6"
                        >
                            {t("landingPage.vision.titleA")}{" "}
                            <span className="text-[#F47822]">
                                {t("landingPage.vision.titleHighlight")}
                            </span>{" "}
                            {t("landingPage.vision.titleB")}
                        </SectionTitle>

                        <SectionLead tone="light" className="mt-6">
                            {t("landingPage.vision.description")}
                        </SectionLead>
                    </div>

                    <div className="mt-12 grid gap-5 sm:grid-cols-3">
                        {pillars.map((pillar, index) => {
                            const Icon = PILLAR_ICONS[index];

                            return (
                                <div
                                    key={pillar.title}
                                    className="group rounded-3xl border border-white/12 bg-white/[0.06] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#F47822]/45 hover:bg-white/[0.09]"
                                >
                                    <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[#F47822]/25 bg-[#F47822]/12 text-[#F47822] transition-colors duration-300 group-hover:bg-[#F47822] group-hover:text-white">
                                        <Icon size={19} strokeWidth={2.1} />
                                    </span>

                                    <h3 className="mt-5 text-lg font-black tracking-tight">
                                        {pillar.title}
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-white/55">
                                        {pillar.text}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </LandingContainer>
            </LandingSection>

            {/* =================================================
                OUR WAY — light 4-step path
            ================================================== */}

            <LandingSection
                id="our-way"
                className="bg-white text-[#3A3A3A]"
            >
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-40 bottom-[-10%] -z-10 h-[420px] w-[420px] rounded-full bg-[#F47822]/[0.05] blur-[130px] rtl:-right-40 rtl:left-auto"
                />

                <LandingContainer>
                    <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
                        <div className="lg:col-span-7">
                            <Eyebrow>
                                {t("landingPage.way.badge")}
                            </Eyebrow>

                            <SectionTitle className="mt-4">
                                {t("landingPage.way.titleA")}{" "}
                                <span className="text-[#F47822]">
                                    {t("landingPage.way.titleHighlight")}
                                </span>{" "}
                                {t("landingPage.way.titleB")}
                            </SectionTitle>
                        </div>

                        <div className="lg:col-span-5">
                            <SectionLead className="lg:text-end">
                                {t("landingPage.way.description")}
                            </SectionLead>
                        </div>
                    </div>

                    <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                        {steps.map((step, index) => {
                            const Icon = STEP_ICONS[index];

                            return (
                                <div
                                    key={step.title}
                                    className="group relative overflow-hidden rounded-3xl border border-[#3A3A3A]/10 bg-[#F7F6F4] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#F47822]/40 hover:bg-white hover:shadow-[0_24px_50px_rgba(244,120,34,0.12)]"
                                >
                                    <div className="flex items-center justify-between">
                                        <span
                                            className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F47822]/12 font-black text-[#F47822]"
                                            dir="ltr"
                                        >
                                            {`0${index + 1}`}
                                        </span>

                                        <Icon
                                            size={20}
                                            className="text-[#3A3A3A]/25 transition-colors duration-300 group-hover:text-[#F47822]"
                                        />
                                    </div>

                                    <h3 className="mt-6 text-lg font-black tracking-tight">
                                        {step.title}
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/60">
                                        {step.text}
                                    </p>

                                    <span
                                        aria-hidden="true"
                                        className="absolute bottom-0 left-0 h-1 w-0 bg-[#F47822] transition-all duration-300 group-hover:w-full rtl:left-auto rtl:right-0"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </LandingContainer>
            </LandingSection>
        </>
    );
}
