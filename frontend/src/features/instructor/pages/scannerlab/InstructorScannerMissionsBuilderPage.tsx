import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    CheckCircle2,
    Circle,
    Flag,
    Plus,
    Search,
    Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { simulatorBuilderApi } from "../../api/simulatorBuilder.api";
import { ScannerLabHeader } from "../../components/scannerlab/ScannerLabHeader";
import {
    scannerMissionsStore,
    useScannerMissions,
    type MissionObjective,
    type MissionObjectiveKind,
    type ScannerMission,
} from "../../data/scannerMissionsStore";

const OBJECTIVE_KINDS: MissionObjectiveKind[] = [
    "scan",
    "readDtc",
    "clearDtc",
    "liveData",
    "specialFunction",
];

type TargetVehicle = { id: string; label: string };

export function InstructorScannerMissionsBuilderPage() {
    const { t } = useTranslation();
    const missions = useScannerMissions();

    const [activeMission, setActiveMission] = useState<ScannerMission | null>(null);
    const [search, setSearch] = useState("");
    const [picking, setPicking] = useState(false);
    const [modalVehicle, setModalVehicle] = useState<TargetVehicle | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [objectives, setObjectives] = useState<MissionObjective[]>([]);
    const [objKind, setObjKind] = useState<MissionObjectiveKind>("scan");
    const [objEcu, setObjEcu] = useState("");
    const [objDtc, setObjDtc] = useState("");
    const [objLabel, setObjLabel] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [savedFlash, setSavedFlash] = useState<string | null>(null);

    const vehicles = useQuery({
        queryKey: ["instructor", "simulator", "vehicles"],
        queryFn: () => simulatorBuilderApi.vehicles(),
        enabled: modalVehicle !== null,
    });

    const filteredVehicles = (() => {
        const query = search.trim().toLowerCase();
        return (vehicles.data ?? [])
            .flatMap((make) =>
                make.models.flatMap((model) =>
                    model.variants.map((variant) => ({
                        id: variant.id,
                        label: `${make.name} ${model.name} · ${variant.name}`,
                        meta: [variant.engine_code, variant.fuel_type, variant.transmission]
                            .filter(Boolean)
                            .join(" · "),
                    })),
                ),
            )
            .filter((vehicle) => {
                if (!query) return true;
                return (
                    vehicle.label.toLowerCase().includes(query) ||
                    vehicle.meta.toLowerCase().includes(query)
                );
            });
    })();

    const openMission = (mission: ScannerMission) => {
        setActiveMission(mission);
        setSavedFlash(null);
    };

    const backToGrid = () => {
        setActiveMission(null);
        setSavedFlash(null);
    };

    const openModal = (vehicle: TargetVehicle) => {
        setPicking(false);
        setModalVehicle(vehicle);
        setTitle("");
        setDescription("");
        setObjectives([]);
        setFormError(null);
    };

    const closeModal = () => {
        setPicking(false);
        setModalVehicle(null);
        setFormError(null);
    };

    const addObjective = () => {
        const label = objLabel.trim();
        if (!label) {
            setFormError(t("instructor.simulator.scannerLab.missions.objectiveRequired"));
            return;
        }
        setObjectives((prev) => [
            ...prev,
            {
                id: `o-${Date.now().toString(36)}-${prev.length}`,
                kind: objKind,
                ...(objEcu.trim() ? { ecuName: objEcu.trim() } : {}),
                ...(objDtc.trim() ? { dtcCode: objDtc.trim().toUpperCase() } : {}),
                label,
            },
        ]);
        setObjLabel("");
        setObjEcu("");
        setObjDtc("");
        setFormError(null);
    };

    const removeObjective = (id: string) =>
        setObjectives((prev) => prev.filter((o) => o.id !== id));

    const createMission = () => {
        if (!title.trim()) {
            setFormError(t("instructor.simulator.scannerLab.missions.titleRequired"));
            return;
        }
        if (objectives.length === 0) {
            setFormError(t("instructor.simulator.scannerLab.missions.needObjective"));
            return;
        }
        const mission = scannerMissionsStore.add({
            title: title.trim(),
            description: description.trim(),
            vehicleVariantId: modalVehicle!.id,
            vehicleLabel: modalVehicle!.label,
            objectives,
        });
        closeModal();
        setActiveMission(mission);
    };

    const togglePublished = (mission: ScannerMission) => {
        scannerMissionsStore.update(mission.id, { published: !mission.published });
        setActiveMission({
            ...mission,
            published: !mission.published,
        });
    };

    const deleteMission = (id: string) => {
        scannerMissionsStore.remove(id);
        setActiveMission(null);
    };

    const cs = "instructor.simulator.scannerLab.missions";

    if (activeMission) {
        return (
            <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-4 sm:p-6">
                <div className="mx-auto max-w-[1200px] space-y-5">
                    <ScannerLabHeader
                        testId="missions-detail-header"
                        to="/instructor/simulator/scanner/missions"
                        crumbs={[t("instructor.simulator.scannerLab.header.builders")]}
                        backLabel={t(`${cs}.backToMissions`)}
                        icon={Flag}
                        eyebrow={t("instructor.simulator.scannerLab.eyebrow")}
                        title={activeMission.title}
                        description={activeMission.description || activeMission.vehicleLabel}
                        stats={[
                            {
                                label: t(`${cs}.objectives`),
                                value: activeMission.objectives.length,
                            },
                            {
                                label: t(`${cs}.status`),
                                value: activeMission.published
                                    ? t(`${cs}.published`)
                                    : t(`${cs}.draft`),
                            },
                        ]}
                    />
                    <section className="rounded-[24px] border border-white/10 bg-white p-5 shadow-sm dark:bg-[#17171b]">
                        {savedFlash ? (
                            <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                {savedFlash}
                            </p>
                        ) : null}
                        <p className="text-sm font-semibold text-[#3A3A3A]/60 dark:text-white/55">
                            {activeMission.vehicleLabel}
                        </p>
                        <ul className="mt-4 space-y-2">
                            {activeMission.objectives.map((objective, index) => (
                                <li
                                    key={objective.id}
                                    className="flex items-center gap-3 rounded-xl border border-[#3A3A3A]/10 bg-[#FDF9F6] px-4 py-3 dark:border-white/10 dark:bg-white/[.04]"
                                >
                                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#F47822]/10 text-[#F47822]">
                                        <Circle className="h-3.5 w-3.5" aria-hidden />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-[#2E2E2E] dark:text-[#ececef]">
                                            {index + 1}. {objective.label}
                                        </p>
                                        <p className="text-[11px] text-[#3A3A3A]/50 dark:text-white/45">
                                            {t(`${cs}.kinds.${objective.kind}`)}
                                            {objective.ecuName ? ` · ${objective.ecuName}` : ""}
                                            {objective.dtcCode ? ` · ${objective.dtcCode}` : ""}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeObjective(objective.id)}
                                        aria-label={t(`${cs}.removeObjective`)}
                                        className="shrink-0 rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => togglePublished(activeMission)}
                                data-testid="mission-toggle-publish"
                                className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(244,120,34,.25)] transition hover:brightness-[1.06] ${
                                    activeMission.published
                                        ? "bg-gradient-to-r from-[#2ea44f] to-[#3fb964]"
                                        : "bg-gradient-to-r from-[#F47822] to-[#ff8f45]"
                                }`}
                            >
                                {activeMission.published ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                                ) : null}
                                {activeMission.published
                                    ? t(`${cs}.unpublish`)
                                    : t(`${cs}.publish`)}
                            </button>
                            <button
                                type="button"
                                onClick={() => deleteMission(activeMission.id)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-xs font-black text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                            >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                {t(`${cs}.delete`)}
                            </button>
                        </div>
                    </section>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-4 sm:p-6">
            <div className="mx-auto max-w-[1200px] space-y-5">
                <ScannerLabHeader
                    testId="missions-builder-header"
                    to="/instructor/simulator/scanner"
                    backLabel={t("instructor.simulator.scannerLab.back")}
                    icon={Flag}
                    eyebrow={t("instructor.simulator.scannerLab.eyebrow")}
                    title={t(`${cs}.title`)}
                    description={t(`${cs}.description`)}
                    stats={[{ label: t(`${cs}.missions`), value: missions.length }]}
                />

                {modalVehicle ? (
                    <section className="rounded-[24px] border border-white/10 bg-white p-5 shadow-sm dark:bg-[#17171b]">
                        <h2 className="text-lg font-black text-[#2E2E2E] dark:text-[#ececef]">
                            {t(`${cs}.newFor`, { vehicle: modalVehicle.label })}
                        </h2>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <label className="block text-xs font-bold text-[#3A3A3A]/60 dark:text-white/50">
                                {t(`${cs}.missionTitle`)}
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    data-testid="mission-title"
                                    className="mt-1 w-full rounded-xl border border-[#3A3A3A]/15 bg-white px-3 py-2 text-sm text-[#2E2E2E] outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-[#101013] dark:text-white"
                                />
                            </label>
                            <label className="block text-xs font-bold text-[#3A3A3A]/60 dark:text-white/50">
                                {t(`${cs}.missionDesc`)}
                                <input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    data-testid="mission-desc"
                                    className="mt-1 w-full rounded-xl border border-[#3A3A3A]/15 bg-white px-3 py-2 text-sm text-[#2E2E2E] outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-[#101013] dark:text-white"
                                />
                            </label>
                        </div>

                        <h3 className="mt-6 text-sm font-black text-[#2E2E2E] dark:text-[#ececef]">
                            {t(`${cs}.objectives`)}
                        </h3>
                        <div className="mt-2 grid gap-3 sm:grid-cols-[160px_1fr_1fr_1fr_auto]">
                            <label className="block text-xs font-bold text-[#3A3A3A]/60 dark:text-white/50">
                                {t(`${cs}.objectiveKind`)}
                                <select
                                    value={objKind}
                                    onChange={(e) => setObjKind(e.target.value as MissionObjectiveKind)}
                                    data-testid="objective-kind"
                                    className="mt-1 w-full rounded-xl border border-[#3A3A3A]/15 bg-white px-3 py-2 text-sm text-[#2E2E2E] outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-[#101013] dark:text-white"
                                >
                                    {OBJECTIVE_KINDS.map((kind) => (
                                        <option key={kind} value={kind}>
                                            {t(`${cs}.kinds.${kind}`)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block text-xs font-bold text-[#3A3A3A]/60 dark:text-white/50">
                                {t(`${cs}.objectiveEcu`)}
                                <input
                                    value={objEcu}
                                    onChange={(e) => setObjEcu(e.target.value)}
                                    data-testid="objective-ecu"
                                    placeholder={t(`${cs}.objectiveEcuPh`)}
                                    className="mt-1 w-full rounded-xl border border-[#3A3A3A]/15 bg-white px-3 py-2 text-sm text-[#2E2E2E] outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-[#101013] dark:text-white"
                                />
                            </label>
                            <label className="block text-xs font-bold text-[#3A3A3A]/60 dark:text-white/50">
                                {t(`${cs}.objectiveDtc`)}
                                <input
                                    value={objDtc}
                                    onChange={(e) => setObjDtc(e.target.value)}
                                    data-testid="objective-dtc"
                                    placeholder="P0301"
                                    dir="ltr"
                                    className="mt-1 w-full rounded-xl border border-[#3A3A3A]/15 bg-white px-3 py-2 font-mono text-sm text-[#2E2E2E] outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-[#101013] dark:text-white"
                                />
                            </label>
                            <label className="block text-xs font-bold text-[#3A3A3A]/60 dark:text-white/50">
                                {t(`${cs}.objectiveLabel`)}
                                <input
                                    value={objLabel}
                                    onChange={(e) => setObjLabel(e.target.value)}
                                    data-testid="objective-label"
                                    className="mt-1 w-full rounded-xl border border-[#3A3A3A]/15 bg-white px-3 py-2 text-sm text-[#2E2E2E] outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-[#101013] dark:text-white"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={addObjective}
                                data-testid="objective-add"
                                className="mt-auto inline-flex items-center gap-1.5 self-end rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#222] dark:bg-white/10 dark:hover:bg-white/20"
                            >
                                <Plus className="h-3.5 w-3.5" aria-hidden />
                                {t(`${cs}.addObjective`)}
                            </button>
                        </div>

                        {objectives.length > 0 ? (
                            <ul className="mt-4 space-y-2">
                                {objectives.map((objective, index) => (
                                    <li
                                        key={objective.id}
                                        className="flex items-center gap-3 rounded-xl border border-[#3A3A3A]/10 bg-[#FDF9F6] px-4 py-2.5 dark:border-white/10 dark:bg-white/[.04]"
                                    >
                                        <span className="text-sm font-black text-[#F47822]">
                                            {index + 1}.
                                        </span>
                                        <span className="flex-1 text-sm font-bold text-[#2E2E2E] dark:text-[#ececef]">
                                            {objective.label}
                                        </span>
                                        <span className="text-[11px] text-[#3A3A3A]/50 dark:text-white/45">
                                            {t(`${cs}.kinds.${objective.kind}`)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeObjective(objective.id)}
                                            aria-label={t(`${cs}.removeObjective`)}
                                            className="shrink-0 rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : null}

                        {formError ? (
                            <p role="alert" className="mt-4 text-xs font-semibold text-red-600 dark:text-red-300">
                                {formError}
                            </p>
                        ) : null}

                        <div className="mt-5 flex gap-3">
                            <button
                                type="button"
                                onClick={createMission}
                                data-testid="mission-create"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-5 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(244,120,34,.25)] transition hover:brightness-[1.06]"
                            >
                                <Plus className="h-3.5 w-3.5" aria-hidden />
                                {t(`${cs}.create`)}
                            </button>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-xl border border-[#3A3A3A]/15 px-5 py-2.5 text-xs font-black text-[#3A3A3A]/60 transition hover:bg-[#3A3A3A]/5 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/10"
                            >
                                {t(`${cs}.cancel`)}
                            </button>
                        </div>
                    </section>
                ) : (
                    <section className="rounded-[24px] border border-white/10 bg-white p-5 shadow-sm dark:bg-[#17171b]">
                        <button
                            type="button"
                            onClick={() => setPicking(true)}
                            data-testid="missions-pick-vehicle"
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-5 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(244,120,34,.25)] transition hover:brightness-[1.06]"
                        >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                            {t(`${cs}.newMission`)}
                        </button>

                        {picking ? (
                            <div className="mt-5">
                                <label className="block text-xs font-bold text-[#3A3A3A]/60 dark:text-white/50">
                                    <span className="mb-1 flex items-center gap-2">
                                        <Search className="h-3.5 w-3.5" aria-hidden />
                                        {t(`${cs}.searchVehicles`)}
                                    </span>
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        data-testid="vehicle-search"
                                        className="w-full rounded-xl border border-[#3A3A3A]/15 bg-white px-3 py-2 text-sm text-[#2E2E2E] outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-[#101013] dark:text-white"
                                    />
                                </label>
                                <ul className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
                                    {filteredVehicles.map((vehicle) => (
                                        <li key={vehicle.id}>
                                            <button
                                                type="button"
                                                onClick={() => openModal(vehicle)}
                                                className="flex w-full items-center justify-between rounded-xl border border-[#3A3A3A]/10 px-4 py-3 text-start transition hover:border-[#F47822]/40 hover:bg-[#F47822]/5 dark:border-white/10"
                                            >
                                                <span className="text-sm font-bold text-[#2E2E2E] dark:text-[#ececef]">
                                                    {vehicle.label}
                                                </span>
                                                <span className="text-[11px] text-[#3A3A3A]/50 dark:text-white/45">
                                                    {vehicle.meta}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </section>
                )}

                {missions.length > 0 ? (
                    <section className="rounded-[24px] border border-white/10 bg-white p-5 shadow-sm dark:bg-[#17171b]">
                        <h2 className="text-lg font-black text-[#2E2E2E] dark:text-[#ececef]">
                            {t(`${cs}.missions`)}
                        </h2>
                        <ul className="mt-4 space-y-2">
                            {missions.map((mission) => (
                                <li key={mission.id}>
                                    <button
                                        type="button"
                                        onClick={() => openMission(mission)}
                                        className="flex w-full items-center gap-3 rounded-xl border border-[#3A3A3A]/10 px-4 py-3 text-start transition hover:border-[#F47822]/40 hover:bg-[#F47822]/5 dark:border-white/10"
                                    >
                                        <Flag className="h-4 w-4 shrink-0 text-[#F47822]" aria-hidden />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-bold text-[#2E2E2E] dark:text-[#ececef]">
                                                {mission.title}
                                            </span>
                                            <span className="block truncate text-[11px] text-[#3A3A3A]/50 dark:text-white/45">
                                                {mission.vehicleLabel} · {mission.objectives.length}{" "}
                                                {t(`${cs}.objectives`)}
                                            </span>
                                        </span>
                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                                                mission.published
                                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                    : "bg-[#3A3A3A]/10 text-[#3A3A3A]/60 dark:bg-white/10 dark:text-white/50"
                                            }`}
                                        >
                                            {mission.published
                                                ? t(`${cs}.published`)
                                                : t(`${cs}.draft`)}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}
            </div>
        </main>
    );
}
