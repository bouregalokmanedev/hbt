import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Lead, MeterProcedureEngine } from "../engine/meter.engine";
import { DmmPanel } from "../components/DevicePanels";
import { GuideCard } from "../components/GuideCard";
import { ProbeBench } from "../components/ProbeBench";
import { ProbeCableOverlay } from "../components/ProbeCableOverlay";
import { ComponentArt, refPhotoFallback } from "../components/ComponentArt";
import { WiringView } from "../components/WiringView";
import { useProbeDrag } from "../hooks/useProbeDrag";
import { sfx } from "../lib/sfx";

function fmtClock(total: number): string {
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function DiagnosisScreen({ engine }: { engine: MeterProcedureEngine }) {
    const { t } = useTranslation();
    const state = engine.getState();
    const comp = engine.component();
    const step = engine.step();
    const reading = engine.reading();
    const complaint = t(`simulator.dmmLab.bench.complaint.${comp.ref}`, { defaultValue: comp.name });
    const dragApi = useProbeDrag(engine);
    const leadRefs = useRef<Record<Lead, HTMLElement | null>>({ red: null, black: null });
    const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
    const [photoOpen, setPhotoOpen] = useState(false);
    const [muted, setMuted] = useState(() => sfx.isMuted());
    const photo = refPhotoFallback(comp.ref);

    const stepNo = Math.min(state.stepIdx + 1, comp.steps.length);
    const placement = engine.placement();

    useEffect(() => {
        if (!dragApi.drag) {
            setOrigin(null);
            return;
        }
        const el = leadRefs.current[dragApi.drag.lead];
        if (!el) return;
        const r = el.getBoundingClientRect();
        setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }, [dragApi.drag]);

    useEffect(() => {
        if (state.feedback?.tone === "bad") sfx.play("bad");
        else if (state.feedback?.kind === "clear") sfx.play("pass");
        else if (state.feedback?.kind === "found") sfx.play("fault");
        else if (state.feedback?.kind === "stepOk") sfx.play("good");
        else if (state.feedback?.kind === "hint") sfx.play("hint");
        // Only fire when feedback identity changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.feedback?.kind, state.feedback?.tone, state.finished]);

    useEffect(() => {
        if (reading.status === "ok") sfx.play("reading");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reading.value, reading.status]);

    const feedbackText =
        state.feedback?.kind === "takeMeasurement"
            ? t("simulator.dmmLab.fbNeedProbes")
            : state.feedback?.kind === "wrongYes"
              ? state.feedback.detail
                  ? t("simulator.dmmLab.fbWrongWithReading", {
                        value: state.feedback.detail.value,
                        spec: state.feedback.detail.spec,
                        unit: state.feedback.detail.unit ?? "",
                    })
                  : t("simulator.dmmLab.fbWrongFault")
              : state.feedback?.kind === "wrongNo"
                ? state.feedback.detail
                    ? t("simulator.dmmLab.fbWrongWithReading", {
                          value: state.feedback.detail.value,
                          spec: state.feedback.detail.spec,
                          unit: state.feedback.detail.unit ?? "",
                      })
                    : t("simulator.dmmLab.fbWrongSpec")
                : state.feedback?.kind === "stepOk"
                  ? t("simulator.dmmLab.fbStepOk")
                  : state.feedback?.kind === "hint"
                    ? t("simulator.dmmLab.fbHintSoft")
                    : state.feedback?.kind === "clear"
                      ? t("simulator.dmmLab.fbClear", { ref: comp.ref, score: state.score })
                      : state.feedback?.kind === "found"
                        ? t("simulator.dmmLab.fbFound", {
                              ref: comp.ref,
                              n: state.stepIdx + 1,
                              spec: step.spec,
                              bad: step.bad,
                          })
                        : null;

    const onJack = (lead: Lead, jack: "COM" | "V/Ω" | "mA" | "A") => {
        engine.setJack(lead, jack);
    };

    return (
        <div className="relative space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1F6AE1]">
                        {t("simulator.dmmLab.bench.diagnosisOf", { done: stepNo, total: comp.steps.length })}
                    </p>
                    <h3 className="mt-1.5 flex flex-wrap items-center gap-2 text-xl font-black tracking-tight text-[#3A3A3A] dark:text-white">
                        <span className="inline-block rounded-lg bg-[#1F6AE1]/10 px-2 py-0.5 font-mono text-sm text-[#1F6AE1]" dir="ltr">
                            {comp.ref}
                        </span>
                        <span>{complaint}</span>
                    </h3>
                    <p className="mt-1 font-mono text-[11px] text-[#3A3A3A]/45 dark:text-white/45" dir="ltr">
                        {fmtClock(state.elapsed)} · {t("simulator.dmmLab.score")} {state.score} / 100
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {photo && (
                        <button
                            type="button"
                            onClick={() => setPhotoOpen((v) => !v)}
                            className="rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-1.5 text-[11px] font-bold text-[#3A3A3A] transition hover:border-[#F47822]/40 dark:border-white/10 dark:text-white"
                        >
                            {photoOpen ? t("simulator.dmmLab.bench.hidePhoto") : t("simulator.dmmLab.bench.showPhoto")}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setMuted(sfx.toggleMute())}
                        aria-pressed={muted}
                        className="rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-1.5 text-[11px] font-bold text-[#3A3A3A] transition hover:border-[#F47822]/40 dark:border-white/10 dark:text-white"
                    >
                        {muted ? t("simulator.dmmLab.bench.sfxOff") : t("simulator.dmmLab.bench.sfxOn")}
                    </button>
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_300px]">
                {/* Procedure */}
                <section className="min-w-0 space-y-3">
                    <GuideCard engine={engine} />
                    <ol className="space-y-2">
                        {comp.steps.map((s, i) => {
                            const isDone = i < state.stepIdx;
                            const active = i === state.stepIdx && !state.finished;
                            const revealSpec = isDone || active === false || engine.measurementReady();
                            return (
                                <li
                                    key={i}
                                    className={`rounded-xl border p-3.5 ${
                                        active
                                            ? "border-[#1F6AE1] bg-[#FBFDFF] shadow-sm dark:bg-[#1F6AE1]/[.07]"
                                            : isDone
                                              ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/[0.07]"
                                              : "border-[#3A3A3A]/10 opacity-70 dark:border-white/10"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black ${
                                                isDone
                                                    ? "bg-emerald-500 text-white"
                                                    : active
                                                      ? "bg-[#1F6AE1] text-white"
                                                      : "bg-[#3A3A3A]/10 text-[#3A3A3A]/50 dark:bg-white/10 dark:text-white/50"
                                            }`}
                                        >
                                            {isDone ? "✓" : i + 1}
                                        </span>
                                        <span className="flex-1 text-sm font-bold text-[#3A3A3A] dark:text-white">
                                            {t("simulator.dmmLab.step")} {i + 1}
                                            {revealSpec ? (
                                                <>
                                                    {" · "}
                                                    {s.mode} ·{" "}
                                                    <span dir="ltr">{s.spec}</span>
                                                </>
                                            ) : (
                                                <span className="ms-1 font-mono text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                                                    {t("simulator.dmmLab.bench.specLocked")}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    {active && (
                                        <div className="mt-3 space-y-3">
                                            {s.table && engine.measurementReady() && (
                                                <table className="w-full min-w-0 overflow-hidden rounded-xl border border-[#3A3A3A]/10 text-xs dark:border-white/10">
                                                    <thead>
                                                        <tr className="bg-[#0f1115] text-white">
                                                            {s.table.head.map((h) => (
                                                                <th key={h} className="px-3 py-1.5 text-left font-bold">
                                                                    {h}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#3A3A3A]/[.06] dark:divide-white/[0.06]">
                                                        {s.table.rows.map((row) => (
                                                            <tr key={row[0]}>
                                                                {row.map((cell) => (
                                                                    <td key={cell} dir="ltr" className="px-3 py-1.5 font-mono text-[#3A3A3A] dark:text-white">
                                                                        {cell}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                            <div className="rounded-xl border border-[#3A3A3A]/10 bg-white p-3 dark:border-white/10 dark:bg-[#1b1b20]">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-[#1F6AE1]">
                                                    {t("simulator.dmmLab.bench.yourMeasurement")}
                                                </p>
                                                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-bold">
                                                    <span className={placement.modeOk ? "text-emerald-600" : "text-[#3A3A3A]/50 dark:text-white/50"}>
                                                        ✓ {t("simulator.dmmLab.bench.guideDialDone")}
                                                    </span>
                                                    <span className={placement.jackOk ? "text-emerald-600" : "text-[#3A3A3A]/50 dark:text-white/50"}>
                                                        ✓ {t("simulator.dmmLab.bench.guideJackDone")}
                                                    </span>
                                                    <span className={placement.redOk && !!state.red ? "text-emerald-600" : "text-[#3A3A3A]/50 dark:text-white/50"}>
                                                        ✓ {t("simulator.dmmLab.bench.guideRedDone")}
                                                    </span>
                                                    <span className={placement.blackOk && !!state.black ? "text-emerald-600" : "text-[#3A3A3A]/50 dark:text-white/50"}>
                                                        ✓ {t("simulator.dmmLab.bench.guideBlackDone")}
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => engine.answer(true)}
                                                        className="rounded-xl bg-[#3A3A3A] px-4 py-2 text-xs font-black text-white transition hover:bg-black"
                                                    >
                                                        {t("simulator.dmmLab.yesOk")}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => engine.answer(false)}
                                                        className="rounded-xl border border-[#3A3A3A]/10 bg-white px-4 py-2 text-xs font-black text-[#3A3A3A] transition hover:border-[#F47822]/40 dark:border-white/10 dark:bg-transparent dark:text-white"
                                                    >
                                                        {t("simulator.dmmLab.noFault")}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => engine.useHint()}
                                                        disabled={state.hintUsed}
                                                        className="rounded-xl border border-dashed border-[#3A3A3A]/20 px-4 py-2 text-xs font-bold text-[#3A3A3A]/60 transition hover:text-[#3A3A3A] disabled:opacity-40 dark:text-white/60"
                                                    >
                                                        {t("simulator.dmmLab.hintSoft")}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </section>

                {/* Stage: component art + wiring */}
                <section className="min-w-0 space-y-3">
                    <div className="flex items-center gap-3 rounded-xl border border-[#3A3A3A]/10 bg-white p-3 dark:border-white/10 dark:bg-[#1b1b20]">
                        <ComponentArt sym={comp.sym} className="h-16 w-24 shrink-0" />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#3A3A3A] dark:text-white">{comp.name}</p>
                            <p className="mt-0.5 text-[11px] text-[#3A3A3A]/55 dark:text-white/55">{comp.group}</p>
                            <p className="mt-0.5 font-mono text-[10px] text-[#3A3A3A]/45 dark:text-white/45" dir="ltr">
                                {comp.code} · {comp.ecu.code}
                            </p>
                        </div>
                        {photo && photoOpen && (
                            <img
                                src={photo}
                                alt={comp.name}
                                className="h-20 w-28 rounded-lg object-cover ring-1 ring-[#3A3A3A]/10 dark:ring-white/10"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                }}
                            />
                        )}
                    </div>
                    <div className="min-h-[340px]">
                        <WiringView engine={engine} onPinClick={dragApi.onPinClick} />
                    </div>
                </section>

                {/* Instrument column */}
                <section className="min-w-0 space-y-3">
                    <DmmPanel
                        mode={state.mode}
                        reading={reading}
                        onMode={(m) => engine.setMode(m)}
                        redJack={state.redJack}
                        blackJack={state.blackJack}
                        onJack={onJack}
                        jackError={state.mode !== "OFF" && !placement.jackOk}
                    />
                    <ProbeBench
                        engine={engine}
                        armedLead={dragApi.armed}
                        onArm={dragApi.arm}
                        onPointerDownLead={dragApi.onLeadPointerDown}
                        registerRef={(lead, el) => {
                            leadRefs.current[lead] = el;
                        }}
                    />
                </section>
            </div>

            {state.feedback && (
                <p
                    role="status"
                    className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${
                        state.feedback.tone === "good"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : state.feedback.tone === "bad"
                              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                    }`}
                >
                    {feedbackText ?? state.feedback.kind}
                </p>
            )}
            {state.finished && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {state.feedback?.kind === "found" ? t("simulator.dmmLab.bench.finishedFound") : t("simulator.dmmLab.bench.finishedClear")} ·{" "}
                    {t("simulator.dmmLab.score")} {state.score} / 100
                </p>
            )}

            <ProbeCableOverlay drag={dragApi.drag} origin={origin} />
        </div>
    );
}
