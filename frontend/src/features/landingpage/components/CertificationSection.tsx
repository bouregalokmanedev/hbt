import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  Wrench,
} from "lucide-react";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useTranslation } from "react-i18next";

import {
    Eyebrow,
    LandingContainer,
    LandingSection,
    SectionTitle,
} from "./landing-ui";

import hbtLogo from "@/assets/brand/hbt-logo-full.png";

const ORANGE = "#F47822";
const DARK = "#181818";
const PAPER = "#F7F5F0";

type PipelineStep = {
  number: string;
  title: string;
  description: string;
  icon: typeof Award;
};

const stepIcons = [Target, FileCheck2, Wrench, Award];

const stepNumbers = ["01", "02", "03", "04"];

type TranslatedStep = {
  title: string;
  description: string;
};

type TranslatedLevel = {
  level: string;
  title: string;
  description: string;
};

function CertificateSeal() {
  return (
    <div className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full border border-[#F47822]/30 bg-[#F47822]/[0.035]">
      <div className="absolute inset-[6px] rounded-full border border-dashed border-[#F47822]/30" />

      <div className="absolute inset-[13px] rounded-full border border-[#F47822]/15" />

      <div
        className="
          relative
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-full
          bg-[#F47822]
          text-white
          shadow-[0_6px_20px_rgba(244,120,34,0.18)]
        "
      >
        <ShieldCheck className="h-[17px] w-[17px]" strokeWidth={2.2} />
      </div>
    </div>
  );
}

function TechnicalGrid() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.45]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(24,24,24,0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(24,24,24,0.045) 1px, transparent 1px)
        `,
        backgroundSize: "42px 42px",
      }}
    />
  );
}

export function CertificationSection() {
  const { t } = useTranslation();

  const translatedSteps = t("landingPage.certification.steps", {
    returnObjects: true,
  }) as TranslatedStep[];

  const pipelineSteps: PipelineStep[] = translatedSteps.map((step, index) => ({
    number: stepNumbers[index] ?? String(index + 1).padStart(2, "0"),
    title: step.title,
    description: step.description,
    icon: stepIcons[index] ?? Award,
  }));

  const certificationLevels = t("landingPage.certification.levels", {
    returnObjects: true,
  }) as TranslatedLevel[];

  const sectionRef = useRef<HTMLElement | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(3);

  useEffect(() => {
    const element = sectionRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.15,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const interval = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % pipelineSteps.length);
    }, 2600);

    return () => window.clearInterval(interval);
  }, [isVisible]);

  return (
    <LandingSection
      id="certification"
      sectionRef={sectionRef}
      className="bg-[#E8E4DE]"
    >
      <TechnicalGrid />

      {/* Decorative technical marks */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-0
          top-32
          h-px
          w-[18vw]
          bg-gradient-to-r
          from-transparent
          via-[#181818]/10
          to-[#181818]/10
          rtl:left-auto
          rtl:right-0
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          right-0
          top-[42%]
          h-px
          w-[14vw]
          bg-gradient-to-l
          from-transparent
          via-[#F47822]/30
          to-[#F47822]/30
          rtl:left-0
          rtl:right-auto
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          bottom-20
          left-[8%]
          h-20
          w-20
          rounded-full
          border
          border-[#181818]/10
          rtl:left-auto
          rtl:right-[8%]
        "
      />

      <LandingContainer className="relative z-10">

        {/* ============================================================
            HEADER
        ============================================================ */}

        <div
          className={`
            max-w-3xl
            transition-all
            duration-1000
            ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }
          `}
        >
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-[#F47822]" />

            <Eyebrow tone="muted">
              {t("landingPage.certification.eyebrow")}
            </Eyebrow>
          </div>

          <SectionTitle size="display" className="max-w-4xl lowercase">
            {t("landingPage.certification.titleA")}
            <br />

            <span className="text-[#F47822]">{t("landingPage.certification.titleB")}</span>
          </SectionTitle>

          <p
            className="
              mt-7
              max-w-2xl
              text-base
              leading-7
              text-[#181818]/60
              sm:text-lg
            "
          >
            {t("landingPage.certification.description")}
          </p>
        </div>

        {/* ============================================================
            MAIN CERTIFICATE AREA
        ============================================================ */}

        <div className="mt-20 grid gap-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)] lg:items-center">

          {/* ==========================================================
              CERTIFICATE
          ========================================================== */}

          <div
            className={`
              relative
              transition-all
              delay-150
              duration-1000
              ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-10 opacity-0"
              }
            `}
          >
            {/* technical label */}

            <div className="mb-4 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F47822]" />

                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#181818]/40">
                  {t("landingPage.certification.previewLabel")}
                </span>
              </div>

              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#181818]/30">
                HBT-CERT-01
              </span>
            </div>

            {/* ========================================================
                CERTIFICATE
                No dark outer frame.
            ======================================================== */}

            <div
              className="
                relative
                overflow-hidden
                rounded-[24px]
                bg-[#F7F5F0]
                shadow-[0_35px_90px_rgba(24,24,24,0.14)]
              "
            >
              <div
                className="
                  relative
                  min-h-[590px]
                  overflow-hidden
                  rounded-[24px]
                  border
                  border-black/[0.07]
                  bg-[#F7F5F0]
                  px-7
                  py-8
                  sm:px-12
                  sm:py-11
                  lg:min-h-[630px]
                  lg:px-14
                  lg:py-12
                "
              >
                {/* certificate technical border */}

                <div className="pointer-events-none absolute inset-4 rounded-[10px] border border-black/[0.055] sm:inset-6" />

                <div className="pointer-events-none absolute inset-6 rounded-[7px] border border-[#F47822]/10 sm:inset-8" />

                {/* decorative corners */}

                <div className="absolute left-8 top-8 h-7 w-7 border-l border-t border-[#F47822]/40" />

                <div className="absolute right-8 top-8 h-7 w-7 border-r border-t border-[#F47822]/40" />

                <div className="absolute bottom-8 left-8 h-7 w-7 border-b border-l border-[#F47822]/40" />

                <div className="absolute bottom-8 right-8 h-7 w-7 border-b border-r border-[#F47822]/40" />

                {/* subtle paper grid */}

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.22]"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(24,24,24,0.035) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(24,24,24,0.035) 1px, transparent 1px)
                    `,
                    backgroundSize: "28px 28px",
                  }}
                />

                {/* orange identity strip */}

                <div className="absolute bottom-0 left-0 top-0 w-[4px] bg-[#F47822] rtl:left-auto rtl:right-0" />

                <div className="relative z-10 flex min-h-[530px] flex-col lg:min-h-[570px]">

                  {/* ==================================================
                      CERTIFICATE HEADER
                  ================================================== */}

                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <img
                        src={hbtLogo}
                        alt="HBTronics"
                        className="
                          h-[15px]
                          w-auto
                          object-contain
                          opacity-90
                          sm:h-[18px]
                        "
                      />

                      <p className="mt-2.5 font-mono text-[6px] uppercase tracking-[0.18em] text-black/30 sm:text-[7px]">
                        {t("landingPage.certification.platformLine")}
                      </p>
                    </div>

                    <div className="text-right rtl:text-left">
                      <p className="font-mono text-[7px] uppercase tracking-[0.16em] text-black/30">
                        {t("landingPage.certification.credentialLabel")}
                      </p>

                      <p className="mt-1 font-mono text-[8px] font-semibold tracking-[0.1em] text-black/65">
                        HBT-9X42-EMS-26
                      </p>
                    </div>
                  </div>

                  {/* ==================================================
                      CERTIFICATE TITLE
                  ================================================== */}

                  <div className="mt-16 text-center sm:mt-20">
                    <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.25em] text-[#F47822]">
                      {t("landingPage.certification.certificateTitle")}
                    </p>

                    <h3 className="mt-5 text-[clamp(2rem,4vw,4rem)] font-semibold leading-none tracking-[-0.045em] text-[#181818]">
                      {t("landingPage.certification.certificateNameA")}
                      <br />
                      {t("landingPage.certification.certificateNameB")}
                    </h3>

                    <p className="mx-auto mt-6 max-w-md text-[10px] leading-5 text-black/45 sm:text-xs sm:leading-6">
                      {t("landingPage.certification.certificateDesc")}
                    </p>
                  </div>

                  {/* ==================================================
                      CREDENTIAL DATA
                  ================================================== */}

                  <div className="mx-auto mt-12 grid w-full max-w-2xl grid-cols-2 gap-x-8 gap-y-7 sm:mt-14 sm:grid-cols-4">
                    <div>
                      <span className="block font-mono text-[7px] uppercase tracking-[0.16em] text-black/30">
                        {t("landingPage.certification.candidateLabel")}
                      </span>

                      <p className="mt-1 text-[10px] font-semibold text-black/75 sm:text-xs">
                        Alex Morgan
                      </p>
                    </div>

                    <div>
                      <span className="block font-mono text-[7px] uppercase tracking-[0.16em] text-black/30">
                        {t("landingPage.certification.programLabel")}
                      </span>

                      <p className="mt-1 text-[10px] font-semibold text-black/75 sm:text-xs">
                        {t("landingPage.certification.programValue")}
                      </p>
                    </div>

                    <div>
                      <span className="block font-mono text-[7px] uppercase tracking-[0.16em] text-black/30">
                        {t("landingPage.certification.issuedLabel")}
                      </span>

                      <p className="mt-1 text-[10px] font-semibold text-black/75 sm:text-xs">
                        {t("landingPage.certification.issuedValue")}
                      </p>
                    </div>

                    <div>
                      <span className="block font-mono text-[7px] uppercase tracking-[0.16em] text-black/30">
                        {t("landingPage.certification.levelLabel")}
                      </span>

                      <p className="mt-1 text-[10px] font-semibold text-black/75 sm:text-xs">
                        {t("landingPage.certification.levelValue")}
                      </p>
                    </div>
                  </div>

                  {/* ==================================================
                      CERTIFICATE FOOTER
                  ================================================== */}

                  <div className="mt-auto border-t border-black/8 pt-7">
                    <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">

                      {/* signature */}

                      <div>
                        <div className="mb-5 h-px w-32 bg-black/25" />

                        <p className="text-[9px] font-semibold text-black/65">
                          {t("landingPage.certification.boardName")}
                        </p>

                        <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.13em] text-black/30">
                          {t("landingPage.certification.authorizedLabel")}
                        </p>
                      </div>

                      {/* QR + status */}

                      <div className="flex items-end gap-5">

                        {/* QR */}

                        <div className="flex items-center gap-3">
                          <div className="rounded-lg border border-black/10 bg-white p-2">
                            <QRCodeSVG
                              value="https://hbtronics.dz/verify/HBT-9X42-EMS-26"
                              size={58}
                              bgColor="#FFFFFF"
                              fgColor="#181818"
                              level="M"
                              marginSize={0}
                            />
                          </div>

                          <div className="max-w-[80px]">
                            <p className="text-[7px] font-bold uppercase tracking-[0.13em] text-black/45">
                              {t("landingPage.certification.scanLabel")}
                            </p>

                            <p className="mt-1 font-mono text-[6px] leading-3 text-black/25">
                              HBT-9X42-EMS-26
                            </p>
                          </div>
                        </div>

                        {/* status */}

                        <div className="flex items-center gap-4">
                          <div className="text-right rtl:text-left">
                            <span className="mb-1 block font-mono text-[7px] uppercase tracking-[0.16em] text-black/30">
                              {t("landingPage.certification.statusLabel")}
                            </span>

                            <span className="flex items-center justify-end gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-600 rtl:justify-start">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {t("landingPage.certification.statusValue")}
                            </span>
                          </div>

                          <CertificateSeal />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scanner removed intentionally */}
              </div>
            </div>

            {/* floating credential badge */}

            <div
              className={`
                absolute
                -bottom-7
                right-5
                hidden
                rounded-2xl
                border
                border-black/10
                bg-[#F7F5F0]
                px-5
                py-4
                shadow-[0_18px_45px_rgba(24,24,24,0.13)]
                transition-all
                delay-700
                duration-1000
                sm:block
                rtl:left-5
                rtl:right-auto
                ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-5 opacity-0"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F47822]/10 text-[#F47822]">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-[10px] font-bold text-[#181818]">
                    {t("landingPage.certification.verifiableTitle")}
                  </p>

                  <p className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.13em] text-[#181818]/35">
                    {t("landingPage.certification.verifiableSub")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================================
              RIGHT SIDE
          ========================================================== */}

          <div
            className={`
              transition-all
              delay-300
              duration-1000
              ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "translate-x-10 opacity-0"
              }
            `}
          >
            {/* ========================================================
                PIPELINE
            ======================================================== */}

            <div>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#181818]/35">
                    {t("landingPage.certification.pathwayLabel")}
                  </span>

                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#181818] sm:text-3xl">
                    {t("landingPage.certification.pathwayTitle")}
                  </h3>
                </div>

                <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-[#F7F5F0] sm:flex">
                  <Sparkles className="h-4 w-4 text-[#F47822]" />
                </div>
              </div>

              <div className="relative">

                {/* Vertical connector removed */}

                <div className="space-y-2">
                  {pipelineSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = activeStep === index;
                    const isComplete = index <= activeStep;

                    return (
                      <button
                        key={step.number}
                        type="button"
                        onMouseEnter={() => setActiveStep(index)}
                        onFocus={() => setActiveStep(index)}
                        className="
                          group
                          relative
                          flex
                          w-full
                          items-start
                          gap-5
                          rounded-2xl
                          p-3
                          text-left
                          transition-all
                          duration-300
                          hover:bg-black/[0.025]
                          rtl:text-right
                        "
                      >
                        {/* node */}

                        <div
                          className={`
                            relative
                            z-10
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            border
                            transition-all
                            duration-300
                            ${
                              isActive
                                ? "border-[#F47822] bg-[#F47822] text-white shadow-[0_8px_25px_rgba(244,120,34,0.22)]"
                                : isComplete
                                  ? "border-[#F47822]/30 bg-[#F47822]/10 text-[#F47822]"
                                  : "border-black/10 bg-[#F7F5F0] text-black/35"
                            }
                          `}
                        >
                          {isComplete && !isActive ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>

                        {/* content */}

                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#181818]/30">
                                {step.number}
                              </span>

                              <h4
                                className={`
                                  mt-1
                                  text-sm
                                  font-semibold
                                  transition-colors
                                  duration-300
                                  ${
                                    isActive
                                      ? "text-[#F47822]"
                                      : "text-[#181818]"
                                  }
                                `}
                              >
                                {step.title}
                              </h4>
                            </div>

                            <ChevronRight
                              className={`
                                h-4
                                w-4
                                shrink-0
                                transition-all
                                duration-300
                                rtl:-scale-x-100
                                ${
                                  isActive
                                    ? "translate-x-0 text-[#F47822] opacity-100 rtl:-translate-x-0"
                                    : "-translate-x-1 text-black/20 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 rtl:translate-x-1 rtl:group-hover:-translate-x-0"
                                }
                              `}
                            />
                          </div>

                          <p className="mt-2 max-w-md text-xs leading-5 text-[#181818]/50">
                            {step.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ========================================================
                VERIFICATION CARD
            ======================================================== */}

            <div className="mt-10 rounded-[24px] border border-black/10 bg-[#F7F5F0] p-6 shadow-[0_18px_50px_rgba(24,24,24,0.06)] sm:p-7">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2">
                    <ScanLine className="h-4 w-4 text-[#F47822]" />

                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#181818]/40">
                      {t("landingPage.certification.verifyTitle")}
                    </span>
                  </div>

                  <h4 className="mt-4 text-xl font-semibold tracking-[-0.025em] text-[#181818]">
                    {t("landingPage.certification.verifyHeading")}
                  </h4>

                  <p className="mt-2 max-w-sm text-xs leading-5 text-[#181818]/50">
                    {t("landingPage.certification.verifyDesc")}
                  </p>
                </div>

                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822] sm:flex">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>

              {/* ======================================================
                  IMPROVED BUTTONS
              ====================================================== */}

              <div className="mt-7 grid gap-3 sm:grid-cols-2">

                {/* PRIMARY */}

                <Link
                  to="/verify-certificate"
                  className="
                    group
                    relative
                    flex
                    min-h-[58px]
                    items-center
                    justify-between
                    overflow-hidden
                    rounded-2xl
                    bg-[#F47822]
                    px-4
                    py-3
                    text-white
                    shadow-[0_10px_25px_rgba(24,24,24,0.12)]
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:bg-[#F47822]
                    hover:shadow-[0_15px_32px_rgba(244,120,34,0.24)]
                  "
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-xl
                        bg-white/10
                        transition-colors
                        duration-300
                        group-hover:bg-white/20
                      "
                    >
                      <ShieldCheck className="h-4 w-4" />
                    </span>

                    <span className="text-left rtl:text-right">
                      <span className="block text-[11px] font-bold">
                        {t("landingPage.certification.verifyCta")}
                      </span>

                      <span className="mt-0.5 block font-mono text-[7px] uppercase tracking-[0.12em] text-white/40 group-hover:text-white/65">
                        {t("landingPage.certification.verifySub")}
                      </span>
                    </span>
                  </div>

                  <span
                    className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-full
                      bg-white/10
                      transition-all
                      duration-300
                      group-hover:translate-x-0.5
                      group-hover:bg-white/20
                      rtl:group-hover:-translate-x-0.5
                      rtl:group-hover:translate-x-0
                    "
                  >
                    <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                  </span>
                </Link>

                {/* SECONDARY */}

                <Link
                  to="/courses"
                  className="
                    group
                    relative
                    flex
                    min-h-[58px]
                    items-center
                    justify-between
                    overflow-hidden
                    rounded-2xl
                    border
                    border-black/10
                    bg-white/40
                    px-4
                    py-3
                    text-[#181818]
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:border-[#F47822]/30
                    hover:bg-white
                    hover:shadow-[0_15px_32px_rgba(24,24,24,0.08)]
                  "
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-xl
                        bg-black/[0.045]
                        text-[#181818]
                        transition-all
                        duration-300
                        group-hover:bg-[#F47822]/10
                        group-hover:text-[#F47822]
                      "
                    >
                      <Target className="h-4 w-4" />
                    </span>

                    <span className="text-left rtl:text-right">
                      <span className="block text-[11px] font-bold">
                        {t("landingPage.certification.exploreCta")}
                      </span>

                      <span className="mt-0.5 block font-mono text-[7px] uppercase tracking-[0.12em] text-black/30 group-hover:text-[#F47822]/70">
                        {t("landingPage.certification.exploreSub")}
                      </span>
                    </span>
                  </div>

                  <span
                    className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-black/10
                      transition-all
                      duration-300
                      group-hover:translate-x-0.5
                      group-hover:border-[#F47822]/30
                      group-hover:bg-[#F47822]/10
                      group-hover:text-[#F47822]
                      rtl:group-hover:-translate-x-0.5
                      rtl:group-hover:translate-x-0
                    "
                  >
                    <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            CERTIFICATION LEVELS
        ============================================================ */}

        <div
          className={`
            mt-28
            border-t
            border-black/10
            pt-12
            transition-all
            delay-500
            duration-1000
            ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }
          `}
        >
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">

            <div>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#181818]/35">
                {t("landingPage.certification.structureLabel")}
              </span>

              <h3 className="mt-3 max-w-md text-3xl font-semibold tracking-[-0.04em] text-[#181818] sm:text-4xl">
                {t("landingPage.certification.structureTitle")}
              </h3>

              <p className="mt-5 max-w-md text-sm leading-6 text-[#181818]/50">
                {t("landingPage.certification.structureDesc")}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {certificationLevels.map((level, index) => (
                <div
                  key={level.level}
                  className="
                    group
                    relative
                    overflow-hidden
                    rounded-2xl
                    border
                    border-black/10
                    bg-[#F7F5F0]
                    p-5
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:border-[#F47822]/30
                    hover:shadow-[0_18px_40px_rgba(24,24,24,0.07)]
                  "
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
                      {level.level}
                    </span>

                    <span className="font-mono text-[8px] text-black/25">
                      0{index + 1}
                    </span>
                  </div>

                  <h4 className="mt-7 text-sm font-semibold text-[#181818]">
                    {level.title}
                  </h4>

                  <p className="mt-3 text-xs leading-5 text-[#181818]/45">
                    {level.description}
                  </p>

                  <div className="mt-7 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-black/35 transition-colors group-hover:text-[#F47822]">
                    {t("landingPage.certification.pathwayCta")}

                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
                  </div>

                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#F47822] transition-all duration-500 group-hover:w-full rtl:left-auto rtl:right-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================
            BOTTOM CTA
        ============================================================ */}

        <div
          className={`
            mt-20
            flex
            flex-col
            gap-6
            rounded-[28px]
            bg-[#181818]
            p-7
            text-white
            shadow-[0_30px_70px_rgba(24,24,24,0.15)]
            transition-all
            delay-700
            duration-1000
            sm:p-9
            lg:flex-row
            lg:items-center
            lg:justify-between
            lg:px-11
            ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }
          `}
        >
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F47822]" />

              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-white/35">
                {t("landingPage.certification.nextLabel")}
              </span>
            </div>

            <h3 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
              {t("landingPage.certification.bottomTitle")}
            </h3>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">
              {t("landingPage.certification.bottomDesc")}
            </p>
          </div>

          <Link
            to="/courses"
            className="
              group
              inline-flex
              shrink-0
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[#F47822]
              px-6
              py-3.5
              text-xs
              font-bold
              text-white
              transition-all
              duration-300
              hover:bg-white
              hover:text-[#181818]
              hover:shadow-[0_12px_30px_rgba(244,120,34,0.22)]
            "
          >
            {t("landingPage.certification.startLearning")}

            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>
      </LandingContainer>
    </LandingSection>
  );
}

export default CertificationSection;