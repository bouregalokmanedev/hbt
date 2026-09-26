import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
    component: string;
    view: string;
    note: string;
    onComponentChange(v: string): void;
    onViewChange(v: string): void;
    onNoteChange(v: string): void;
};

const COMPONENTS = [
    { id: "L3", label: "L3 · MAF", x: 38, y: 28 },
    { id: "H3", label: "H3 · Throttle", x: 62, y: 42 },
    { id: "X1", label: "X1 · Crank", x: 48, y: 72 },
    { id: "X7", label: "X7 · Cam inlet", x: 58, y: 34 },
    { id: "T1", label: "T1 · Coolant", x: 72, y: 58 },
    { id: "U1", label: "U1 · O2", x: 24, y: 64 },
] as const;

const LOCATION_VIEW_VALUES = ["Engine bay", "Under-dash", "Fuse box", "ECU map"] as const;

export function LocationPanel({ component, view, note, onComponentChange, onViewChange, onNoteChange }: Props) {
    const { t } = useTranslation();
    const locationViews = t("diagnostics.tools.locationViews", { returnObjects: true }) as string[];
    const [zoom, setZoom] = useState(1);
    const [hover, setHover] = useState<string | null>(null);
    const targetId = component.split("·")[0].trim();

    return (
        <div className="space-y-3">
            <div className="rounded-xl border border-[#3A3A3A]/8 dark:border-white/8 bg-[#FCFCFC] dark:bg-[#232329] p-3">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.location.title")}</p>
                    <span className="rounded-full bg-[#3A3A3A] px-2 py-0.5 text-[10px] font-bold text-white">{view}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/60 dark:text-white/60">{t("diagnostics.tools.location.desc")}</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#3A3A3A]/15 dark:border-white/15 bg-[#0f1115]">
                <div className="flex items-center gap-1.5 bg-[#14171e] px-2 py-1.5">
                    {LOCATION_VIEW_VALUES.map((v, i) => (
                        <button key={v} type="button" onClick={() => onViewChange(v)} className={`rounded-full px-2 py-1 text-[10px] font-bold ${view === v ? "bg-[#F47822] text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>{locationViews[i] ?? v}</button>
                    ))}
                    <span className="ml-auto flex items-center gap-1 text-[10px] text-white/40">
                        <button type="button" onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))} className="h-6 w-6 rounded border bg-white/10">−</button>
                        {Math.round(zoom * 100)}%
                        <button type="button" onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.15).toFixed(2)))} className="h-6 w-6 rounded border bg-white/10">+</button>
                    </span>
                </div>
                <div className="relative h-[190px] overflow-auto bg-[#080a0e] p-2">
                    <div className="relative mx-auto rounded-lg border border-white/10 bg-gradient-to-br from-[#1a2332] to-[#0f172a]" style={{ width: 320, height: 170, transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
                        <p className="absolute left-2 top-1 text-[8px] font-bold uppercase tracking-widest text-white/30">{view} · Toyota 1ZR-FE</p>
                        {COMPONENTS.map((c) => {
                            const isTarget = c.id === targetId;
                            const isHover = hover === c.id;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onMouseEnter={() => setHover(c.id)}
                                    onMouseLeave={() => setHover(null)}
                                    onClick={() => onComponentChange(c.label)}
                                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 px-2 py-1 text-[9px] font-bold leading-none shadow ${isTarget ? "border-[#F47822] bg-[#F47822] text-white" : isHover ? "border-white bg-white text-[#0f1115]" : "border-white/30 bg-white/10 text-white/80"}`}
                                    style={{ left: `${c.x}%`, top: `${c.y}%` }}
                                >
                                    {c.id}
                                </button>
                            );
                        })}
                        <div className="absolute bottom-1 end-1 rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-mono text-white/50">{t("diagnostics.tools.location.meta")}</div>
                    </div>
                </div>
                <p className="bg-[#14171e] px-2 py-1 text-center text-[10px] font-mono text-white/40">{t("diagnostics.tools.location.target")} <b className="text-white">{component}</b></p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.location.component")}</span>
                    <select value={component} onChange={(e) => onComponentChange(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/15 dark:border-white/15 px-3 text-sm outline-none focus:border-[#F47822]">
                        {["L3 · MAF", "L1 · MAP", "H3 · Throttle", "X1 · Crank", "X7 · Cam inlet", "T1 · Coolant", "U1 · O2", "G1 · Pedal"].map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.location.view")}</span>
                    <select value={view} onChange={(e) => onViewChange(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/15 dark:border-white/15 px-3 text-sm outline-none focus:border-[#F47822]">
                        {LOCATION_VIEW_VALUES.map((v, i) => (
                            <option key={v} value={v}>{locationViews[i] ?? v}</option>
                        ))}
                    </select>
                </label>
            </div>
            <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.location.note")}</span>
                <input value={note} onChange={(e) => onNoteChange(e.target.value)} placeholder={t("diagnostics.tools.location.notePh")} className="mt-1.5 w-full rounded-xl border border-[#3A3A3A]/15 dark:border-white/15 px-3.5 py-2.5 text-sm outline-none focus:border-[#F47822]" />
            </label>
        </div>
    );
}
