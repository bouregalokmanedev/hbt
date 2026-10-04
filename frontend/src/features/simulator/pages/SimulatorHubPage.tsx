import { Activity, Award, Gauge, GitBranch, MapPin, MonitorPlay, ScanSearch, Zap, ArrowRight, Trophy, Clock3, Flame, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { api } from "@/lib/api/client";
import { track, trackOnce } from "@/lib/track";
import { SIMULATOR_RESULTS_EVENT, simulatorApi, type SimulatorResult } from "../api/simulator.api";
import { HubFeedback } from "../components/HubFeedback";

/** Monthly free-tier quota returned by GET /v1/simulator/usage. */
interface SimulatorUsage {
    used: number;
    limit: number | null;
    remaining: number | null;
    unlimited: boolean;
    /** Extra sessions granted by unlocked simulator badges (+1/+2/+3). */
    bonus?: number;
    resets_at?: string | null;
}

const LABS = [
    { id: "scanner", name: "Scanner", tag: "SCN", accent: "#F47822", accentBg: "#FFF1E6", desc: "ECU network · DTC · Live data · ADAS", features: "14 screens · UDS · Freeze-frame", icon: ScanSearch },
    { id: "multimeter", name: "Multimeter", tag: "DMM", accent: "#EAB308", accentBg: "#FEF9C3", desc: "11 components · 54 steps · 7 modes", features: "Rotary · Probes · Guided", icon: Gauge },
    { id: "oscilloscope", name: "Oscilloscope", tag: "OSC", accent: "#22C55E", accentBg: "#DCFCE7", desc: "7 exercises · Fault model · Cursors", features: "Waveform · Trigger · ΔV/Δt", icon: Activity },
    { id: "location", name: "Location", tag: "LOC", accent: "#06B6D4", accentBg: "#CFFAFE", desc: "115 components · 58 groups · 6 views", features: "Hotspots · Training · Quiz", icon: MapPin },
    { id: "schematic", name: "Schematic", tag: "WDG", accent: "#8B5CF6", accentBg: "#EDE9FE", desc: "57 comps · 133 pins · 3 traces", features: "E1 hub · Trace · Exam", icon: GitBranch },
] as const;

export function SimulatorHubPage() {
    const { t } = useTranslation();
    const hubLabs = t("simulator.hub.labs", { returnObjects: true }) as { name: string }[];
    const { dashboard } = useDashboard();
    const streak = dashboard?.progression.current_streak ?? 0;
    const lastFiveDays = (dashboard?.progression.learning_days ?? []).slice(-5);

    const [results, setResults] = useState<SimulatorResult[]>([]);
    const [loadingResults, setLoadingResults] = useState(true);
    const [usage, setUsage] = useState<SimulatorUsage | null>(null);

    useEffect(() => {
        let cancelled = false;
        const loadUsage = () => {
            api<SimulatorUsage>("/v1/simulator/usage")
                .then((data) => {
                    if (!cancelled) setUsage(data);
                })
                .catch(() => {
                    if (!cancelled) setUsage(null);
                });
        };
        loadUsage();
        window.addEventListener(SIMULATOR_RESULTS_EVENT, loadUsage);
        window.addEventListener("focus", loadUsage);
        return () => {
            cancelled = true;
            window.removeEventListener(SIMULATOR_RESULTS_EVENT, loadUsage);
            window.removeEventListener("focus", loadUsage);
        };
    }, []);

    const quotaExhausted = Boolean(usage && !usage.unlimited && usage.remaining === 0);

    useEffect(() => {
        if (quotaExhausted) {
            trackOnce("simulator_limit_reached", { source: "simulator_hub" });
        }
    }, [quotaExhausted]);

    const usagePercent = (() => {
        if (!usage || usage.unlimited || !usage.limit) return 0;
        return Math.max(0, Math.min(100, Math.round((usage.used / usage.limit) * 100)));
    })();

    useEffect(() => {
        let cancelled = false;
        const load = () => {
            simulatorApi
                .results()
                .then((data) => {
                    if (!cancelled) setResults(Array.isArray(data) ? data : []);
                })
                .catch(() => {
                    if (!cancelled) setResults([]);
                })
                .finally(() => {
                    if (!cancelled) setLoadingResults(false);
                });
        };
        load();
        window.addEventListener(SIMULATOR_RESULTS_EVENT, load);
        window.addEventListener("focus", load);
        return () => {
            cancelled = true;
            window.removeEventListener(SIMULATOR_RESULTS_EVENT, load);
            window.removeEventListener("focus", load);
        };
    }, []);

    const progressByTool = useMemo(() => {
        const map: Record<string, { count: number; avg: number; lastScore: number | null; best: number }> = {};
        for (const lab of LABS) {
            // Results are already sorted newest-first by simulatorApi.results().
            const toolResults = results.filter((r) => r.tool === lab.id);
            if (toolResults.length === 0) {
                map[lab.id] = { count: 0, avg: 0, lastScore: null, best: 0 };
            } else {
                const avg = Math.round(toolResults.reduce((s, r) => s + (r.score ?? 0), 0) / toolResults.length);
                const last = toolResults[0]?.score ?? null;
                const best = Math.max(...toolResults.map((r) => r.score ?? 0));
                map[lab.id] = { count: toolResults.length, avg, lastScore: last, best };
            }
        }
        return map;
    }, [results]);

    const platformProgress = useMemo(() => {
        const avgs = LABS.map((l) => progressByTool[l.id]?.avg ?? 0).filter((v) => v > 0);
        if (avgs.length === 0) return 0;
        return Math.round(avgs.reduce((s, v) => s + v, 0) / LABS.length);
    }, [progressByTool]);

    const totalSessions = results.length;
    const avgScore = results.length ? Math.round(results.reduce((s, r) => s + (r.score ?? 0), 0) / results.length) : 0;

    const recentResults = useMemo(() => results.slice(0, 3), [results]);
    const recommendedLab = useMemo(() => {
        const sorted = [...LABS].sort((a, b) => (progressByTool[a.id]?.avg ?? 0) - (progressByTool[b.id]?.avg ?? 0));
        return sorted[0];
    }, [progressByTool]);

    const hasActivity = results.length > 0;

    return (
        <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013]">
            <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10">
                {/* Compact professional header: one row + slim quota strip */}
                <section className="rounded-2xl border border-[#3A3A3A]/10 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#1b1b20] sm:px-6 sm:py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#F47822]">
                                <span className="grid h-5 w-5 place-items-center rounded-md bg-[#F47822]/10">
                                    <MonitorPlay className="h-3 w-3" />
                                </span>
                                {t("simulator.hub.badge")}
                            </p>
                            <div className="mt-1.5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                                <h1 className="shrink-0 text-xl font-black tracking-tight text-[#1A1A1A] dark:text-white sm:text-[22px]">
                                    {t("simulator.hub.title")}
                                </h1>
                                <p className="line-clamp-2 max-w-[540px] text-[13px] leading-5 text-[#3A3A3A]/55 dark:text-white/55">
                                    {t("simulator.hub.desc")}
                                </p>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {quotaExhausted ? (
                                    <Link
                                        to="/pricing"
                                        onClick={() =>
                                            track("plan_cta_clicked", { plan: "professional", source: "simulator_hub" })
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-[13px] font-black text-white transition hover:bg-[#E96D18]"
                                    >
                                        {t("simulator.hub.usage.upgrade")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                                    </Link>
                                ) : (
                                    <Link
                                        to={recommendedLab ? `/simulator/${recommendedLab.id}` : "/simulator/scanner"}
                                        className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-[13px] font-black text-white transition hover:bg-[#E96D18]"
                                    >
                                        {t("simulator.hub.openLab")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                                    </Link>
                                )}
                                <Link
                                    to="/reports"
                                    className="inline-flex items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 py-2.5 text-[13px] font-bold text-[#3A3A3A] transition hover:bg-[#F8F7F6] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                >
                                    <BarChart3 className="h-4 w-4" />
                                    {t("simulator.hub.viewReports", { defaultValue: "View reports" })}
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-stretch divide-x divide-[#3A3A3A]/10 lg:shrink-0 dark:divide-white/10">
                            <div className="px-4 first:pl-0 last:pr-0">
                                <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#3A3A3A]/40 dark:text-white/40">
                                    <Trophy className="h-3 w-3" />
                                    {t("simulator.hub.sessions", { defaultValue: "Sessions" })}
                                </p>
                                <p className="mt-1.5 text-lg font-black leading-none text-[#1A1A1A] dark:text-white">
                                    {loadingResults ? "—" : totalSessions}
                                </p>
                                <p className="mt-1 text-[11px] font-medium text-[#3A3A3A]/50 dark:text-white/50">
                                    {loadingResults
                                        ? t("simulator.hub.loading")
                                        : avgScore
                                          ? `${avgScore}% avg`
                                          : t("simulator.hub.noSessions", { defaultValue: "No sessions yet" })}
                                </p>
                            </div>
                            <div className="px-4">
                                <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#3A3A3A]/40 dark:text-white/40">
                                    <BarChart3 className="h-3 w-3" />
                                    {t("simulator.hub.platform")}
                                </p>
                                <p className="mt-1.5 text-lg font-black leading-none text-[#1A1A1A] dark:text-white">
                                    {platformProgress}
                                    <span className="text-xs font-bold text-[#3A3A3A]/30 dark:text-white/30">%</span>
                                </p>
                                <div className="mt-2 h-1 w-full min-w-[72px] overflow-hidden rounded-full bg-[#3A3A3A]/10 dark:bg-white/10">
                                    <div className="h-full rounded-full bg-[#F47822] transition-all duration-700" style={{ width: `${platformProgress}%` }} />
                                </div>
                            </div>
                            <div className="px-4 last:pr-0">
                                <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#F47822]">
                                    <Flame className="h-3 w-3" />
                                    {t("simulator.hub.streak")}
                                </p>
                                <p className="mt-1.5 text-lg font-black leading-none text-[#1A1A1A] dark:text-white">
                                    {streak}
                                    <span className="text-xs font-bold text-[#3A3A3A]/30 dark:text-white/30">
                                        {" "}
                                        {streak === 1 ? t("simulator.hub.day") : t("simulator.hub.days")}
                                    </span>
                                </p>
                                <div className="mt-2 flex gap-1">
                                    {(lastFiveDays.length > 0 ? lastFiveDays.map((day) => day.active) : [false, false, false, false, false]).map((on, i) => (
                                        <span key={i} className={`h-1 w-3 rounded-full ${on ? "bg-[#F47822]" : "bg-[#F47822]/15 dark:bg-white/15"}`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly quota — slim strip */}
                    {usage && !usage.unlimited && (
                        <div
                            data-testid="simulator-usage"
                            className="mt-4 flex items-center gap-3 border-t border-[#3A3A3A]/8 pt-3 dark:border-white/10"
                        >
                            <p className="flex shrink-0 items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#3A3A3A]/40 dark:text-white/40">
                                <Gauge className="h-3.5 w-3.5 text-[#F47822]" />
                                {t("simulator.hub.usage.label")}
                            </p>
                            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#3A3A3A]/10 dark:bg-white/10">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${quotaExhausted ? "bg-red-500" : "bg-[#F47822]"}`}
                                    style={{ width: `${usagePercent}%` }}
                                />
                            </div>
                            <p className="shrink-0 font-mono text-[11px] font-black text-[#1A1A1A] dark:text-white">
                                {t("simulator.hub.usage.progress", { used: usage.used, limit: usage.limit })}
                            </p>
                            {!!usage.bonus && (
                                <p
                                    data-testid="simulator-usage-bonus"
                                    className="shrink-0 rounded-full bg-[#F47822]/12 px-2 py-0.5 text-[10px] font-black text-[#B85708] dark:bg-[#F47822]/15 dark:text-[#F47822]"
                                >
                                    {t("simulator.hub.usage.badgeBonus", { count: usage.bonus })}
                                </p>
                            )}
                            <p className="hidden shrink-0 text-[11px] text-[#3A3A3A]/45 sm:block dark:text-white/45">
                                {t("simulator.hub.usage.resets")}
                            </p>
                        </div>
                    )}

                    {quotaExhausted && usage && (
                        <div
                            data-testid="simulator-limit-upsell"
                            className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#F47822]/30 bg-[#FFF7ED] px-3.5 py-2.5 dark:border-[#F47822]/30 dark:bg-[#F47822]/10"
                        >
                            <p className="min-w-0 text-[13px] leading-5 text-[#3A3A3A]/65 dark:text-white/65">
                                <span className="font-black text-[#B85708] dark:text-[#F47822]">
                                    {t("simulator.hub.usage.exhaustedTitle")}
                                </span>{" "}
                                {t("simulator.hub.usage.exhaustedDesc", { limit: usage.limit ?? 0 })}
                            </p>
                            <Link
                                to="/pricing"
                                onClick={() =>
                                    track("plan_cta_clicked", {
                                        plan: "professional",
                                        source: "simulator_limit",
                                    })
                                }
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#F47822] px-3.5 py-2 text-xs font-black text-white transition hover:bg-[#E96D18]"
                            >
                                {t("simulator.hub.usage.upgrade")}
                                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                            </Link>
                        </div>
                    )}
                </section>

                {/* Redesigned lab cards */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    {LABS.map((lab, idx) => {
                        const Icon = lab.icon;
                        const prog = progressByTool[lab.id];
                        // Bar tracks the latest run (moves as soon as a session completes);
                        // avg is shown as secondary text.
                        const pct = prog?.lastScore ?? prog?.avg ?? 0;
                        const count = prog?.count ?? 0;
                        const isStarted = count > 0;
                        return (
                            <motion.div key={lab.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                                <Link to={`/simulator/${lab.id}`} className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-[#3A3A3A]/8 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(0,0,0,0.08)] dark:border-white/8 dark:bg-[#1b1b20]">
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="grid h-11 w-11 place-items-center rounded-2xl border text-xs font-black shadow-sm" style={{ background: lab.accentBg, color: lab.accent, borderColor: `${lab.accent}18` }}>
                                                <Icon className="h-5 w-5" />
                                            </span>
                                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${isStarted ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-[#3A3A3A]/5 text-[#3A3A3A]/40 dark:bg-white/5 dark:text-white/40"}`}>
                                                {isStarted ? t("simulator.hub.runCount", { count }) : t("simulator.hub.newBadge")}
                                            </span>
                                        </div>
                                        <h2 className="mt-4 text-[15px] font-black leading-tight text-[#1A1A1A] dark:text-white">{hubLabs[idx]?.name ?? lab.name}</h2>
                                        <p className="mt-1 line-clamp-2 text-xs leading-4 text-[#3A3A3A]/50 dark:text-white/50">{t(`simulator.hub.labDescs.${lab.id}`, { defaultValue: lab.desc })}</p>
                                        <span className="mt-3 inline-flex rounded-full bg-[#F8F7F6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/50 dark:bg-white/5 dark:text-white/50">{t(`simulator.hub.labFeatures.${lab.id}`, { defaultValue: lab.features })}</span>
                                    </div>
                                    <div className="mt-auto border-t border-[#3A3A3A]/5 bg-[#FCFCFC] p-4 dark:border-white/5 dark:bg-[#232329]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("simulator.hub.progress")}</span>
                                            <span className="flex items-center gap-1.5 font-mono text-xs font-black text-[#1A1A1A] dark:text-white">
                                                {pct}%
                                                {isStarted && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                            </span>
                                        </div>
                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#3A3A3A]/10 dark:bg-white/10">
                                            <div
                                                className="h-full min-w-0 rounded-full transition-all duration-700 ease-out"
                                                style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: pct === 0 ? "#E5E7EB" : lab.accent }}
                                            />
                                        </div>
                                        {isStarted && (
                                            <p className="mt-2 font-mono text-[10px] font-bold text-[#3A3A3A]/45 dark:text-white/45">
                                                {t("simulator.hub.lastScore", { defaultValue: "Last" })} {prog?.lastScore ?? 0}% · {t("simulator.hub.avgShort", { defaultValue: "Avg" })} {prog?.avg ?? 0}%
                                            </p>
                                        )}
                                        <span className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1A1A1A] px-3 py-2.5 text-xs font-black text-white transition group-hover:bg-black dark:bg-white dark:text-[#1A1A1A] dark:group-hover:bg-white/90">
                                            {isStarted ? t("simulator.hub.continueLab", { defaultValue: "Continue" }) : t("simulator.hub.openLab")} <Zap className="h-3 w-3 text-[#F47822] rtl:rotate-180" />
                                        </span>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Simulation-focused bottom section — replaces the 3 generic cards */}
                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                    {/* Recent simulator activity */}
                    <div className="rounded-[20px] border border-[#3A3A3A]/8 bg-white p-5 dark:border-white/8 dark:bg-[#1b1b20]">
                        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
                            <Clock3 className="h-4 w-4 text-[#F47822]" />
                            {t("simulator.hub.recentActivity", { defaultValue: "Recent activity" })}
                        </p>
                        <div className="mt-4">
                            {loadingResults ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-14 animate-pulse rounded-xl bg-[#F8F7F6] dark:bg-white/5" />
                                    ))}
                                </div>
                            ) : recentResults.length === 0 ? (
                                <div className="rounded-2xl border-2 border-dashed border-[#3A3A3A]/10 bg-[#F8F7F6] p-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
                                    <p className="text-sm font-bold text-[#3A3A3A] dark:text-white">{t("simulator.hub.noRecent", { defaultValue: "No runs yet" })}</p>
                                    <p className="mt-1 text-xs text-[#3A3A3A]/50 dark:text-white/50">{t("simulator.hub.noRecentDesc", { defaultValue: "Complete a lab to see your history here." })}</p>
                                    <Link to="/simulator/scanner" className="mt-3 inline-flex rounded-full bg-[#F47822] px-4 py-1.5 text-xs font-bold text-white">{t("simulator.hub.startScanner")}</Link>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {recentResults.map((r) => {
                                        const lab = LABS.find((l) => l.id === r.tool);
                                        return (
                                            <Link key={r.id} to={`/simulator/${r.tool}`} className="flex items-center gap-3 rounded-xl border border-[#3A3A3A]/10 bg-[#F8F7F6] p-3 transition hover:border-[#F47822]/20 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]">
                                                <span className="grid h-9 w-9 place-items-center rounded-xl text-xs font-black" style={{ background: lab?.accentBg ?? "#FFF1E6", color: lab?.accent ?? "#F47822" }}>
                                                    {lab?.tag ?? r.tool.slice(0, 3).toUpperCase()}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-bold text-[#1A1A1A] dark:text-white">{lab?.name ?? r.tool}</span>
                                                    <span className="block truncate font-mono text-xs text-[#3A3A3A]/50 dark:text-white/50">{r.scenario_key ?? r.scenario_key ?? "—"} · {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</span>
                                                </span>
                                                <span className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-xs font-black ${ (r.score ?? 0) >= 70 ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : (r.score ?? 0) >= 40 ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-red-500/10 text-red-600 dark:text-red-300"}`}>{r.score ?? 0}%</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <Link to="/reports" className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white py-2.5 text-xs font-bold text-[#3A3A3A] transition hover:bg-[#F8F7F6] dark:border-white/10 dark:bg-white/5 dark:text-white">
                            {t("simulator.hub.viewReports", { defaultValue: "View reports" })} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    {/* Recommended next step */}
                    <div className="rounded-[20px] border border-[#B85708]/15 bg-gradient-to-br from-[#FFF7ED] to-white p-5 dark:border-[#F47822]/15 dark:from-[#F47822]/10 dark:to-[#1b1b20]">
                        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#B85708]">
                            <Award className="h-4 w-4" />
                            {t("simulator.hub.recommended", { defaultValue: "Recommended next" })}
                        </p>
                        {(() => {
                            const lab = recommendedLab;
                            const prog = progressByTool[lab.id];
                            const Icon = lab.icon;
                            return (
                                <>
                                    <div className="mt-4 flex items-start gap-4">
                                        <span className="grid h-12 w-12 place-items-center rounded-2xl border bg-white text-lg shadow-sm dark:bg-[#1b1b20]" style={{ color: lab.accent, background: lab.accentBg, borderColor: `${lab.accent}20` }}>
                                            <Icon className="h-6 w-6" />
                                        </span>
                                        <div className="min-w-0">
                                            <h3 className="text-base font-black text-[#1A1A1A] dark:text-white">{hubLabs[LABS.indexOf(lab)]?.name ?? lab.name}</h3>
                                            <p className="mt-1 text-xs leading-4 text-[#3A3A3A]/60 dark:text-white/60">{lab.desc}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 rounded-xl bg-white p-3 shadow-sm ring-1 ring-[#3A3A3A]/5 dark:bg-[#1b1b20] dark:ring-white/10">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("simulator.hub.progress")}</span>
                                            <span className="font-mono font-black text-[#B85708]">{prog?.avg ?? 0}%</span>
                                        </div>
                                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/10 dark:bg-white/10">
                                            <div className="h-full rounded-full bg-[#B85708]" style={{ width: `${prog?.avg ?? 0}%` }} />
                                        </div>
                                        <p className="mt-2 text-xs text-[#3A3A3A]/50 dark:text-white/50">
                                            {hasActivity ? t("simulator.hub.keepGoing", { defaultValue: "Keep your streak alive — one lab a day." }) : t("simulator.hub.startJourney", { defaultValue: "Start here to build your foundation." })}
                                        </p>
                                    </div>
                                    <Link to={`/simulator/${lab.id}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#B85708] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#9A4A06]">
                                        <Zap className="h-4 w-4" />
                                        {t("simulator.hub.startLab", { defaultValue: "Start lab" })}
                                    </Link>
                                </>
                            );
                        })()}
                    </div>

                    {/* Quick simulation stats + actions */}
                    <div className="rounded-[20px] border border-[#3A3A3A]/8 bg-white p-5 dark:border-white/8 dark:bg-[#1b1b20]">
                        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
                            <BarChart3 className="h-4 w-4 text-[#F47822]" />
                            {t("simulator.hub.atAGlance", { defaultValue: "At a glance" })}
                        </p>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            <div className="rounded-2xl bg-[#F8F7F6] p-3 text-center dark:bg-white/[0.04]">
                                <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("simulator.hub.labsCount")}</p>
                                <p className="mt-1 text-xl font-black text-[#1A1A1A] dark:text-white">5</p>
                            </div>
                            <div className="rounded-2xl bg-[#F8F7F6] p-3 text-center dark:bg-white/[0.04]">
                                <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("simulator.hub.avg")}</p>
                                <p className="mt-1 text-xl font-black text-[#1A1A1A] dark:text-white">{avgScore}<span className="text-sm text-[#3A3A3A]/30">%</span></p>
                            </div>
                            <div className="rounded-2xl bg-[#F8F7F6] p-3 text-center dark:bg-white/[0.04]">
                                <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("simulator.hub.best")}</p>
                                <p className="mt-1 text-xl font-black text-emerald-600 dark:text-emerald-400">{results.length ? Math.max(...results.map((r) => r.score ?? 0)) : 0}<span className="text-sm">%</span></p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <Link to="/diagnostics" className="flex w-full items-center justify-between rounded-xl border border-[#3A3A3A]/10 bg-white px-4 py-3 text-sm font-bold text-[#1A1A1A] transition hover:border-[#F47822]/20 hover:bg-[#FFF7ED] dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
                                <span className="flex items-center gap-2">
                                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#F47822]/10 text-[#F47822]">
                                        <ScanSearch className="h-4 w-4" />
                                    </span>
                                    {t("simulator.hub.diagnostics")}
                                </span>
                                <ArrowRight className="h-4 w-4 text-[#3A3A3A]/20" />
                            </Link>
                            <Link to="/ai-mentor" className="flex w-full items-center justify-between rounded-xl border border-[#3A3A3A]/10 bg-white px-4 py-3 text-sm font-bold text-[#1A1A1A] transition hover:border-[#F47822]/20 hover:bg-[#FFF7ED] dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
                                <span className="flex items-center gap-2">
                                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-500/10 text-violet-600">
                                        <Zap className="h-4 w-4" />
                                    </span>
                                    {t("simulator.hub.aiMentor")}
                                </span>
                                <ArrowRight className="h-4 w-4 text-[#3A3A3A]/20" />
                            </Link>
                        </div>
                        <p className="mt-3 text-center text-[11px] font-medium text-[#3A3A3A]/40 dark:text-white/40">
                            {t("simulator.hub.streakNote", { defaultValue: "Your daily streak counts every simulator completion." })} <Flame className="inline h-3 w-3 text-[#F47822]" /> {streak} {t("simulator.hub.days")}
                        </p>
                    </div>
                </div>

                {/* Student feedback & reviews */}
                <HubFeedback />
            </div>
        </main>
    );
}
