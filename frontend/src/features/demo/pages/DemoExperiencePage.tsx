import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
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
  X,
} from "lucide-react";

import { useAuth } from "@/features/auth/hooks/useAuth";
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
  setDemoStage,
  type DemoLabId,
} from "../demo.state";

const LAB_META: Record<
  DemoLabId,
  { accent: string; accentBg: string; tag: string; icon: typeof ScanSearch }
> = {
  scanner: { accent: "#F47822", accentBg: "#FFF1E6", tag: "SCN", icon: ScanSearch },
  multimeter: { accent: "#EAB308", accentBg: "#FEF9C3", tag: "DMM", icon: Gauge },
  oscilloscope: { accent: "#22C55E", accentBg: "#DCFCE7", tag: "OSC", icon: Activity },
  location: { accent: "#06B6D4", accentBg: "#CFFAFE", tag: "LOC", icon: MapPin },
  schematic: { accent: "#8B5CF6", accentBg: "#EDE9FE", tag: "WDG", icon: GitBranch },
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
  const meta = LAB_META[labId];
  const Icon = meta.icon;
  const hubLabs = t("simulator.hub.labs", { returnObjects: true }) as { name: string }[];
  const label = hubLabs[labIndex]?.name ?? labId;

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`demo-lab-${labId}`}
      aria-disabled={!unlocked}
      className={[
        "group relative w-full overflow-hidden rounded-[22px] border bg-white p-5 text-start transition-all dark:bg-[#1b1b20]",
        unlocked
          ? "border-[#3A3A3A]/10 hover:-translate-y-0.5 hover:border-[#F47822]/40 hover:shadow-[0_12px_28px_rgba(244,120,34,.12)] dark:border-white/10"
          : "border-[#3A3A3A]/10 opacity-95 dark:border-white/10",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid h-11 w-11 place-items-center rounded-2xl"
          style={{ background: meta.accentBg, color: meta.accent }}
        >
          <Icon className="h-5 w-5" />
        </span>
        {unlocked ? (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {t("demo.labs.free")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#3A3A3A]/[.06] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#3A3A3A]/50 dark:bg-white/[0.07] dark:text-white/50">
            <Lock className="h-3 w-3" />
            {t("demo.labs.locked")}
          </span>
        )}
      </div>
      <p className="mt-4 flex items-center gap-2 text-base font-black text-[#3A3A3A] dark:text-white">
        {label}
        <span className="rounded-md bg-[#3A3A3A]/[.06] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#3A3A3A]/40 dark:bg-white/[0.07] dark:text-white/40">
          {meta.tag}
        </span>
      </p>
      <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">
        {t(`simulator.hub.labDescs.${labId}`, { defaultValue: "" })}
      </p>
      <span
        className={[
          "mt-4 inline-flex items-center gap-1 text-xs font-bold",
          unlocked ? "text-[#F47822]" : "text-[#3A3A3A]/40 dark:text-white/40",
        ].join(" ")}
      >
        {unlocked ? t("demo.labs.enter") : t("demo.labs.unlock")}
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
      </span>
      {active && unlocked && (
        <span className="absolute inset-x-0 bottom-0 h-1 bg-[#F47822]" aria-hidden />
      )}
    </button>
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
  }, [scenarioIndex, stage, scenario.steps.length]);

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
      <div className="rounded-[24px] border border-[#3A3A3A]/10 bg-white p-6 text-sm text-[#3A3A3A]/60 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/60">
        {t("demo.scenarios.noSteps")}
      </div>
    );
  }

  return (
    <div
      data-testid="demo-scenario-workspace"
      className="overflow-hidden rounded-[24px] border border-[#3A3A3A]/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#1b1b20]"
    >
      <header className="border-b border-[#3A3A3A]/8 px-5 py-4 dark:border-white/8">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
          {t("demo.scenarios.workstation")}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-black text-[#3A3A3A] dark:text-white">{scenario.title}</h3>
          <span className="rounded-full bg-[#F47822]/10 px-2 py-0.5 font-mono text-[11px] font-bold text-[#F47822]">
            {scenario.faultCodes.join(", ")}
          </span>
        </div>
        <p className="mt-1 text-xs text-[#3A3A3A]/50 dark:text-white/50">
          {scenario.vehicle} · {scenario.complaint}
        </p>
      </header>

      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#3A3A3A]/8 px-4 py-3 dark:border-white/8">
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
                  "grid h-8 w-8 place-items-center rounded-full border text-xs font-black",
                  done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : !unlocked
                      ? "border-[#3A3A3A]/10 bg-[#F3F3F3] text-[#3A3A3A]/30 dark:border-white/10 dark:bg-white/[0.04]"
                      : active
                        ? "border-[#F47822] bg-[#F47822] text-white shadow-[0_0_0_4px_rgba(244,120,34,0.12)]"
                        : "border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/40 dark:border-white/10 dark:bg-[#1b1b20]",
                ].join(" ")}
              >
                {!unlocked ? <Lock className="h-3 w-3" /> : done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={[
                  "hidden max-w-[140px] truncate text-xs font-bold xl:block",
                  active ? "text-[#3A3A3A] dark:text-white" : "text-[#3A3A3A]/45 dark:text-white/45",
                ].join(" ")}
              >
                {unlocked ? s.title : t("demo.scenarios.lockedStep")}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
            {t("demo.scenarios.step")} {stepIndex + 1} / {scenario.steps.length}
          </p>
          <h4 className="mt-1 text-base font-black text-[#3A3A3A] dark:text-white">{step.title}</h4>
          <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/60 dark:text-white/60">{step.description}</p>

          <label className="mt-4 block text-xs font-semibold text-[#3A3A3A]/65 dark:text-white/65">
            {t("demo.scenarios.finding")}
            <textarea
              value={finding}
              onChange={(event) => setFinding(event.target.value)}
              placeholder={step.findingPlaceholder}
              rows={3}
              data-testid="demo-finding"
              className="mt-1.5 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 py-2.5 text-sm outline-none transition focus:border-[#F47822] dark:border-white/10 dark:bg-[#232329] dark:text-white"
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-4 py-2.5 text-xs font-bold text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822] disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70"
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
            <p role="status" className="mt-3 text-xs font-semibold text-emerald-600">
              {note}
            </p>
          )}
        </div>

        <aside className="rounded-2xl border border-[#3A3A3A]/8 bg-[#FCFCFC] p-4 dark:border-white/8 dark:bg-white/[0.03]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
            {t("demo.scenarios.complaint")}
          </p>
          <p className="mt-2 text-sm font-semibold leading-5 text-[#3A3A3A] dark:text-white">{scenario.complaint}</p>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
            {t("demo.scenarios.tool")}
          </p>
          <p className="mt-1 rounded-lg bg-[#F47822]/10 px-2.5 py-1.5 font-mono text-xs font-bold uppercase text-[#F47822]">
            {step.tool}
          </p>
          {stage === 0 && (
            <p className="mt-4 rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] leading-4 text-amber-700 dark:text-amber-300">
              {t("demo.scenarios.stepHint")}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

export function DemoExperiencePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const refreshStage = useCallback(() => setStage(readDemoStage()), []);

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
    document.getElementById("demo-simulator-bench")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  const openScenario = (index: number) => {
    if (!isDemoScenarioUnlocked(index)) {
      handleLocked();
      return;
    }
    setActiveLab(null);
    setActiveScenario(index);
    document.getElementById("demo-diagnostics-bench")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  const unlockedLabCount = DEMO_LABS.filter((id) => isDemoLabUnlocked(id)).length;

  return (
    <main className="min-h-screen bg-[#F3F3F3] dark:bg-[#101013]" data-testid="demo-page">
      <DemoRegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F47822]/[0.07] via-transparent to-[#3A3A3A]/[0.04]" aria-hidden />
        <div className="relative mx-auto max-w-[1200px] px-5 py-12 sm:px-8 sm:py-16">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#F47822]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#F47822]">
            <FlaskConical className="h-3.5 w-3.5" />
            {t("demo.hero.eyebrow")}
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-[#3A3A3A] sm:text-4xl dark:text-white">
            {t("demo.hero.title")}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#3A3A3A]/60 sm:text-base dark:text-white/60">
            {t("demo.hero.desc")}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#3A3A3A] px-4 py-2 text-xs font-bold text-white">
              <Trophy className="h-3.5 w-3.5 text-[#F47822]" />
              {t("demo.hero.unlockedLabs", { count: unlockedLabCount, total: DEMO_LABS.length })}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#3A3A3A]/10 bg-white px-4 py-2 text-xs font-bold text-[#3A3A3A]/70 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
              <MonitorPlay className="h-3.5 w-3.5 text-[#F47822]" />
              {stage === 0 ? t("demo.hero.guestMode") : t("demo.hero.registeredMode")}
            </span>
            {!user && (
              <Link
                to="/register?next=%2Fdemo"
                className="inline-flex items-center gap-2 rounded-full bg-[#F47822] px-5 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(244,120,34,.2)] transition hover:bg-[#e96916]"
              >
                {t("demo.hero.registerCta")}
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] space-y-12 px-5 py-10 sm:px-8">
        {/* Simulator labs */}
        <section id="demo-simulator" aria-labelledby="demo-simulator-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#F47822]">
                {t("demo.labs.eyebrow")}
              </p>
              <h2 id="demo-simulator-title" className="mt-1 text-2xl font-black text-[#3A3A3A] dark:text-white">
                {t("demo.labs.title")}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-[#3A3A3A]/55 dark:text-white/55">{t("demo.labs.desc")}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

          <div id="demo-simulator-bench" className="mt-6 scroll-mt-24">
            {activeLab === "scanner" && (
              <div className="rounded-[24px] border border-[#3A3A3A]/10 bg-[#F8F7F6] p-4 dark:border-white/10 dark:bg-white/[0.02] sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-wide text-[#3A3A3A]/45 dark:text-white/45">
                    {t("demo.labs.scannerBench")}
                  </p>
                  <span className="rounded-full bg-[#F47822]/10 px-3 py-1 text-[11px] font-bold text-[#F47822]">
                    {t("demo.labs.oneVehicle")}
                  </span>
                </div>
                <ScannerLabFull sessionId={null} demo />
              </div>
            )}
            {activeLab === "schematic" && (
              <div className="rounded-[24px] border border-[#3A3A3A]/10 bg-[#F8F7F6] p-4 dark:border-white/10 dark:bg-white/[0.02] sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-wide text-[#3A3A3A]/45 dark:text-white/45">
                    {t("demo.labs.schematicBench")}
                  </p>
                  <span className="rounded-full bg-[#8B5CF6]/10 px-3 py-1 text-[11px] font-bold text-[#8B5CF6]">
                    {t("demo.labs.registeredUnlock")}
                  </span>
                </div>
                <SchematicLabFull sessionId={null} />
              </div>
            )}
            {activeLab && !isDemoLabUnlocked(activeLab) && (
              <div className="rounded-[24px] border border-dashed border-[#F47822]/40 bg-white p-8 text-center dark:bg-[#1b1b20]">
                <Lock className="mx-auto h-8 w-8 text-[#F47822]" />
                <p className="mt-3 text-sm font-bold text-[#3A3A3A] dark:text-white">{t("demo.labs.lockedTitle")}</p>
                <button
                  type="button"
                  onClick={handleLocked}
                  className="mt-4 rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-black text-white"
                >
                  {stage === 0 ? t("demo.labs.registerUnlock") : t("demo.labs.seePricing")}
                </button>
              </div>
            )}
            {!activeLab && !activeScenario && (
              <div className="rounded-[24px] border border-dashed border-[#3A3A3A]/15 bg-white p-8 text-center text-sm text-[#3A3A3A]/50 dark:border-white/15 dark:bg-[#1b1b20] dark:text-white/50">
                {t("demo.labs.pickLab")}
              </div>
            )}
          </div>
        </section>

        {/* Diagnostics scenarios */}
        <section id="demo-diagnostics" aria-labelledby="demo-diagnostics-title">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#F47822]">
              {t("demo.scenarios.eyebrow")}
            </p>
            <h2 id="demo-diagnostics-title" className="mt-1 text-2xl font-black text-[#3A3A3A] dark:text-white">
              {t("demo.scenarios.title")}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-[#3A3A3A]/55 dark:text-white/55">{t("demo.scenarios.desc")}</p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DEMO_SCENARIOS.map((scenario, index) => {
              const unlocked = isDemoScenarioUnlocked(index);
              return (
                <button
                  key={scenario.id}
                  type="button"
                  data-testid={`demo-scenario-${index}`}
                  onClick={() => openScenario(index)}
                  className={[
                    "rounded-[22px] border bg-white p-5 text-start transition dark:bg-[#1b1b20]",
                    unlocked
                      ? "border-[#3A3A3A]/10 hover:-translate-y-0.5 hover:border-[#F47822]/40 dark:border-white/10"
                      : "border-[#3A3A3A]/10 dark:border-white/10",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                      <Wrench className="h-5 w-5" />
                    </span>
                    {unlocked ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                        {t("demo.scenarios.open")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#3A3A3A]/[.06] px-2 py-0.5 text-[10px] font-black uppercase text-[#3A3A3A]/50 dark:bg-white/[0.07] dark:text-white/50">
                        <Lock className="h-3 w-3" />
                        {t("demo.scenarios.locked")}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-black text-[#3A3A3A] dark:text-white">{scenario.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">{scenario.description}</p>
                  <span
                    className={[
                      "mt-3 inline-flex items-center gap-1 text-xs font-bold",
                      unlocked ? "text-[#F47822]" : "text-[#3A3A3A]/40 dark:text-white/40",
                    ].join(" ")}
                  >
                    {unlocked ? t("demo.scenarios.enter") : t("demo.scenarios.unlock")}
                    <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </span>
                </button>
              );
            })}
          </div>

          <div id="demo-diagnostics-bench" className="mt-6 scroll-mt-24">
            {activeScenario !== null && (
              <ScenarioWorkspace
                key={`${activeScenario}-${stage}`}
                scenarioIndex={activeScenario}
                onLockedStep={handleLocked}
              />
            )}
          </div>
        </section>

        {/* AI mentor teaser */}
        <section
          id="demo-mentor"
          aria-labelledby="demo-mentor-title"
          className="overflow-hidden rounded-[28px] border border-[#3A3A3A]/10 bg-[#3A3A3A] p-6 text-white sm:p-8 dark:border-white/10"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#F47822]">
                <BrainCircuit className="h-3.5 w-3.5" />
                {t("demo.mentor.eyebrow")}
              </p>
              <h2 id="demo-mentor-title" className="mt-2 text-2xl font-black">
                {t("demo.mentor.title")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/70">{t("demo.mentor.desc")}</p>
              <ul className="mt-4 space-y-2 text-sm text-white/80">
                {[
                  t("demo.mentor.point1"),
                  t("demo.mentor.point2"),
                  t("demo.mentor.point3"),
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#F47822]" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3 lg:min-w-[240px]">
              <Link
                to="/ai-mentor/intro"
                data-testid="demo-mentor-intro"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-black text-white transition hover:bg-[#e96916]"
              >
                {t("demo.mentor.learnMore")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <button
                type="button"
                onClick={() => setRegisterOpen(true)}
                data-testid="demo-mentor-register"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
              >
                <Lock className="h-4 w-4" />
                {t("demo.mentor.registerToken")}
              </button>
              <p className="text-center text-[11px] text-white/50">{t("demo.mentor.tokenNote")}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
