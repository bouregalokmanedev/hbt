import {
    Activity,
    ArrowRight,
    Award,
    Car,
    ChevronLeft,
    Clock3,
    Gauge,
    GitBranch,
    ListChecks,
    MapPin,
    ScanSearch,
    ShieldCheck,
    Target,
    Wrench,
    Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { getDiagnosticScenario, startDiagnosticAttempt } from "../api/diagnostics.api";
import type { DiagnosticScenarioDetail } from "../types/diagnostic.types";

const toolMetaKeys = [
    { icon: ScanSearch, key: "scanner" },
    { icon: Gauge, key: "multimeter" },
    { icon: Activity, key: "scope" },
    { icon: MapPin, key: "location" },
    { icon: GitBranch, key: "schematic" },
] as const;

const fadeUp = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
} as const;

function SectionCard({
    children,
    className = "",
    delay = 0,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-[24px] border border-[#3A3A3A]/10 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.08)] dark:border-white/10 dark:bg-[#1b1b20] ${className}`}
        >
            {children}
        </motion.section>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    hint,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    hint: string;
}) {
    return (
        <div className="group relative overflow-hidden rounded-[20px] border border-[#3A3A3A]/8 bg-[#FCFCFC] p-5 transition hover:border-[#F47822]/25 hover:shadow-[0_8px_20px_-12px_rgba(244,120,34,0.35)] dark:border-white/8 dark:bg-[#232329]">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[#F47822]/[0.06] blur-xl transition group-hover:bg-[#F47822]/[0.12]" />
            <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-[#F47822]/10">
                <Icon className="h-4.5 w-4.5 text-[#F47822]" />
            </div>
            <p className="relative mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#3A3A3A]/40 dark:text-white/40">
                {label}
            </p>
            <p className="relative mt-1 text-2xl font-black tabular-nums tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
                {value}
            </p>
            <p className="relative mt-0.5 text-[11px] leading-4 text-[#3A3A3A]/45 dark:text-white/45">
                {hint}
            </p>
        </div>
    );
}

function IntakeField({
    label,
    value,
    mono = false,
    tone = "default",
}: {
    label: string;
    value: string;
    mono?: boolean;
    tone?: "default" | "ok";
}) {
    const ok = tone === "ok";
    return (
        <div
            className={`rounded-2xl border p-3.5 ${
                ok
                    ? "border-emerald-200/80 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10"
                    : "border-[#3A3A3A]/8 bg-[#FCFCFC] dark:border-white/8 dark:bg-[#232329]"
            }`}
        >
            <p
                className={`text-[9px] font-black uppercase tracking-[0.14em] ${
                    ok
                        ? "text-emerald-700/70 dark:text-emerald-400/80"
                        : "text-[#3A3A3A]/40 dark:text-white/40"
                }`}
            >
                {label}
            </p>
            <p
                dir={mono ? "ltr" : undefined}
                className={`mt-1.5 truncate text-xs font-black ${
                    ok
                        ? "text-emerald-800 dark:text-emerald-300"
                        : "text-[#3A3A3A] dark:text-[#ececef]"
                } ${mono ? "font-mono tracking-tight" : ""}`}
            >
                {value}
            </p>
        </div>
    );
}

export function DiagnosticBriefingPage() {
    const { t } = useTranslation();
    const { scenarioId } = useParams<{ scenarioId: string }>();
    const navigate = useNavigate();
    const [scenario, setScenario] = useState<DiagnosticScenarioDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        if (!scenarioId) return;
        void getDiagnosticScenario(scenarioId)
            .then(setScenario)
            .catch((r: unknown) =>
                setError(r instanceof Error ? r.message : t("diagnostics.briefing.loadFail")),
            )
            .finally(() => setLoading(false));
    }, [scenarioId, t]);

    const begin = async () => {
        if (!scenarioId) return;
        setStarting(true);
        setError(null);
        try {
            const attempt = await startDiagnosticAttempt(scenarioId);
            void navigate(`/diagnostics/attempts/${attempt.id}`);
        } catch (e) {
            setError(e instanceof Error ? e.message : t("diagnostics.briefing.startFail"));
            setStarting(false);
        }
    };

    const vehicleLabel =
        scenario?.vehicle?.label || t("diagnostics.briefing.vehicleFallback");
    const faultCodes = scenario?.fault_codes ?? [];
    const primaryFault =
        faultCodes.length > 0
            ? faultCodes[0]
            : null;
    const requiredTools = Array.from(
        new Set(
            (scenario?.steps ?? [])
                .map((s) => s.tool)
                .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool)),
        ),
    );
    const toolsToShow =
        requiredTools.length > 0
            ? toolMetaKeys.filter(({ key }) =>
                  requiredTools.some((tool) => tool === key || (tool === "oscilloscope" && key === "scope")),
              )
            : toolMetaKeys;
    const complaint =
        scenario?.customer_complaint?.trim() ||
        t("diagnostics.briefing.noComplaint");
    const vin = scenario?.vehicle?.vin || "—";
    const odometer =
        scenario?.vehicle?.odometer_km != null
            ? `${Number(scenario.vehicle.odometer_km).toLocaleString()} km`
            : "—";
    const engine =
        scenario?.vehicle?.engine_code ||
        scenario?.vehicle?.variant ||
        "—";
    const maxHints = scenario?.max_hints ?? 3;

    if (loading) {
        return (
            <main className="min-h-full bg-[#F8F7F6] p-8 dark:bg-[#101013]">
                <div className="mx-auto max-w-[1040px] animate-pulse space-y-5">
                    <div className="h-8 w-48 rounded-full bg-[#3A3A3A]/10 dark:bg-white/10" />
                    <div className="h-56 rounded-[28px] bg-[#3A3A3A]/8 dark:bg-white/8" />
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="h-32 rounded-[22px] bg-white dark:bg-[#1b1b20]" />
                        <div className="h-32 rounded-[22px] bg-white dark:bg-[#1b1b20]" />
                        <div className="h-32 rounded-[22px] bg-white dark:bg-[#1b1b20]" />
                    </div>
                    <div className="h-64 rounded-[28px] bg-white dark:bg-[#1b1b20]" />
                </div>
            </main>
        );
    }

    if (error || !scenario) {
        return (
            <main className="min-h-full bg-[#F8F7F6] p-8 dark:bg-[#101013]">
                <div className="mx-auto max-w-[960px]">
                    <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 dark:border-red-500/25 dark:bg-red-500/10">
                        <p className="text-sm font-black text-red-800 dark:text-red-300">
                            {error ?? t("diagnostics.briefing.notFound")}
                        </p>
                        <Link
                            to="/diagnostics"
                            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-black text-red-700 shadow-sm ring-1 ring-red-200 hover:bg-red-100 dark:bg-white/10 dark:text-red-300 dark:ring-red-500/30 dark:hover:bg-white/15"
                        >
                            <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
                            {t("diagnostics.briefing.back")}
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-full bg-[#F8F7F6] pb-28 dark:bg-[#101013]">
            <div className="mx-auto max-w-[1040px] px-5 py-6 sm:px-8 sm:py-8">
                {/* Top bar: back + status */}
                <motion.div
                    {...fadeUp}
                    transition={{ duration: 0.35 }}
                    className="flex flex-wrap items-center justify-between gap-3"
                >
                    <Link
                        to="/diagnostics"
                        className="group inline-flex items-center gap-2 rounded-full border border-[#3A3A3A]/10 bg-white px-4 py-2 text-xs font-black text-[#3A3A3A]/60 shadow-sm transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/60 dark:hover:border-[#F47822]/40 dark:hover:text-[#F47822]"
                    >
                        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:translate-x-0.5" />
                        {t("diagnostics.briefing.back")}
                    </Link>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        {t("diagnostics.card.available")}
                    </span>
                </motion.div>

                {/* Work order hero */}
                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-4 overflow-hidden rounded-[28px] border border-[#3A3A3A]/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#1b1b20]"
                >
                    <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="relative overflow-hidden bg-[#0f1115] p-7 text-white sm:p-8">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a] via-[#1a1a1a] to-[#0f1115]" />
                            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#F47822]/25 blur-3xl" />
                            <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-[#F47822]/10 blur-3xl" />
                            <div
                                className="absolute inset-0 opacity-[0.04]"
                                style={{
                                    backgroundImage:
                                        "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
                                    backgroundSize: "24px 24px",
                                }}
                            />
                            <div className="relative">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="inline-flex items-center gap-2 rounded-full bg-[#F47822] px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] text-white">
                                        {t("diagnostics.briefing.workOrder")}
                                    </p>
                                    <p className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-white/70 backdrop-blur">
                                        <ShieldCheck className="h-3 w-3 text-[#F47822]" />
                                        {t("diagnostics.briefing.serverGraded")}
                                    </p>
                                </div>
                                <h1 className="mt-4 text-2xl font-black leading-[1.15] tracking-tight sm:text-[28px]">
                                    {scenario.title}
                                </h1>
                                {scenario.description ? (
                                    <p className="mt-3 max-w-[520px] text-sm leading-6 text-white/60">
                                        {scenario.description}
                                    </p>
                                ) : null}
                                <div className="mt-6 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                                        <Car className="h-3.5 w-3.5 text-[#F47822]" />
                                        {vehicleLabel}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F47822]/25 bg-[#F47822]/15 px-3 py-1.5 text-xs font-bold text-[#F47822]">
                                        <Zap className="h-3.5 w-3.5" />
                                        {primaryFault
                                            ? `Fault · ${primaryFault}`
                                            : t("diagnostics.briefing.faultNone")}
                                    </span>
                                    {scenario?.system_tag ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70 backdrop-blur">
                                            <Wrench className="h-3.5 w-3.5" />
                                            {scenario.system_tag}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {/* Vehicle intake */}
                        <div className="border-t border-[#3A3A3A]/8 bg-white p-6 dark:border-white/8 dark:bg-[#1b1b20] sm:p-7 lg:border-s lg:border-t-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#3A3A3A]/40 dark:text-white/40">
                                    {t("diagnostics.briefing.intake")}
                                </p>
                                <span className="rounded-full bg-[#F47822]/10 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-[#F47822]">
                                    Bay ready
                                </span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2.5">
                                <IntakeField label={t("diagnostics.briefing.vin")} value={vin} mono />
                                <IntakeField label={t("diagnostics.briefing.odometer")} value={odometer} />
                                <IntakeField label={t("diagnostics.briefing.engine")} value={engine} />
                                <IntakeField
                                    label={t("diagnostics.briefing.bay")}
                                    value="Bench 04 · E1 Hub"
                                    tone="ok"
                                />
                            </div>
                            <div className="mt-3 rounded-2xl border border-[#F47822]/20 bg-[#0f1115] p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
                                    {t("diagnostics.briefing.complaint")}
                                </p>
                                <p className="mt-1.5 text-sm leading-5 text-white/85">
                                    “{complaint}”
                                    {faultCodes.length > 0 ? (
                                        <>
                                            {" "}
                                            ·{" "}
                                            <span className="font-mono font-bold text-[#F47822]">
                                                {faultCodes.join(", ")}
                                            </span>
                                        </>
                                    ) : null}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Stats + tools */}
                <section className="mt-5 grid gap-4 lg:grid-cols-3">
                    <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
                        <StatCard
                            icon={Target}
                            label={t("diagnostics.briefing.passMark")}
                            value={`${scenario.passing_score}%`}
                            hint={t("diagnostics.briefing.serverGraded")}
                        />
                        <StatCard
                            icon={ListChecks}
                            label={t("diagnostics.briefing.tasks")}
                            value={String(scenario.steps.length)}
                            hint={t("diagnostics.briefing.stepsToProve")}
                        />
                        <StatCard
                            icon={Clock3}
                            label={t("diagnostics.briefing.time")}
                            value={
                                scenario.time_limit
                                    ? `${scenario.time_limit} min`
                                    : t("diagnostics.briefing.openTime")
                            }
                            hint={t("diagnostics.briefing.benchTime")}
                        />
                    </div>

                    <SectionCard className="p-5" delay={0.05}>
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#3A3A3A]/40 dark:text-white/40">
                                {t("diagnostics.briefing.toolsRequired")}
                            </p>
                            <span className="rounded-full bg-[#3A3A3A]/[0.06] px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-[#3A3A3A]/50 dark:bg-white/[0.07] dark:text-white/50">
                                {toolsToShow.length} / 5
                            </span>
                        </div>
                        <div className={`mt-3 grid gap-2 ${toolsToShow.length === 5 ? "grid-cols-5" : toolsToShow.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
                            {toolsToShow.map(({ icon: Icon, key }) => {
                                const fullName = t(`diagnostics.briefing.toolNames.${key}`);
                                const shortName = fullName.slice(0, 3);
                                return (
                                    <div
                                        key={key}
                                        title={`${fullName} — ${t(`diagnostics.briefing.toolDescs.${key}`)}`}
                                        className="grid place-items-center gap-1.5 rounded-2xl border border-white/5 bg-[#0f1115] p-2.5 text-white transition hover:border-[#F47822]/40"
                                    >
                                        <Icon className="h-4 w-4 text-[#F47822]" />
                                        <span className="text-center font-mono text-[10px] font-black uppercase tracking-[0.08em] text-white/85">
                                            {shortName}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-3 text-[11px] leading-4 text-[#3A3A3A]/50 dark:text-white/50">
                            {t("diagnostics.briefing.toolsNote")}
                        </p>
                    </SectionCard>
                </section>

                {/* Objectives — workbench checklist */}
                <SectionCard className="mt-5 p-6 sm:p-7" delay={0.04}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#0f1115] text-[#F47822] shadow-sm">
                                <Wrench className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
                                    {t("diagnostics.briefing.workPlan")}
                                </h2>
                                <p className="mt-0.5 text-xs text-[#3A3A3A]/50 dark:text-white/50">
                                    {t("diagnostics.briefing.workPlanDesc")}
                                </p>
                            </div>
                        </div>
                        <span className="rounded-full border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-[#3A3A3A]/50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50">
                            {scenario.steps.length} {t("diagnostics.card.steps")}
                        </span>
                    </div>

                    <ol className="relative mt-6">
                        <div className="absolute bottom-3 left-[13px] top-3 hidden w-px bg-gradient-to-b from-[#F47822]/40 via-[#3A3A3A]/15 to-transparent sm:block" />
                        {scenario.steps.map((step, i) => (
                            <motion.li
                                key={step.id}
                                initial={{ opacity: 0, x: -8 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05, duration: 0.35 }}
                                className="relative flex gap-4 py-2.5"
                            >
                                <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#F47822] text-[11px] font-black text-white shadow-[0_4px_12px_rgba(244,120,34,0.35)]">
                                    {i + 1}
                                </span>
                                <div className="min-w-0 flex-1 rounded-2xl border border-[#3A3A3A]/6 bg-[#FCFCFC] p-4 transition hover:border-[#F47822]/25 dark:border-white/6 dark:bg-[#232329]">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <p className="min-w-0 text-sm font-bold leading-5 text-[#3A3A3A] dark:text-[#ececef]">
                                            {step.title}
                                        </p>
                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider ${
                                                step.is_required
                                                    ? "bg-[#F47822]/10 text-[#F47822]"
                                                    : "bg-[#3A3A3A]/[0.06] text-[#3A3A3A]/45 dark:bg-white/[0.07] dark:text-white/45"
                                            }`}
                                        >
                                            {step.is_required
                                                ? t("diagnostics.card.required")
                                                : t("diagnostics.card.optional")}
                                        </span>
                                    </div>
                                    {step.description ? (
                                        <p className="mt-1 text-sm leading-5 text-[#3A3A3A]/60 dark:text-white/60">
                                            {step.description}
                                        </p>
                                    ) : null}
                                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                        <span className="inline-flex rounded-full border border-[#3A3A3A]/10 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/45 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/45">
                                            {step.action_type}
                                        </span>
                                        {step.tool ? (
                                            <span className="inline-flex rounded-full border border-[#F47822]/20 bg-[#F47822]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#F47822]">
                                                {step.tool === "oscilloscope"
                                                    ? t("diagnostics.briefing.toolNames.scope")
                                                    : t(`diagnostics.briefing.toolNames.${step.tool}`)}
                                            </span>
                                        ) : null}
                                        <span className="font-mono text-[10px] font-bold text-[#3A3A3A]/35 dark:text-white/35">
                                            +{step.criteria_points} pts
                                        </span>
                                    </div>
                                </div>
                            </motion.li>
                        ))}
                    </ol>
                </SectionCard>

                {/* Policy + sticky-ready CTA (desktop) */}
                <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_340px]">
                    <SectionCard className="p-5" delay={0.03}>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-[#F47822]" />
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#3A3A3A]/40 dark:text-white/40">
                                {t("diagnostics.briefing.policy")}
                            </p>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            {[
                                {
                                    icon: ShieldCheck,
                                    title: `${t("diagnostics.briefing.hintsBudget")} · ${maxHints}`,
                                    sub: t("diagnostics.briefing.hintsBudgetValue", { count: maxHints }),
                                },
                                {
                                    icon: Award,
                                    title: t("diagnostics.briefing.bestKept"),
                                    sub: t("diagnostics.briefing.ofAttempts"),
                                },
                                {
                                    icon: Clock3,
                                    title: t("diagnostics.briefing.timed"),
                                    sub: `${scenario.time_limit ?? "—"} ${t("diagnostics.briefing.total")}`,
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-2xl border border-[#3A3A3A]/6 bg-[#FCFCFC] p-3.5 text-center transition hover:border-[#F47822]/25 dark:border-white/6 dark:bg-[#232329]"
                                >
                                    <div className="mx-auto grid h-8 w-8 place-items-center rounded-xl bg-[#3A3A3A]/[0.06] dark:bg-white/[0.07]">
                                        <item.icon className="h-4 w-4 text-[#3A3A3A]/50 dark:text-white/50" />
                                    </div>
                                    <p className="mt-2 text-xs font-black text-[#3A3A3A] dark:text-[#ececef]">
                                        {item.title}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                                        {item.sub}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <div className="hidden rounded-[24px] border border-[#F47822]/20 bg-gradient-to-b from-[#14181c] to-[#0f1115] p-5 text-white shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] lg:block">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-[#F47822]" />
                            <p className="text-sm font-black">{t("diagnostics.briefing.ready")}</p>
                        </div>
                        <p className="mt-1.5 text-xs leading-5 text-white/55">
                            {t("diagnostics.briefing.readyDesc")}
                        </p>
                        <button
                            type="button"
                            onClick={() => void begin()}
                            disabled={starting}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F47822] px-5 py-3.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(244,120,34,0.4)] transition hover:bg-[#df6817] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {starting ? t("diagnostics.briefing.starting") : t("diagnostics.briefing.enter")}
                            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                        </button>
                        {scenario.in_progress_attempt_id ? (
                            <Link
                                to={`/diagnostics/attempts/${scenario.in_progress_attempt_id}`}
                                className="mt-2.5 block rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs font-bold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                            >
                                {t("diagnostics.briefing.resume")}
                            </Link>
                        ) : null}
                    </div>
                </section>
            </div>

            {/* Sticky action bar — always available (mobile + desktop) */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#3A3A3A]/10 bg-white/90 px-4 py-3 shadow-[0_-8px_30px_rgba(16,24,40,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-[#1b1b20]/90 lg:hidden">
                <div className="mx-auto flex max-w-[1040px] items-center gap-3">
                    <Link
                        to="/diagnostics"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-[#3A3A3A]/12 px-4 py-3 text-xs font-black text-[#3A3A3A]/65 transition hover:border-[#3A3A3A]/30 hover:text-[#3A3A3A] dark:border-white/12 dark:text-white/65 dark:hover:text-white"
                    >
                        <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
                        <span className="hidden sm:inline">{t("diagnostics.briefing.back")}</span>
                        <span className="sm:hidden">{t("diagnostics.briefing.back")}</span>
                    </Link>
                    <div className="min-w-0 flex-1">
                        {scenario.in_progress_attempt_id ? (
                            <Link
                                to={`/diagnostics/attempts/${scenario.in_progress_attempt_id}`}
                                className="mb-1.5 block truncate text-center text-[11px] font-bold text-[#F47822]"
                            >
                                {t("diagnostics.briefing.resume")}
                            </Link>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => void begin()}
                            disabled={starting}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F47822] px-5 py-3 text-sm font-black text-white shadow-[0_8px_20px_rgba(244,120,34,0.35)] transition hover:bg-[#df6817] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {starting ? t("diagnostics.briefing.starting") : t("diagnostics.briefing.enter")}
                            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
