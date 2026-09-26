import { Cpu } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ADAS_ACTIVE, ADAS_ITEMS } from "../data/scanner.data";
import type { ScannerEngine } from "../engine/scanner.engine";

const ADAS_NAMES = ["Front camera", "Front radar", "BSM left", "BSM right", "PDC", "Surround view"];

const PRE_KEYS = ["pre1", "pre2", "pre3", "pre4", "pre5", "pre6"] as const;

export function AdasScreen({ engine }: { engine: ScannerEngine }) {
    const { t } = useTranslation();
    const snap = engine.getState();
    const doneCount = snap.adasDone.filter(Boolean).length;
    return (
        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-4 dark:border-white/10 dark:bg-[#1b1b20]">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
                    {t("simulator.scannerLab.adasScreen.items")} · {ADAS_ITEMS.length}
                </p>
                <ul className="mt-3 space-y-1.5">
                    {ADAS_ITEMS.map((item, i) => {
                        const done = snap.adasDone[i] ?? false;
                        const equipped = item.status !== "notEquipped";
                        return (
                            <li
                                key={item.id}
                                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold ${
                                    equipped ? "text-[#3A3A3A] dark:text-white" : "text-[#3A3A3A]/35 dark:text-white/35"
                                }`}
                            >
                                <span
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{
                                        background: !equipped ? "#9AA0A6" : done ? "#12A150" : "#F59E0B",
                                    }}
                                />
                                <span className="min-w-0 flex-1 truncate">{ADAS_NAMES[i] ?? item.id}</span>
                                <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider text-[#3A3A3A]/40 dark:text-white/40">
                                    {!equipped
                                        ? "—"
                                        : done
                                          ? t("simulator.scannerLab.calibrated")
                                          : t("simulator.scannerLab.awaiting")}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="rounded-2xl bg-[#14181C] p-5 text-white sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                            STATIC
                        </p>
                        <h3 className="mt-1 text-[22px] font-black tracking-tight">
                            {ADAS_NAMES[0]} · {t("simulator.scannerLab.adasScreen.title")}
                        </h3>
                        <p className="mt-1 font-mono text-xs text-white/50" dir="ltr">
                            {ADAS_ACTIVE.targetBoard} · {ADAS_ACTIVE.distance} {ADAS_ACTIVE.tolerance} · {ADAS_ACTIVE.dtc}
                        </p>
                    </div>
                    <p dir="ltr" className="font-mono text-2xl font-black tabular-nums text-white">
                        {snap.adasProg}%
                    </p>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                        className="h-full rounded-full bg-[#F47822] transition-[width] duration-150"
                        style={{ width: `${snap.adasProg}%` }}
                    />
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                            {t("simulator.scannerLab.adasScreen.preconditions")}
                        </p>
                        <ul className="mt-2 space-y-1.5">
                            {PRE_KEYS.map((key, i) => {
                                const met = snap.adasDone[i] ?? i < doneCount;
                                return (
                                    <li key={key} className="flex items-center gap-2 text-xs text-white/70">
                                        <span
                                            className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-black ${
                                                met ? "bg-emerald-500 text-white" : "bg-white/10 text-white/40"
                                            }`}
                                        >
                                            {met ? "✓" : "·"}
                                        </span>
                                        {t(`simulator.scannerLab.adasScreen.${key}`)}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div className="flex flex-col justify-between gap-3 rounded-xl bg-white/[0.04] p-4">
                        <div className="flex items-center gap-3">
                            <Cpu className="h-8 w-8 shrink-0 text-white/30" />
                            <p className="text-xs leading-5 text-white/55">{t("simulator.scannerLab.adasNote")}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => engine.runAdas()}
                            disabled={snap.adasRunning || snap.adasProg >= 100}
                            className="rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#E96D18] disabled:opacity-50"
                        >
                            {snap.adasRunning
                                ? t("simulator.scannerLab.adasScreen.running")
                                : snap.adasProg >= 100
                                  ? t("simulator.scannerLab.adasScreen.complete")
                                  : t("simulator.scannerLab.adasScreen.run")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
