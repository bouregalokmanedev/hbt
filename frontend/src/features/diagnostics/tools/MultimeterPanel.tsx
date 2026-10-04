import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import type { Lead } from "@/features/simulator/multimeter/engine/meter.engine";
import { MeterProcedureEngine } from "@/features/simulator/multimeter/engine/meter.engine";
import { DmmPanel } from "@/features/simulator/multimeter/components/DevicePanels";
import { GuideCard } from "@/features/simulator/multimeter/components/GuideCard";
import { ProbeBench } from "@/features/simulator/multimeter/components/ProbeBench";
import { ProbeCableOverlay } from "@/features/simulator/multimeter/components/ProbeCableOverlay";
import { ComponentArt, refPhotoFallback } from "@/features/simulator/multimeter/components/ComponentArt";
import { WiringView } from "@/features/simulator/multimeter/components/WiringView";
import { useProbeDrag } from "@/features/simulator/multimeter/hooks/useProbeDrag";
import { sfx } from "@/features/simulator/multimeter/lib/sfx";
import { ProbeWireOverlay } from "@/features/simulator/multimeter/probe/ProbeWireOverlay";
import { jackViewportPoint } from "@/features/simulator/multimeter/probe/probeGeometry";

type Props = {
    mode: string;
    redProbe: string;
    blackProbe: string;
    reading: string;
    /** Safe focus only — never expected pins/spec. Defaults to first static procedure. */
    componentRef?: string | null;
    onModeChange(v: string): void;
    onRedProbeChange(v: string): void;
    onBlackProbeChange(v: string): void;
    onReadingChange(v: string): void;
};

function readingDisplay(value: string, unit: string): string {
    if (!value) return "";
    return unit ? `${value} ${unit}` : value;
}

/**
 * Student diagnostics multimeter bench — hosts a local MeterProcedureEngine
 * focused on the step's component. Dial/probes/reading sync up to the
 * workspace store for payload build; no Yes/No judge (step submission owns scoring).
 */
