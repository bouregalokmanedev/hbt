import { useEffect, useRef, useState } from "react";
import { Download, Pause, Play, Pin, PinOff, Circle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PARAMS } from "../data/scanner.data";
import type { ScannerEngine } from "../engine/scanner.engine";

type Filter = "all" | "selected" | "pinned" | "outOfSpec";

const DEFAULT_SELECTED = ["RPM", "ECT", "VBAT", "TPS", "FRP"];

function statusColor(status: string): string {
    if (status === "fault") return "#D92D20";
    if (status === "warn") return "#B4560F";
    return "#12A150";
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
    const w = 120;
    const h = 32;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const pts = values
        .map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`)
        .join(" ");
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={pts} fill="none" stroke={color} strokeWidth={1.6} />
        </svg>
    );
}

export function LiveDataGrid({
    engine,
    onPlot,
}: {
    engine: ScannerEngine;
    onPlot: (ids: string[]) => void;
}) {
    const { t } = useTranslation();
    const snap = engine.getState();
    const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED);
    const [pinned, setPinned] = useState<string[]>([]);
    const [filter, setFilter] = useState<Filter>("all");
    const [query, setQuery] = useState("");
    const [recording, setRecording] = useState(false);
    const recorded = useRef<{ tick: number; values: Record<string, number> }[]>([]);

    useEffect(() => {
        if (!recording) return;
        recorded.current.push({
            tick: snap.tick,
            values: Object.fromEntries(PARAMS.map((p) => [p.id, snap.live[p.id]?.value ?? 0])),
        });
    }, [recording, snap.tick, snap.live]);

    const toggle = (list: string[], id: string, set: (v: string[]) => void) =>
        set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

    const q = query.trim().toLowerCase();
    const cards = PARAMS.filter((p) => {
        const sample = snap.live[p.id];
        if (filter === "selected" && !selected.includes(p.id)) return false;
        if (filter === "pinned" && !pinned.includes(p.id)) return false;
        if (filter === "outOfSpec" && sample?.status === "ok") return false;
        if (q && !`${p.id} ${p.name}`.toLowerCase().includes(q)) return false;
        return true;
    });

    const exportCsv = () => {
        const ids = selected.length > 0 ? selected : PARAMS.map((p) => p.id);
        const header = ["tick", ...ids].join(",");
        const lines = recorded.current.length > 0
            ? recorded.current.map((r) => [r.tick, ...ids.map((id) => r.values[id] ?? "")].join(","))
            : Array.from({ length: 48 }, (_, i) =>
                [i, ...ids.map((id) => snap.live[id]?.history[i]?.toFixed(2) ?? "")].join(","),
            );
        const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "scanner-live-data.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                {(["all", "selected", "pinned", "outOfSpec"] as const).map((f) => (
                    <button
                        key={f}
                        type="button"
                        onClick={() => setFilter(f)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                            filter === f
                                ? "bg-[#14181C] text-white dark:bg-white dark:text-[#14181C]"
                                : "border border-[#3A3A3A]/10 text-[#3A3A3A]/55 hover:text-[#3A3A3A] dark:border-white/10 dark:text-white/55 dark:hover:text-white"
                        }`}
                    >
                        {t(`simulator.scannerLab.livedata.${f}`)}
                    </button>
                ))}
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("simulator.scannerLab.livedata.searchPh")}
                    className="h-8 w-48 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-xs outline-none placeholder:text-[#3A3A3A]/30 focus:border-[#F47822] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                />
                <span className="ms-auto flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold ${recording ? "bg-red-500/10 text-red-600 dark:text-red-300" : "text-[#3A3A3A]/40 dark:text-white/40"}`}>
                        <Circle className={`h-2 w-2 ${recording ? "fill-red-500 text-red-500 animate-pulse" : ""}`} />
                        {recording ? t("simulator.scannerLab.livedata.recording") : t("simulator.scannerLab.livedata.notRecording")}
                    </span>
                    <button
                        type="button"
                        onClick={() => engine.toggleLive()}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 px-3 py-1.5 text-[11px] font-black text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:text-white"
                    >
                        {snap.livePlay ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        {snap.livePlay ? t("simulator.scannerLab.livedata.pause") : t("simulator.scannerLab.livedata.resume")}
                    </button>
                </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {cards.map((p) => {
                    const sample = snap.live[p.id];
                    if (!sample) return null;
                    const color = statusColor(sample.status);
                    const isPinned = pinned.includes(p.id);
                    return (
                        <div key={p.id} className="rounded-xl border border-[#3A3A3A]/10 bg-white p-4 dark:border-white/10 dark:bg-[#1b1b20]">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(p.id)}
                                    onChange={() => toggle(selected, p.id, setSelected)}
                                    aria-label={p.id}
                                    className="h-4 w-4 accent-[#F47822]"
                                />
                                <p className="min-w-0 flex-1 truncate text-sm font-bold text-[#3A3A3A] dark:text-white">{p.name}</p>
                                <button
                                    type="button"
                                    onClick={() => toggle(pinned, p.id, setPinned)}
                                    aria-label={isPinned ? t("simulator.scannerLab.livedata.unpin") : t("simulator.scannerLab.livedata.pin")}
                                    className={isPinned ? "text-[#F47822]" : "text-[#3A3A3A]/25 hover:text-[#F47822] dark:text-white/25"}
                                >
                                    {isPinned ? <Pin className="h-3.5 w-3.5 fill-current" /> : <PinOff className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                            <p className="mt-1 font-mono text-[10px] text-[#3A3A3A]/40 dark:text-white/40" dir="ltr">
                                {p.id} · {p.spec}
                            </p>
                            <p className="mt-2 font-mono text-[26px] font-black leading-none tabular-nums" style={{ color }} dir="ltr">
                                {sample.value.toFixed(p.decimals)} <span className="text-sm font-bold">{p.unit}</span>
                            </p>
                            <div className="mt-2" dir="ltr">
                                <Sparkline values={sample.history} color={color} />
                            </div>
                            <p className="mt-1 flex justify-between font-mono text-[10px] text-[#3A3A3A]/40 dark:text-white/40" dir="ltr">
                                <span>{t("simulator.scannerLab.livedata.min")} {Math.min(...sample.history).toFixed(p.decimals)}</span>
                                <span>{t("simulator.scannerLab.livedata.max")} {Math.max(...sample.history).toFixed(p.decimals)}</span>
                            </p>
                        </div>
                    );
                })}
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#3A3A3A]/10 bg-white p-3 dark:border-white/10 dark:bg-[#1b1b20]">
                <span className="px-2 font-mono text-[11px] font-bold text-[#3A3A3A]/55 dark:text-white/55">
                    {t("simulator.scannerLab.livedata.selectedCount", { n: selected.length, total: PARAMS.length })}
                </span>
                <span className="ms-auto flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            if (!recording) recorded.current = [];
                            setRecording(!recording);
                        }}
                        className={`rounded-xl px-4 py-2 text-xs font-black transition ${recording ? "bg-red-600 text-white hover:bg-red-700" : "border border-[#3A3A3A]/10 text-[#3A3A3A] hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:text-white"}`}
                    >
                        {recording ? t("simulator.scannerLab.livedata.stopRecord") : t("simulator.scannerLab.livedata.record")}
                    </button>
                    <button
                        type="button"
                        onClick={exportCsv}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 px-4 py-2 text-xs font-black text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:text-white"
                    >
                        <Download className="h-3.5 w-3.5" />
                        {t("simulator.scannerLab.livedata.exportCsv")}
                    </button>
                    <button
                        type="button"
                        onClick={() => onPlot(selected.length > 0 ? selected : PARAMS.map((p) => p.id))}
                        className="rounded-xl bg-[#F47822] px-4 py-2 text-xs font-black text-white transition hover:bg-[#E96D18]"
                    >
                        {t("simulator.scannerLab.livedata.plot")}
                    </button>
                </span>
            </div>
        </div>
    );
}
