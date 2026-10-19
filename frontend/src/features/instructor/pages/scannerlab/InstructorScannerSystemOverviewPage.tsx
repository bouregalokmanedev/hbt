import { useState } from "react";
import { AlertCircle, Cpu, Network, Plus, Trash2, Zap, Gauge, Wrench } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { SystemEcuAuthoringModal, type EcuAction } from "../../components/SystemEcuAuthoringModal";
import { ScannerLabHeader } from "../../components/scannerlab/ScannerLabHeader";
import {
    SYSTEM_KEYS,
    vehicleSystemsStore,
    useVehicleSystems,
    makeId,
    type EcuNode,
    type SystemKey,
} from "../../data/vehicleSystems";

const SYSTEM_ICONS: Record<SystemKey, typeof Cpu> = {
    drivetrain: Zap,
    chassis: Gauge,
    body: Wrench,
};

const ACTIONS: EcuAction[] = ["info", "dtc", "live", "actuator"];

export function InstructorScannerSystemOverviewPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { variantId = "", systemKey } = useParams();
    const systems = useVehicleSystems(variantId);
    const selected = (SYSTEM_KEYS as readonly string[]).includes(systemKey ?? "") ? (systemKey as SystemKey) : null;

    const [modalEcu, setModalEcu] = useState<{ ecu: EcuNode; action: EcuAction } | null>(null);
    const [newEcuName, setNewEcuName] = useState("");
    const [addError, setAddError] = useState<string | null>(null);

    const addEcu = () => {
        const name = newEcuName.trim();
        if (!name) {
            setAddError(t("instructor.simulator.scannerLab.systems.modal.required"));
            return;
        }
        vehicleSystemsStore.mutateSystems(variantId, (s) => ({
            ...s,
            systems: {
                ...s.systems,
                [selected as SystemKey]: [
                    ...s.systems[selected as SystemKey],
                    { id: makeId(), name, info: null, dtcs: [], liveData: [], actuators: [] },
                ],
            },
        }));
        setNewEcuName("");
        setAddError(null);
    };

    const removeEcu = (ecuId: string) =>
        vehicleSystemsStore.mutateSystems(variantId, (s) => ({
            ...s,
            systems: { ...s.systems, [selected as SystemKey]: s.systems[selected as SystemKey].filter((e) => e.id !== ecuId) },
        }));

    // Page C — selected system's ECU list + authoring
    if (selected) {
        const ecus = systems.systems[selected];
        const Icon = SYSTEM_ICONS[selected];
        return (
            <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-4 sm:p-6" data-testid={`system-ecus-${selected}`}>
                <div className="mx-auto max-w-[1200px] space-y-5">
                    <ScannerLabHeader
                        testId={`system-ecus-header-${selected}`}
                        to={`/instructor/simulator/scanner/diagnostics/${variantId}/systems/selection`}
                        backLabel={t("instructor.simulator.scannerLab.systems.backToSystems")}
                        crumbs={[t("instructor.simulator.scannerLab.systems.eyebrow")]}
                        icon={Icon}
                        eyebrow={t("instructor.simulator.scannerLab.systems.eyebrow")}
                        title={t(`instructor.simulator.scannerLab.systems.names.${selected}`)}
                        description={t("instructor.simulator.scannerLab.systems.ecusDesc", { count: ecus.length })}
                        stats={[
                            { label: t("instructor.simulator.scannerLab.header.ecus"), value: ecus.length },
                            {
                                label: t("instructor.simulator.scannerLab.header.authored"),
                                value: ecus.filter((e) => e.info || e.dtcs.length || e.liveData.length || e.actuators.length).length,
                            },
                        ]}
                    />

                    <section className="overflow-hidden rounded-[28px] border border-[#3A3A3A]/10 bg-white shadow-[0_10px_28px_rgba(58,58,58,.06)] dark:border-white/10 dark:bg-[#1b1b20]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3A3A3A]/10 px-5 py-4 dark:border-white/10">
                            <div className="flex items-center gap-2.5">
                                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F47822]/12 text-[#F47822]">
                                    <Cpu className="h-4.5 w-4.5" aria-hidden />
                                </span>
                                <div>
                                    <p className="text-sm font-black text-[#2E2E2E] dark:text-[#ececef]">
                                        {t("instructor.simulator.scannerLab.systems.ecusTitle")}
                                    </p>
                                    <p className="text-[11px] text-[#3A3A3A]/50 dark:text-white/45">
                                        {t("instructor.simulator.scannerLab.systems.ecusTitleHint")}
                                    </p>
                                </div>
                            </div>
                            <span className="rounded-full bg-[#F47822]/12 px-3 py-1 font-mono text-[11px] font-bold text-[#F47822]">
                                {t("instructor.simulator.scannerLab.systems.ecuCount", { count: ecus.length })}
                            </span>
                        </div>

                        <div className="max-h-[32rem] overflow-y-auto px-3 py-3">
                            {ecus.length === 0 && (
                                <p className="rounded-2xl border border-dashed border-[#3A3A3A]/15 px-4 py-10 text-center text-sm text-[#3A3A3A]/50 dark:border-white/15 dark:text-white/50">
                                    {t("instructor.simulator.scannerLab.systems.ecusEmpty")}
                                </p>
                            )}

                            <div className="space-y-2">
                                {ecus.map((ecu) => (
                                    <div
                                        key={ecu.id}
                                        data-testid={`ecu-row-${ecu.id}`}
                                        className="rounded-2xl border border-transparent bg-[#FDF9F6] p-4 transition hover:border-[#F47822]/25 hover:shadow-[0_6px_16px_rgba(244,120,34,.08)] dark:bg-white/[.04] dark:hover:border-[#F47822]/30"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F47822]/12 text-[#F47822]">
                                                    <Cpu className="h-4 w-4" aria-hidden />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-black text-[#2E2E2E] dark:text-[#ececef]">{ecu.name}</p>
                                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                                        {ecu.info && (
                                                            <span className="rounded-md bg-[#8B5CF6]/10 px-2 py-0.5 text-[10px] font-bold text-[#8B5CF6]">
                                                                {t("instructor.simulator.scannerLab.systems.actions.info")}
                                                            </span>
                                                        )}
                                                        {ecu.dtcs.length > 0 && (
                                                            <span className="rounded-md bg-[#EF4444]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#EF4444]">
                                                                {ecu.dtcs.length} DTC
                                                            </span>
                                                        )}
                                                        {ecu.liveData.length > 0 && (
                                                            <span className="rounded-md bg-[#F47822]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#F47822]">
                                                                {ecu.liveData.length} PID
                                                            </span>
                                                        )}
                                                        {ecu.actuators.length > 0 && (
                                                            <span className="rounded-md bg-[#10B981]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#10B981]">
                                                                {ecu.actuators.length} ACT
                                                            </span>
                                                        )}
                                                        {!ecu.info && ecu.dtcs.length === 0 && ecu.liveData.length === 0 && ecu.actuators.length === 0 && (
                                                            <span className="rounded-md bg-[#3A3A3A]/6 px-2 py-0.5 text-[10px] font-bold text-[#3A3A3A]/50 dark:bg-white/10 dark:text-white/45">
                                                                {t("instructor.simulator.scannerLab.systems.noAuthoring")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeEcu(ecu.id)}
                                                aria-label={t("instructor.simulator.scannerLab.systems.modal.delete")}
                                                data-testid={`ecu-remove-${ecu.id}`}
                                                className="shrink-0 rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                            </button>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2 ps-12">
                                            {ACTIONS.map((action) => (
                                                <button
                                                    key={action}
                                                    type="button"
                                                    onClick={() => setModalEcu({ ecu, action })}
                                                    data-testid={`ecu-action-${ecu.id}-${action}`}
                                                    className="rounded-xl border border-[#3A3A3A]/12 bg-white px-3 py-1.5 text-[11px] font-black text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/12 dark:bg-[#1b1b20] dark:text-white/60"
                                                >
                                                    {t(`instructor.simulator.scannerLab.systems.actions.${action}`)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-[#3A3A3A]/10 bg-[#FDFCFC] px-5 py-4 dark:border-white/10 dark:bg-white/[.02]">
                            <p className="text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">
                                {t("instructor.simulator.scannerLab.systems.addEcu")}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <input
                                    value={newEcuName}
                                    onChange={(e) => setNewEcuName(e.target.value)}
                                    placeholder={t("instructor.simulator.scannerLab.systems.ecuNamePh")}
                                    data-testid="add-ecu-name"
                                    className="h-11 min-w-[14rem] flex-1 rounded-xl border border-[#3A3A3A]/12 bg-white px-3 text-sm text-[#3A3A3A] shadow-sm transition placeholder:text-[#3A3A3A]/35 focus:border-[#F47822]/40 focus:outline-none focus:ring-2 focus:ring-[#F47822]/20 dark:border-white/12 dark:bg-[#101013] dark:text-[#ececef]"
                                />
                                <button
                                    type="button"
                                    onClick={addEcu}
                                    data-testid="add-ecu-submit"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-5 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(244,120,34,.25)] transition hover:brightness-[1.06]"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    {t("instructor.simulator.scannerLab.systems.add")}
                                </button>
                            </div>
                            {addError && (
                                <p role="alert" className="mt-2 flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-300">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {addError}
                                </p>
                            )}
                        </div>
                    </section>
                </div>

                {modalEcu && (
                    <SystemEcuAuthoringModal
                        variantId={variantId}
                        systemKey={selected}
                        ecu={modalEcu.ecu}
                        action={modalEcu.action}
                        onClose={() => setModalEcu(null)}
                    />
                )}
            </main>
        );
    }

    // Page B — 3 system cards
    const totalEcus = SYSTEM_KEYS.reduce((sum, key) => sum + systems.systems[key].length, 0);
    return (
        <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-4 sm:p-6" data-testid="system-overview-page">
            <div className="mx-auto max-w-[1200px] space-y-5">
                <ScannerLabHeader
                    testId="system-overview-header"
                    to={`/instructor/simulator/scanner/diagnostics/${variantId}/systems`}
                    backLabel={t("instructor.simulator.scannerLab.systems.backToSystems")}
                    crumbs={[t("instructor.simulator.scannerLab.systems.eyebrow")]}
                    icon={Network}
                    eyebrow={t("instructor.simulator.scannerLab.systems.eyebrow")}
                    title={t("instructor.simulator.scannerLab.systems.selectTitle")}
                    description={t("instructor.simulator.scannerLab.systems.desc")}
                    stats={[
                        { label: t("instructor.simulator.scannerLab.header.systems"), value: SYSTEM_KEYS.length },
                        { label: t("instructor.simulator.scannerLab.header.ecus"), value: totalEcus },
                    ]}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    {SYSTEM_KEYS.map((key) => {
                        const Icon = SYSTEM_ICONS[key];
                        const count = systems.systems[key].length;
                        const authored = systems.systems[key].filter((e) => e.info || e.dtcs.length || e.liveData.length || e.actuators.length).length;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => navigate(`/instructor/simulator/scanner/diagnostics/${variantId}/systems/selection/${key}`)}
                                data-testid={`system-card-${key}`}
                                className="group rounded-[28px] border border-[#3A3A3A]/10 bg-white p-5 text-start shadow-[0_10px_28px_rgba(58,58,58,.06)] transition hover:-translate-y-0.5 hover:border-[#F47822]/40 hover:shadow-[0_16px_36px_rgba(244,120,34,.12)] dark:border-white/10 dark:bg-[#1b1b20]"
                            >
                                <div className="flex items-start justify-between">
                                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F47822]/12 text-[#F47822] transition group-hover:bg-[#F47822] group-hover:text-white">
                                        <Icon className="h-6 w-6" aria-hidden />
                                    </span>
                                    <span className="rounded-full bg-[#F47822]/12 px-2.5 py-1 font-mono text-[10px] font-bold text-[#F47822]">
                                        {t("instructor.simulator.scannerLab.systems.ecuCount", { count })}
                                    </span>
                                </div>
                                <p className="mt-4 text-sm font-black text-[#2E2E2E] dark:text-[#ececef]">
                                    {t(`instructor.simulator.scannerLab.systems.names.${key}`)}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/55 dark:text-white/50">
                                    {t(`instructor.simulator.scannerLab.systems.namesDesc.${key}`)}
                                </p>
                                <p className="mt-4 border-t border-[#3A3A3A]/8 pt-3 text-[11px] font-bold text-[#3A3A3A]/50 dark:border-white/8 dark:text-white/45">
                                    {authored > 0
                                        ? t("instructor.simulator.scannerLab.systems.authoredCount", { count: authored })
                                        : t("instructor.simulator.scannerLab.systems.noneAuthored")}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
