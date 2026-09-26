import { Car } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ScannerToolbar({
    crumb,
    volts,
    livePlay,
    trainingActive,
    onProfessional,
    onTraining,
    vehicleEngine,
    onSwitchVehicle,
    completed,
    score,
}: {
    crumb: string;
    volts: number;
    livePlay: boolean;
    trainingActive: boolean;
    onProfessional: () => void;
    onTraining: () => void;
    vehicleEngine: string;
    onSwitchVehicle: () => void;
    completed: boolean;
    score: number | null;
}) {
    const { t } = useTranslation();
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3A3A3A]/8 bg-white px-4 py-2.5 dark:border-white/8 dark:bg-[#1b1b20]">
            <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#3A3A3A]/50 dark:text-white/50">
                <span className="h-1.5 w-1.5 rounded-sm bg-[#F47822]" />
                {t("simulator.scannerLab.dash.crumbScanner")}
                <span className="font-normal text-[#3A3A3A]/25 dark:text-white/25">|</span>
                <span className="text-[#3A3A3A] dark:text-white">{crumb}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={onSwitchVehicle}
                    title={t("simulator.scannerLab.gate.changeVehicle")}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-1.5 font-mono text-[11px] font-bold text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                >
                    <Car className="h-3.5 w-3.5 text-[#F47822]" />
                    <span dir="ltr">{vehicleEngine}</span>
                </button>
                <span className="inline-flex items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-1.5 font-mono text-[11px] font-bold text-[#3A3A3A] dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
                    <span className={`h-2 w-2 rounded-full ${livePlay ? "animate-pulse bg-emerald-500" : "bg-[#3A3A3A]/25 dark:bg-white/25"}`} />
                    {t("simulator.scannerLab.dash.vciLinked")}
                    <span dir="ltr" className="tabular-nums text-emerald-600 dark:text-emerald-400">{volts.toFixed(2)} V</span>
                </span>
                {completed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 font-mono text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        {t("simulator.scannerLab.status.completed")}
                        {score !== null && <span dir="ltr" className="tabular-nums">· {score}</span>}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F47822]/10 px-3 py-1.5 font-mono text-[11px] font-black text-[#F47822]">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#F47822]" />
                        {t("simulator.scannerLab.status.inProgress")}
                    </span>
                )}
                <div className="flex rounded-xl bg-[#3A3A3A]/[.06] p-1 dark:bg-white/[0.07]">
                    <button
                        type="button"
                        onClick={onProfessional}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-black tracking-wide transition ${!trainingActive ? "bg-[#F47822] text-white shadow" : "text-[#3A3A3A]/50 hover:text-[#3A3A3A] dark:text-white/50 dark:hover:text-white"}`}
                    >
                        {t("simulator.scannerLab.dash.professional")}
                    </button>
                    <button
                        type="button"
                        onClick={onTraining}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-black tracking-wide transition ${trainingActive ? "bg-[#F47822] text-white shadow" : "text-[#3A3A3A]/50 hover:text-[#3A3A3A] dark:text-white/50 dark:hover:text-white"}`}
                    >
                        {t("simulator.scannerLab.dash.training")}
                    </button>
                </div>
            </div>
        </div>
    );
}