export function MultimeterPanel({
    mode,
    redProbe,
    blackProbe,
    reading,
    componentRef,
    onModeChange,
    onRedProbeChange,
    onBlackProbeChange,
    onReadingChange,
}: Props) {
    const { t } = useTranslation();
    const focus = componentRef?.trim() || "A1";
    const engine = useMemo(
        () => new MeterProcedureEngine({ vehicleId: `diagnostics:${focus}`, focus, randomFault: false }),
        [focus],
    );
    useEffect(() => () => engine.dispose(), [engine]);

    const state = useSyncExternalStore(
        (listener) => engine.subscribe(listener),
        () => engine.getState(),
        () => engine.getState(),
    );
    const live = engine.reading();
    const dragApi = useProbeDrag(engine);
    const leadRefs = useRef<Record<Lead, HTMLElement | null>>({ red: null, black: null });
    const gridRef = useRef<HTMLDivElement>(null);
    const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
    const [photoOpen, setPhotoOpen] = useState(false);
    const [muted, setMuted] = useState(() => sfx.isMuted());
    const comp = engine.component();
    const placement = engine.placement();
    const photo = refPhotoFallback(comp.ref);

    // Keep parent store in sync with engine (source of truth for the bench).
    useEffect(() => {
        if (mode !== state.mode) onModeChange(state.mode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.mode]);
    useEffect(() => {
        const r = state.red ?? "";
        const b = state.black ?? "";
        if (redProbe !== r) onRedProbeChange(r);
        if (blackProbe !== b) onBlackProbeChange(b);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.red, state.black]);
    useEffect(() => {
        if (live.status === "off" || live.status === "unseated") {
            if (reading !== "") onReadingChange("");
            return;
        }
        const display = readingDisplay(live.value, live.unit);
        if (reading !== display) onReadingChange(display);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [live.value, live.unit, live.status]);
    useEffect(() => {
        if (live.status === "ok") sfx.play("reading");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [live.value, live.status]);

    useEffect(() => {
        if (!dragApi.drag) {
            setOrigin(null);
            return;
        }
        // Cable leaves the meter front jack; fall back to the lead token.
        const jack = dragApi.drag.lead === "red" ? state.redJack : state.blackJack;
        const fromJack = jackViewportPoint(jack, gridRef.current ?? document);
        if (fromJack) {
            setOrigin(fromJack);
            return;
        }
        const el = leadRefs.current[dragApi.drag.lead];
        if (!el) return;
        const r = el.getBoundingClientRect();
        setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }, [dragApi.drag, state.redJack, state.blackJack]);

    const statusChip =
        live.status === "ok"
            ? { label: t("diagnostics.tools.multimeter.statusReady"), cls: "border-emerald-300 bg-emerald-50 text-emerald-700" }
            : live.status === "wrongJack"
              ? { label: t("simulator.dmmLab.wrongJack"), cls: "border-red-200 bg-red-50 text-red-700" }
              : live.status === "wrongMode"
                ? { label: t("simulator.dmmLab.wrongMode"), cls: "border-amber-200 bg-amber-50 text-amber-700" }
                : live.status === "wrongPoints"
                  ? { label: t("diagnostics.tools.multimeter.statusWrongPoints"), cls: "border-amber-200 bg-amber-50 text-amber-700" }
                  : live.status === "off"
                    ? { label: t("diagnostics.tools.multimeter.statusOff"), cls: "border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/50" }
                    : { label: t("diagnostics.tools.multimeter.statusPlace"), cls: "border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/50" };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1F6AE1]">
                        {t("diagnostics.tools.multimeter.benchTitle")}
                    </p>
                    <h3 className="mt-1 flex flex-wrap items-center gap-2 text-base font-black tracking-tight text-[#3A3A3A] dark:text-white">
                        <span className="inline-block rounded-lg bg-[#1F6AE1]/10 px-2 py-0.5 font-mono text-xs text-[#1F6AE1]" dir="ltr">
                            {comp.ref}
                        </span>
                        <span className="truncate">{comp.name}</span>
                    </h3>
                    <p className="mt-0.5 font-mono text-[11px] text-[#3A3A3A]/45 dark:text-white/45" dir="ltr">
                        {comp.code} · {comp.ecu.code} · {comp.group}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusChip.cls}`}>{statusChip.label}</span>
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

            <div ref={gridRef} className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_280px]">
                <section className="min-w-0 space-y-3">
                    <GuideCard engine={engine} />
                    <div className="rounded-xl border border-[#3A3A3A]/10 bg-white p-3 dark:border-white/10 dark:bg-[#1b1b20]">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#1F6AE1]">
                            {t("diagnostics.tools.multimeter.checklistTitle")}
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
                        <div className="mt-3 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] p-2.5 dark:border-white/10 dark:bg-white/[0.03]">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
                                {t("diagnostics.tools.multimeter.liveReading")}
                            </p>
                            <p className="mt-1 font-mono text-lg font-black text-[#3A3A3A] dark:text-white" dir="ltr">
                                {readingDisplay(live.value, live.unit) || "—"}
                            </p>
                            {photo && photoOpen && (
                                <img
                                    src={photo}
                                    alt={comp.name}
                                    className="mt-2 h-16 w-full rounded-lg object-cover ring-1 ring-[#3A3A3A]/10 dark:ring-white/10"
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).style.display = "none";
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </section>

                <section className="min-w-0 space-y-3">
                    <div className="flex items-center gap-3 rounded-xl border border-[#3A3A3A]/10 bg-white p-3 dark:border-white/10 dark:bg-[#1b1b20]">
                        <ComponentArt sym={comp.sym} className="h-14 w-20 shrink-0" />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#3A3A3A] dark:text-white">{comp.name}</p>
                            <p className="font-mono text-[10px] text-[#3A3A3A]/45 dark:text-white/45" dir="ltr">
                                {comp.ref} · {comp.pins.length} {t("simulator.dmmLab.pins")} · {comp.ecu.code}
                            </p>
                        </div>
                    </div>
                    <div className="min-h-[300px]">
                        <WiringView engine={engine} onPinClick={dragApi.onPinClick} />
                    </div>
                </section>

                <section className="min-w-0 space-y-3">
                    <DmmPanel
                        mode={state.mode}
                        reading={live}
                        onMode={(m) => engine.setMode(m)}
                        redJack={state.redJack}
                        blackJack={state.blackJack}
                        onJack={(lead, jack) => engine.setJack(lead, jack)}
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

            <p className="rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 py-2 text-[11px] text-[#3A3A3A]/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
                {t("diagnostics.tools.multimeter.submitHint")}
            </p>

            <ProbeWireOverlay engine={engine} scopeRef={gridRef} hideLead={dragApi.drag?.lead ?? null} />
            <ProbeCableOverlay drag={dragApi.drag} origin={origin} />
        </div>
    );
}
