import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MM_PROCEDURES } from "../data/multimeter.data";
import type { MeterProcedureEngine } from "../engine/meter.engine";

export function ProgressScreen({ engine, onSelect }: { engine: MeterProcedureEngine; onSelect: (ref: string) => void }) {
    const { t } = useTranslation();
    const state = engine.getState();
    const total = MM_PROCEDURES.reduce((n, c) => n + c.steps.length, 0);
    const cleared = Object.values(state.done).reduce((n, d) => n + d.steps, 0);
    const pct = total === 0 ? 0 : Math.round((cleared / total) * 100);
    return (
        <div className="mx-auto max-w-2xl p-5">
            <h3 className="text-lg font-black text-[#3A3A3A] dark:text-white">
                {t("simulator.dmmLab.bench.progressTitle")}
            </h3>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#3A3A3A]/10 dark:bg-white/10">
                <div className="h-full rounded-full bg-[#1F6AE1] transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 font-mono text-xs font-bold text-[#3A3A3A]/50 dark:text-white/50" dir="ltr">
                {cleared}/{total} · {pct}%
            </p>
            <div className="mt-4 space-y-2">
                {MM_PROCEDURES.map((comp) => {
                    const record = state.done[comp.ref];
                    return (
                        <button
                            key={comp.ref}
                            type="button"
                            onClick={() => onSelect(comp.ref)}
                            className="flex w-full items-center gap-3 rounded-2xl border border-[#3A3A3A]/10 bg-white p-4 text-left transition hover:border-[#1F6AE1]/40 dark:border-white/10 dark:bg-[#1b1b20]"
                        >
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#1F6AE1]/10 font-mono text-xs font-black text-[#1F6AE1]">
                                {comp.ref}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold text-[#3A3A3A] dark:text-white">
                                    {comp.name}
                                </span>
                                <span className="block text-[11px] text-[#3A3A3A]/50 dark:text-white/50">
                                    {comp.group} · {record ? `${record.steps}/${record.total}` : `0/${comp.steps.length}`} {t("simulator.dmmLab.steps")}
                                </span>
                            </span>
                            {record ? (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {record.status === "clear" ? t("simulator.dmmLab.bench.finishedClear") : t("simulator.dmmLab.bench.finishedFound")} · {record.score}
                                </span>
                            ) : (
                                <span className="shrink-0 text-[11px] font-bold text-[#3A3A3A]/30 dark:text-white/30">—</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
