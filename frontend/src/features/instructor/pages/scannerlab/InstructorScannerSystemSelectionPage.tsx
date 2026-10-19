import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronRight, Network, Car } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { vehicleSystemsStore, SYSTEM_KEYS } from "../../data/vehicleSystems";
import { ScannerLabHeader } from "../../components/scannerlab/ScannerLabHeader";

const SYSTEM_ICONS = {
    drivetrain: Network,
    chassis: Car,
    body: Car,
} as const;

export function InstructorScannerSystemSelectionPage() {
    const { t } = useTranslation();
    const { variantId = "" } = useParams();
    const systems = vehicleSystemsStore.getSystems(variantId);

    const vehicles = useQuery({
        queryKey: ["instructor", "simulator", "vehicles"],
        queryFn: () => import("../../api/simulatorBuilder.api").then((m) => m.simulatorBuilderApi.vehicles()),
        enabled: Boolean(variantId),
    });

    const vehicle = (vehicles.data ?? [])
        .flatMap((make) => make.models.flatMap((model) => model.variants.map((v) => ({ id: v.id, label: `${make.name} ${model.name} · ${v.name}` }))))
        .find((v) => v.id === variantId);

    const totalEcus = SYSTEM_KEYS.reduce((sum, key) => sum + systems.systems[key].length, 0);

    return (
        <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-4 sm:p-6" data-testid="system-selection-page">
            <div className="mx-auto max-w-[1200px] space-y-5">
                <ScannerLabHeader
                    testId="system-selection-header"
                    to="/instructor/simulator/scanner/diagnostics"
                    backLabel={t("instructor.simulator.scannerLab.systems.backToDiagnostics")}
                    icon={Network}
                    eyebrow={t("instructor.simulator.scannerLab.systems.vehicleEyebrow")}
                    title={vehicle ? vehicle.label : t("instructor.simulator.scannerLab.systems.title")}
                    description={t("instructor.simulator.scannerLab.systems.desc")}
                    stats={[
                        { label: t("instructor.simulator.scannerLab.header.systems"), value: SYSTEM_KEYS.length },
                        { label: t("instructor.simulator.scannerLab.header.ecus"), value: totalEcus },
                    ]}
                />

                {vehicles.isError && (
                    <p role="alert" className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {t("instructor.simulator.scannerLab.diagnostics.loadError")}
                    </p>
                )}

                <Link
                    to={`/instructor/simulator/scanner/diagnostics/${variantId}/systems/selection`}
                    data-testid="system-selection-card"
                    className="group flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[#F47822]/25 bg-gradient-to-r from-[#FFF8F4] to-[#FFFDFC] p-5 shadow-[0_10px_28px_rgba(244,120,34,.1)] transition hover:border-[#F47822]/50 hover:shadow-[0_14px_34px_rgba(244,120,34,.16)] dark:from-[#F47822]/10 dark:to-transparent"
                >
                    <div className="flex items-center gap-4">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#F47822] to-[#ff9d5c] text-white shadow-[0_8px_20px_rgba(244,120,34,.35)] ring-1 ring-white/20">
                            <Network className="h-6 w-6" aria-hidden />
                        </span>
                        <div>
                            <p className="text-sm font-black text-[#2E2E2E] dark:text-[#ececef]">
                                {t("instructor.simulator.scannerLab.systems.cardTitle")}
                            </p>
                            <p className="mt-1 text-xs text-[#3A3A3A]/55 dark:text-white/50">
                                {t("instructor.simulator.scannerLab.systems.cardDesc")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="rounded-full bg-[#F47822]/12 px-2.5 py-1 font-mono text-[10px] font-bold text-[#F47822]">
                            {t("instructor.simulator.scannerLab.systems.ecuCount", { count: totalEcus })}
                        </span>
                        <ChevronRight className="h-5 w-5 text-[#F47822] transition group-hover:translate-x-1" aria-hidden />
                    </div>
                </Link>

                <div className="grid gap-4 sm:grid-cols-3">
                    {SYSTEM_KEYS.map((key) => {
                        const Icon = SYSTEM_ICONS[key];
                        const count = systems.systems[key].length;
                        return (
                            <div
                                key={key}
                                className="rounded-[22px] border border-[#3A3A3A]/10 bg-white p-5 shadow-[0_8px_22px_rgba(58,58,58,.05)] dark:border-white/10 dark:bg-[#1b1b20]"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/12 text-[#F47822]">
                                        <Icon className="h-5 w-5" aria-hidden />
                                    </span>
                                    <span className="rounded-full bg-[#F47822]/12 px-2.5 py-1 font-mono text-[10px] font-bold text-[#F47822]">
                                        {count}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm font-black text-[#2E2E2E] dark:text-[#ececef]">
                                    {t(`instructor.simulator.scannerLab.systems.names.${key}`)}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/55 dark:text-white/50">
                                    {t(`instructor.simulator.scannerLab.systems.namesDesc.${key}`)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
