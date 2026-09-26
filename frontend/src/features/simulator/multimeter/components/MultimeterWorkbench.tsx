import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useMeterProcedure } from "../hooks/useMeterProcedure";
import { ComponentSidebar } from "./ComponentSidebar";
import { DiagnosisScreen } from "../screens/DiagnosisScreen";
import { ProgressScreen } from "../screens/ProgressScreen";

function fmtClock(total: number): string {
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function MultimeterWorkbench({
    vehicleId,
    sessionId,
    onSwitchVehicle,
}: {
    vehicleId: string;
    sessionId: string | null;
    onSwitchVehicle: () => void;
}) {
    const { t } = useTranslation();
    const { engine, state } = useMeterProcedure(vehicleId, sessionId, null);
    const [view, setView] = useState<"diagnosis" | "progress">("diagnosis");

    if (!engine || !state) {
        return (
            <div className="grid min-h-[320px] place-items-center rounded-[20px] border border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
                <div className="flex items-center gap-3 text-sm font-bold text-[#3A3A3A]/50 dark:text-white/50">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#1F6AE1]/25 border-t-[#1F6AE1]" />
                    {t("simulator.dmmLab.loading")}
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-[20px] border border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3A3A3A]/8 bg-white px-4 py-2.5 dark:border-white/8 dark:bg-[#1b1b20]">
                <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#3A3A3A]/50 dark:text-white/50">
                    <span className="h-1.5 w-1.5 rounded-sm bg-[#1F6AE1]" />
                    {t("simulator.dmmLab.bench.workbenchTitle")}
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onSwitchVehicle}
                        title={vehicleId}
                        className="max-w-[140px] truncate rounded-xl bg-[#3A3A3A]/[.05] px-3 py-1.5 font-mono text-[11px] font-bold text-[#3A3A3A] transition hover:bg-[#3A3A3A]/10 dark:bg-white/[0.06] dark:text-white"
                    >
                        {vehicleId}
                    </button>
                    <span dir="ltr" className="rounded-xl bg-[#3A3A3A]/[.05] px-3 py-1.5 font-mono text-[11px] font-bold tabular-nums text-[#3A3A3A] dark:bg-white/[0.06] dark:text-white">
                        {fmtClock(state.elapsed)}
                    </span>
                    <span dir="ltr" className="rounded-xl bg-[#1F6AE1]/10 px-3 py-1.5 font-mono text-[11px] font-black tabular-nums text-[#1F6AE1]">
                        {state.score} / 100
                    </span>
                    <div className="flex rounded-xl bg-[#3A3A3A]/[.06] p-1 dark:bg-white/[0.07]">
                        {(["diagnosis", "progress"] as const).map((id) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setView(id)}
                                className={`rounded-lg px-3 py-1.5 text-[11px] font-black transition ${
                                    view === id ? "bg-white text-[#1F6AE1] shadow dark:bg-[#1b1b20]" : "text-[#3A3A3A]/50 hover:text-[#3A3A3A] dark:text-white/50 dark:hover:text-white"
                                }`}
                            >
                                {id === "diagnosis" ? t("simulator.dmmLab.bench.viewDiagnosis") : t("simulator.dmmLab.bench.viewProgress")}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex items-stretch">
                <ComponentSidebar
                    done={state.done}
                    activeRef={state.compRef}
                    onSelect={(ref) => {
                        engine.selectComponent(ref);
                        setView("diagnosis");
                    }}
                />
                <div className="min-w-0 flex-1">
                    {view === "diagnosis" ? (
                        <DiagnosisScreen engine={engine} />
                    ) : (
                        <ProgressScreen
                            engine={engine}
                            onSelect={(ref) => {
                                engine.selectComponent(ref);
                                setView("diagnosis");
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
