import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type MotionProps,
} from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  Gauge,
  GitBranch,
  Lock,
  MapPin,
  MonitorPlay,
  ScanSearch,
  Sparkles,
  Trophy,
  Wrench,
} from "lucide-react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { usePageMeta } from "@/lib/page-meta";
import { ScannerLabFull } from "@/features/simulator/components/labs/ScannerLabFull";
import { SchematicLabFull } from "@/features/simulator/components/labs/SchematicLabFull";
import { DemoRegisterModal } from "../components/DemoRegisterModal";
import {
  DEMO_LABS,
  DEMO_SCENARIOS,
  bumpDemoStageForAuth,
  isDemoLabUnlocked,
  isDemoScenarioUnlocked,
  isDemoStepUnlocked,
  readDemoStage,
  type DemoLabId,
} from "../demo.state";

const LAB_META: Record<
  DemoLabId,
  { accent: string; accentBg: string; tag: string; icon: typeof ScanSearch }
> = {
  scanner: {
    accent: "#F47822",
    accentBg: "#FFF1E6",
    tag: "SCN",
    icon: ScanSearch,
  },
  multimeter: {
    accent: "#EAB308",
    accentBg: "#FEF9C3",
    tag: "DMM",
    icon: Gauge,
  },
  oscilloscope: {
    accent: "#22C55E",
    accentBg: "#DCFCE7",
    tag: "OSC",
    icon: Activity,
  },
  location: {
    accent: "#06B6D4",
    accentBg: "#CFFAFE",
    tag: "LOC",
    icon: MapPin,
  },
  schematic: {
    accent: "#8B5CF6",
    accentBg: "#EDE9FE",
    tag: "WDG",
    icon: GitBranch,
  },
};

