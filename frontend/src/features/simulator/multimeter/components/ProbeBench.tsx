import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Lead, MeterProcedureEngine } from "../engine/meter.engine";
import { sfx } from "../lib/sfx";

export function ProbeBench({
    engine,
    armedLead,
    onArm,
    onPointerDownLead,
    registerRef,
}: {
    engine: MeterProcedureEngine;
    armedLead: Lead | null;
    onArm: (lead: Lead | null) => void;
    onPointerDownLead: (lead: Lead, e: React.PointerEvent) => void;
    registerRef?: (lead: Lead, el: HTMLElement | null) => void;
}) {
    const { t } = useTranslation();
    const state = engine.getState();
    const rows: { lead: Lead; seated: string | null }[] = [
        { lead: "red", seated: state.red },
        { lead: "black", seated: state.black },
    ];
    return (
        <div className="rounded-xl border border-[#3A3A3A]/10 bg-white p-3 dark:border-white/10 dark:bg-[#1b1b20]">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#1F6AE1]">
                    {t("simulator.dmmLab.bench.probeBench")}
                </p>
                <button
                    type="button"
                    onClick={() => {
                        engine.clearProbes();
                        onArm(null);
                        sfx.play("clear");
                    }}
                    className="rounded-lg px-2 py-1 text-[11px] font-bold text-[#3A3A3A]/60 transition hover:text-[#3A3A3A] dark:text-white/60 dark:hover:text-white"
                >
                    {t("simulator.dmmLab.bench.clearProbesBtn")}
                </button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {rows.map(({ lead, seated }) => {
                    const armed = armedLead === lead;
                    return (
                        <div
                            key={lead}
                            ref={(el) => registerRef?.(lead, el)}
                            onPointerDown={(e) => onPointerDownLead(lead, e)}
                            onClick={() => onArm(armed ? null : lead)}
                            role="button"
                            tabIndex={0}
                            aria-pressed={armed}
                            aria-label={lead === "red" ? t("simulator.dmmLab.bench.leadRed") : t("simulator.dmmLab.bench.leadBlack")}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onArm(armed ? null : lead);
                                }
                            }}
                            className={`flex cursor-grab touch-none items-center gap-2.5 rounded-xl border px-3 py-2.5 transition active:cursor-grabbing ${
                                armed
                                    ? "border-[#1F6AE1] bg-[#1F6AE1]/[.07] shadow-sm"
                                    : "border-[#3A3A3A]/10 bg-[#FCFCFC] hover:border-[#1F6AE1]/40 dark:border-white/10 dark:bg-white/[0.04]"
                            }`}
                        >
                            <span className={`h-3 w-3 shrink-0 rounded-full ${lead === "red" ? "bg-[#D92D20]" : "bg-[#14181C] dark:bg-white"}`} />
                            <span className="min-w-0 flex-1">
                                <span className="block text-xs font-black text-[#3A3A3A] dark:text-white">
                                    {lead === "red" ? t("simulator.dmmLab.bench.leadRed") : t("simulator.dmmLab.bench.leadBlack")}
                                </span>
                                <span dir="ltr" className="block truncate font-mono text-[11px] text-[#3A3A3A]/50 dark:text-white/50">
                                    {seated ?? t("simulator.dmmLab.bench.notPlaced")}
                                </span>
                            </span>
                            {seated && (
                                <button
                                    type="button"
                                    aria-label={t("simulator.dmmLab.bench.detachLead")}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        engine.detachProbe(lead);
                                        sfx.play("detach");
                                        if (armed) onArm(null);
                                    }}
                                    className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[#3A3A3A]/40 transition hover:bg-red-50 hover:text-red-600 dark:text-white/40"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
            <p className="mt-2 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                {t("simulator.dmmLab.bench.tapHint")}
            </p>
        </div>
    );
}
