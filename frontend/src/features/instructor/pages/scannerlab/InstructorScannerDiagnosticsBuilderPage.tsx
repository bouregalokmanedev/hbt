import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Car, CheckCircle2, Network, Plus, ScanLine, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    simulatorBuilderApi,
    type CreateVariantPayload,
} from "../../api/simulatorBuilder.api";
import { ScannerLabHeader } from "../../components/scannerlab/ScannerLabHeader";

const FORM_FIELDS = [
    "make_name",
    "model_name",
    "name",
    "engine_code",
    "fuel_type",
    "transmission",
    "year_from",
    "year_to",
] as const;

type FormKey = (typeof FORM_FIELDS)[number];

const LABEL_KEYS: Record<FormKey, string> = {
    make_name: "make",
    model_name: "model",
    name: "variant",
    engine_code: "engineCode",
    fuel_type: "fuelType",
    transmission: "transmission",
    year_from: "yearFrom",
    year_to: "yearTo",
};

export function InstructorScannerDiagnosticsBuilderPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [fuelFilter, setFuelFilter] = useState("all");
    const [form, setForm] = useState<Record<FormKey, string>>({
        make_name: "",
        model_name: "",
        name: "",
        engine_code: "",
        fuel_type: "",
        transmission: "",
        year_from: "",
        year_to: "",
    });
    const [savedId, setSavedId] = useState<string | null>(null);

    const vehicles = useQuery({
        queryKey: ["instructor", "simulator", "vehicles"],
        queryFn: () => simulatorBuilderApi.vehicles(),
    });

    const create = useMutation({
        mutationFn: (payload: CreateVariantPayload) => simulatorBuilderApi.createVariant(payload),
        onSuccess: (variant) => {
            void queryClient.invalidateQueries({ queryKey: ["instructor", "simulator"] });
            setSavedId(variant.id);
            setForm({
                make_name: "",
                model_name: "",
                name: "",
                engine_code: "",
                fuel_type: "",
                transmission: "",
                year_from: "",
                year_to: "",
            });
        },
    });

    const set = (key: FormKey, value: string) => setForm((f) => ({ ...f, [key]: value }));
    const canSubmit = form.make_name.trim() && form.model_name.trim() && form.name.trim();
    const submit = () => {
        if (!canSubmit) return;
        create.mutate({
            make_name: form.make_name.trim(),
            model_name: form.model_name.trim(),
            name: form.name.trim(),
            engine_code: form.engine_code.trim() || undefined,
            fuel_type: form.fuel_type.trim() || undefined,
            transmission: form.transmission.trim() || undefined,
            year_from: form.year_from ? Number(form.year_from) : undefined,
            year_to: form.year_to ? Number(form.year_to) : undefined,
        });
    };

    const query = search.trim().toLowerCase();

    const totalVehicles = useMemo(
        () => (vehicles.data ?? []).reduce((sum, make) => sum + make.models.reduce((m, model) => m + model.variants.length, 0), 0),
        [vehicles.data],
    );

    const fuelFilters = useMemo(() => {
        const set = new Set<string>();
        for (const make of vehicles.data ?? []) {
            for (const model of make.models) {
                for (const variant of model.variants) {
                    if (variant.fuel_type) set.add(variant.fuel_type);
                }
            }
        }
        return [...set].sort();
    }, [vehicles.data]);

    const filtered = useMemo(
        () =>
            (vehicles.data ?? [])
                .map((make) => ({
                    ...make,
                    models: make.models
                        .map((model) => ({
                            ...model,
                            variants: model.variants.filter((variant) => {
                                if (fuelFilter !== "all" && variant.fuel_type !== fuelFilter) return false;
                                if (!query) return true;
                                return (
                                    make.name.toLowerCase().includes(query) ||
                                    model.name.toLowerCase().includes(query) ||
                                    variant.name.toLowerCase().includes(query) ||
                                    (variant.engine_code ?? "").toLowerCase().includes(query)
                                );
                            }),
                        }))
                        .filter((model) => model.variants.length > 0),
                }))
                .filter((make) => make.models.length > 0),
        [vehicles.data, query, fuelFilter],
    );

    const filteredCount = useMemo(
        () => filtered.reduce((sum, make) => sum + make.models.reduce((m, model) => m + model.variants.length, 0), 0),
        [filtered],
    );

    const grouped = useMemo(
        () => filtered.map((make) => ({ make: make.name, models: make.models })),
        [filtered],
    );

    const openInSimulator = (variantId: string) => {
        navigate("/instructor/simulator", { state: { tab: "variants", variantId } });
    };

    return (
        <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-4 sm:p-6" data-testid="scanner-diagnostics-page">
            <div className="mx-auto max-w-[1200px] space-y-5">
                <ScannerLabHeader
                    testId="scanner-diagnostics-header"
                    to="/instructor/simulator/scanner"
                    backLabel={t("instructor.simulator.scannerLab.backToHub")}
                    icon={ScanLine}
                    eyebrow={t("instructor.simulator.scannerLab.cards.diagnostics.title")}
                    title={t("instructor.simulator.scannerLab.diagnostics.title")}
                    description={t("instructor.simulator.scannerLab.diagnostics.desc")}
                    stats={[
                        {
                            label: t("instructor.simulator.scannerLab.header.vehicles"),
                            value: vehicles.isPending ? "…" : totalVehicles,
                        },
                    ]}
                />

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                    <section
                        aria-label={t("instructor.simulator.scannerLab.diagnostics.libraryTitle")}
                        className="overflow-hidden rounded-[28px] border border-[#3A3A3A]/10 bg-white shadow-[0_10px_28px_rgba(58,58,58,.06)] dark:border-white/10 dark:bg-[#1b1b20]"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3A3A3A]/10 px-5 py-4 dark:border-white/10">
                            <div className="flex items-center gap-2.5">
                                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F47822]/12 text-[#F47822]">
                                    <Car className="h-4.5 w-4.5" aria-hidden />
                                </span>
                                <div>
                                    <p className="text-sm font-black text-[#2E2E2E] dark:text-[#ececef]">
                                        {t("instructor.simulator.scannerLab.diagnostics.libraryTitle")}
                                    </p>
                                    <p className="text-[11px] text-[#3A3A3A]/50 dark:text-white/45">
                                        {t("instructor.simulator.scannerLab.diagnostics.libraryHint")}
                                    </p>
                                </div>
                            </div>
                            <span className="rounded-full bg-[#F47822]/12 px-3 py-1 font-mono text-[11px] font-bold text-[#F47822]">
                                {vehicles.isPending
                                    ? "…"
                                    : t("instructor.simulator.scannerLab.diagnostics.libraryCount", {
                                          count: totalVehicles,
                                      })}
                            </span>
                        </div>

                        <div className="border-b border-[#3A3A3A]/10 bg-[#FDFCFC] px-5 py-3.5 dark:border-white/10 dark:bg-white/[.02]">
                            <label className="relative block">
                                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/35" aria-hidden />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t("instructor.simulator.scannerLab.diagnostics.searchPh")}
                                    data-testid="library-search"
                                    className="h-11 w-full rounded-xl border border-[#3A3A3A]/12 bg-white ps-9 pe-3 text-sm text-[#3A3A3A] shadow-sm transition placeholder:text-[#3A3A3A]/35 focus:border-[#F47822]/40 focus:outline-none focus:ring-2 focus:ring-[#F47822]/20 dark:border-white/12 dark:bg-[#101013] dark:text-[#ececef]"
                                />
                            </label>

                            {fuelFilters.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {["all", ...fuelFilters].map((fuel) => (
                                        <button
                                            key={fuel}
                                            type="button"
                                            onClick={() => setFuelFilter(fuel)}
                                            aria-pressed={fuelFilter === fuel}
                                            data-testid={`fuel-filter-${fuel}`}
                                            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                                                fuelFilter === fuel
                                                    ? "border-[#F47822] bg-[#F47822] text-white shadow-[0_6px_14px_rgba(244,120,34,.28)]"
                                                    : "border-[#3A3A3A]/12 bg-white text-[#3A3A3A]/60 hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/12 dark:bg-[#101013] dark:text-white/55"
                                            }`}
                                        >
                                            {fuel === "all"
                                                ? t("instructor.simulator.scannerLab.diagnostics.filterAll")
                                                : fuel}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {vehicles.isError && (
                            <p role="alert" className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {t("instructor.simulator.scannerLab.diagnostics.loadError")}
                            </p>
                        )}

                        <div className="max-h-[32rem] overflow-y-auto px-3 py-3">
                            {vehicles.isPending &&
                                [0, 1, 2].map((row) => (
                                    <div key={row} className="mb-2 flex items-center gap-3 rounded-2xl border border-[#3A3A3A]/8 bg-[#FDFCFC] px-4 py-3.5 dark:border-white/8 dark:bg-white/[.02]">
                                        <span className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-[#3A3A3A]/8" />
                                        <span className="h-3 w-40 animate-pulse rounded-full bg-[#3A3A3A]/8" />
                                    </div>
                                ))}

                            {grouped.map(({ make, models }) => (
                                <div key={make} className="mb-4 last:mb-0">
                                    <div className="sticky top-0 z-10 flex items-center gap-2 bg-white/95 px-2 pb-2 pt-1 backdrop-blur dark:bg-[#1b1b20]/95">
                                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#2E2E2E] text-[11px] font-black text-white">
                                            {make.charAt(0).toUpperCase()}
                                        </span>
                                        <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#3A3A3A]/55 dark:text-white/50">{make}</p>
                                        <span className="ms-auto font-mono text-[10px] font-bold text-[#3A3A3A]/40 dark:text-white/35">
                                            {models.reduce((sum, model) => sum + model.variants.length, 0)}
                                        </span>
                                    </div>

                                    {models.map((model) =>
                                        model.variants.map((variant) => (
                                            <div
                                                key={variant.id}
                                                className="group mb-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-transparent bg-[#FDF9F6] px-4 py-3 transition hover:border-[#F47822]/25 hover:shadow-[0_6px_16px_rgba(244,120,34,.08)] dark:bg-white/[.04] dark:hover:border-[#F47822]/30"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-black text-[#2E2E2E] dark:text-[#ececef]">
                                                        {make} {model.name} · {variant.name}
                                                    </p>
                                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                        {variant.engine_code && (
                                                            <span className="rounded-md bg-[#2E2E2E]/6 px-2 py-0.5 font-mono text-[10px] font-bold text-[#3A3A3A]/70 dark:bg-white/10 dark:text-white/65">
                                                                {variant.engine_code}
                                                            </span>
                                                        )}
                                                        {variant.fuel_type && (
                                                            <span className="rounded-md bg-[#F47822]/10 px-2 py-0.5 text-[10px] font-bold text-[#F47822]">
                                                                {variant.fuel_type}
                                                            </span>
                                                        )}
                                                        {variant.transmission && (
                                                            <span className="rounded-md bg-[#8B5CF6]/10 px-2 py-0.5 text-[10px] font-bold text-[#8B5CF6]">
                                                                {variant.transmission}
                                                            </span>
                                                        )}
                                                        {(variant.year_from || variant.year_to) && (
                                                            <span className="rounded-md bg-[#3A3A3A]/6 px-2 py-0.5 font-mono text-[10px] font-bold text-[#3A3A3A]/60 dark:bg-white/10 dark:text-white/55">
                                                                {variant.year_from && variant.year_to
                                                                    ? `${variant.year_from}–${variant.year_to}`
                                                                    : variant.year_from
                                                                      ? `${variant.year_from}+`
                                                                      : `≤${variant.year_to}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        data-testid={`use-vehicle-${variant.id}`}
                                                        onClick={() => openInSimulator(variant.id)}
                                                        className="rounded-xl bg-[#F47822]/12 px-3.5 py-2 text-[11px] font-black text-[#F47822] transition hover:bg-[#F47822]/20"
                                                    >
                                                        {t("instructor.simulator.scannerLab.diagnostics.useVehicle")}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        data-testid={`system-selection-${variant.id}`}
                                                        onClick={() => navigate(`/instructor/simulator/scanner/diagnostics/${variant.id}/systems`)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#3A3A3A]/12 px-3.5 py-2 text-[11px] font-black text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/12 dark:text-white/60"
                                                    >
                                                        <Network className="h-3.5 w-3.5" aria-hidden />
                                                        {t("instructor.simulator.scannerLab.systems.open")}
                                                    </button>
                                                </div>
                                            </div>
                                        )),
                                    )}
                                </div>
                            ))}

                            {!vehicles.isPending && !vehicles.isError && totalVehicles === 0 && (
                                <p className="rounded-2xl border border-dashed border-[#3A3A3A]/15 px-4 py-10 text-center text-sm text-[#3A3A3A]/50 dark:border-white/15 dark:text-white/50">
                                    {t("instructor.simulator.scannerLab.diagnostics.empty")}
                                </p>
                            )}
                            {!vehicles.isPending && !vehicles.isError && totalVehicles > 0 && filteredCount === 0 && (
                                <p className="rounded-2xl border border-dashed border-[#3A3A3A]/15 px-4 py-10 text-center text-sm text-[#3A3A3A]/50 dark:border-white/15 dark:text-white/50">
                                    {t("instructor.simulator.scannerLab.diagnostics.empty")}
                                </p>
                            )}
                        </div>
                    </section>

                    <section
                        aria-label={t("instructor.simulator.scannerLab.diagnostics.createTitle")}
                        className="rounded-[28px] border border-[#F47822]/25 bg-[#FFF8F4] p-5 shadow-[0_10px_28px_rgba(244,120,34,.08)] dark:bg-[#F47822]/10"
                    >
                        <p className="text-sm font-black text-[#2E2E2E] dark:text-[#ececef]">
                            {t("instructor.simulator.scannerLab.diagnostics.createTitle")}
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {FORM_FIELDS.map((key) => (
                                <label
                                    key={key}
                                    className={`block text-xs font-bold text-[#3A3A3A] dark:text-[#ececef] ${
                                        key === "name" || key === "engine_code" ? "sm:col-span-2" : ""
                                    }`}
                                >
                                    {t(`instructor.simulator.vehicleForm.${LABEL_KEYS[key]}`)}
                                    <input
                                        value={form[key]}
                                        onChange={(e) => set(key, e.target.value)}
                                        className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 bg-white dark:bg-[#1b1b20] px-3 text-sm font-normal text-[#3A3A3A] shadow-sm transition focus:border-[#F47822]/40 focus:outline-none focus:ring-2 focus:ring-[#F47822]/20"
                                    />
                                </label>
                            ))}
                        </div>
                        {create.isError && (
                            <p role="alert" className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-300">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {t("instructor.simulator.vehicleForm.saveError")}
                            </p>
                        )}
                        {savedId && (
                            <p role="status" className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {t("instructor.simulator.scannerLab.diagnostics.created")}
                            </p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={submit}
                                disabled={!canSubmit || create.isPending}
                                data-testid="diagnostics-create-submit"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-5 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(244,120,34,.25)] transition hover:brightness-[1.06] disabled:opacity-50"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {create.isPending
                                    ? t("instructor.simulator.scannerLab.diagnostics.creating")
                                    : t("instructor.simulator.scannerLab.diagnostics.submit")}
                            </button>
                            {savedId && (
                                <button
                                    type="button"
                                    onClick={() => openInSimulator(savedId)}
                                    data-testid="diagnostics-open-builder"
                                    className="rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 px-5 py-2.5 text-xs font-black text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:text-white/60"
                                >
                                    {t("instructor.simulator.scannerLab.diagnostics.openBuilder")}
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
