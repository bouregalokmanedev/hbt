import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    Plus,
    Search,
    Trash2,
    Wrench,
    X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { simulatorBuilderApi } from "../../api/simulatorBuilder.api";
import { ScannerLabHeader } from "../../components/scannerlab/ScannerLabHeader";
import { SPECIAL_FUNCTIONS, specialFunctionLabel, type SpecialFunctionDef } from "../../data/specialFunctions";
import {
    specialFunctionsStore,
    useSpecialFunctionInstances,
    type SpecialFunctionInstance,
} from "../../data/specialFunctionsStore";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

type TargetVehicle = { id: string; label: string };

export function InstructorScannerSpecialFunctionsBuilderPage() {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === "rtl";
    const instances = useSpecialFunctionInstances();

    const [activeFunction, setActiveFunction] = useState<SpecialFunctionDef | null>(null);
    const [search, setSearch] = useState("");
    const [modalVehicle, setModalVehicle] = useState<TargetVehicle | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [savedFlash, setSavedFlash] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const vehicles = useQuery({
        queryKey: ["instructor", "simulator", "vehicles"],
        queryFn: () => simulatorBuilderApi.vehicles(),
        enabled: activeFunction !== null,
    });

    const counts = useMemo(() => {
        const map = new Map<string, number>();
        for (const instance of instances) {
            map.set(instance.functionId, (map.get(instance.functionId) ?? 0) + 1);
        }
        return map;
    }, [instances]);

    const filteredVehicles = useMemo(() => {
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
                return vehicle.label.toLowerCase().includes(query) || vehicle.meta.toLowerCase().includes(query);
            });
    }, [vehicles.data, search]);

    const openFunction = (fn: SpecialFunctionDef) => {
        setActiveFunction(fn);
        setSearch("");
        setSavedFlash(null);
    };

    const backToGrid = () => {
        setActiveFunction(null);
        setSearch("");
        setSavedFlash(null);
    };

    const openModal = (vehicle: TargetVehicle) => {
        setModalVehicle(vehicle);
        setTitle("");
        setDescription("");
        setImage(null);
        setFormError(null);
    };

    const closeModal = () => {
        setModalVehicle(null);
        setFormError(null);
    };

    const pickImage = (file: File | undefined) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setFormError(t("instructor.simulator.scannerLab.specialFunctions.imageInvalid"));
            return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            setFormError(t("instructor.simulator.scannerLab.specialFunctions.imageTooBig"));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setImage(typeof reader.result === "string" ? reader.result : null);
            setFormError(null);
        };
        reader.readAsDataURL(file);
    };

    const submit = () => {
        if (!activeFunction || !modalVehicle) return;
        if (!title.trim()) {
            setFormError(t("instructor.simulator.scannerLab.specialFunctions.titleRequired"));
            return;
        }
        specialFunctionsStore.add({
            functionId: activeFunction.id,
            vehicleVariantId: modalVehicle.id,
            vehicleLabel: modalVehicle.label,
            title: title.trim(),
            description: description.trim(),
            image,
        });
        setSavedFlash(modalVehicle.label);
        closeModal();
    };

    const removeInstance = (id: string) => specialFunctionsStore.remove(id);

    return (
        <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-4 sm:p-6" data-testid="scanner-special-functions-page">
            <div className="mx-auto max-w-[1200px] space-y-5">
                <ScannerLabHeader
                    testId="scanner-special-functions-header"
                    to="/instructor/simulator/scanner"
                    backLabel={t("instructor.simulator.scannerLab.backToHub")}
                    icon={activeFunction ? activeFunction.icon : Wrench}
                    eyebrow={
                        activeFunction
                            ? activeFunction.label
                            : t("instructor.simulator.scannerLab.cards.specialFunctions.title")
                    }
                    title={
                        activeFunction
                            ? t("instructor.simulator.scannerLab.specialFunctions.pickVehicle", { fn: activeFunction.label })
                            : t("instructor.simulator.scannerLab.specialFunctions.title")
                    }
                    description={
                        activeFunction
                            ? t("instructor.simulator.scannerLab.specialFunctions.pickVehicleDesc")
                            : t("instructor.simulator.scannerLab.specialFunctions.desc")
                    }
                    stats={
                        activeFunction
                            ? undefined
                            : [
                                  {
                                      label: t("instructor.simulator.scannerLab.header.functions"),
                                      value: SPECIAL_FUNCTIONS.length,
                                  },
                                  {
                                      label: t("instructor.simulator.scannerLab.header.saved"),
                                      value: instances.length,
                                  },
                              ]
                    }
                />

                {!activeFunction && (
                    <>
                        <section
                            aria-label={t("instructor.simulator.scannerLab.cards.specialFunctions.title")}
                            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                        >
                            {SPECIAL_FUNCTIONS.map((fn) => {
                                const count = counts.get(fn.id) ?? 0;
                                return (
                                    <button
                                        key={fn.id}
                                        type="button"
                                        data-testid={`sf-fn-${fn.id}`}
                                        onClick={() => openFunction(fn)}
                                        className="group relative flex flex-col items-center gap-3 rounded-[22px] border border-[#3A3A3A]/10 bg-white px-3 py-6 text-center shadow-[0_8px_22px_rgba(58,58,58,.05)] transition duration-300 hover:-translate-y-0.5 hover:border-[#F47822]/40 hover:shadow-[0_16px_36px_rgba(244,120,34,.12)] dark:border-white/10 dark:bg-[#1b1b20]"
                                    >
                                        {count > 0 && (
                                            <span
                                                data-testid={`sf-count-${fn.id}`}
                                                className="absolute end-2.5 top-2.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#F47822] px-1.5 font-mono text-[10px] font-black text-white"
                                            >
                                                {count}
                                            </span>
                                        )}
                                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F47822]/10 text-[#F47822] transition group-hover:bg-[#F47822] group-hover:text-white dark:bg-[#F47822]/15">
                                            <fn.icon className="h-6 w-6" aria-hidden />
                                        </span>
                                        <span className="text-[13px] font-black leading-tight tracking-tight text-[#2E2E2E] dark:text-[#ececef]">
                                            {fn.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </section>

                        <section
                            aria-label={t("instructor.simulator.scannerLab.specialFunctions.instancesTitle")}
                            className="rounded-[28px] border border-[#3A3A3A]/10 bg-white p-5 shadow-[0_10px_28px_rgba(58,58,58,.06)] dark:border-white/10 dark:bg-[#1b1b20]"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm font-black text-[#2E2E2E] dark:text-[#ececef]">
                                    {t("instructor.simulator.scannerLab.specialFunctions.instancesTitle")}
                                </p>
                                <span className="rounded-full bg-[#F47822]/12 px-2.5 py-1 font-mono text-[10px] font-bold text-[#F47822]">
                                    {instances.length}
                                </span>
                            </div>
                            {instances.length === 0 ? (
                                <p className="mt-4 rounded-2xl border border-dashed border-[#3A3A3A]/15 px-4 py-8 text-center text-sm text-[#3A3A3A]/50 dark:border-white/15 dark:text-white/50">
                                    {t("instructor.simulator.scannerLab.specialFunctions.instancesEmpty")}
                                </p>
                            ) : (
                                <ul className="mt-4 space-y-3">
                                    {instances.map((instance) => (
                                        <li
                                            key={instance.id}
                                            data-testid={`sf-instance-${instance.id}`}
                                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#3A3A3A]/10 bg-[#FDF9F6] px-4 py-3 dark:border-white/10 dark:bg-white/[.04]"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                {instance.image ? (
                                                    <img
                                                        src={instance.image}
                                                        alt=""
                                                        className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-[#3A3A3A]/10 dark:ring-white/10"
                                                    />
                                                ) : (
                                                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                                                        <ImageIcon className="h-5 w-5" aria-hidden />
                                                    </span>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-black text-[#2E2E2E] dark:text-[#ececef]">
                                                        {instance.title}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-xs text-[#3A3A3A]/55 dark:text-white/50">
                                                        {specialFunctionLabel(instance.functionId) ?? instance.functionId} · {instance.vehicleLabel}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                data-testid={`sf-delete-${instance.id}`}
                                                onClick={() => removeInstance(instance.id)}
                                                aria-label={t("instructor.simulator.scannerLab.specialFunctions.delete")}
                                                className="shrink-0 rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                                            >
                                                <Trash2 className="h-4 w-4" aria-hidden />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </>
                )}

                {activeFunction && (
                    <section
                        aria-label={t("instructor.simulator.scannerLab.specialFunctions.pickVehicle", { fn: activeFunction.label })}
                        className="rounded-[28px] border border-[#3A3A3A]/10 bg-white p-5 shadow-[0_10px_28px_rgba(58,58,58,.06)] dark:border-white/10 dark:bg-[#1b1b20]"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <button
                                type="button"
                                data-testid="sf-back-to-grid"
                                onClick={backToGrid}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#3A3A3A]/12 px-3.5 py-2 text-[11px] font-black text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/12 dark:text-white/60"
                            >
                                {isRtl ? <ChevronRight className="h-3.5 w-3.5" aria-hidden /> : <ChevronLeft className="h-3.5 w-3.5" aria-hidden />}
                                {t("instructor.simulator.scannerLab.specialFunctions.backToFunctions")}
                            </button>
                            <span className="rounded-full bg-[#F47822]/12 px-2.5 py-1 font-mono text-[10px] font-bold text-[#F47822]">
                                {t("instructor.simulator.scannerLab.diagnostics.libraryCount", {
                                    count: filteredVehicles.length,
                                })}
                            </span>
                        </div>

                        <label className="relative mt-4 block">
                            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/35" aria-hidden />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t("instructor.simulator.scannerLab.diagnostics.searchPh")}
                                className="h-11 w-full rounded-xl border border-[#3A3A3A]/12 bg-white ps-9 pe-3 text-sm text-[#3A3A3A] shadow-sm transition focus:border-[#F47822]/40 focus:outline-none focus:ring-2 focus:ring-[#F47822]/20 dark:border-white/12 dark:bg-[#101013] dark:text-[#ececef]"
                            />
                        </label>

                        {vehicles.isError && (
                            <p role="alert" className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-300">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {t("instructor.simulator.scannerLab.diagnostics.loadError")}
                            </p>
                        )}
                        {savedFlash && (
                            <p role="status" className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                {t("instructor.simulator.scannerLab.specialFunctions.savedFlash", { vehicle: savedFlash })}
                            </p>
                        )}

                        <div className="mt-4 max-h-[26rem] space-y-3 overflow-y-auto pe-1">
                            {filteredVehicles.map((vehicle) => (
                                <div
                                    key={vehicle.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#3A3A3A]/10 bg-[#FDF9F6] px-4 py-3 dark:border-white/10 dark:bg-white/[.04]"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black text-[#2E2E2E] dark:text-[#ececef]">{vehicle.label}</p>
                                        <p className="mt-0.5 truncate text-xs text-[#3A3A3A]/55 dark:text-white/50">{vehicle.meta || "—"}</p>
                                    </div>
                                    <button
                                        type="button"
                                        data-testid={`sf-vehicle-${vehicle.id}`}
                                        onClick={() => openModal(vehicle)}
                                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#F47822]/12 px-3.5 py-2 text-[11px] font-black text-[#F47822] transition hover:bg-[#F47822]/20"
                                    >
                                        <Plus className="h-3.5 w-3.5" aria-hidden />
                                        {t("instructor.simulator.scannerLab.specialFunctions.addForVehicle")}
                                    </button>
                                </div>
                            ))}
                            {!vehicles.isPending && !vehicles.isError && filteredVehicles.length === 0 && (
                                <p className="rounded-2xl border border-dashed border-[#3A3A3A]/15 px-4 py-8 text-center text-sm text-[#3A3A3A]/50 dark:border-white/15 dark:text-white/50">
                                    {t("instructor.simulator.scannerLab.diagnostics.empty")}
                                </p>
                            )}
                        </div>
                    </section>
                )}
            </div>

            {modalVehicle && activeFunction && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={t("instructor.simulator.scannerLab.specialFunctions.modalTitle", { fn: activeFunction.label })}
                    data-testid="sf-modal"
                    onClick={closeModal}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1115]/60 p-4 backdrop-blur-sm"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg overflow-hidden rounded-[28px] border border-[#3A3A3A]/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1b1b20]"
                    >
                        <div className="flex items-center justify-between gap-3 border-b border-[#3A3A3A]/10 bg-[#F8F7F6] px-5 py-4 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-black text-[#2E2E2E] dark:text-[#ececef]">
                                    {t("instructor.simulator.scannerLab.specialFunctions.modalTitle", { fn: activeFunction.label })}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-[#3A3A3A]/50 dark:text-white/50">{modalVehicle.label}</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                aria-label={t("instructor.simulator.scannerLab.specialFunctions.cancel")}
                                data-testid="sf-modal-close"
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#3A3A3A]/12 text-[#3A3A3A]/60 transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/12 dark:text-white/60"
                            >
                                <X className="h-4 w-4" aria-hidden />
                            </button>
                        </div>

                        <div className="space-y-4 p-5">
                            <label className="block text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">
                                {t("instructor.simulator.scannerLab.specialFunctions.titleLabel")}
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    data-testid="sf-title"
                                    className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 bg-white px-3 text-sm font-normal text-[#3A3A3A] shadow-sm transition focus:border-[#F47822]/40 focus:outline-none focus:ring-2 focus:ring-[#F47822]/20 dark:border-white/12 dark:bg-[#101013] dark:text-[#ececef]"
                                />
                            </label>

                            <label className="block text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">
                                {t("instructor.simulator.scannerLab.specialFunctions.descriptionLabel")}
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    data-testid="sf-description"
                                    className="mt-1.5 w-full rounded-xl border border-[#3A3A3A]/12 bg-white px-3 py-2.5 text-sm font-normal text-[#3A3A3A] shadow-sm transition focus:border-[#F47822]/40 focus:outline-none focus:ring-2 focus:ring-[#F47822]/20 dark:border-white/12 dark:bg-[#101013] dark:text-[#ececef]"
                                />
                            </label>

                            <div>
                                <p className="text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">
                                    {t("instructor.simulator.scannerLab.specialFunctions.imageLabel")}
                                </p>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    data-testid="sf-image"
                                    onChange={(e) => {
                                        pickImage(e.target.files?.[0]);
                                        e.target.value = "";
                                    }}
                                    className="hidden"
                                />
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => fileRef.current?.click()}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#3A3A3A]/12 px-4 py-2.5 text-xs font-black text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/12 dark:text-white/60"
                                    >
                                        <ImageIcon className="h-3.5 w-3.5" aria-hidden />
                                        {t("instructor.simulator.scannerLab.specialFunctions.imagePick")}
                                    </button>
                                    {image && (
                                        <div className="flex items-center gap-2">
                                            <img src={image} alt="" className="h-14 w-14 rounded-xl object-cover ring-1 ring-[#3A3A3A]/10 dark:ring-white/10" />
                                            <button
                                                type="button"
                                                onClick={() => setImage(null)}
                                                aria-label={t("instructor.simulator.scannerLab.specialFunctions.imageRemove")}
                                                className="grid h-8 w-8 place-items-center rounded-lg border border-[#3A3A3A]/12 text-[#3A3A3A]/60 transition hover:border-red-300 hover:text-red-500 dark:border-white/12 dark:text-white/60"
                                            >
                                                <X className="h-3.5 w-3.5" aria-hidden />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {formError && (
                                <p role="alert" className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-300">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {formError}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={submit}
                                    data-testid="sf-save"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-5 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(244,120,34,.25)] transition hover:brightness-[1.06]"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    {t("instructor.simulator.scannerLab.specialFunctions.save")}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-xl border border-[#3A3A3A]/12 px-5 py-2.5 text-xs font-black text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/12 dark:text-white/60"
                                >
                                    {t("instructor.simulator.scannerLab.specialFunctions.cancel")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export type { SpecialFunctionInstance };
