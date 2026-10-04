import type { SchematicWorkspaceEngine, WorkspaceState } from "../engine/workspace.engine";
import { SCH_WIRES, SCH_VEHICLE, schByKey, distinctEcuPins, relatedTo, type SchWire } from "../data/schematic.data";
import { swatchBg } from "../lib";
import clsx from "clsx";
import { CheckCircle2, XCircle, AlertTriangle, Eye, Brain, Trophy, ChevronRight, ExternalLink, X, Zap, Layers, FileText } from "lucide-react";

/** Right inspector — task panel + selection details with platform card language. */
export function Inspector({ engine, state, t, tc }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any; tc: any }) {
    const taskMode = state.mode === "training" || state.mode === "practice" || state.mode === "exam";
    const sel = engine.component(state.sel);

    return (
        <aside className="flex w-[360px] shrink-0 flex-col overflow-hidden border-s border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
            {taskMode ? <TaskPanel engine={engine} state={state} t={t} tc={tc} /> : null}
            <div className="min-h-0 flex-1 overflow-y-auto">
                {sel ? <SelectionPanel engine={engine} state={state} t={t} tc={tc} /> : <NoSelection engine={engine} t={t} tc={tc} />}
            </div>
        </aside>
    );
}

function ProgressBar({ pct }: { pct: number }) {
    return (
        <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#3A3A3A]/10 dark:bg-white/10">
                <div className="h-full rounded-full bg-[#B85708] transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="font-mono text-xs font-black text-[#B85708]">{pct}%</span>
        </div>
    );
}

function TaskPanel({ engine, state, t, tc }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any; tc: any }) {
    const exam = state.mode === "exam", practice = state.mode === "practice";
    const pct = engine.accuracyPct();
    const q = practice ? engine.practiceQuestion() : null;
    const kicker = state.mode === "training" ? t("task.trainingKicker") : practice ? t("task.practiceKicker") : t("task.examKicker");
    const counter = state.mode === "training" ? t("task.counter", { n: (state.taskIdx % 8) + 1, total: 8 }) : exam ? t("task.counter", { n: state.examIdx + 1, total: 6 }) : "auto";

    const prompt =
        state.mode === "training"
            ? tc(`schematic.task.${state.taskIdx % 8}.prompt`)
            : practice
              ? tc("schematic.practice.prompt", { name: schByKey(q!.targetKey)!.name, pin: q!.targetPin })
              : state.examSubmitted
                ? t("task.examSubmitted", { pct: `${Math.round((100 * engine.examCorrect()) / 6)}%` })
                : tc(`schematic.exam.${state.examIdx}.prompt`);

    const fb = state.feedback;
    const fbText =
        fb == null
            ? null
            : state.mode === "training"
              ? fb.ok
                  ? `${tc("schematic.feedback.correct")} ${tc(`schematic.task.${state.taskIdx % 8}.explain`)}`
                  : tc("schematic.feedback.wrong", { code: engine.component(state.sel)?.code ?? "", name: engine.component(state.sel)?.name ?? "" })
              : practice
                ? fb.ok
                    ? tc("schematic.feedback.practiceCorrect", { pin: q!.answer, name: schByKey(q!.targetKey)!.name, tpin: q!.targetPin })
                    : tc("schematic.feedback.practiceWrong", { code: schByKey(q!.targetKey)!.code })
                : tc("schematic.feedback.examRecorded");

    const isCorrect = fb?.ok === true;
    const isWrong = fb?.ok === false;

    return (
        <div className={clsx("shrink-0 border-b p-4", exam ? "border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20" : "border-[#F59E0B]/20 bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] dark:from-[#B85708]/10 dark:to-[#B85708]/5")}>
            <div className="mb-3 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B85708] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                    <Brain className="h-3 w-3" />
                    {kicker}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 font-mono text-xs font-bold text-[#3A3A3A] shadow-sm ring-1 ring-[#3A3A3A]/10 dark:bg-[#1b1b20] dark:text-white dark:ring-white/10">{counter}</span>
            </div>
            <h3 className="text-[15px] font-bold leading-6 text-[#3A3A3A] dark:text-white">{prompt}</h3>
            {fbText ? (
                <div className={clsx("mt-3 flex gap-2 rounded-xl border p-3 text-sm leading-5", isCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-200" : isWrong ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-200" : "border-amber-200 bg-amber-50 text-amber-800")}>
                    {isCorrect ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : isWrong ? <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                    <span>{fbText}</span>
                </div>
            ) : null}

            {practice ? (
                <div className="mt-3 grid gap-2">
                    {q!.options.map((o, idx) => (
                        <button
                            key={o}
                            type="button"
                            onClick={() => engine.answerPractice(o)}
                            dir="ltr"
                            className="group flex items-center gap-3 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-3 text-start transition hover:border-[#B85708]/30 hover:bg-[#FFF7ED] dark:border-white/10 dark:bg-[#1b1b20] dark:hover:bg-white/[0.06]"
                        >
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#3A3A3A] font-mono text-xs font-black text-white group-hover:bg-[#B85708]">{String.fromCharCode(65 + idx)}</span>
                            <span className="font-mono text-sm font-bold text-[#3A3A3A] dark:text-white">{t("task.option", { pin: o })}</span>
                            <ChevronRight className="ms-auto h-4 w-4 text-[#3A3A3A]/20 group-hover:text-[#B85708]" />
                        </button>
                    ))}
                </div>
            ) : null}

            <div className="mt-4 space-y-2">
                <ProgressBar pct={pct} />
                <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#3A3A3A]/60 dark:text-white/60">{t("sidebar.attempts", { n: state.attempts })}</span>
                    <span className="font-mono font-bold text-[#B85708]">{pct}% accuracy</span>
                </div>
            </div>
            <div className="mt-3 flex gap-2">
                <button
                    type="button"
                    onClick={() => (exam ? (state.examSubmitted ? engine.restartExam() : state.examIdx >= 5 ? engine.submitExam() : engine.nextExam()) : engine.nextTask())}
                    className="flex-1 rounded-xl bg-[#B85708] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#9A4A06]"
                >
                    {exam ? (state.examSubmitted ? t("task.restart") : state.examIdx >= 5 ? t("task.submit") : t("task.nextQuestion")) : t("task.next")}
                </button>
                <button type="button" onClick={() => engine.reveal()} className="rounded-xl border border-[#3A3A3A]/10 bg-white px-4 py-2.5 text-sm font-bold text-[#3A3A3A]/70 transition hover:bg-[#F8F7F6] dark:border-white/10 dark:bg-white/10 dark:text-white/70">
                    <Eye className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div className="rounded-xl bg-[#F8F7F6] p-3 dark:bg-white/[0.06]">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#3A3A3A]/40 dark:text-white/40">
                {icon}
                {label}
            </div>
            <div className="mt-1 font-mono text-sm font-black text-[#3A3A3A] dark:text-white">{value}</div>
        </div>
    );
}

function SelectionPanel({ engine, state, t, tc }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any; tc: any }) {
    const c = engine.component(state.sel)!;
    const rows = engine.selectedWires();
    const pins = new Set(rows.map(({ wire }) => wire.ecuPin));
    const selWireRow: SchWire | null = state.selWire != null ? SCH_WIRES[state.selWire] : null;
    const isGround = c.type === "ground";
    const relatedKeys = relatedTo(state.sel!);

    return (
        <div>
            {/* header */}
            <div className="border-b border-[#3A3A3A]/10 bg-gradient-to-br from-white to-[#F8F7F6] p-4 dark:from-[#1b1b20] dark:to-[#1b1b20] dark:border-white/10">
                <div className="mb-3 flex items-center gap-2">
                    <span dir="ltr" className="rounded-lg bg-[#B85708] px-2.5 py-1 font-mono text-sm font-black text-white shadow-sm">{c.code}</span>
                    <span className="rounded-full border border-[#3A3A3A]/10 bg-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/60 dark:border-white/10 dark:bg-white/10 dark:text-white/60">{typeLabel(c.type)}</span>
                    <div className="flex-1" />
                    <button type="button" onClick={() => engine.clearSelection()} aria-label={t("inspector.clear")} className="grid h-7 w-7 place-items-center rounded-xl border border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/60 transition hover:bg-[#3A3A3A] hover:text-white dark:border-white/10 dark:bg-white/10 dark:text-white/60">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
                <h2 className="text-[18px] font-black leading-tight text-[#3A3A3A] dark:text-white">{c.name}</h2>
                <div className="mt-3 grid grid-cols-3 gap-2">
                    <Stat label={t("inspector.connections")} value={String(rows.length)} icon={<Zap className="h-3 w-3" />} />
                    <Stat label={t("inspector.ecuPins")} value={String(pins.size)} icon={<Layers className="h-3 w-3" />} />
                    <Stat label={t("inspector.sheet")} value="R16" icon={<FileText className="h-3 w-3" />} />
                </div>
            </div>

            {/* selected wire */}
            {selWireRow ? (
                <div className="border-b border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-amber-900/30 dark:from-amber-950/20 dark:to-orange-950/10">
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#B85708]">
                        <div className="h-1 w-1 rounded-full bg-[#B85708] animate-pulse" />
                        {t("inspector.selectedWire")}
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-[#3A3A3A]/5 dark:bg-[#1b1b20] dark:ring-white/10">
                        <span className="h-8 w-8 shrink-0 rounded-lg border-2 border-white shadow-sm" style={{ background: swatchBg(selWireRow.ecuColour) }} />
                        <span dir="ltr" className="font-mono text-sm font-black text-[#3A3A3A] dark:text-white">{selWireRow.ecuColour}</span>
                        <span className="ms-auto rounded-full bg-[#B85708]/10 px-2 py-1 font-mono text-xs font-bold text-[#B85708]">{selWireRow.ecuPin}</span>
                    </div>
                    <div className="mt-3 grid gap-2">
                        <WireEnd pin={selWireRow.ecuPin} name={t("inspector.from")} />
                        <div className="flex justify-center">
                            <div className="h-4 w-px bg-[#3A3A3A]/20 dark:bg-white/20" />
                        </div>
                        <WireEnd pin={t("inspector.pin", { n: selWireRow.targetPin })} name={`${schByKey(selWireRow.target)!.code} ${schByKey(selWireRow.target)!.name}`} />
                    </div>
                    {selWireRow.mismatch ? (
                        <div className="mt-3 flex gap-2 rounded-xl border border-amber-300 bg-amber-100 p-3 text-sm leading-5 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{t("inspector.mismatchNote", { a: selWireRow.ecuColour, b: selWireRow.targetColour })}</span>
                        </div>
                    ) : null}
                    <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-xs leading-5 text-[#3A3A3A]/60 dark:bg-white/5 dark:text-white/60">{tc("schematic.na.wire")}</p>
                </div>
            ) : null}

            {/* pin table */}
            <div className="px-4 pb-2 pt-4">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#3A3A3A]/40 dark:text-white/40">
                        <Layers className="h-3.5 w-3.5" />
                        {state.sel === "E1" ? t("inspector.allRows") : t("inspector.pinRows")}
                    </span>
                    <span className="rounded-full bg-[#3A3A3A] px-2 py-0.5 font-mono text-xs font-bold text-white dark:bg-white dark:text-[#3A3A3A]">{rows.length}</span>
                </div>
            </div>
            <div className="flex flex-col gap-1 px-3 pb-4">
                {rows.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-[#3A3A3A]/10 bg-[#F8F7F6] p-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm dark:bg-white/10">
                            <FileText className="h-5 w-5 text-[#3A3A3A]/30 dark:text-white/30" />
                        </div>
                        <p className="mt-2 text-sm font-medium text-[#3A3A3A]/60 dark:text-white/60">{tc("schematic.na.pins")}</p>
                    </div>
                ) : (
                    rows.slice(0, 200).map(({ wire, idx }) => {
                        const on = state.selWire === idx;
                        const target = schByKey(wire.target)!;
                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => engine.selectWire(idx)}
                                aria-current={on ? "true" : undefined}
                                className={clsx(
                                    "group flex items-center gap-3 rounded-xl border px-3 py-3 text-start transition",
                                    on ? "border-[#B85708] bg-[#B85708] text-white shadow-sm" : "border-[#3A3A3A]/10 bg-white hover:border-[#B85708]/20 hover:bg-[#FFF7ED] dark:border-white/10 dark:bg-[#1b1b20] dark:hover:bg-white/[0.06]",
                                )}
                            >
                                <span className="h-4 w-4 shrink-0 rounded-md border-2 border-white shadow-sm" style={{ background: swatchBg(wire.ecuColour) }} />
                                <span dir="ltr" className={clsx("w-12 shrink-0 rounded-lg px-2 py-1 font-mono text-xs font-black", on ? "bg-white/20 text-white" : "bg-[#F8F7F6] text-[#3A3A3A] dark:bg-white/10 dark:text-white")}>
                                    {wire.ecuPin}
                                </span>
                                <span className={clsx("min-w-0 flex-1 truncate text-sm font-medium", on ? "text-white" : "text-[#3A3A3A] dark:text-white")}>{state.sel === "E1" ? `${target.code} ${target.name}` : `${wire.ecuColour} → ${target.name}`}</span>
                                <span dir="ltr" className={clsx("rounded-full px-2 py-0.5 font-mono text-xs font-bold", on ? "bg-white/20 text-white" : "bg-[#3A3A3A]/10 text-[#3A3A3A]/60 dark:bg-white/10 dark:text-white/60")}>
                                    {wire.targetPin}
                                </span>
                                {wire.mismatch ? <span className={clsx("h-2 w-2 shrink-0 rounded-full", on ? "bg-white" : "bg-amber-500")} title={t("inspector.mismatchNote", { a: wire.ecuColour, b: wire.targetColour })} /> : null}
                                <ChevronRight className={clsx("h-4 w-4 shrink-0 transition", on ? "text-white/60" : "text-[#3A3A3A]/20 group-hover:text-[#B85708]")} />
                            </button>
                        );
                    })
                )}
            </div>

            {/* shared ground */}
            {isGround ? (
                <div className="border-t border-[#3A3A3A]/10 bg-emerald-50/50 p-4 dark:border-white/10 dark:bg-emerald-950/10">
                    <div className="mb-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        <Zap className="h-3.5 w-3.5" />
                        {t("inspector.sharedGround")}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {rows.map(({ wire }, i) => (
                            <span key={i} dir="ltr" className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 font-mono text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                                {wire.ecuPin}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* related */}
            <div className="border-t border-[#3A3A3A]/10 p-4 dark:border-white/10">
                <div className="mb-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#3A3A3A]/40 dark:text-white/40">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t("inspector.related")}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {relatedKeys.slice(0, 14).map((k) => (
                        <button
                            key={k}
                            type="button"
                            onClick={() => engine.select(k)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#3A3A3A]/10 bg-white px-3 py-1.5 text-sm font-medium text-[#3A3A3A] shadow-sm transition hover:border-[#B85708]/30 hover:bg-[#B85708]/5 hover:text-[#B85708] dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                        >
                            <span dir="ltr" className="rounded bg-[#3A3A3A] px-1.5 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-white dark:text-[#3A3A3A]">{schByKey(k)!.code}</span>
                            {shortName(schByKey(k)!.name)}
                        </button>
                    ))}
                </div>
            </div>

            {/* OEM */}
            <div className="border-t border-[#3A3A3A]/10 bg-[#F8F7F6] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="mb-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#3A3A3A]/40 dark:text-white/40">
                    <FileText className="h-3.5 w-3.5" />
                    {t("inspector.oem")}
                </div>
                <div className="space-y-2">
                    {(["image", "housing", "location", "rating", "repair", "notes"] as const).map((f) => (
                        <div key={f} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 dark:bg-[#1b1b20]">
                            <span className="text-sm font-medium text-[#3A3A3A] dark:text-white/80">{t(`oem.${f}`)}</span>
                            <span className="text-sm text-[#3A3A3A]/40 dark:text-white/40">{tc("schematic.na.field")}</span>
                        </div>
                    ))}
                    <div className="flex items-center justify-between rounded-xl bg-[#B85708] px-3 py-2.5 text-white">
                        <span className="text-sm font-bold">{t("inspector.sheet")}</span>
                        <span dir="ltr" className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-xs font-bold">{SCH_VEHICLE}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function WireEnd({ pin, name }: { pin: string; name: string }) {
    return (
        <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-[#3A3A3A]/5 dark:bg-[#1b1b20] dark:ring-white/10">
            <span dir="ltr" className="rounded-lg bg-[#3A3A3A] px-2 py-1 font-mono text-xs font-black text-white dark:bg-white dark:text-[#3A3A3A]">{pin}</span>
            <span className="truncate text-sm font-medium text-[#3A3A3A] dark:text-white">{name}</span>
        </div>
    );
}

function NoSelection({ engine, t, tc }: { engine: SchematicWorkspaceEngine; t: any; tc: any }) {
    const A = distinctEcuPins("A").length, B = distinctEcuPins("B").length;
    const summary = [
        { label: t("summary.components"), value: String(engine.components().length), icon: <Layers className="h-4 w-4" /> },
        { label: t("summary.rows"), value: String(engine.wires().length), icon: <FileText className="h-4 w-4" /> },
        { label: t("summary.connectors"), value: t("summary.connectorsValue"), icon: <Zap className="h-4 w-4" /> },
        { label: t("summary.pins"), value: String(A + B), icon: <Target className="h-4 w-4" /> },
        { label: t("summary.grounds"), value: t("summary.groundsValue"), icon: <Zap className="h-4 w-4" /> },
        { label: t("summary.can"), value: "2", icon: <Network className="h-4 w-4" /> },
    ];
    return (
        <div className="p-4">
            <div className="mb-4 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#3A3A3A]/40 dark:text-white/40">
                <FileText className="h-3.5 w-3.5" />
                {t("inspector.information")}
            </div>
            <div className="rounded-2xl border-2 border-dashed border-[#3A3A3A]/15 bg-[#F8F7F6] p-6 text-center dark:border-white/15 dark:bg-white/[0.03]">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm dark:bg-white/10">
                    <Trophy className="h-6 w-6 text-[#B85708]" />
                </div>
                <div className="mt-3 text-[15px] font-black text-[#3A3A3A] dark:text-white">{tc("schematic.empty.title")}</div>
                <p className="mx-auto mt-1 max-w-[260px] text-sm leading-5 text-[#3A3A3A]/60 dark:text-white/60">{tc("schematic.empty.body")}</p>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#B85708]/10 px-3 py-1 text-xs font-bold text-[#B85708]">
                    <Eye className="h-3.5 w-3.5" />
                    Click a component on the diagram
                </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#3A3A3A]/40 dark:text-white/40">
                <Layers className="h-3.5 w-3.5" />
                {t("inspector.sheetSummary")}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
                {summary.map((s) => (
                    <div key={s.label} className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-3 dark:border-white/10 dark:bg-[#1b1b20]">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#3A3A3A]/40 dark:text-white/40">
                            {s.icon}
                            {s.label}
                        </div>
                        <div dir="ltr" className="mt-1 font-mono text-lg font-black text-[#3A3A3A] dark:text-white">{s.value}</div>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#3A3A3A]/40 dark:text-white/40">
                <Zap className="h-3.5 w-3.5" />
                {t("inspector.connectors")}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
                {(["A", "B"] as const).map((code) => (
                    <button
                        key={code}
                        type="button"
                        onClick={() => engine.openConnector(code)}
                        className="group rounded-2xl border border-[#3A3A3A]/10 bg-white p-4 text-start transition hover:border-[#B85708]/30 hover:shadow-sm dark:border-white/10 dark:bg-[#1b1b20]"
                    >
                        <div dir="ltr" className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#B85708] font-mono text-sm font-black text-white shadow-sm">{code}</div>
                        <div className="mt-2 text-sm font-bold text-[#3A3A3A] dark:text-white">{t("inspector.connector", { code })}</div>
                        <div className="text-xs font-medium text-[#3A3A3A]/60 dark:text-white/60">{t("connector.pinsInTable", { code, n: code === "A" ? 34 : 77 })}</div>
                        <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#B85708] group-hover:gap-1.5">
                            {t("inspector.viewPins")} <ChevronRight className="h-3 w-3" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// small pure helpers (presentation)
function typeLabel(type: string) {
    return ({ ecu: "ECU", relay: "RELAY", fuse: "FUSE", ground: "GROUND", network: "CAN", connector: "CONNECTOR", module: "MODULE", sensor: "SENSOR", actuator: "ACTUATOR", switch: "SWITCH" } as Record<string, string>)[type] ?? type;
}
function shortName(n: string) {
    return n.length > 22 ? n.slice(0, 21) + "…" : n;
}

function Target({ className }: { className?: string }) {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className={className}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="7" cy="7" r="2" fill="currentColor" />
        </svg>
    );
}
function Network({ className }: { className?: string }) {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className={className}>
            <path d="M7 1v4M7 9v4M1 7h4M9 7h4M3.5 3.5l2.8 2.8M7.7 7.7l2.8 2.8M10.5 3.5L7.7 6.3M3.5 10.5l2.8-2.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    );
}
