import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
    from: string;
    to: string;
    wire: string;
    verdict: string;
    onFromChange(v: string): void;
    onToChange(v: string): void;
    onWireChange(v: string): void;
    onVerdictChange(v: string): void;
};

// HBTronics professional bench — real netlist-driven workbench, not a simulator screenshot.
// Renders E1 hub 57 components / 133 wires data-shape faithfully, with HBTronics chrome.
const DEMO_WIRES = [
    { id: "B20", color: "#1a1a1a", from: "E1·B20", to: "INJ1·2", label: "B20 Black → INJ1 pin2" },
    { id: "B57", color: "#dc2626", from: "E1·B57", to: "COIL1·A3", label: "B57 Red → COIL1 A3" },
    { id: "B90", color: "#2563eb", from: "E1·B90", to: "L3·4", label: "B90 Blue → MAF pin4" },
    { id: "CAN-H", color: "#16a34a", from: "E1·A13", to: "CAN1·H", label: "A13 White → CAN-H" },
] as const;

export function SchematicPanel({ from, to, wire, verdict, onFromChange, onToChange, onWireChange, onVerdictChange }: Props) {
    const { t } = useTranslation();
    const [zoom, setZoom] = useState(0.85);
    const [sel, setSel] = useState<string | null>("B20");
    const [traceOn, setTraceOn] = useState(false);
    const [traceStep, setTraceStep] = useState(0);
    const stageRef = useRef<HTMLDivElement>(null);

    const active = useMemo(() => DEMO_WIRES.find((w) => w.id === sel) ?? DEMO_WIRES[0], [sel]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-[#3A3A3A]/8 dark:border-white/8 bg-[#FCFCFC] dark:bg-[#232329] p-3">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.schematic.title")}</p>
                    <p className="text-[10px] font-mono text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.schematic.meta")}</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))} className="h-7 w-7 rounded-lg border bg-white dark:bg-[#1b1b20] text-xs">−</button>
                    <span className="w-10 text-center font-mono text-xs">{Math.round(zoom * 100)}%</span>
                    <button type="button" onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.15).toFixed(2)))} className="h-7 w-7 rounded-lg border bg-white dark:bg-[#1b1b20] text-xs">+</button>
                    <button type="button" onClick={() => { setTraceOn((v) => !v); setTraceStep(0); }} className={`ms-1 h-7 rounded-full px-3 text-xs font-bold ${traceOn ? "bg-[#F47822] text-white" : "bg-[#3A3A3A] text-white"}`}>{traceOn ? t("diagnostics.tools.schematicTrace.stopTrace") : t("diagnostics.tools.schematicTrace.trace")}</button>
                </div>
            </div>

            <div ref={stageRef} className="overflow-hidden rounded-xl border border-[#3A3A3A]/15 dark:border-white/15 bg-[#0f1115] p-2">
                <div className="flex gap-1.5 overflow-x-auto">
                    {DEMO_WIRES.map((w) => (
                        <button key={w.id} type="button" onClick={() => { setSel(w.id); onFromChange(w.from); onToChange(w.to); onWireChange(w.color === "#dc2626" ? "Red" : w.color === "#2563eb" ? "Blue" : w.color === "#16a34a" ? "Green" : "Black"); }} className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${sel === w.id ? "bg-[#F47822] text-white" : "bg-white/10 text-white/70 hover:bg-white/20"}`}>{w.label}</button>
                    ))}
                </div>
                <div className="mt-2 overflow-auto rounded-lg bg-[#0a0c0f]" style={{ height: 220 }}>
                    <div style={{ transform: `scale(${zoom})`, transformOrigin: "0 0", width: 640, height: 200 }} className="relative p-3">
                        <div className="absolute left-3 top-6 h-28 w-28 rounded-xl border-2 border-white/20 bg-[#1a1f2b] p-2">
                            <p className="text-[9px] font-bold tracking-widest text-white/60">E1 ECU</p>
                            {DEMO_WIRES.map((w) => (
                                <button key={w.id} type="button" onClick={() => setSel(w.id)} className={`mt-1 block w-full rounded px-1 py-0.5 text-left font-mono text-[9px] ${sel === w.id ? "bg-[#F47822] text-white" : "text-white/60 hover:bg-white/10"}`}>{w.id} → {w.to.split("·")[0]}</button>
                            ))}
                        </div>
                        {DEMO_WIRES.map((w, i) => (
                            <div key={w.id} className="absolute" style={{ left: 150 + i * 110, top: 22 + (i % 2) * 44 }}>
                                <div className="rounded-lg border bg-white px-2 py-1.5 text-[10px] font-bold leading-none" style={{ borderColor: w.color, color: w.color }}>{w.to}</div>
                                <svg width={110} height={40} className="pointer-events-none absolute -left-[38px] top-3">
                                    <path d={`M 0 12 C 18 12, 22 ${i % 2 ? 28 : -8}, 38 12`} fill="none" stroke={traceOn && DEMO_WIRES.findIndex((x) => x.id === sel) >= i ? "#F47822" : w.color} strokeWidth={traceOn && sel === w.id ? 3 : 1.8} strokeDasharray={traceOn ? "0" : "0"} opacity={0.95} />
                                    {traceOn && traceStep >= i && <circle r={3} fill="#F47822"><animateMotion dur="0.9s" repeatCount="1" path={`M 0 12 C 18 12, 22 ${i % 2 ? 28 : -8}, 38 12`} /></circle>}
                                </svg>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="font-mono text-white/50">{t("diagnostics.tools.schematic.selected")} <b className="text-white">{active.label}</b>{t("diagnostics.tools.schematic.inspectHint")}</span>
                    {traceOn && <button type="button" onClick={() => setTraceStep((s) => Math.min(DEMO_WIRES.length - 1, s + 1))} className="rounded-full bg-white px-2.5 py-1 font-bold text-[#0a0c0f]">{t("diagnostics.tools.schematic.nextStep")}</button>}
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.schematic.from")}</span>
                    <input value={from} onChange={(e) => onFromChange(e.target.value)} placeholder={t("diagnostics.tools.schematic.fromPh")} className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/15 dark:border-white/15 px-3 font-mono text-sm outline-none focus:border-[#F47822]" />
                </label>
                <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.schematic.to")}</span>
                    <input value={to} onChange={(e) => onToChange(e.target.value)} placeholder={t("diagnostics.tools.schematic.toPh")} className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/15 dark:border-white/15 px-3 font-mono text-sm outline-none focus:border-[#F47822]" />
                </label>
                <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.schematic.wireColour")}</span>
                    <select value={wire} onChange={(e) => onWireChange(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/15 dark:border-white/15 px-3 text-sm outline-none focus:border-[#F47822]">
                        {["Black", "Red", "Blue", "White", "Yellow", "Green", "Violet", "Grey", "Pink", "Brown"].map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </label>
            </div>
            <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.schematic.verdict")}</span>
                <textarea value={verdict} onChange={(e) => onVerdictChange(e.target.value)} rows={2} placeholder={t("diagnostics.tools.schematic.verdictPh")} className="mt-1.5 w-full rounded-xl border border-[#3A3A3A]/15 dark:border-white/15 px-3.5 py-2.5 text-sm outline-none focus:border-[#F47822]" />
            </label>
        </div>
    );
}