function LabCard({
  labId,
  labIndex,
  unlocked,
  active,
  onClick,
}: {
  labId: DemoLabId;
  labIndex: number;
  unlocked: boolean;
  active: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const meta = LAB_META[labId];
  const Icon = meta.icon;
  const hubLabs = t("simulator.hub.labs", { returnObjects: true }) as {
    name: string;
  }[];
  const label = hubLabs[labIndex]?.name ?? labId;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      data-testid={`demo-lab-${labId}`}
      whileHover={prefersReduced ? undefined : { y: -5 }}
      whileTap={prefersReduced ? undefined : { scale: 0.99 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={[
        "group relative w-full overflow-hidden rounded-[24px] border p-5 text-start transition-all duration-300",
        active && unlocked
          ? "border-[#F47822]/55 bg-[#FFF5EE] shadow-[0_20px_48px_rgba(244,120,34,0.14)]"
          : unlocked
            ? "border-[#3A3A3A]/10 bg-white shadow-[0_8px_24px_rgba(39,32,25,0.04)] hover:border-[#F47822]/35 hover:bg-[#FFFDFC] hover:shadow-[0_18px_42px_rgba(39,32,25,0.08)]"
            : "border-[#3A3A3A]/8 bg-[#FAF9F7] hover:border-[#3A3A3A]/16",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
        style={{
          background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)`,
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <span
          className="grid h-12 w-12 place-items-center rounded-2xl ring-1 ring-black/[0.04]"
          style={{ background: `${meta.accent}18`, color: meta.accent }}
        >
          <Icon className="h-5 w-5" />
        </span>

        <div className="flex items-center gap-2">
          {unlocked ? (
            <span className="rounded-full border border-emerald-600/15 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
              {labId === "scanner"
                ? t("demo.labs.free")
                : t("demo.labs.unlocked")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#3A3A3A]/10 bg-[#F3F1EE] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#3A3A3A]/50">
              <Lock className="h-3 w-3" />
              {t("demo.labs.locked")}
            </span>
          )}
          <span className="font-mono text-[10px] font-bold text-[#3A3A3A]/28">
            {String(labIndex + 1).padStart(2, "0")}
          </span>
        </div>
      </div>

      <p className="mt-5 flex items-center gap-2 text-[15px] font-black text-[#292929]">
        {label}
        <span className="rounded-md border border-[#3A3A3A]/8 bg-[#F6F4F1] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#3A3A3A]/45">
          {meta.tag}
        </span>
      </p>
      <p className="mt-1.5 min-h-10 text-[11px] leading-5 text-[#3A3A3A]/58">
        {t(`simulator.hub.labDescs.${labId}`, { defaultValue: "" })}
      </p>

      <span
        className={[
          "mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold transition-colors",
          unlocked
            ? "text-[#C95F12] group-hover:text-[#F47822]"
            : "text-[#3A3A3A]/38",
        ].join(" ")}
      >
        {unlocked ? t("demo.labs.enter") : t("demo.labs.unlock")}
        <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
      </span>

      {active && unlocked && (
        <motion.span
          layoutId="demo-active-lab"
          className="absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-[#F47822]"
          aria-hidden="true"
        />
      )}
    </motion.button>
  );
}

function ScenarioWorkspace({
  scenarioIndex,
  onLockedStep,
}: {
  scenarioIndex: number;
  onLockedStep: () => void;
}) {
  const { t } = useTranslation();
  const scenario = DEMO_SCENARIOS[scenarioIndex];
  const stage = readDemoStage();
  const [stepIndex, setStepIndex] = useState(() => {
    for (let i = 0; i < scenario.steps.length; i += 1) {
      if (isDemoStepUnlocked(scenarioIndex, i)) return i;
    }
    return 0;
  });
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [finding, setFinding] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const maxUnlocked = useMemo(() => {
    let last = -1;
    for (let i = 0; i < scenario.steps.length; i += 1) {
      if (isDemoStepUnlocked(scenarioIndex, i)) last = i;
    }
    return last;
  }, [scenarioIndex, scenario.steps.length]);

  const step = scenario.steps[stepIndex];
  const canGoNext = stepIndex < scenario.steps.length - 1;
  const canGoPrev = stepIndex > 0;

  const goNext = () => {
    if (!canGoNext) return;
    if (!isDemoStepUnlocked(scenarioIndex, stepIndex + 1)) {
      onLockedStep();
      return;
    }
    setStepIndex(stepIndex + 1);
    setFinding("");
    setNote(null);
  };

  const record = () => {
    if (!finding.trim()) return;
    setAnswered((prev) => new Set(prev).add(step.id));
    setNote(t("demo.scenarios.recorded"));
    if (stepIndex < maxUnlocked) {
      setStepIndex(stepIndex + 1);
      setFinding("");
      setNote(null);
    }
  };

  if (!step) {
    return (
      <div className="rounded-[24px] border border-[#3A3A3A]/10 bg-white p-6 text-sm text-[#3A3A3A]/60 shadow-[0_12px_30px_rgba(39,32,25,0.05)]">
        {t("demo.scenarios.noSteps")}
      </div>
    );
  }

  return (
    <div
      data-testid="demo-scenario-workspace"
      className="overflow-hidden rounded-[26px] border border-[#3A3A3A]/10 bg-white shadow-[0_24px_70px_rgba(39,32,25,0.10)]"
    >
      <header className="relative overflow-hidden border-b border-[#3A3A3A]/8 bg-[#FFFDFC] px-5 py-4 sm:px-6">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#F47822]/[0.12] via-transparent to-transparent"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F47822]" />
              {t("demo.scenarios.workstation")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-[#292929]">
                {scenario.title}
              </h3>
              <span className="rounded-full border border-[#F47822]/25 bg-[#FFF1E6] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#C95F12]">
                {scenario.faultCodes.join(", ")}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#3A3A3A]/55">
              {scenario.vehicle} · {scenario.complaint}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/15 bg-emerald-50 px-3 py-1 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {t("demo.scenarios.open")}
          </span>
        </div>
      </header>

      <div className="flex items-center gap-2 overflow-x-auto border-b border-black/5 bg-[#F7F5F1] px-4 py-3">
        {scenario.steps.map((s, i) => {
          const unlocked = isDemoStepUnlocked(scenarioIndex, i);
          const done = answered.has(s.id);
          const active = i === stepIndex;
          return (
            <button
              key={s.id}
              type="button"
              data-testid={`demo-step-${i}`}
              onClick={() => {
                if (!unlocked) {
                  onLockedStep();
                  return;
                }
                setStepIndex(i);
                setFinding("");
                setNote(null);
              }}
              className="flex shrink-0 items-center gap-2"
            >
              <span
                className={[
                  "grid h-8 w-8 place-items-center rounded-full border text-xs font-black transition",
                  done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : !unlocked
                      ? "border-[#3A3A3A]/10 bg-[#EBE8E2] text-[#3A3A3A]/30"
                      : active
                        ? "border-[#F47822] bg-[#F47822] text-white shadow-[0_0_0_4px_rgba(244,120,34,0.14)]"
                        : "border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/40",
                ].join(" ")}
              >
                {!unlocked ? (
                  <Lock className="h-3 w-3" />
                ) : done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={[
                  "hidden max-w-[140px] truncate text-xs font-bold xl:block",
                  active ? "text-[#3A3A3A]" : "text-[#3A3A3A]/45",
                ].join(" ")}
              >
                {unlocked ? s.title : t("demo.scenarios.lockedStep")}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="grid gap-4 bg-[#F7F5F1] p-5 text-[#3A3A3A] lg:grid-cols-[minmax(0,1fr)_240px]"
        >
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40">
              {t("demo.scenarios.step")} {stepIndex + 1} /{" "}
              {scenario.steps.length}
            </p>
            <h4 className="mt-1 text-base font-black">{step.title}</h4>
            <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/60">
              {step.description}
            </p>

            <label className="mt-4 block text-xs font-semibold text-[#3A3A3A]/65">
              {t("demo.scenarios.finding")}
              <textarea
                value={finding}
                onChange={(event) => setFinding(event.target.value)}
                placeholder={step.findingPlaceholder}
                rows={3}
                data-testid="demo-finding"
                className="mt-1.5 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/10"
              />
            </label>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() => {
                  setStepIndex(stepIndex - 1);
                  setFinding("");
                  setNote(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-4 py-2.5 text-xs font-bold text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822] disabled:opacity-40"
              >
                <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                {t("demo.scenarios.prev")}
              </button>
              <button
                type="button"
                onClick={record}
                disabled={!finding.trim()}
                data-testid="demo-record"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#e96916] disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("demo.scenarios.record")}
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                data-testid="demo-next-step"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#F47822]/30 bg-[#F47822]/10 px-4 py-2.5 text-xs font-bold text-[#F47822] transition hover:bg-[#F47822] hover:text-white disabled:opacity-40"
              >
                {t("demo.scenarios.next")}
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </button>
            </div>
            {note && (
              <p
                role="status"
                className="mt-3 text-xs font-semibold text-emerald-700"
              >
                {note}
              </p>
            )}
          </div>

          <aside className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40">
              {t("demo.scenarios.complaint")}
            </p>
            <p className="mt-2 text-sm font-semibold leading-5 text-[#3A3A3A]">
              {scenario.complaint}
            </p>
            <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40">
              {t("demo.scenarios.tool")}
            </p>
            <p className="mt-1 rounded-lg bg-[#F47822]/10 px-2.5 py-1.5 font-mono text-xs font-bold uppercase text-[#F47822]">
              {step.tool}
            </p>
            {stage === 0 && (
              <p className="mt-4 rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] leading-4 text-amber-700">
                {t("demo.scenarios.stepHint")}
              </p>
            )}
          </aside>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function DemoExperiencePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const prefersReduced = useReducedMotion();

  // jsdom (and very old browsers) have no IntersectionObserver, so skip the
  // scroll-triggered entrance and render sections in their final state.
  const reveal: MotionProps =
    typeof IntersectionObserver === "undefined"
      ? {}
      : {
          initial: prefersReduced ? false : { opacity: 0, y: 28 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "0px 0px -60px 0px" },
          transition: { duration: 0.6, ease: "easeOut" },
        };

  usePageMeta({
    title: t("demo.hero.title"),
    description: t("demo.hero.desc"),
    canonicalPath: "/demo",
  });

  const [stage, setStage] = useState(() => readDemoStage());
  const [activeLab, setActiveLab] = useState<DemoLabId | null>("scanner");
  const [activeScenario, setActiveScenario] = useState<number | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  useEffect(() => {
    if (user) {
      bumpDemoStageForAuth();
      setStage(readDemoStage());
    }
  }, [user]);

  const handleLocked = useCallback(() => {
    if (readDemoStage() === 0) {
      setRegisterOpen(true);
      return;
    }
    void navigate("/pricing");
  }, [navigate]);

  const openLab = (labId: DemoLabId) => {
    if (!isDemoLabUnlocked(labId)) {
      handleLocked();
      return;
    }
    setActiveLab(labId);
    setActiveScenario(null);
    document
      .getElementById("demo-simulator-bench")
      ?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  const openScenario = (index: number) => {
    if (!isDemoScenarioUnlocked(index)) {
      handleLocked();
      return;
    }
    setActiveLab(null);
    setActiveScenario(index);
    document
      .getElementById("demo-diagnostics-bench")
      ?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  const unlockedLabCount = DEMO_LABS.filter((id) =>
    isDemoLabUnlocked(id),
  ).length;

  return (
    <main
      className="min-h-screen bg-[#F7F7F7] text-[#292929]"
      data-testid="demo-page"
    >
      <DemoRegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
      />

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(244,120,34,0.16),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(34,211,238,0.10),transparent_28%),radial-gradient(circle_at_50%_120%,rgba(244,120,34,0.08),transparent_45%)]" />
          <div className="absolute inset-0 opacity-[0.42] [background-image:linear-gradient(to_right,#d9d9d9_1px,transparent_1px),linear-gradient(to_bottom,#d9d9d9_1px,transparent_1px)] [background-size:64px_64px]" />
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#F47822]/15 blur-[120px] motion-safe:animate-[hbt-glow_9s_ease-in-out_infinite]" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-[130px] motion-safe:animate-[hbt-glow_11s_ease-in-out_infinite] [animation-delay:1.5s]" />
        </div>

        <div className="relative mx-auto max-w-[1240px] px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-16">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#F47822]/25 bg-[#F47822]/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#C95F12]">
                  <FlaskConical className="h-3.5 w-3.5" />
                  {t("demo.hero.eyebrow")}
                </span>
                <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/50">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70 motion-reduce:hidden" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  {t("demo.hero.guestMode")}
                </span>
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.045em] text-[#292929] sm:text-5xl lg:text-6xl">
                {t("demo.hero.titleA")}{" "}
                <span className="bg-gradient-to-r from-[#F47822] via-[#FFB37A] to-[#F47822] bg-clip-text text-transparent">
                  {t("demo.hero.titleHighlight")}
                </span>{" "}
                {t("demo.hero.titleB")}
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-[#3A3A3A]/65 sm:text-base">
                {t("demo.hero.desc")}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {user ? (
                  <Link
                    to="/simulator"
                    className="group inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-6 py-3.5 text-sm font-black text-white shadow-[0_16px_50px_rgba(244,120,34,0.3)] transition hover:-translate-y-0.5 hover:bg-[#e96916]"
                  >
                    {t("demo.labs.enter")}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
                  </Link>
                ) : (
                  <Link
                    to="/register?next=%2Fdemo"
                    className="group inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-6 py-3.5 text-sm font-black text-white shadow-[0_16px_50px_rgba(244,120,34,0.3)] transition hover:-translate-y-0.5 hover:bg-[#e96916]"
                  >
                    {t("demo.hero.registerCta")}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
                  </Link>
                )}
                <a
                  href="#demo-simulator"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#3A3A3A]/12 bg-white px-6 py-3.5 text-sm font-black text-[#3A3A3A]/80 shadow-[0_8px_22px_rgba(39,32,25,0.05)] transition hover:-translate-y-0.5 hover:border-[#F47822]/35 hover:bg-[#FFF9F5] hover:text-[#F47822]"
                >
                  <MonitorPlay className="h-4 w-4 text-[#F47822]" />
                  {t("demo.hero.exploreBench")}
                </a>
              </div>

              <div className="mt-10 grid max-w-lg grid-cols-3 gap-3 border-t border-[#3A3A3A]/10 pt-6">
                {[
                  { value: "05", label: t("demo.labs.title") },
                  { value: "04", label: t("demo.scenarios.title") },
                  { value: "24/7", label: t("demo.mentor.eyebrow") },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="font-mono text-2xl font-black tracking-tight text-[#292929]">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/48">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              aria-hidden="true"
              initial={
                prefersReduced ? false : { opacity: 0, y: 30, scale: 0.97 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.8,
                delay: 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative mx-auto w-full max-w-[540px]"
            >
              <div className="absolute -inset-10 rounded-full bg-[#F47822]/10 blur-[90px]" />
              <div
                className="relative rounded-[30px] border border-[#3A3A3A]/10 bg-white/90 p-2.5 shadow-[0_32px_90px_rgba(39,32,25,0.15)] backdrop-blur"
                dir="ltr"
              >
                <div className="overflow-hidden rounded-[22px] border border-[#3A3A3A]/10 bg-[#F6F8FA]">
                  <div className="flex items-center justify-between border-b border-[#3A3A3A]/8 bg-white px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-400/80" />
                      <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                      <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                      <span className="ms-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#3A3A3A]/45">
                        HBT / diagnostic console
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/15 bg-emerald-50 px-2.5 py-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      live
                    </span>
                  </div>

                  <div className="relative overflow-hidden p-4 sm:p-5">
                    <span className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#F47822]/12 to-transparent blur-sm motion-safe:animate-[hbt-scan_6s_ease-in-out_infinite]" />
                    <span className="pointer-events-none absolute inset-0 opacity-[0.55] [background-image:linear-gradient(to_right,rgba(58,58,58,.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(58,58,58,.045)_1px,transparent_1px)] [background-size:28px_28px]" />

                    <div className="relative rounded-2xl border border-[#3A3A3A]/8 bg-white p-4 shadow-[0_8px_20px_rgba(39,32,25,0.04)]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/42">
                          Ignition / channel 1
                        </span>
                        <span className="font-mono text-[9px] font-bold text-[#C95F12]">
                          2.4 ms
                        </span>
                      </div>
                      <svg viewBox="0 0 320 86" className="mt-2 h-20 w-full">
                        <defs>
                          <linearGradient id="demo-wave" x1="0" x2="1">
                            <stop
                              offset="0%"
                              stopColor="#F47822"
                              stopOpacity="0.2"
                            />
                            <stop offset="45%" stopColor="#F47822" />
                            <stop offset="100%" stopColor="#22D3EE" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0 58 H34 L44 20 L54 72 L64 34 L74 58 H112 L122 16 L132 74 L142 30 L152 58 H196 L206 22 L216 70 L226 36 L236 58 H320"
                          fill="none"
                          stroke="url(#demo-wave)"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="8 5"
                          className="motion-safe:animate-[hbt-dash_9s_linear_infinite]"
                        />
                      </svg>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        {
                          label: "Battery",
                          value: "12.6 V",
                          tone: "text-emerald-700",
                        },
                        { label: "RPM", value: "842", tone: "text-[#292929]" },
                        {
                          label: "Coolant",
                          value: "91 °C",
                          tone: "text-[#C95F12]",
                        },
                        {
                          label: "Status",
                          value: "Ready",
                          tone: "text-emerald-700",
                        },
                      ].map((readout) => (
                        <div
                          key={readout.label}
                          className="rounded-xl border border-[#3A3A3A]/8 bg-[#FAFBFC] px-3 py-2"
                        >
                          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/38">
                            {readout.label}
                          </p>
                          <p
                            className={`mt-1 font-mono text-xs font-black ${readout.tone}`}
                          >
                            {readout.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/38">
                        DTC
                      </span>
                      {["P0301", "P0171", "C0035"].map((code) => (
                        <span
                          key={code}
                          className="rounded-md border border-[#F47822]/20 bg-[#FFF1E6] px-2 py-1 font-mono text-[9px] font-bold text-[#C95F12]"
                        >
                          {code}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#3A3A3A]/8 pt-3">
                      <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/38">
                        System scan
                      </span>
                      <div className="flex items-center gap-1">
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((bar) => (
                          <span
                            key={bar}
                            className="h-3 w-1.5 rounded-full bg-[#F47822]/70"
                            style={{ opacity: 0.25 + bar * 0.1 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -end-3 top-14 hidden rotate-3 rounded-xl border border-[#F47822]/30 bg-white px-3 py-2 shadow-[0_12px_30px_rgba(39,32,25,0.14)] sm:-end-6 sm:block">
                <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#C95F12]">
                  {t("demo.hero.available")}
                </p>
                <p className="mt-0.5 text-xs font-black text-[#292929]">
                  {t("demo.hero.unlockedLabs", {
                    count: unlockedLabCount,
                    total: DEMO_LABS.length,
                  })}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-[1240px] space-y-20 px-5 py-16 sm:px-8 sm:py-20">
        {/* Simulator labs */}
        <motion.section
          id="demo-simulator"
          aria-labelledby="demo-simulator-title"
          {...reveal}
        >
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
                <span className="h-px w-8 bg-[#F47822]" />
                01 / {t("demo.labs.eyebrow")}
              </p>
              <h2
                id="demo-simulator-title"
                className="mt-3 text-3xl font-black tracking-tight text-[#292929] sm:text-4xl"
              >
                {t("demo.labs.title")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3A3A3A]/62">
                {t("demo.labs.desc")}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#3A3A3A]/10 bg-white px-4 py-2 text-xs font-bold text-[#3A3A3A]/65 shadow-[0_8px_22px_rgba(39,32,25,0.04)]">
              <Trophy className="h-3.5 w-3.5 text-[#F47822]" />
              {t("demo.hero.unlockedLabs", {
                count: unlockedLabCount,
                total: DEMO_LABS.length,
              })}
            </span>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {DEMO_LABS.map((labId, labIndex) => (
              <LabCard
                key={labId}
                labId={labId}
                labIndex={labIndex}
                unlocked={isDemoLabUnlocked(labId)}
                active={activeLab === labId}
                onClick={() => openLab(labId)}
              />
            ))}
          </div>

          {(activeLab || (!activeLab && activeScenario === null)) && (
            <div id="demo-simulator-bench" className="mt-8 scroll-mt-28">
              <div className="rounded-[30px] border border-[#3A3A3A]/10 bg-white p-2 shadow-[0_24px_70px_rgba(39,32,25,0.10)]">
                <div className="overflow-hidden rounded-[24px] border border-[#3A3A3A]/8 bg-[#FCFBF9]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3A3A3A]/8 bg-white px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-400/70" />
                        <span className="h-2 w-2 rounded-full bg-amber-400/70" />
                        <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
                      </span>
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#3A3A3A]/45">
                        HBT / live workbench
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/45">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" />
                      {t("demo.labs.consoleReady")}
                    </span>
                  </div>

                  <div className="bg-[#F6F4F0] p-3 sm:p-5">
                    <AnimatePresence mode="wait" initial={false}>
                      {activeLab === "scanner" && (
                        <motion.div
                          key="scanner"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-black uppercase tracking-wide text-[#3A3A3A]/45">
                              {t("demo.labs.scannerBench")}
                            </p>
                            <span className="rounded-full bg-[#F47822]/10 px-3 py-1 text-[11px] font-bold text-[#F47822]">
                              {t("demo.labs.oneVehicle")}
                            </span>
                          </div>
                          <ScannerLabFull sessionId={null} demo />
                        </motion.div>
                      )}

                      {activeLab === "schematic" && (
                        <motion.div
                          key="schematic"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-black uppercase tracking-wide text-[#3A3A3A]/45">
                              {t("demo.labs.schematicBench")}
                            </p>
                            <span className="rounded-full bg-[#8B5CF6]/10 px-3 py-1 text-[11px] font-bold text-[#8B5CF6]">
                              {t("demo.labs.registeredUnlock")}
                            </span>
                          </div>
                          <SchematicLabFull sessionId={null} />
                        </motion.div>
                      )}

                      {activeLab && !isDemoLabUnlocked(activeLab) && (
                        <motion.div
                          key="locked"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.25 }}
                          className="rounded-[22px] border border-dashed border-[#F47822]/40 bg-white p-8 text-center"
                        >
                          <Lock className="mx-auto h-8 w-8 text-[#F47822]" />
                          <p className="mt-3 text-sm font-bold text-[#3A3A3A]">
                            {t("demo.labs.lockedTitle")}
                          </p>
                          <button
                            type="button"
                            onClick={handleLocked}
                            className="mt-4 rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-black text-white transition hover:bg-[#e96916]"
                          >
                            {stage === 0
                              ? t("demo.labs.registerUnlock")
                              : t("demo.labs.seePricing")}
                          </button>
                        </motion.div>
                      )}

                      {!activeLab && (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="rounded-[22px] border border-dashed border-[#3A3A3A]/15 bg-white p-8 text-center text-sm text-[#3A3A3A]/50"
                        >
                          {t("demo.labs.pickLab")}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.section>

        {/* Diagnostics scenarios */}
        <motion.section
          id="demo-diagnostics"
          aria-labelledby="demo-diagnostics-title"
          {...reveal}
        >
          <div>
            <p className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
              <span className="h-px w-8 bg-[#F47822]" />
              02 / {t("demo.scenarios.eyebrow")}
            </p>
            <h2
              id="demo-diagnostics-title"
              className="mt-3 text-3xl font-black tracking-tight text-[#292929] sm:text-4xl"
            >
              {t("demo.scenarios.title")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3A3A3A]/62">
              {t("demo.scenarios.desc")}
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DEMO_SCENARIOS.map((scenario, index) => {
              const unlocked = isDemoScenarioUnlocked(index);
              return (
                <motion.button
                  key={scenario.id}
                  type="button"
                  data-testid={`demo-scenario-${index}`}
                  onClick={() => openScenario(index)}
                  whileHover={prefersReduced ? undefined : { y: -5 }}
                  whileTap={prefersReduced ? undefined : { scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  className={[
                    "group relative overflow-hidden rounded-[24px] border p-5 text-start transition-all duration-300",
                    unlocked
                      ? "border-[#3A3A3A]/10 bg-white shadow-[0_8px_24px_rgba(39,32,25,0.04)] hover:border-[#F47822]/35 hover:bg-[#FFFDFC] hover:shadow-[0_18px_42px_rgba(39,32,25,0.08)]"
                      : "border-[#3A3A3A]/8 bg-[#FAF9F7] hover:border-[#3A3A3A]/16",
                  ].join(" ")}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F47822]/60 to-transparent"
                  />
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#F47822]/20 bg-[#F47822]/10 text-[#F47822]">
                      <Wrench className="h-4.5 w-4.5" />
                    </span>
                    <span className="font-mono text-[10px] font-bold text-[#3A3A3A]/28">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-4 flex flex-wrap items-center gap-2 text-sm font-black text-[#292929]">
                    {scenario.title}
                    <span className="rounded-full border border-[#F47822]/18 bg-[#FFF1E6] px-2 py-0.5 font-mono text-[9px] font-bold text-[#C95F12]">
                      {scenario.faultCodes.join(", ")}
                    </span>
                  </p>
                  <p className="mt-1.5 min-h-10 text-[11px] leading-5 text-[#3A3A3A]/58">
                    {scenario.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={[
                        "inline-flex items-center gap-1.5 text-[11px] font-bold",
                        unlocked ? "text-[#C95F12]" : "text-[#3A3A3A]/38",
                      ].join(" ")}
                    >
                      {unlocked
                        ? t("demo.scenarios.enter")
                        : t("demo.scenarios.unlock")}
                      <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                    </span>
                    {unlocked ? (
                      <span className="rounded-full border border-emerald-600/15 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">
                        {t("demo.scenarios.open")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#3A3A3A]/10 bg-[#F3F1EE] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#3A3A3A]/50">
                        <Lock className="h-3 w-3" />
                        {t("demo.scenarios.locked")}
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div id="demo-diagnostics-bench" className="mt-8 scroll-mt-28">
            <AnimatePresence mode="wait" initial={false}>
              {activeScenario !== null && (
                <motion.div
                  key={`${activeScenario}-${stage}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <ScenarioWorkspace
                    scenarioIndex={activeScenario}
                    onLockedStep={handleLocked}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* AI mentor teaser */}
        <motion.section
          id="demo-mentor"
          aria-labelledby="demo-mentor-title"
          {...reveal}
          className="relative overflow-hidden rounded-[32px] border border-[#3A3A3A]/10 bg-[linear-gradient(135deg,#FFF8F2_0%,#FFFFFF_48%,#F2FAFB_100%)] p-6 shadow-[0_24px_70px_rgba(39,32,25,0.08)] sm:p-10"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#F47822]/20 blur-[90px]" />
            <div className="absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-cyan-400/10 blur-[100px]" />
            <div className="absolute inset-0 opacity-[0.38] [background-image:linear-gradient(to_right,#d9d9d9_1px,transparent_1px),linear-gradient(to_bottom,#d9d9d9_1px,transparent_1px)] [background-size:48px_48px]" />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
                <span className="h-px w-8 bg-[#F47822]" />
                03 / {t("demo.mentor.eyebrow")}
              </p>
              <h2
                id="demo-mentor-title"
                className="mt-3 text-3xl font-black tracking-tight text-[#292929] sm:text-4xl"
              >
                {t("demo.mentor.title")}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#3A3A3A]/65">
                {t("demo.mentor.desc")}
              </p>
              <ul className="mt-5 space-y-3">
                {[
                  t("demo.mentor.point1"),
                  t("demo.mentor.point2"),
                  t("demo.mentor.point3"),
                ].map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 text-sm text-[#3A3A3A]/72"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[#F47822]/25 bg-[#F47822]/10">
                      <Sparkles className="h-3 w-3 text-[#F47822]" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[24px] border border-[#3A3A3A]/10 bg-white/85 p-3 shadow-[0_20px_55px_rgba(39,32,25,0.10)] backdrop-blur">
              <div className="rounded-[18px] border border-[#3A3A3A]/8 bg-[#FCFBF9] p-4">
                <div className="flex items-center justify-between border-b border-[#3A3A3A]/8 pb-3">
                  <span className="inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/48">
                    <BrainCircuit className="h-3.5 w-3.5 text-[#F47822]" />
                    {t("demo.mentorPage.showcase.windowTitle")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" />
                    {t("demo.mentorPage.showcase.mentorLabel")}
                  </span>
                </div>

                <div className="mt-4 flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-ee-sm bg-[#F47822] px-4 py-2.5 text-[11px] leading-5 text-white">
                    {t("demo.mentorPage.showcase.turns.hint.q")}
                  </p>
                </div>
                <div className="mt-3 flex justify-start">
                  <div className="max-w-[92%] rounded-2xl rounded-es-sm border border-[#3A3A3A]/8 bg-white px-4 py-3 text-[11px] leading-5 text-[#3A3A3A]/70 shadow-sm">
                    <span className="mb-1.5 inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-amber-700">
                      {t("demo.mentorPage.showcase.kinds.hint")}
                    </span>
                    <p className="line-clamp-3">
                      {t("demo.mentorPage.showcase.turns.hint.a")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <Link
                  to="/ai-mentor/intro"
                  data-testid="demo-mentor-intro"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-black text-white transition hover:bg-[#e96916]"
                >
                  {t("demo.mentor.learnMore")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setRegisterOpen(true)}
                  data-testid="demo-mentor-register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#3A3A3A]/12 bg-white px-5 py-3 text-sm font-black text-[#3A3A3A]/75 shadow-sm transition hover:border-[#F47822]/35 hover:bg-[#FFF9F5] hover:text-[#F47822]"
                >
                  <Lock className="h-4 w-4" />
                  {t("demo.mentor.registerToken")}
                </button>
                <p className="text-center text-[10px] text-[#3A3A3A]/45">
                  {t("demo.mentor.tokenNote")}
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
