import { useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

type Props = {
    channel: string;
    timeDiv: string;
    voltDiv: string;
    observation: string;
    onChannelChange(v: string): void;
    onTimeDivChange(v: string): void;
    onVoltDivChange(v: string): void;
    onObservationChange(v: string): void;
};

const VOLTS = ["0.1V", "0.2V", "0.5V", "1V", "2V", "5V", "10V"] as const;
const TIMES = ["0.2ms", "0.5ms", "1ms", "2ms", "5ms", "10ms", "20ms"] as const;
const CHANNELS = ["A · INJ", "A · COIL", "B · CAM", "B · MAP", "B · KNK", "B · O2"] as const;
const FAULTS = ["none", "open", "shortGnd", "highRes", "dropout", "intermittent"] as const;

function waveformPath(fault: string, timeScale: number, voltScale: number, noise: number): string {
    // Deterministic fn(ch,p) mimic — amplitude scales with volt, horizontal with time, noise wobbles
    const base = fault === "open" ? "M 0 60 L 220 60" : fault === "shortGnd" ? "M 0 100 L 220 100" : `M 0 ${60} L ${40 / timeScale} 60 L ${42 / timeScale} ${95 - voltScale * 2} L ${44 / timeScale} ${8 + voltScale} L ${46 / timeScale} 62 L ${60 / timeScale} 62 L 120 60`;
    if (noise === 0 || fault === "open" || fault === "shortGnd") return base;
    // add micro wobble for noise
    return base.replace(/L (\d+)/g, (_m, n) => `L ${Number(n) + (Math.sin(Number(n)) * noise * 0.6).toFixed(1)}`);
}

function ScopeKnob({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
    const { t } = useTranslation();
    const idx = Math.max(0, options.indexOf(value as typeof options[number]));
    const angle = -120 + (idx / Math.max(1, options.length - 1)) * 240;
    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-black uppercase tracking-[.12em] text-[#3A3A3A]/40 dark:text-white/40">{label}</span>
            <button
                type="button"
                onClick={() => onChange(options[(idx + 1) % options.length])}
                className="relative grid h-[64px] w-[64px] place-items-center rounded-full bg-gradient-to-b from-[#2a3140] to-[#0f1115] shadow-[0_4px_12px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)] border border-white/10 active:scale-[0.98]"
                title={t("diagnostics.tools.scope.knobStep")}
            >
                <span className="absolute inset-[6px] rounded-full bg-[#0f1115] border border-white/5" />
                <motion.span animate={{ rotate: angle }} transition={{ type: "spring", stiffness: 380, damping: 26 }} className="absolute h-7 w-[3px] origin-bottom rounded-full bg-[#F47822] shadow-[0_0_6px_rgba(244,120,34,0.7)]" style={{ top: "10px" }} />
                <span className="absolute h-2 w-2 rounded-full bg-white shadow" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
            </button>
            <span className="rounded-full bg-[#3A3A3A] px-2 py-0.5 font-mono text-[11px] font-bold text-white">{value}</span>
        </div>
    );
}

export function OscilloscopePanel({ channel, timeDiv, voltDiv, observation, onChannelChange, onTimeDivChange, onVoltDivChange, onObservationChange }: Props) {
    const { t } = useTranslation();
    const [fault, setFault] = useState<string>("none");
    const [noise, setNoise] = useState(1);
    const [run, setRun] = useState(true);
    const [cursorA, setCursorA] = useState(64);
    const [cursorB, setCursorB] = useState(112);
    const [trig, setTrig] = useState(48);
    const svgRef = useRef<SVGSVGElement>(null);

    const voltScale = useMemo(() => {
        const v = parseFloat(voltDiv);
        return isNaN(v) ? 5 : Math.max(0.5, Math.min(10, v)) / 5;
    }, [voltDiv]);
    const timeScale = useMemo(() => {
        const t = parseFloat(timeDiv);
        return isNaN(t) ? 1 : Math.max(0.3, Math.min(20, t)) / 2;
    }, [timeDiv]);

    const path = useMemo(() => waveformPath(fault, timeScale, voltScale, noise), [fault, timeScale, voltScale, noise]);
    const deltaV = useMemo(() => Math.abs(cursorB - cursorA) * 0.042 * (voltScale * 5), [cursorA, cursorB, voltScale]);
    const deltaT = useMemo(() => Math.abs(cursorB - cursorA) * 0.038 * timeScale, [cursorA, cursorB, timeScale]);

    const onDragCursor = (which: "A" | "B", e: React.MouseEvent) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = ((e.clientX - rect.left) / rect.width) * 220;
        const clamped = Math.max(8, Math.min(212, x));
        if (which === "A") setCursorA(clamped);
        else setCursorB(clamped);
    };

    return (
        <div className="space-y-3">
            {/* Device — modern DSO */}
            <div className="mx-auto max-w-[640px] rounded-[24px] border border-[#3A3A3A]/10 dark:border-white/10 bg-[#E9EEF2] p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
                <div className="flex items-center justify-between px-2 pb-2">
                    <span className="rounded-full bg-[#0f1115] px-2.5 py-1 text-[10px] font-black tracking-[.14em] text-white">HBTronics DSO <span className="font-normal text-white/50">1052 · 100MHz</span></span>
                    <span className="flex items-center gap-1.5">
                        <button onClick={() => setRun((v) => !v)} className={`rounded-full px-2.5 py-1 text-[10px] font-black ${run ? "bg-emerald-500 text-white shadow" : "bg-[#3A3A3A] text-white/70"}`}>{run ? "● RUN" : "■ STOP"}</button>
                        <span className={`h-2 w-2 rounded-full ${run ? "bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.9)]" : "bg-red-500"}`} />
                    </span>
                </div>

                {/* Screen */}
                <div className="relative overflow-hidden rounded-xl border-[6px] border-[#0f1115] bg-[#0a0f1a] shadow-[inset_0_4px_16px_rgba(0,0,0,0.7)]">
                    <div className="flex items-center gap-1 bg-[#14171e] px-2 py-1 text-[10px] font-mono text-white/60">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-black ${channel.includes("A") ? "bg-[#F47822] text-white" : "bg-white/10"}`}>CH {channel.includes("B") ? "B" : "A"}</span>
                        <span>{voltDiv} · {timeDiv} · {fault !== "none" ? `FAULT:${fault}` : "NORM"} · {run ? "AUTO" : "HOLD"}</span>
                        <span className="ml-auto hidden sm:inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> TRIG {trig.toFixed(0)}mV</span>
                    </div>

                    <svg ref={svgRef} viewBox="0 0 220 120" className="h-[168px] w-full select-none" onMouseMove={(e) => e.buttons === 1 && (e.shiftKey ? onDragCursor("B", e) : onDragCursor("A", e))}>
                        <defs>
                            <pattern id="grid-dso" width={22} height={12} patternUnits="userSpaceOnUse"><path d="M 22 0 L 0 0 0 12" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={0.6} /></pattern>
                            <radialGradient id="glow" cx="50%" cy="50%"><stop offset="0%" stopColor="#7CFF7C" stopOpacity={0.9} /><stop offset="100%" stopColor="#7CFF7C" stopOpacity={0} /></radialGradient>
                        </defs>
                        <rect width={220} height={120} fill="#070c16" />
                        <rect width={220} height={120} fill="url(#grid-dso)" />
                        {/* Trigger level */}
                        <line x1={0} y1={120 - trig} x2={220} y2={120 - trig} stroke="#FACC15" strokeWidth={0.8} strokeDasharray="4 3" opacity={0.5} />
                        <g onMouseDown={(e) => { const move = (ev: MouseEvent) => { const r = svgRef.current?.getBoundingClientRect(); if (!r) return; const y = ((ev.clientY - r.top) / r.height) * 120; setTrig(Math.max(10, Math.min(110, 120 - y))); }; const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); }; window.addEventListener("mousemove", move); window.addEventListener("mouseup", up); }}>
                            <rect x={212} y={120 - trig - 6} width={8} height={12} rx={2} fill="#FACC15" />
                            <text x={216} y={120 - trig + 3} textAnchor="middle" fontSize={5} fontWeight={900} fill="#0a0f1a">▶</text>
                        </g>
                        {/* Waveform with glow */}
                        <path d={path} fill="none" stroke="#7CFF7C" strokeWidth={2.1} strokeLinejoin="round" opacity={run ? 0.95 : 0.55} style={{ filter: "drop-shadow(0 0 6px rgba(124,255,124,0.55))" }} />
                        {noise > 0 && <path d={path} fill="none" stroke="white" strokeWidth={0.5} opacity={0.10 + noise * 0.07} />}
                        {/* Afterglow */}
                        <path d={path} fill="none" stroke="#7CFF7C" strokeWidth={3.2} opacity={0.08} />
                        {/* Cursors — draggable */}
                        <g className="cursor-grab active:cursor-grabbing" onMouseDown={(e) => { const move = (ev: MouseEvent) => onDragCursor("A", ev as unknown as React.MouseEvent); const up = () => { window.removeEventListener("mousemove", move as unknown as EventListener); window.removeEventListener("mouseup", up); }; window.addEventListener("mousemove", move as unknown as EventListener); window.addEventListener("mouseup", up); e.preventDefault(); }}>
                            <line x1={cursorA} y1={8} x2={cursorA} y2={112} stroke="#F47822" strokeWidth={1.2} strokeDasharray="4 2" />
                            <rect x={cursorA - 10} y={4} width={20} height={10} rx={5} fill="#F47822" />
                            <text x={cursorA} y={11} textAnchor="middle" fontSize={6} fontWeight={900} fill="white">A</text>
                        </g>
                        <g className="cursor-grab active:cursor-grabbing" onMouseDown={(e) => { const move = (ev: MouseEvent) => onDragCursor("B", ev as unknown as React.MouseEvent); const up = () => { window.removeEventListener("mousemove", move as unknown as EventListener); window.removeEventListener("mouseup", up); }; window.addEventListener("mousemove", move as unknown as EventListener); window.addEventListener("mouseup", up); e.preventDefault(); }}>
                            <line x1={cursorB} y1={8} x2={cursorB} y2={112} stroke="#38bdf8" strokeWidth={1.2} strokeDasharray="4 2" />
                            <rect x={cursorB - 10} y={4} width={20} height={10} rx={5} fill="#38bdf8" />
                            <text x={cursorB} y={11} textAnchor="middle" fontSize={6} fontWeight={900} fill="white">B</text>
                        </g>
                        {/* Scale labels */}
                        <text x={6} y={18} fontSize={6} fill="white" opacity={0.35} fontFamily="monospace">12V</text>
                        <text x={6} y={108} fontSize={6} fill="white" opacity={0.25} fontFamily="monospace">0V</text>
                        <text x={190} y={116} fontSize={5} fill="white" opacity={0.25} fontFamily="monospace">t →</text>
                    </svg>

                    {/* Readout bar — ΔV/Δt */}
                    <div className="flex flex-wrap items-center gap-2 bg-[#0f1115] px-2 py-1.5 text-[11px] font-mono">
                        <span className="rounded bg-[#F47822] px-1.5 py-0.5 font-black text-white">A</span>
                        <span className="text-white/80">ΔV <b className="text-white">{deltaV.toFixed(2)}V</b></span>
                        <span className="h-3 w-px bg-white/10" />
                        <span className="rounded bg-[#38bdf8] px-1.5 py-0.5 font-black text-white">B</span>
                        <span className="text-white/80">Δt <b className="text-white">{deltaT.toFixed(2)}ms</b></span>
                        <span className="ml-auto hidden sm:inline text-white/30">{t("diagnostics.tools.scope.dragAB")}</span>
                        <span className="ml-auto sm:hidden text-white/30">{t("diagnostics.tools.scope.dragCursors")}</span>
                    </div>
                </div>

                {/* Knobs — tactile */}
                <div className="mt-2 grid grid-cols-3 gap-2">
                    <ScopeKnob label={t("diagnostics.tools.scope.voltsDiv")} value={voltDiv} options={VOLTS} onChange={onVoltDivChange} />
                    <ScopeKnob label={t("diagnostics.tools.scope.timeDiv")} value={timeDiv} options={TIMES} onChange={onTimeDivChange} />
                    <div className="rounded-xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-2">
                        <p className="text-center text-[9px] font-black uppercase tracking-[.12em] text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.scope.trigger")}</p>
                        <input type="range" min={10} max={100} value={trig} onChange={(e) => setTrig(Number(e.target.value))} className="mt-2 h-1.5 w-full accent-[#F47822]" />
                        <p className="mt-1 text-center font-mono text-[11px] font-bold text-[#3A3A3A] dark:text-[#ececef]">{trig.toFixed(0)} mV</p>
                    </div>
                </div>

                {/* Channel + fault — hardware row */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                    <div className="flex gap-1">
                        {CHANNELS.slice(0, 4).map((c) => (
                            <button key={c} onClick={() => onChannelChange(c)} className={`rounded-full px-2.5 py-1 text-[11px] font-black ${channel === c ? "bg-[#3A3A3A] text-white" : "bg-white dark:bg-[#1b1b20] text-[#3A3A3A]/60 dark:text-white/60 border border-[#3A3A3A]/10 dark:border-white/10 hover:bg-[#FCFCFC] dark:hover:bg-[#232329]"}`}>{c}</button>
                        ))}
                    </div>
                    <span className="hidden h-7 w-px bg-[#3A3A3A]/10 dark:bg-white/10 sm:block" />
                    <div className="flex gap-1">
                        {FAULTS.map((f) => (
                            <button key={f} onClick={() => setFault(f)} className={`rounded-full px-2 py-1 text-[11px] font-bold ${fault === f ? "bg-[#F47822] text-white" : "bg-white dark:bg-[#1b1b20] border border-[#3A3A3A]/10 dark:border-white/10 text-[#3A3A3A]/60 dark:text-white/60 hover:bg-[#FFF7ED]"}`}>{f}</button>
                        ))}
                    </div>
                    <label className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-[#3A3A3A]/40 dark:text-white/40">
                        {t("diagnostics.tools.scope.noise")}
                        <input type="range" min={0} max={2} value={noise} onChange={(e) => setNoise(Number(e.target.value))} className="h-1 w-14 accent-[#F47822]" />
                        <span className="font-mono text-[#3A3A3A] dark:text-[#ececef]">{noise}</span>
                    </label>
                </div>
            </div>

            <label className="block rounded-2xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-3 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-[.14em] text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.scope.obsTitle")}</span>
                <textarea value={observation} onChange={(e) => onObservationChange(e.target.value)} rows={2} placeholder={t("diagnostics.tools.scope.obsPh")} className="mt-1.5 w-full rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-[#FCFCFC] dark:bg-[#232329] px-3.5 py-2.5 text-sm outline-none placeholder:text-[#3A3A3A]/30 dark:placeholder:text-white/30 focus:border-[#F47822] focus:bg-white dark:focus:bg-[#1b1b20]" />
                <p className="mt-1 text-[11px] text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.tools.scope.obsTip")}</p>
            </label>
        </div>
    );
}
