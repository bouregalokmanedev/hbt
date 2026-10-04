import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Gauge,
  MessageSquare,
  Radio,
  ScanLine,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    Eyebrow,
    LandingContainer,
    LandingSection,
    SectionTitle,
} from "./landing-ui";

type DiagnosticMetric = {
  label: string;
  value: string;
  unit?: string;
  status?: "normal" | "warning" | "critical";
};

const metricValues: Array<Pick<DiagnosticMetric, "value" | "unit" | "status">> = [
  {
    value: "812",
    unit: "rpm",
    status: "normal",
  },
  {
    value: "91",
    unit: "°C",
    status: "normal",
  },
  {
    value: "+18.4",
    unit: "%",
    status: "warning",
  },
  {
    value: "+12.1",
    unit: "%",
    status: "warning",
  },
];

function StatusDot({
  status = "normal",
}: {
  status?: DiagnosticMetric["status"];
}) {
  return (
    <span
      className={[
        "inline-block h-1.5 w-1.5 rounded-full",
        status === "normal" && "bg-emerald-500",
        status === "warning" && "bg-[#F47822]",
        status === "critical" && "bg-red-500",
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

function Waveform() {
  return (
    <div className="relative h-[118px] overflow-hidden rounded-2xl border border-white/8 bg-[#111111]">
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="absolute left-3 top-3 flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.18em] text-white/35">
        <Radio className="h-3 w-3 text-[#F47822]" />
        CKP SIGNAL
      </div>

      <svg
        viewBox="0 0 700 160"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[82px] w-full"
      >
        <path
          d="
            M0 92
            L25 92
            L32 55
            L40 118
            L48 92
            L76 92
            L84 48
            L92 121
            L100 92
            L128 92
            L136 56
            L144 116
            L152 92
            L180 92
            L188 47
            L196 121
            L204 92
            L232 92
            L240 57
            L248 117
            L256 92
            L284 92
            L292 48
            L300 120
            L308 92
            L336 92
            L344 56
            L352 116
            L360 92
            L388 92
            L396 46
            L404 122
            L412 92
            L440 92
            L448 57
            L456 116
            L464 92
            L492 92
            L500 49
            L508 120
            L516 92
            L544 92
            L552 55
            L560 117
            L568 92
            L596 92
            L604 48
            L612 121
            L620 92
            L650 92
            L658 57
            L666 117
            L674 92
            L700 92
          "
          fill="none"
          stroke="#F47822"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="absolute bottom-3 left-3 text-[9px] uppercase tracking-[0.16em] text-white/30">
        5V / 2ms
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  status,
}: DiagnosticMetric) {
  return (
    <div className="border-b border-black/8 py-3 last:border-b-0">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-black/40">
          {label}
        </span>

        <StatusDot status={status} />
      </div>

      <div className="flex items-baseline gap-1.5">
        <span
          className={[
            "font-mono text-[18px] font-semibold tracking-tight",
            status === "warning" ? "text-[#F47822]" : "text-[#181818]",
          ].join(" ")}
        >
          {value}
        </span>

        {unit && (
          <span className="text-[10px] font-medium uppercase text-black/35">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function MentorMessage({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={[
        "relative rounded-2xl border px-4 py-4 transition-all duration-500",
        active
          ? "border-[#F47822]/35 bg-[#F47822]/[0.06] shadow-[0_12px_35px_rgba(244,120,34,0.08)]"
          : "border-black/8 bg-[#F7F7F7]",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#181818] text-white">
          <Sparkles className="h-3 w-3" />
        </div>

        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-black/70">
            HBTronics Mentor
          </p>

          <p className="text-[8px] uppercase tracking-[0.12em] text-black/30">
            {t("landingPage.mentor.mentorRole")}
          </p>
        </div>
      </div>

      <div className="text-[12px] leading-5 text-black/65">{children}</div>
    </div>
  );
}

type MentorMetricLabel = {
  label: string;
};

type MentorBottomItem = {
  label: string;
  text: string;
};

export default function AIMentorSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement | null>(null);

  const [visible, setVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [typedText, setTypedText] = useState("");

  const metricLabels = t("landingPage.mentor.metrics", {
    returnObjects: true,
  }) as MentorMetricLabel[];

  const metrics: DiagnosticMetric[] = metricLabels.map((item, index) => ({
    label: item.label,
    ...metricValues[index % metricValues.length],
  }));

  const diagnosticSteps = t("landingPage.mentor.steps", {
    returnObjects: true,
  }) as string[];

  const bottomItems = t("landingPage.mentor.bottom", {
    returnObjects: true,
  }) as MentorBottomItem[];

  const testOptions = [
    {
      id: "intake",
      icon: Terminal,
      label: t("landingPage.mentor.testIntake"),
    },
    {
      id: "fuel",
      icon: Gauge,
      label: t("landingPage.mentor.testFuel"),
    },
    {
      id: "vacuum",
      icon: ScanLine,
      label: t("landingPage.mentor.testVacuum"),
    },
  ];

  const mentorText = t("landingPage.mentor.mentorText");

  useEffect(() => {
    const element = sectionRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.2,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    setTypedText("");

    let index = 0;

    const interval = window.setInterval(() => {
      index += 1;

      setTypedText(mentorText.slice(0, index));

      if (index >= mentorText.length) {
        window.clearInterval(interval);
      }
    }, 22);

    return () => window.clearInterval(interval);
  }, [visible, mentorText]);

  useEffect(() => {
    if (!visible) return;

    const interval = window.setInterval(() => {
      setActiveStep((current) =>
        current >= diagnosticSteps.length - 1 ? 1 : current + 1,
      );
    }, 3200);

    return () => window.clearInterval(interval);
  }, [visible, diagnosticSteps.length]);

  const handleTest = (test: string) => {
    setSelectedTest(test);
    setActiveStep(2);
  };

  return (
    <LandingSection
      id="ai-mentor"
      sectionRef={sectionRef}
      className="bg-[#E8E4DE]"
    >
      {/* Background technical grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(24,24,24,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,24,.08) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Orange diagnostic trace */}
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute left-0 top-[46%] h-px bg-[#F47822]/45 transition-all duration-[1800ms] ease-out rtl:left-auto rtl:right-0",
          visible ? "w-[62%]" : "w-0",
        ].join(" ")}
      />

      <LandingContainer className="relative">
        {/* Section header */}
        <div
          className={[
            "mb-6 grid gap-8 transition-all duration-1000 lg:grid-cols-[1fr_auto] lg:items-end",
            visible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0",
          ].join(" ")}
        >
          <div>
            <div className="flex items-center gap-3">
              <Eyebrow>
                {t("landingPage.mentor.eyebrow")}
              </Eyebrow>

              <span className="h-px w-10 bg-[#F47822]/40" />


            </div>

            <SectionTitle size="display" className="max-w-[850px] lowercase">
              {t("landingPage.mentor.titleA")}
              <br />
              <span className="text-[#F47822]">{t("landingPage.mentor.titleHighlight")}</span>
            </SectionTitle>
          </div>

          <div className="max-w-[390px] pb-1 lg:text-right rtl:lg:text-left">
            <p className="text-[15px] leading-7 text-black/55">
              {t("landingPage.mentor.description")}
            </p>
          </div>
        </div>

        {/* Main diagnostic workstation */}
        <div
          className={[
            "relative overflow-hidden rounded-[34px] border border-black/10 bg-[#F7F7F7] shadow-[0_35px_100px_rgba(24,24,24,0.12)] transition-all duration-[1200ms] ease-out",
            visible
              ? "translate-y-0 opacity-100"
              : "translate-y-14 opacity-0",
          ].join(" ")}
        >
          {/* Top bar */}
          <div className="flex min-h-[56px] items-center justify-between border-b border-black/8 px-5 sm:px-7">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-black/55">
                  {t("landingPage.mentor.sessionLabel")}
                </span>
              </div>

              <span className="hidden h-4 w-px bg-black/10 sm:block" />

              <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-black/30 sm:block">
                {t("landingPage.mentor.vehicleLabel")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden text-[9px] uppercase tracking-[0.14em] text-black/30 sm:block">
                {t("landingPage.mentor.aiAssist")}
              </span>

              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#181818] text-white">
                <Sparkles className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Workstation */}
          <div className="grid lg:grid-cols-[1.45fr_0.85fr]">
            {/* Diagnostic side */}
            <div className="border-b border-black/8 p-5 sm:p-7 lg:border-b-0 lg:border-r rtl:lg:border-l rtl:lg:border-r-0">
              <div className="mb-5 flex items-start justify-between gap-5">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-[#F47822]" />

                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-black/40">
                      {t("landingPage.mentor.category")}
                    </span>
                  </div>

                  <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#181818] sm:text-3xl">
                    {t("landingPage.mentor.caseTitle")}
                  </h3>
                </div>

                <div className="hidden shrink-0 rounded-xl border border-[#F47822]/20 bg-[#F47822]/[0.06] px-3 py-2 text-right sm:block rtl:text-left">
                  <span className="block font-mono text-[8px] uppercase tracking-[0.16em] text-black/35">
                    DTC
                  </span>

                  <span className="font-mono text-sm font-bold text-[#F47822]">
                    P0171
                  </span>
                </div>
              </div>

              {/* Complaint */}
              <div className="mb-5 rounded-2xl border border-black/8 bg-[#ECE9E3] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CircleHelp className="h-3.5 w-3.5 text-[#F47822]" />

                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-black/40">
                    {t("landingPage.mentor.complaintLabel")}
                  </span>
                </div>

                <p className="max-w-[680px] text-[13px] leading-6 text-black/60">
                  {t("landingPage.mentor.complaintText")}
                </p>
              </div>

              {/* Live data */}
              <div className="mb-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ScanLine className="h-3.5 w-3.5 text-[#F47822]" />

                    <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-black/40">
                      {t("landingPage.mentor.liveData")}
                    </span>
                  </div>

                  <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-emerald-600">
                    {t("landingPage.mentor.connected")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-5 border-y border-black/8 sm:grid-cols-4">
                  {metrics.map((metric) => (
                    <Metric
                      key={metric.label}
                      label={metric.label}
                      value={metric.value}
                      unit={metric.unit}
                      status={metric.status}
                    />
                  ))}
                </div>
              </div>

              {/* Waveform */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-[#F47822]" />

                    <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-black/40">
                      {t("landingPage.mentor.signalTitle")}
                    </span>
                  </div>

                  <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-black/25">
                    {t("landingPage.mentor.channelLabel")}
                  </span>
                </div>

                <Waveform />
              </div>
            </div>

            {/* Mentor side */}
            <div className="bg-white p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#181818] text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[#181818]">
                      {t("landingPage.mentor.mentorTitle")}
                    </h3>

                    <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
                      {t("landingPage.mentor.mentorSub")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />

                  <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-black/35">
                    {t("landingPage.mentor.online")}
                  </span>
                </div>
              </div>

              <MentorMessage active>
                <p className="min-h-[72px]">
                  {typedText}
                  {typedText.length < mentorText.length && (
                    <span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-[#F47822]" />
                  )}
                </p>
              </MentorMessage>

              {/* Test choices */}
              <div className="mt-4 space-y-2">
                {testOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedTest === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleTest(option.id)}
                      className={[
                        "group flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all duration-300 rtl:text-right",
                        isSelected
                          ? "border-[#F47822]/40 bg-[#F47822]/[0.06]"
                          : "border-black/8 bg-white hover:border-[#F47822]/30 hover:bg-[#F47822]/[0.03]",
                      ].join(" ")}
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0EEEA] text-black/50 transition-colors group-hover:bg-[#F47822] group-hover:text-white">
                          <Icon className="h-3.5 w-3.5" />
                        </span>

                        <span className="text-[11px] font-medium text-black/65">
                          {option.label}
                        </span>
                      </span>

                      <ChevronRight className="h-3.5 w-3.5 text-black/25 transition-transform group-hover:translate-x-1 group-hover:text-[#F47822] rtl:-scale-x-100 rtl:group-hover:-translate-x-1 rtl:group-hover:translate-x-0" />
                    </button>
                  );
                })}
              </div>

              {/* Result */}
              <div
                className={[
                  "mt-5 overflow-hidden transition-all duration-500",
                  selectedTest
                    ? "max-h-40 opacity-100"
                    : "max-h-0 opacity-0",
                ].join(" ")}
              >
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />

                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-700">
                      {t("landingPage.mentor.resultTitle")}
                    </span>
                  </div>

                  <p className="text-[11px] leading-5 text-black/55">
                    {t("landingPage.mentor.resultText")}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-black/35">
                    {t("landingPage.mentor.progressLabel")}
                  </span>

                  <span className="font-mono text-[9px] text-[#F47822]">
                    {String(activeStep + 1).padStart(2, "0")} / 04
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {diagnosticSteps.map((step, index) => (
                    <div key={step}>
                      <div
                        className={[
                          "mb-2 h-1 rounded-full transition-all duration-700",
                          index <= activeStep
                            ? "bg-[#F47822]"
                            : "bg-black/8",
                        ].join(" ")}
                      />

                      <span
                        className={[
                          "text-[8px] uppercase leading-3 tracking-[0.08em]",
                          index <= activeStep
                            ? "text-black/60"
                            : "text-black/25",
                        ].join(" ")}
                      >
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom footer */}
          <div className="flex flex-col gap-5 border-t border-black/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-[#F47822]" />

                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/40">
                  {t("landingPage.mentor.footerAsk")}
                </span>
              </div>

              <ChevronRight className="h-3 w-3 text-black/20 rtl:-scale-x-100" />

              <div className="flex items-center gap-2">
                <ScanLine className="h-3.5 w-3.5 text-[#F47822]" />

                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/40">
                  {t("landingPage.mentor.footerTest")}
                </span>
              </div>

              <ChevronRight className="h-3 w-3 text-black/20 rtl:-scale-x-100" />

              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#F47822]" />

                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/40">
                  {t("landingPage.mentor.footerUnderstand")}
                </span>
              </div>
            </div>

            <Link
              to="/simulator"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#181818] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#F47822] hover:shadow-[0_12px_30px_rgba(244,120,34,0.22)]"
            >
              {t("landingPage.mentor.cta")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1 rtl:group-hover:translate-x-0" />
            </Link>
          </div>
        </div>

        {/* Bottom statement */}
        <div
          className={[
            "mt-6 grid gap-8 transition-all delay-200 duration-1000 sm:grid-cols-3",
            visible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0",
          ].join(" ")}
        >
          {bottomItems.map((item) => (
            <div key={item.label}>
              <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.18em] text-[#F47822]">
                {item.label}
              </span>

              <p className="text-sm leading-6 text-black/50">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </LandingContainer>
    </LandingSection>
  );
}
