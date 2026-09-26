import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PARAMS } from "../data/scanner.data";
import type { ScannerEngine } from "../engine/scanner.engine";

const SIGNAL_COLORS = ["#F47822", "#1F6AE1", "#8B5CF6", "#D92D20", "#0E9F6E", "#B4560F"];
const W = 760;
const H = 260;

export function SignalGraph({ engine, signals, onSignals }: { engine: ScannerEngine; signals: string[]; onSignals: (ids: string[]) => void }) {
    const { t } = useTranslation();
    const snap = engine.getState();
    const [visible, setVisible] = useState<string[]>(signals);
    useEffect(() => {
        setVisible(signals);
    }, [signals.join("|")]);

    const shown = PARAMS.filter((p) => visible.includes(p.id));
    const allValues = shown.flatMap((p) => snap.live[p.id]?.history ?? []);
    const min = allValues.length > 0 ? Math.min(...allValues) : 0;
    const max = allValues.length > 0 ? Math.max(...allValues) : 1;
    const span = max - min || 1;
    const colorOf = (id: string) => SIGNAL_COLORS[PARAMS.findIndex((p) => p.id === id) % SIGNAL_COLORS.length];

    return (
        <div className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]">
            <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
                    {t("simulator.scannerLab.graph.title")}
                </p>
                <button
                    type="button"
                    onClick={() => engine.toggleLive()}
                    className="ms-auto inline-flex items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 px-3 py-1.5 text-[11px] font-black text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:text-white"
                >
                    {snap.livePlay ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {snap.livePlay ? t("simulator.scannerLab.graph.pause") : t("simulator.scannerLab.graph.play")}
                </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
                {PARAMS.filter((p) => signals.includes(p.id)).map((p) => {
                    const on = visible.includes(p.id);
                    return (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => onSignals(on ? visible.filter((x) => x !== p.id) : [...visible, p.id])}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold transition ${on ? "border-[#3A3A3A]/15 text-[#3A3A3A] dark:border-white/15 dark:text-white" : "border-[#3A3A3A]/10 text-[#3A3A3A]/35 dark:border-white/10 dark:text-white/35"}`}
                        >
                            <span className="h-2 w-2 rounded-full" style={{ background: on ? colorOf(p.id) : "currentColor", opacity: on ? 1 : 0.35 }} />
                            {p.id}
                        </button>
                    );
                })}
            </div>
            {shown.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-[#3A3A3A]/15 p-6 text-center text-sm text-[#3A3A3A]/50 dark:border-white/15 dark:text-white/50">
                    {t("simulator.scannerLab.graph.noSignals")}
                </p>
            ) : (
                <div dir="ltr" className="mt-3 overflow-x-auto rounded-xl bg-[#0f1115] p-3">
                    <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[560px]" role="img">
                        {[0.15, 0.4, 0.65, 0.9].map((f) => (
                            <line key={f} x1={0} y1={H * f} x2={W} y2={H * f} stroke="#EFF1F5" strokeOpacity={0.12} strokeWidth={1} />
                        ))}
                        {shown.map((p) => {
                            const hist = snap.live[p.id]?.history ?? [];
                            const pts = hist
                                .map((v, i) => `${((i / (hist.length - 1)) * W).toFixed(1)},${(H - 12 - ((v - min) / span) * (H - 24)).toFixed(1)}`)
                                .join(" ");
                            return <polyline key={p.id} points={pts} fill="none" stroke={colorOf(p.id)} strokeWidth={1.6} />;
                        })}
                    </svg>
                </div>
            )}
        </div>
    );
}
