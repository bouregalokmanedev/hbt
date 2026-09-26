import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Clock3, Cpu, Gauge, Send, ShieldCheck, Sparkles, Wrench, History, Lightbulb, Timer, Award } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

import { useDiagnosticAttempt } from "../hooks/useDiagnosticAttempt";
import { useDiagnosticTimer } from "../hooks/useDiagnosticTimer";
import { DiagnosticMentorPanel } from "../components/DiagnosticMentorPanel";
import { HintsPanel } from "../components/WorkspacePanels";
import { TOOL_LABELS } from "../types/diagnostic.types";
import { LocationPanel } from "../tools/LocationPanel";
import { MultimeterPanel } from "../tools/MultimeterPanel";
import { OscilloscopePanel } from "../tools/OscilloscopePanel";
import { ScannerPanel } from "../tools/ScannerPanel";
import { SchematicPanel } from "../tools/SchematicPanel";
import { useDiagnosticWorkspaceStore } from "../state/diagnosticWorkspaceStore";
import type { DiagnosticTool } from "../types/diagnostic.types";

const TOOLS = Object.keys(TOOL_LABELS) as DiagnosticTool[];
const RECOMMENDED_TOOL: Record<string, DiagnosticTool> = { scan: "scanner", measure: "multimeter", test: "multimeter", diagnose: "oscilloscope", inspect: "location", identify: "schematic" };
const TOOL_ICON: Record<DiagnosticTool, typeof Cpu> = { scanner: Cpu, multimeter: Gauge, oscilloscope: Wrench, location: Wrench, schematic: Wrench } as unknown as Record<DiagnosticTool, typeof Cpu>;

