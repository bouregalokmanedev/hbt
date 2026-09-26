import { useTranslation } from "react-i18next";

import type { ProbeTarget } from "../data/multimeter.data";
import type { MeterProcedureEngine } from "../engine/meter.engine";
import { sfx } from "../lib/sfx";

function targetLabel(t: (k: string, o?: Record<string, unknown>) => string, target: ProbeTarget): string {
    if (target === "gnd") return t("simulator.dmmLab.bench.earthLabel");
    if (target.startsWith("e")) return t("simulator.dmmLab.bench.ecuPin", { pin: target.slice(1) });
    return t("simulator.dmmLab.bench.componentPin", { pin: target.slice(1) });
}

/**
 * Coach without spoiling exact pins: before a lead is correctly seated the
 * instruction is generic; the pin code is revealed only after redOk/blackOk.
 */
export function GuideCard({ engine }: { engine: MeterProcedureEngine }) {
    const { t } = useTranslation();
    const state = engine.getState();
    const step = engine.step();
    const placement = engine.placement();
    const ready = engine.measurementReady();
    const showHint = state.hintUsed;

    const dialDone = placement.modeOk;
    const redDone = placement.redOk && !!state.red;
    const blackDone = placement.blackOk && !!state.black;
    const jackOk = placement.jackOk;

    const instruction = !dialDone
        ? t("simulator.dmmLab.bench.guideDial", { mode: step.mode })
        : !jackOk
          ? t("simulator.dmmLab.bench.guideJack")
          : !redDone
            ? t("simulator.dmmLab.bench.guideRedHidden")
            : !blackDone
              ? t("simulator.dmmLab.bench.guideBlackHidden")
              : !ready
                ? t("simulator.dmmLab.bench.guideAdjust")
                : t("simulator.dmmLab.bench.guideReadReady");

    const redLabel = redDone || showHint ? targetLabel(t, step.red) : t("simulator.dmmLab.bench.pinHidden");
    const blackLabel = blackDone || showHint ? targetLabel(t, step.black) : t("simulator.dmmLab.bench.pinHidden");
    const modeLabel = dialDone || showHint ? step.mode : t("simulator.dmmLab.bench.modeHidden");

    const items = [
        { done: dialDone, label: `${t("simulator.dmmLab.bench.guideDialDone")}: ${modeLabel}` },
        { done: jackOk, label: t("simulator.dmmLab.bench.guideJackDone") },
        { done: redDone, label: `${t("simulator.dmmLab.bench.guideRedDone")}: ${redLabel}` },
        { done: blackDone, label: `${t("simulator.dmmLab.bench.guideBlackDone")}: ${blackLabel}` },
        { done: false, active: ready, label: t("simulator.dmmLab.bench.guideJudge") },
    ];

    return (
        <div className="rounded-2xl border border-[#1F6AE1]/25 bg-gradient-to-l from-[#1F6AE1]/[.07] to-transparent p-4 dark:border-[#1F6AE1]/30 dark:from-[#1F6AE1]/[.12]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1F6AE1]">
                {t("simulator.dmmLab.bench.guideTitle")} · {t("simulator.dmmLab.step")}{" "}
                {Math.min(state.stepIdx + 1, engine.component().steps.length)}
            </p>
            <p className="mt-1 text-base font-black tracking-tight text-[#3A3A3A] dark:text-white">{instruction}</p>
            <p className="mt-1 text-xs text-[#3A3A3A]/55 dark:text-white/55">{t("simulator.dmmLab.bench.hidePinNote")}</p>
            <ol className="mt-2.5 flex flex-wrap gap-2">
                {items.map((item, i) => (
                    <li
                        key={i}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${
                            item.done
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : item.active
                                  ? "animate-pulse border-[#1F6AE1] bg-[#1F6AE1]/10 text-[#1F6AE1]"
                                  : "border-[#3A3A3A]/15 text-[#3A3A3A]/55 dark:border-white/15 dark:text-white/55"
                        }`}
                    >
                        <span
                            className={`grid h-4 w-4 place-items-center rounded-full text-[9px] font-black ${
                                item.done ? "bg-emerald-500 text-white" : "bg-[#3A3A3A]/10 text-[#3A3A3A]/60 dark:bg-white/10 dark:text-white/60"
                            }`}
                        >
                            {item.done ? "✓" : i + 1}
                        </span>
                        <span dir="auto">{item.label}</span>
                    </li>
                ))}
            </ol>
            {ready && (
                <button
                    type="button"
                    onClick={() => sfx.play("reading")}
                    className="mt-2 text-[11px] font-bold text-[#1F6AE1] underline-offset-2 hover:underline"
                >
                    {t("simulator.dmmLab.bench.tubeBeep")}
                </button>
            )}
        </div>
    );
}