function EvidenceFacts({ evidence }: { evidence: Record<string, unknown> | null }) {
    const { t } = useTranslation();
    if (!evidence || Object.keys(evidence).length === 0) return null;
    const entries: Array<[string, string]> = Array.isArray(evidence)
        ? evidence.flatMap((item) => {
              if (item && typeof item === "object" && "key" in item && "value" in item) {
                  return [[String((item as { key: unknown }).key), String((item as { value: unknown }).value)] as [string, string]];
              }
              return [];
          })
        : Object.entries(evidence).map(([k, v]) => [k, String(v)] as [string, string]);
    if (entries.length === 0) return null;
    return (
        <div className="rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-[#FCFCFC] dark:bg-[#232329] p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40"><Sparkles className="h-3 w-3 text-[#F47822]" /> {t("diagnostics.workspace.evidenceTitle")}</p>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                {entries.map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-white dark:bg-[#1b1b20] border border-[#3A3A3A]/5 dark:border-white/5 px-3 py-2.5">
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{k}</dt>
                        <dd className="mt-0.5 font-mono text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{v}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

function Stepper({ steps, idx, onSelect }: { steps: { id: string; answered: boolean; title: string }[]; idx: number; onSelect: (id: string) => void }) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto py-1">
            {steps.map((s, i) => {
                const done = s.answered;
                const active = i === idx;
                return (
                    <button key={s.id} onClick={() => onSelect(s.id)} className="group flex shrink-0 items-center gap-2">
                        <span className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-black transition ${done ? "border-emerald-500 bg-emerald-500 text-white" : active ? "border-[#F47822] bg-[#F47822] text-white shadow-[0_0_0_4px_rgba(244,120,34,0.12)]" : "border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] text-[#3A3A3A]/30 dark:text-white/30 group-hover:border-[#3A3A3A]/20 dark:group-hover:border-white/20 group-hover:text-[#3A3A3A]/60 dark:group-hover:text-white/60"}`}>
                            {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                        </span>
                        <span className={`hidden max-w-[130px] truncate pr-1 text-left text-xs font-bold leading-tight xl:block ${active ? "text-[#3A3A3A] dark:text-[#ececef]" : done ? "text-[#3A3A3A]/60 dark:text-white/60" : "text-[#3A3A3A]/30 dark:text-white/30"}`}>{s.title}</span>
                        {i < steps.length - 1 && <span className={`hidden h-px w-5 sm:block ${i < idx || done ? "bg-emerald-500/40" : "bg-[#3A3A3A]/10 dark:bg-white/10"}`} />}
                    </button>
                );
            })}
        </div>
    );
}

export function DiagnosticWorkspacePage() {
    const { t } = useTranslation();
    const { attemptId } = useParams<{ attemptId: string }>();
    const navigate = useNavigate();
    const { attempt, hints, isLoading, isSaving, error, answerStep, revealHint, submit } = useDiagnosticAttempt(attemptId);
    const ws = useDiagnosticWorkspaceStore();
    const { selectedStepId, tool, finding, measurement, scannerDtc, scannerLive, scannerInterp, mmMode, mmRed, mmBlack, mmReading, scopeChannel, scopeTime, scopeVolt, scopeObs, locComponent, locView, locNote, schFrom, schTo, schWire, schVerdict, feedback } = ws;
    const timer = useDiagnosticTimer((attempt as unknown as { started_at?: string | null } | null)?.started_at ?? null, (attempt as unknown as { time_limit?: number | null } | null)?.time_limit ?? null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key >= "1" && e.key <= "5") { const t = TOOLS[Number(e.key) - 1]; if (t) ws.setTool(t); }
            if (!attempt) return;
            const steps = attempt.steps ?? [];
            const curIdx = steps.findIndex((s: { id: string }) => s.id === (selectedStepId ?? steps.find((x: { answered: boolean }) => !x.answered)?.id ?? steps[0]?.id));
            if (e.key === "ArrowLeft" && curIdx > 0) ws.setSelectedStepId(steps[curIdx - 1].id);
            if (e.key === "ArrowRight" && curIdx < steps.length - 1) ws.setSelectedStepId(steps[curIdx + 1].id);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [attempt, selectedStepId]);

    // Keep selected tool locked to the active step's required tool (hook must run unconditionally).
    const currentStepForTool =
        (attempt?.steps ?? []).find((s) => s.id === selectedStepId) ??
        (attempt?.steps ?? []).find((s) => !s.answered) ??
        (attempt?.steps ?? [])[0] ??
        null;
    const lockedTool = currentStepForTool?.tool ?? null;

    useEffect(() => {
        if (lockedTool && tool !== lockedTool) {
            ws.setTool(lockedTool);
        }
    }, [lockedTool, tool, ws]);

    if (isLoading) return <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] grid place-items-center p-8"><div className="flex items-center gap-3 rounded-full bg-white dark:bg-[#1b1b20] px-4 py-2 text-sm font-bold text-[#3A3A3A] dark:text-[#ececef] shadow-sm border border-[#3A3A3A]/5 dark:border-white/5"><span className="h-2 w-2 animate-pulse rounded-full bg-[#F47822]" /> {t("diagnostics.workspace.preparing")}</div></main>;
    if (error || !attempt) return <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-8"><div className="mx-auto max-w-[960px] rounded-2xl bg-red-50 dark:bg-red-500/10 p-5 text-red-700 dark:text-red-400">{error ?? t("diagnostics.workspace.notFound")}</div><Link to="/diagnostics" className="mx-auto mt-4 block max-w-[960px] text-sm font-bold text-[#F47822]">← {t("diagnostics.workspace.back")}</Link></main>;

    const steps = attempt.steps ?? [];
    const current = steps.find((s) => s.id === selectedStepId) ?? steps.find((s) => !s.answered) ?? steps[0] ?? null;
    const answeredRequired = steps.filter((s) => s.is_required && s.answered).length;
    const requiredTotal = steps.filter((s) => s.is_required).length;
    const progress = requiredTotal > 0 ? Math.round((answeredRequired / requiredTotal) * 100) : 100;
    const hintPenalty = hints?.penalty_total ?? 0;
    const estScore = Math.max(0, 100 - hintPenalty);
    const idx = current ? steps.findIndex((s) => s.id === current.id) : -1;
    const canPrev = idx > 0;
    const canNext = idx >= 0 && idx < steps.length - 1;
    const recommended = current?.tool ?? (current ? RECOMMENDED_TOOL[current.action_type] : null);
    const activeTool = lockedTool ?? tool;

    const submitStep = async () => {
        if (!current || isSaving) return;
        ws.setFeedback(null);
        const payload: Record<string, unknown> = { action: current.action_type, tool: activeTool, finding: finding.trim() };
        if (measurement.trim() !== "") { const n = Number(measurement); payload.measurement = Number.isNaN(n) ? measurement.trim() : n; }
        if (activeTool === "scanner") { if (scannerDtc.trim()) payload.dtc = scannerDtc.trim(); if (scannerLive.trim()) payload.liveData = scannerLive.trim(); if (scannerInterp.trim()) payload.interpretation = scannerInterp.trim(); payload.payload = finding.trim(); }
        else if (activeTool === "multimeter") { payload.mode = mmMode; if (mmRed.trim()) payload.redProbe = mmRed.trim(); if (mmBlack.trim()) payload.blackProbe = mmBlack.trim(); if (mmReading.trim()) payload.reading = mmReading.trim(); }
        else if (activeTool === "oscilloscope") { payload.channel = scopeChannel; payload.timeDiv = scopeTime; payload.voltDiv = scopeVolt; if (scopeObs.trim()) payload.observation = scopeObs.trim(); }
        else if (activeTool === "location") { payload.component = locComponent; payload.view = locView; if (locNote.trim()) payload.note = locNote.trim(); }
        else if (activeTool === "schematic") { payload.from = schFrom.trim(); payload.to = schTo.trim(); payload.wire = schWire; if (schVerdict.trim()) payload.verdict = schVerdict.trim(); }
        try {
            const outcome = await answerStep(current.id, payload, activeTool);
            ws.clearStepInputs();
            if (outcome) { ws.setFeedback(outcome.points_earned > 0 ? t("diagnostics.workspace.stepRecorded", { pts: outcome.points_earned }) : t("diagnostics.workspace.stepRecordedPlain")); if (outcome.next_step) ws.setSelectedStepId(outcome.next_step.id); }
        } catch (e) { ws.setFeedback(e instanceof Error ? e.message : t("diagnostics.workspace.stepFail")); }
    };
    const submitAttempt = async () => {
        if (isSaving) return;
        ws.setFeedback(null);
        try { const r = await submit(); if (r) void navigate(`/diagnostics/attempts/${attempt.id}/result`); } catch (e) { ws.setFeedback(e instanceof Error ? e.message : t("diagnostics.workspace.submitFail")); }
    };

    return (
        <main className="min-h-screen bg-[#F8F7F6] dark:bg-[#101013] text-[#3A3A3A] dark:text-[#ececef] selection:bg-[#F47822]/20">
            {/* Light workstation header */}
            <div className="sticky top-0 z-30 border-b border-[#3A3A3A]/8 dark:border-white/8 bg-white/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6">
                    <Link
                        to="/diagnostics"
                        className="group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/12 bg-white px-3 text-[#3A3A3A]/70 shadow-sm transition hover:border-[#F47822]/45 hover:bg-[#F47822]/5 hover:text-[#F47822] dark:border-white/12 dark:bg-[#1b1b20] dark:text-white/70 dark:hover:border-[#F47822]/45 dark:hover:text-[#F47822]"
                        aria-label={t("diagnostics.workspace.back")}
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
                        <span className="hidden text-xs font-bold sm:inline">{t("diagnostics.workspace.back")}</span>
                    </Link>
                    <div className="hidden h-8 w-px bg-[#3A3A3A]/10 dark:bg-white/10 sm:block" />
                    <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-[#3A3A3A]/40 dark:text-white/40"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> {t("diagnostics.workspace.workstation")} <span className="hidden sm:inline">· {t("diagnostics.workspace.benchMeta")}</span><span className="hidden lg:inline"> · {t("diagnostics.workspace.sidebarNote")}</span></p>
                        <p className="truncate text-sm font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
                            {(attempt.scenario?.vehicle?.label as string | undefined) || (attempt.scenario?.vehicle?.engine_code as string | undefined) || t("diagnostics.briefing.vehicleFallback")}
                            {attempt.scenario?.vehicle?.vin ? (
                                <span className="font-mono text-xs font-medium text-[#3A3A3A]/40 dark:text-white/40"> · {attempt.scenario.vehicle.vin as string}</span>
                            ) : null}
                            {" "}
                            {(attempt.scenario?.fault_codes?.length ?? 0) > 0 ? (
                                <span className="ml-1 rounded-full bg-[#F47822]/10 px-2 py-0.5 font-mono text-xs font-bold text-[#F47822] border border-[#F47822]/15">
                                    {(attempt.scenario?.fault_codes ?? []).join(", ")}
                                </span>
                            ) : null}
                        </p>
                    </div>
                    <div className="hidden items-center gap-2 sm:flex">
                        <div className="rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-[#FCFCFC] dark:bg-[#232329] px-3 py-2 text-right"><p className="text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.workspace.score")}</p><p className="text-sm font-black leading-none text-[#3A3A3A] dark:text-[#ececef]">{estScore}<span className="text-xs font-bold text-[#3A3A3A]/30 dark:text-white/30">/100</span> <span className="text-[10px] font-bold text-[#F47822]">−{hintPenalty}</span></p></div>
                        <div className={`rounded-2xl border px-3 py-2 text-right ${timer.isExpired ? "border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10" : "border-[#3A3A3A]/8 dark:border-white/8 bg-[#FCFCFC] dark:bg-[#232329]"}`}><p className="text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.workspace.time")}</p><p className={`font-mono text-sm font-bold leading-none ${timer.isExpired ? "text-red-600 dark:text-red-400" : "text-[#3A3A3A] dark:text-[#ececef]"}`}>{timer.formatted ?? "--:--"}</p></div>
                        <div className="hidden lg:flex items-center gap-2 rounded-full bg-[#3A3A3A] px-3 py-2 text-white">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-[#F47822] transition-all" style={{ width: `${progress}%` }} /></div>
                            <span className="text-xs font-black">{progress}%</span>
                        </div>
                    </div>
                    <Link to="/diagnostics/history" className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-[#1b1b20] px-3 py-2 text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60 hover:bg-[#3A3A3A]/5 dark:hover:bg-white/5 hover:text-[#3A3A3A] dark:hover:text-[#ececef] border border-[#3A3A3A]/10 dark:border-white/10"><History className="h-3.5 w-3.5" /> {t("diagnostics.workspace.history")}</Link>
                </div>
            </div>

            {/* Stepper — clair */}
            <div className="mx-auto max-w-[1600px] px-4 sm:px-6 pt-4">
                <div className="rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] px-3 py-2 shadow-sm">
                    <Stepper steps={steps.map(s => ({ id: s.id, answered: s.answered, title: s.title }))} idx={idx} onSelect={(id) => ws.setSelectedStepId(id)} />
                </div>
            </div>

            {/* Tools — reorganised: labeled dock with status */}
            <div className="mx-auto max-w-[1600px] px-4 sm:px-6 pt-3">
                <div className="rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-2 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-2 text-[11px] font-black uppercase tracking-[.14em] text-[#3A3A3A]/30 dark:text-white/30"><Wrench className="h-3.5 w-3.5" /> {t("diagnostics.workspace.tools")}</span>
                        <div className="flex flex-1 gap-1.5 overflow-x-auto">
                            {TOOLS.map((toolKey, i) => {
                                const active = activeTool === toolKey;
                                const rec = recommended === toolKey;
                                const lockedOut = Boolean(lockedTool) && lockedTool !== toolKey;
                                const toolName = toolKey === "oscilloscope" ? t("diagnostics.briefing.toolNames.scope") : t(`diagnostics.briefing.toolNames.${toolKey}`);
                                return (
                                    <button
                                        key={toolKey}
                                        onClick={() => { if (!lockedOut) ws.setTool(toolKey); }}
                                        disabled={lockedOut}
                                        title={lockedOut ? t("diagnostics.workspace.recommended") : undefined}
                                        className={`group relative inline-flex min-w-[124px] flex-1 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-[#3A3A3A] dark:border-white/20 bg-[#3A3A3A] text-white shadow-[0_6px_16px_rgba(0,0,0,0.12)]" : "border-[#3A3A3A]/10 dark:border-white/10 bg-[#FCFCFC] dark:bg-[#232329] text-[#3A3A3A]/60 dark:text-white/60 hover:border-[#3A3A3A]/20 dark:hover:border-white/20 hover:bg-white dark:hover:bg-[#1b1b20] hover:text-[#3A3A3A] dark:hover:text-[#ececef]"}`}>
                                        <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${active ? "bg-[#F47822] text-white" : rec ? "bg-amber-100 text-amber-700 dark:text-amber-400" : "bg-[#3A3A3A]/5 dark:bg-white/5 text-[#3A3A3A]/40 dark:text-white/40 group-hover:bg-[#3A3A3A]/10 dark:group-hover:bg-white/10"}`}>{i + 1}</span>
                                        <span className="min-w-0 flex-1"><span className="block text-xs font-black leading-none tracking-wide">{toolName}</span><span className={`block text-[10px] leading-none ${active ? "text-white/60" : "text-[#3A3A3A]/40 dark:text-white/40"}`}>{toolKey === "scanner" ? t("diagnostics.workspace.toolSubScanner") : toolKey === "multimeter" ? t("diagnostics.workspace.toolSubMultimeter") : toolKey === "oscilloscope" ? t("diagnostics.workspace.toolSubScope") : toolKey === "location" ? t("diagnostics.workspace.toolSubLocation") : t("diagnostics.workspace.toolSubSchematic")}</span></span>
                                        {rec && !active && <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-[#F47822] text-[10px] font-black text-white shadow">★</span>}
                                        {active && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 shadow" />}
                                    </button>
                                );
                            })}
                        </div>
                        <span className="hidden lg:inline-flex items-center gap-1 rounded-full bg-[#F47822]/10 px-2.5 py-1 text-[11px] font-bold text-[#F47822] border border-[#F47822]/15"><Lightbulb className="h-3 w-3" /> 1-5</span>
                    </div>
                </div>
            </div>

            <div className="mx-auto grid max-w-[1600px] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[300px_1fr_340px]">
                {/* Left — work order */}
                <div className="space-y-4">
                    <div className="rounded-[20px] border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.workspace.workOrder")}</p>
                            <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-100">{t("diagnostics.workspace.live")}</span>
                        </div>
                        <div className="mt-3 rounded-xl bg-[#FCFCFC] dark:bg-[#232329] p-3 border border-[#3A3A3A]/5 dark:border-white/5">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]"><Gauge className="h-4 w-4 text-[#F47822]" /> {attempt.scenario?.vehicle?.engine_code || attempt.scenario?.vehicle?.variant || t("diagnostics.briefing.vehicleFallback")}</div>
                            <p className="mt-1 font-mono text-xs text-[#3A3A3A]/40 dark:text-white/40">
                                {attempt.scenario?.vehicle?.vin ? `VIN ${attempt.scenario.vehicle.vin}` : "—"}
                                {attempt.scenario?.vehicle?.odometer_km != null ? ` · ${Number(attempt.scenario.vehicle.odometer_km).toLocaleString()} km` : ""}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                <span className="rounded-full bg-[#3A3A3A] px-2.5 py-1 text-[11px] font-bold text-white">{t("diagnostics.workspace.attemptPrefix")}{attempt.attempt_number}</span>
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${progress === 100 ? "bg-emerald-500 text-white border-emerald-500" : "bg-[#F47822]/10 text-[#F47822] border-[#F47822]/15"}`}>{progress}%</span>
                            </div>
                            {attempt.scenario?.customer_complaint ? (
                                <p className="mt-2 rounded-lg bg-[#0f1115] px-2.5 py-2 text-[11px] leading-4 text-white/80">
                                    <span className="font-black uppercase tracking-wide text-white/40">{t("diagnostics.briefing.complaint")}</span>
                                    <br />
                                    {attempt.scenario.customer_complaint}
                                </p>
                            ) : null}
                        </div>
                        {current?.evidence ? <div className="mt-3"><EvidenceFacts evidence={current.evidence} /></div> : null}
                        <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-[#3A3A3A]/30 dark:text-white/30"><Timer className="h-3 w-3" /> {t("diagnostics.workspace.keysHint")}</div>
                    </div>

                    <div className="rounded-[20px] border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-4 shadow-sm">
                        <div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.workspace.steps")}</p><span className="text-xs font-bold text-[#3A3A3A]/50 dark:text-white/50">{answeredRequired}/{requiredTotal} {t("diagnostics.workspace.required")}</span></div>
                        <div className="mt-3 space-y-1.5">
                            {steps.map((s, i) => {
                                const active = s.id === current?.id;
                                return (
                                    <button key={s.id} onClick={() => ws.setSelectedStepId(s.id)} className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${active ? "bg-[#3A3A3A] text-white shadow" : s.answered ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 hover:bg-emerald-50/80 border border-emerald-100" : "bg-[#FCFCFC] dark:bg-[#232329] text-[#3A3A3A]/50 dark:text-white/50 hover:bg-white dark:hover:bg-[#1b1b20] hover:text-[#3A3A3A] dark:hover:text-[#ececef] border border-[#3A3A3A]/5 dark:border-white/5"}`}>
                                        <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-black ${active ? "bg-white dark:bg-[#1b1b20] text-[#3A3A3A] dark:text-[#ececef]" : s.answered ? "bg-emerald-500 text-white" : "bg-white dark:bg-[#1b1b20] border border-[#3A3A3A]/10 dark:border-white/10 text-[#3A3A3A]/30 dark:text-white/30"}`}>{s.answered ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
                                        <span className="min-w-0 flex-1 truncate text-xs font-bold leading-tight">{s.title}</span>
                                        {s.is_required && !s.answered ? <span className="h-1.5 w-1.5 rounded-full bg-[#F47822]" /> : null}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Center — bench */}
                <div className="space-y-4">
                    {feedback ? <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-900 flex items-center gap-2"><Check className="h-4 w-4" />{feedback}</div> : null}

                    <div className="rounded-[24px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-3 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center justify-between px-2 pb-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#3A3A3A]/30 dark:text-white/30"><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {activeTool.toUpperCase()} · HBTronics Bench</span><span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> {timer.formatted ?? "--:--"} · {t("diagnostics.workspace.stepLabel")} {current ? idx + 1 : 0}/{steps.length}</span></div>
                        <div className="rounded-[16px] border border-[#3A3A3A]/5 dark:border-white/5 bg-[#FCFCFC] dark:bg-[#232329] p-4">
                            {current ? (
                                <>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-[#3A3A3A] px-3 py-1 text-xs font-black text-white">{t("diagnostics.workspace.stepLabel")} {current.position}</span>
                                        <span className="rounded-full bg-[#F47822]/10 px-3 py-1 text-xs font-bold text-[#F47822] border border-[#F47822]/15">{current.action_type}</span>
                                        {current.tool ? (
                                            <span className="rounded-full border border-[#3A3A3A]/10 bg-white px-3 py-1 text-xs font-bold text-[#3A3A3A]/60 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/60">
                                                {current.tool === "oscilloscope" ? t("diagnostics.briefing.toolNames.scope") : t(`diagnostics.briefing.toolNames.${current.tool}`)}
                                            </span>
                                        ) : null}
                                        {recommended === activeTool ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"><ShieldCheck className="h-3 w-3" /> {t("diagnostics.workspace.recommended")}</span> : null}
                                    </div>
                                    <h2 className="mt-3 text-[20px] font-black leading-tight tracking-tight text-[#3A3A3A] dark:text-[#ececef]">{current.title}</h2>
                                    {current.description ? <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/60 dark:text-white/60">{current.description}</p> : null}

                                    <div className="mt-5 rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-4 shadow-sm">
                                        <AnimatePresence mode="wait">
                                            <motion.div key={activeTool} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                                                {activeTool === "scanner" && <ScannerPanel dtc={scannerDtc} liveData={scannerLive} interpretation={scannerInterp} onDtcChange={(v) => ws.setScannerDtc(v)} onLiveDataChange={(v) => ws.setScannerLive(v)} onInterpretationChange={(v) => ws.setScannerInterp(v)} />}
                                                {activeTool === "multimeter" && (
                                                    <MultimeterPanel
                                                        key={`${current.id}:${current.bench?.component_ref ?? "A1"}`}
                                                        mode={mmMode}
                                                        redProbe={mmRed}
                                                        blackProbe={mmBlack}
                                                        reading={mmReading}
                                                        componentRef={current.bench?.component_ref ?? null}
                                                        onModeChange={(v) => ws.setMmMode(v)}
                                                        onRedProbeChange={(v) => ws.setMmRed(v)}
                                                        onBlackProbeChange={(v) => ws.setMmBlack(v)}
                                                        onReadingChange={(v) => ws.setMmReading(v)}
                                                    />
                                                )}
                                                {activeTool === "oscilloscope" && <OscilloscopePanel channel={scopeChannel} timeDiv={scopeTime} voltDiv={scopeVolt} observation={scopeObs} onChannelChange={(v) => ws.setScopeChannel(v)} onTimeDivChange={(v) => ws.setScopeTime(v)} onVoltDivChange={(v) => ws.setScopeVolt(v)} onObservationChange={(v) => ws.setScopeObs(v)} />}
                                                {activeTool === "location" && <LocationPanel component={locComponent} view={locView} note={locNote} onComponentChange={(v) => ws.setLocComponent(v)} onViewChange={(v) => ws.setLocView(v)} onNoteChange={(v) => ws.setLocNote(v)} />}
                                                {activeTool === "schematic" && <SchematicPanel from={schFrom} to={schTo} wire={schWire} verdict={schVerdict} onFromChange={(v) => ws.setSchFrom(v)} onToChange={(v) => ws.setSchTo(v)} onWireChange={(v) => ws.setSchWire(v)} onVerdictChange={(v) => ws.setSchVerdict(v)} />}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>

                                    <div className="mt-4 grid gap-3">
                                        <label className="block"><span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.workspace.finding")}</span><textarea value={finding} onChange={(e) => ws.setFinding(e.target.value)} rows={3} placeholder={t("diagnostics.workspace.findingPh")} className="mt-1.5 w-full rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-3.5 py-2.5 text-sm outline-none placeholder:text-[#3A3A3A]/30 dark:placeholder:text-white/30 focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/10" /></label>
                                        <label className="block"><span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.workspace.measured")} <span className="font-normal normal-case tracking-normal text-[#3A3A3A]/30 dark:text-white/30">{t("diagnostics.workspace.optional")}</span></span><input value={measurement} onChange={(e) => ws.setMeasurement(e.target.value)} placeholder={t("diagnostics.workspace.measuredPh")} className="mt-1.5 w-full rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-3.5 py-2.5 font-mono text-sm outline-none placeholder:text-[#3A3A3A]/30 dark:placeholder:text-white/30 focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/10" /></label>
                                    </div>

                                    <div className="mt-5 flex gap-2">
                                        <button type="button" disabled={!canPrev} onClick={() => canPrev && ws.setSelectedStepId(steps[idx - 1].id)} className="grid h-11 w-11 place-items-center rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] text-[#3A3A3A]/60 dark:text-white/60 hover:bg-[#FCFCFC] dark:hover:bg-[#232329] hover:text-[#3A3A3A] dark:hover:text-[#ececef] disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                                        <button type="button" onClick={() => void submitStep()} disabled={isSaving || finding.trim() === ""} className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 py-3 text-sm font-black text-white shadow-[0_8px_20px_rgba(244,120,34,0.22)] hover:bg-[#df6817] active:scale-[0.99] disabled:opacity-50">
                                            <span className="grid h-7 w-7 place-items-center rounded-full bg-white dark:bg-[#1b1b20] text-[#F47822]"><Send className="h-3.5 w-3.5" /></span>{isSaving ? t("diagnostics.workspace.recording") : t("diagnostics.workspace.recordStep")}<ArrowRight className="h-4 w-4 opacity-60 group-hover:translate-x-0.5 transition" />
                                        </button>
                                        <button type="button" disabled={!canNext} onClick={() => canNext && ws.setSelectedStepId(steps[idx + 1].id)} className="grid h-11 w-11 place-items-center rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] text-[#3A3A3A]/60 dark:text-white/60 hover:bg-[#FCFCFC] dark:hover:bg-[#232329] hover:text-[#3A3A3A] dark:hover:text-[#ececef] disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                                    </div>
                                    <button type="button" onClick={() => void submitAttempt()} disabled={isSaving || progress < 100} title={progress < 100 ? `Answer all required steps first — ${progress}%` : "Submit for server grading"} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3A3A3A] px-4 py-3 text-sm font-black text-white hover:bg-black disabled:opacity-40">
                                        <Award className="h-4 w-4 text-[#F47822]" /> {t("diagnostics.workspace.submitTitle")} <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">{progress}%</span>
                                    </button>
                                    {progress < 100 ? <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-[#3A3A3A]/40 dark:text-white/40"><AlertTriangle className="h-3 w-3" /> {t("diagnostics.workspace.submitLocked")}</p> : null}
                                </>
                            ) : (
                                <p className="py-10 text-center text-sm text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.workspace.noSteps")}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-[20px] border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-4 shadow-sm">
                        <div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.workspace.benchStatus")}</p><span className={`h-2 w-2 rounded-full ${progress === 100 ? "bg-emerald-500" : "bg-amber-500"}`} /></div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                            <div className="rounded-xl bg-[#FCFCFC] dark:bg-[#232329] p-3 border border-[#3A3A3A]/5 dark:border-white/5"><p className="text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.workspace.estScore")}</p><p className="mt-1 text-lg font-black text-[#3A3A3A] dark:text-[#ececef]">{estScore}</p></div>
                            <div className="rounded-xl bg-[#FCFCFC] dark:bg-[#232329] p-3 border border-[#3A3A3A]/5 dark:border-white/5"><p className="text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.workspace.hintCost")}</p><p className="mt-1 text-lg font-black text-[#F47822]">−{hintPenalty}</p></div>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#3A3A3A]/10 dark:bg-white/10"><div className="h-full rounded-full bg-[#3A3A3A] transition-all" style={{ width: `${progress}%` }} /></div>
                    </div>
                    <HintsPanel hints={hints?.hints ?? []} remaining={hints?.hints_remaining ?? 0} penaltyTotal={hints?.penalty_total ?? 0} disabled={isSaving} onUse={(id) => void revealHint(id).catch(() => undefined)} />
                    <div className="hidden lg:block rounded-2xl border border-dashed border-[#3A3A3A]/10 dark:border-white/10 bg-[#FFFBF7] dark:bg-[#F47822]/[0.08] p-3 text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">{t("diagnostics.workspace.proTip")} <b className="text-[#3A3A3A] dark:text-[#ececef]">Red on B20, black on ground</b> → <b className="text-[#3A3A3A] dark:text-[#ececef]">OHM</b>. {t("diagnostics.workspace.proTipEnd")}</div>
                </div>
            </div>
            <DiagnosticMentorPanel courseId={(attempt as unknown as { course_id?: string | null })?.course_id ?? null} stepTitle={current?.title ?? null} tool={tool} />
        </main>
    );
}
