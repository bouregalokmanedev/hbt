import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Activity, Car, CheckCircle2, ChevronDown, ChevronLeft, FlaskConical, Gauge, Pencil, Plus, Search, ShieldCheck, Trash2, X, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    simulatorBuilderApi,
    type SimCatalogVariant,
    type SimFaultPack,
} from "../api/simulatorBuilder.api";
import { getInstructorSimulatorAnalytics } from "../api/instructorApi";
import { SimulatorActivityTab } from "../components/SimulatorActivityTab";
import {
    FAULT_LIBRARY,
    libraryEntryById,
    type FaultLibraryEntry,
} from "../data/faultLibrary";
import { NODES, PARAMS, type TreeStep } from "@/features/simulator/scanner/data/scanner.data";
import { MM_PROCEDURES } from "@/features/simulator/multimeter/data/multimeter.data";
import { SCOPE_EXERCISES } from "@/features/simulator/oscilloscope/data/oscilloscope.data";
import { LOC_COMPONENTS } from "@/features/simulator/location/data/location.data";
import { SCH_COMPONENTS, SCH_WIRES, SCH_TRACES } from "@/features/simulator/schematic/data/schematic.data";

type Tab = "vehicles" | "variants" | "review" | "activity";

const STATUS_STYLES: Record<string, string> = {
    draft: "border-[#3A3A3A]/15 bg-[#3A3A3A]/[.07] text-[#3A3A3A]/65",
    submitted: "border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-300",
    published: "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    rejected: "border-red-500/25 bg-red-500/12 text-red-700 dark:text-red-300",
    archived: "border-[#3A3A3A]/12 bg-[#3A3A3A]/[.08] text-[#3A3A3A]/45",
};

export interface TrainingStepDraft {
    id: string;
    screen: string;
    label: string;
    /** Per-step question — every step can ask something different. */
    question: string;
    /** Per-step answers; empty strings inherit the session-level fallback. */
    options: [string, string, string, string];
    correctIndex: number;
}

export interface TrainingSessionDraft {
    id: string;
    title: string;
    description: string;
    steps: TrainingStepDraft[];
    /** Fallback diagnosis options when a step carries none. */
    options: [string, string, string, string];
    correctIndex: number;
    hintBudget: string;
    passScore: string;
    accuracy: string;
    process: string;
    time: string;
}

const TRAINING_SCREENS = ["network", "systems", "dtc", "live", "graph", "tree", "training", "adas"];

const EMPTY_STEP: TrainingStepDraft = {
    id: "",
    screen: "training",
    label: "",
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
};

const EMPTY_SESSION: TrainingSessionDraft = {
    id: "",
    title: "",
    description: "",
    steps: [],
    options: ["", "", "", ""],
    correctIndex: 0,
    hintBudget: "",
    passScore: "",
    accuracy: "",
    process: "",
    time: "",
};

function blankSession(): TrainingSessionDraft {
    return { ...EMPTY_SESSION, steps: [{ ...EMPTY_STEP, options: ["", "", "", ""] }], options: ["", "", "", ""] };
}

function stepOptionsFrom(raw: unknown): [string, string, string, string] {
    const arr = Array.isArray(raw) ? raw : [];
    return [0, 1, 2, 3].map((i) => String(arr[i] ?? "")) as [string, string, string, string];
}

function sessionsFromManifest(manifest: unknown): TrainingSessionDraft[] {
    const entry = Array.isArray(manifest) ? manifest[0] : null;
    const list = entry && typeof entry === "object" && Array.isArray((entry as { trainingSessions?: unknown }).trainingSessions)
        ? ((entry as { trainingSessions: unknown[] }).trainingSessions ?? [])
        : [];
    return list
        .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
        .map((s) => ({
            id: String(s.id ?? ""),
            title: String(s.title ?? ""),
            description: String(s.description ?? ""),
            steps: Array.isArray(s.steps)
                ? (s.steps as unknown[]).filter((st): st is Record<string, unknown> => typeof st === "object" && st !== null).map((st) => ({
                    id: String(st.id ?? ""),
                    screen: TRAINING_SCREENS.includes(String(st.screen ?? "")) ? String(st.screen) : "training",
                    label: String(st.label ?? ""),
                    question: String(st.question ?? ""),
                    options: stepOptionsFrom(st.options),
                    correctIndex: typeof st.correctIndex === "number" && st.correctIndex >= 0 && st.correctIndex <= 3 ? st.correctIndex : 0,
                }))
                : [],
            options: stepOptionsFrom(s.options),
            correctIndex: typeof s.correctIndex === "number" && s.correctIndex >= 0 && s.correctIndex <= 3 ? s.correctIndex : 0,
            hintBudget: s.hintBudget !== undefined && s.hintBudget !== null ? String(s.hintBudget) : "",
            passScore: s.passScore !== undefined && s.passScore !== null ? String(s.passScore) : "",
            accuracy: (s.weights as Record<string, unknown> | undefined)?.accuracy !== undefined ? String((s.weights as Record<string, unknown>).accuracy) : "",
            process: (s.weights as Record<string, unknown> | undefined)?.process !== undefined ? String((s.weights as Record<string, unknown>).process) : "",
            time: (s.weights as Record<string, unknown> | undefined)?.time !== undefined ? String((s.weights as Record<string, unknown>).time) : "",
        }));
}

function sessionsToManifest(sessions: TrainingSessionDraft[]): Record<string, unknown>[] {
    return sessions.map((s) => {
        const num = (v: string): number | undefined => (v.trim() === "" ? undefined : Number(v));
        const weights: Record<string, number> = {};
        const a = num(s.accuracy);
        const p = num(s.process);
        const t = num(s.time);
        if (a !== undefined) weights.accuracy = a;
        if (p !== undefined) weights.process = p;
        if (t !== undefined) weights.time = t;
        const stepHasOptions = (st: TrainingStepDraft) => st.options.every((o) => o.trim() !== "");
        const sessionHasOptions = s.options.every((o) => o.trim() !== "");
        return {
            id: s.id.trim(),
            title: s.title.trim(),
            ...(s.description.trim() ? { description: s.description.trim() } : {}),
            steps: s.steps
                .filter((st) => st.id.trim() !== "")
                .map((st) => ({
                    id: st.id.trim(),
                    screen: st.screen,
                    ...(st.label.trim() ? { label: st.label.trim() } : {}),
                    ...(st.question.trim() ? { question: st.question.trim() } : {}),
                    ...(stepHasOptions(st) ? { options: [...st.options], correctIndex: st.correctIndex } : {}),
                })),
            // Session-level fallback Q&A only when steps don't all carry their own.
            ...(sessionHasOptions ? { options: [...s.options], correctIndex: s.correctIndex } : {}),
            ...(num(s.hintBudget) !== undefined ? { hintBudget: num(s.hintBudget) } : {}),
            ...(num(s.passScore) !== undefined ? { passScore: num(s.passScore) } : {}),
            ...(Object.keys(weights).length > 0 ? { weights } : {}),
        };
    });
}

export function InstructorSimulatorPage() {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<Tab>("vehicles");
    const [variantId, setVariantId] = useState<string | null>(null);
    const [showVehicleForm, setShowVehicleForm] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<{ variant: SimCatalogVariant; makeName: string; modelName: string } | null>(null);
    const [detailsId, setDetailsId] = useState<string | null>(null);
    const [showPackForm, setShowPackForm] = useState(false);
    const [editingPack, setEditingPack] = useState<SimFaultPack | null>(null);
    const [viewingPack, setViewingPack] = useState<SimFaultPack | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [vehicleQuery, setVehicleQuery] = useState("");

    const vehicles = useQuery({
        queryKey: ["instructor", "simulator", "vehicles"],
        queryFn: () => simulatorBuilderApi.vehicles(),
    });
    const packs = useQuery({
        queryKey: ["instructor", "simulator", "packs", variantId],
        queryFn: () => simulatorBuilderApi.packs(variantId!),
        enabled: Boolean(variantId),
    });
    const review = useQuery({
        queryKey: ["instructor", "simulator", "review"],
        queryFn: () => simulatorBuilderApi.reviewQueue(),
        enabled: tab === "review",
    });
    const activity = useQuery({
        queryKey: ["instructor", "simulator", "activity", "summary"],
        queryFn: getInstructorSimulatorAnalytics,
        enabled: tab === "activity",
        select: (data) => data.totals,
    });

    const refresh = () => {
        void queryClient.invalidateQueries({ queryKey: ["instructor", "simulator"] });
    };

    const mutate = async (fn: () => Promise<unknown>, ok?: () => void) => {
        setError(null);
        try {
            await fn();
            refresh();
            ok?.();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("instructor.simulator.requestFailed"));
        }
    };

    const statusLabel = (status: string): string => {
        switch (status) {
            case "draft":
                return t("instructor.simulator.status.draft");
            case "submitted":
                return t("instructor.simulator.status.submitted");
            case "published":
                return t("instructor.simulator.status.published");
            case "rejected":
                return t("instructor.simulator.status.rejected");
            case "archived":
                return t("instructor.simulator.status.archived");
            default:
                return status.replace("_", " ");
        }
    };

    const vehicleCount = (vehicles.data ?? []).reduce(
        (sum, make) => sum + make.models.reduce((m, model) => m + model.variants.length, 0),
        0,
    );
    const packCount = (vehicles.data ?? []).reduce(
        (sum, make) => sum + make.models.reduce((m, model) => m + model.variants.reduce((v, variant) => v + variant.packs_count, 0), 0),
        0,
    );
    const reviewCount = review.data?.length ?? 0;
    const activityCount = activity.data?.sessions ?? 0;
    const query = vehicleQuery.trim().toLowerCase();
    const filteredMakes = (vehicles.data ?? [])
        .map((make) => ({
            ...make,
            models: make.models
                .map((model) => ({
                    ...model,
                    variants: model.variants.filter((variant) => {
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
        .filter((make) => make.models.length > 0);
    const hasQuery = query.length > 0;
    const visibleVariantCount = filteredMakes.reduce(
        (sum, make) => sum + make.models.reduce((n, model) => n + model.variants.length, 0),
        0,
    );

    return (
        <main className="min-h-full bg-[#F8F7F6] p-4 sm:p-6" data-testid="instructor-simulator-page">
            <div className="mx-auto max-w-[1200px] space-y-5">
                <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2E2E2E] via-[#3A3A3A] to-[#2A2A2A] px-5 py-7 text-white shadow-[0_20px_50px_rgba(58,58,58,.18)] sm:px-8 sm:py-8">
                    <div aria-hidden className="pointer-events-none absolute inset-0">
                        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#F47822]/25 blur-3xl rtl:-left-20 rtl:right-auto" />
                        <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-[#8B5CF6]/12 blur-3xl" />
                        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:48px_48px]" />
                    </div>
                    <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-start">
                        <div className="max-w-2xl">
                            <p className="inline-flex items-center gap-2 rounded-full border border-[#F47822]/30 bg-[#F47822]/12 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-[#F9A16C]">
                                <FlaskConical className="h-3.5 w-3.5" />
                                {t("instructor.simulator.eyebrow")}
                            </p>
                            <h1 className="mt-4 text-[1.7rem] font-black leading-[1.15] tracking-tight sm:text-3xl lg:text-[2.35rem]">
                                {t("instructor.simulator.title")}
                            </h1>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
                                {t("instructor.simulator.description")}
                            </p>
                        </div>
                        <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:w-auto">
                            {[
                                { label: t("instructor.simulator.tabs.vehicles"), value: vehicles.isPending ? "…" : vehicleCount },
                                { label: t("instructor.simulator.tabs.variants"), value: vehicles.isPending ? "…" : packCount },
                                { label: t("instructor.simulator.tabs.review"), value: review.isFetching && tab === "review" ? "…" : reviewCount },
                                { label: t("instructor.simulator.tabs.activity"), value: tab === "activity" && activity.isFetching ? "…" : activityCount || (tab === "activity" ? 0 : "…") },
                            ].map((metric) => (
                                <div key={metric.label} className="min-w-[7.5rem] rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
                                    <p className="text-[10px] font-black uppercase tracking-[.14em] text-white/40">{metric.label}</p>
                                    <p className="mt-1.5 text-2xl font-black tracking-tight text-white">{metric.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <nav
                    aria-label={t("instructor.simulator.title")}
                    className="inline-flex w-full flex-wrap gap-1 rounded-2xl border border-[#3A3A3A]/10 bg-white p-1.5 shadow-[0_10px_30px_rgba(58,58,58,.06)]"
                    data-testid="simulator-tabs"
                >
                    {(["vehicles", "variants", "review", "activity"] as const).map((id) => {
                        const active = tab === id;
                        const badge =
                            id === "review"
                                ? reviewCount
                                : id === "vehicles"
                                  ? vehicleCount
                                  : id === "activity"
                                    ? activityCount
                                    : packs.data?.length ?? 0;
                        return (
                            <button
                                key={id}
                                type="button"
                                data-testid={`simulator-tab-${id}`}
                                aria-pressed={active}
                                onClick={() => setTab(id)}
                                className={`group inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black transition ${
                                    active
                                        ? "bg-gradient-to-r from-[#F47822] to-[#ff8f45] text-white shadow-[0_8px_18px_rgba(244,120,34,.28)]"
                                        : "text-[#3A3A3A]/55 hover:bg-[#3A3A3A]/[.06] hover:text-[#3A3A3A]"
                                }`}
                            >
                                {id === "vehicles" && <Car className="h-3.5 w-3.5" />}
                                {id === "variants" && <FlaskConical className="h-3.5 w-3.5" />}
                                {id === "review" && <ShieldCheck className="h-3.5 w-3.5" />}
                                {id === "activity" && <Activity className="h-3.5 w-3.5" />}
                                {t(`instructor.simulator.tabs.${id}`)}
                                {badge > 0 && (
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] leading-none ${
                                            active ? "bg-white/25 text-white" : "bg-[#F47822]/12 text-[#F47822]"
                                        }`}
                                    >
                                        {badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {error && (
                    <p role="alert" data-testid="simulator-error" className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error}
                    </p>
                )}

                {tab === "vehicles" && (
                    <section className="space-y-4" data-testid="simulator-vehicles">
                        <div className="rounded-[28px] border border-[#3A3A3A]/8 bg-white p-4 shadow-[0_10px_30px_rgba(58,58,58,.045)] sm:p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                                        <Car className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[.14em] text-[#3A3A3A]/40">
                                            {t("instructor.simulator.tabs.vehicles")}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-[#3A3A3A]/45">
                                            {vehicles.isPending
                                                ? "…"
                                                : t("instructor.simulator.vehicles.variantsCount", { count: vehicleCount })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center lg:justify-end lg:flex-none">
                                    <label className="relative block w-full sm:max-w-xs">
                                        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/35" />
                                        <input
                                            type="search"
                                            value={vehicleQuery}
                                            onChange={(e) => setVehicleQuery(e.target.value)}
                                            placeholder={t("instructor.simulator.vehicles.search")}
                                            data-testid="simulator-vehicle-search"
                                            className="h-11 w-full rounded-xl border border-[#3A3A3A]/12 bg-[#FCFCFC] ps-10 pe-9 text-sm text-[#3A3A3A] outline-none transition placeholder:text-[#3A3A3A]/35 focus:border-[#F47822]/40 focus:bg-white focus:ring-2 focus:ring-[#F47822]/15"
                                        />
                                        {vehicleQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setVehicleQuery("")}
                                                aria-label={t("instructor.simulator.vehicles.clearSearch")}
                                                className="absolute end-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-[#3A3A3A]/40 transition hover:bg-[#3A3A3A]/8 hover:text-[#3A3A3A]"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </label>
                                    <button
                                        type="button"
                                        data-testid="simulator-new-vehicle"
                                        onClick={() => setShowVehicleForm((v) => !v)}
                                        className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-4 text-xs font-black text-white shadow-[0_8px_18px_rgba(244,120,34,.25)] transition hover:brightness-[1.06] active:scale-[0.98]"
                                    >
                                        <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/20 transition group-hover:bg-white/30">
                                            <Plus className="h-3.5 w-3.5" />
                                        </span>
                                        {t("instructor.simulator.vehicles.newVehicle")}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {showVehicleForm && (
                            <VehicleForm
                                initial={null}
                                onClose={() => setShowVehicleForm(false)}
                                onSaved={() => {
                                    setShowVehicleForm(false);
                                    refresh();
                                }}
                                onError={setError}
                            />
                        )}
                        {editingVehicle && (
                            <VehicleForm
                                initial={editingVehicle}
                                onClose={() => setEditingVehicle(null)}
                                onSaved={() => {
                                    setEditingVehicle(null);
                                    refresh();
                                }}
                                onError={setError}
                            />
                        )}

                        {vehicles.isPending && (
                            <div className="space-y-3">
                                {[0, 1].map((row) => (
                                    <div key={row} className="h-36 animate-pulse rounded-[28px] border border-[#3A3A3A]/8 bg-white" />
                                ))}
                            </div>
                        )}

                        {!vehicles.isPending && (vehicles.data?.length ?? 0) === 0 && (
                            <div className="rounded-[28px] border border-dashed border-[#3A3A3A]/15 bg-white p-10 text-center">
                                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
                                    <Car className="h-7 w-7" />
                                </span>
                                <p className="mt-4 text-sm font-bold text-[#3A3A3A]">
                                    {t("instructor.simulator.vehicles.noVehicles")}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowVehicleForm(true)}
                                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-4 text-xs font-black text-white shadow-[0_8px_18px_rgba(244,120,34,.25)]"
                                >
                                    <Plus className="h-4 w-4" />
                                    {t("instructor.simulator.vehicles.newVehicle")}
                                </button>
                            </div>
                        )}

                        {!vehicles.isPending && hasQuery && visibleVariantCount === 0 && (
                            <div className="rounded-[28px] border border-dashed border-[#3A3A3A]/15 bg-white p-8 text-center">
                                <Search className="mx-auto h-7 w-7 text-[#3A3A3A]/25" />
                                <p className="mt-3 text-sm font-bold text-[#3A3A3A]">
                                    {t("instructor.simulator.vehicles.noMatch")}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setVehicleQuery("")}
                                    className="mt-3 rounded-xl border border-[#3A3A3A]/12 px-4 py-2 text-xs font-black text-[#3A3A3A]/65 transition hover:border-[#F47822]/35 hover:text-[#F47822]"
                                >
                                    {t("instructor.simulator.vehicles.clearSearch")}
                                </button>
                            </div>
                        )}

                        {filteredMakes.map((make) => {
                            const makeVariantCount = make.models.reduce((n, m) => n + m.variants.length, 0);
                            return (
                                <article
                                    key={make.id}
                                    className="overflow-hidden rounded-[28px] border border-[#3A3A3A]/8 bg-white shadow-[0_10px_30px_rgba(58,58,58,.045)]"
                                >
                                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3A3A3A]/8 bg-gradient-to-r from-[#FFF8F4] to-white px-5 py-4 sm:px-6">
                                        <div className="flex items-center gap-3">
                                            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F47822] text-white shadow-[0_6px_16px_rgba(244,120,34,.25)]">
                                                <Car className="h-5 w-5" />
                                            </span>
                                            <div>
                                                <h2 className="text-base font-black tracking-tight text-[#3A3A3A]">
                                                    {make.name}
                                                </h2>
                                                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[.1em] text-[#3A3A3A]/40">
                                                    {t("instructor.simulator.vehicles.modelsCount", { count: make.models.length })}
                                                    {" · "}
                                                    {t("instructor.simulator.vehicles.variantsCount", { count: makeVariantCount })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="rounded-full border border-[#F47822]/25 bg-[#F47822]/10 px-3 py-1 font-mono text-[11px] font-bold text-[#F47822]">
                                            {t("instructor.simulator.vehicles.packsCount", {
                                                count: make.models.reduce(
                                                    (n, m) => n + m.variants.reduce((v, variant) => v + variant.packs_count, 0),
                                                    0,
                                                ),
                                            })}
                                        </span>
                                    </header>

                                    <div className="divide-y divide-[#3A3A3A]/[.07]">
                                        {make.models.map((model) => (
                                            <div key={model.id} className="px-5 py-4 sm:px-6">
                                                <div className="mb-3 flex items-center gap-2">
                                                    <span className="rounded-md bg-[#3A3A3A]/[.07] px-2 py-1 text-[10px] font-black uppercase tracking-[.14em] text-[#3A3A3A]/50">
                                                        {model.name}
                                                    </span>
                                                    <span className="h-px flex-1 bg-[#3A3A3A]/[.08]" />
                                                    <span className="text-[10px] font-bold text-[#3A3A3A]/35">
                                                        {model.variants.length}
                                                    </span>
                                                </div>
                                                <ul className="grid gap-2.5">
                                                    {model.variants.map((variant) => {
                                                        const meta = (variant.metadata ?? {}) as Record<string, unknown>;
                                                        const custom = meta.custom === true;
                                                        const expanded = detailsId === variant.id;
                                                        const coverage = (meta.coverage ?? {}) as Record<string, string>;
                                                        const years =
                                                            [variant.year_from, variant.year_to].filter(Boolean).join("–") || null;
                                                        return (
                                                            <li
                                                                key={variant.id}
                                                                data-testid={`vehicle-variant-${variant.id}`}
                                                                className={`group overflow-hidden rounded-2xl border transition ${
                                                                    expanded
                                                                        ? "border-[#F47822]/45 bg-[#FFFBF8] shadow-[0_8px_22px_rgba(244,120,34,.1)]"
                                                                        : "border-[#3A3A3A]/10 bg-[#FCFCFC] hover:border-[#F47822]/35 hover:bg-white hover:shadow-[0_8px_20px_rgba(58,58,58,.06)]"
                                                                }`}
                                                            >
                                                                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setVariantId(variant.id);
                                                                            setTab("variants");
                                                                        }}
                                                                        className="min-w-0 flex-1 text-start"
                                                                        data-testid={`vehicle-open-${variant.id}`}
                                                                    >
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <span className="text-sm font-black text-[#3A3A3A] group-hover:text-[#F47822]">
                                                                                {variant.name}
                                                                            </span>
                                                                            <span className="rounded-full bg-[#F47822]/12 px-2 py-0.5 font-mono text-[10px] font-bold text-[#F47822]">
                                                                                {t("instructor.simulator.vehicles.packsCount", {
                                                                                    count: variant.packs_count,
                                                                                })}
                                                                            </span>
                                                                            <span
                                                                                className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                                                                                    custom
                                                                                        ? "bg-[#8B5CF6]/12 text-[#7C3AED]"
                                                                                        : "bg-[#3A3A3A]/[.07] text-[#3A3A3A]/50"
                                                                                }`}
                                                                            >
                                                                                {custom
                                                                                    ? t("instructor.simulator.vehicles.custom")
                                                                                    : t("instructor.simulator.vehicles.stock")}
                                                                            </span>
                                                                        </div>
                                                                        <p
                                                                            dir="ltr"
                                                                            className="mt-1 truncate font-mono text-[11px] text-[#3A3A3A]/50"
                                                                        >
                                                                            {[make.name, model.name]
                                                                                .join(" · ")}
                                                                            {" · "}
                                                                            {[variant.engine_code, variant.transmission, years]
                                                                                .filter(Boolean)
                                                                                .join(" · ") || "—"}
                                                                        </p>
                                                                    </button>

                                                                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setDetailsId(expanded ? null : variant.id)
                                                                            }
                                                                            aria-expanded={expanded}
                                                                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#3A3A3A]/12 bg-white px-3 text-[11px] font-black text-[#3A3A3A]/65 transition hover:border-[#3A3A3A]/25 hover:text-[#3A3A3A]"
                                                                        >
                                                                            <Gauge className="h-3.5 w-3.5" />
                                                                            {expanded
                                                                                ? t("instructor.simulator.vehicles.hide")
                                                                                : t("instructor.simulator.vehicles.details")}
                                                                            <ChevronDown
                                                                                className={`h-3.5 w-3.5 transition-transform ${
                                                                                    expanded ? "rotate-180" : ""
                                                                                }`}
                                                                            />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            aria-label={t("instructor.simulator.vehicles.edit")}
                                                                            onClick={() =>
                                                                                setEditingVehicle({
                                                                                    variant,
                                                                                    makeName: make.name,
                                                                                    modelName: model.name,
                                                                                })
                                                                            }
                                                                            className="grid h-9 w-9 place-items-center rounded-lg border border-[#3A3A3A]/12 bg-white text-[#3A3A3A]/65 transition hover:border-[#F47822]/35 hover:text-[#F47822]"
                                                                        >
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </button>
                                                                        {custom && (
                                                                            <button
                                                                                type="button"
                                                                                aria-label={t("instructor.simulator.vehicles.delete")}
                                                                                onClick={() => {
                                                                                    if (
                                                                                        window.confirm(
                                                                                            t(
                                                                                                "instructor.simulator.vehicles.deleteConfirm",
                                                                                                { name: variant.name },
                                                                                            ),
                                                                                        )
                                                                                    ) {
                                                                                        void mutate(() =>
                                                                                            simulatorBuilderApi.destroyVariant(
                                                                                                variant.id,
                                                                                            ),
                                                                                        );
                                                                                    }
                                                                                }}
                                                                                className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setVariantId(variant.id);
                                                                                setTab("variants");
                                                                            }}
                                                                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-3.5 text-[11px] font-black text-white shadow-[0_6px_14px_rgba(244,120,34,.22)] transition hover:brightness-[1.06]"
                                                                        >
                                                                            {t("instructor.simulator.vehicles.openPacks")}
                                                                            <ChevronLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {expanded && (
                                                                    <div className="border-t border-[#F47822]/15 bg-white px-4 py-4 sm:px-5">
                                                                        <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                                            {(
                                                                                [
                                                                                    [
                                                                                        t("instructor.simulator.vehicles.make"),
                                                                                        make.name,
                                                                                    ],
                                                                                    [
                                                                                        t("instructor.simulator.vehicles.model"),
                                                                                        model.name,
                                                                                    ],
                                                                                    [
                                                                                        t("instructor.simulator.vehicles.engine"),
                                                                                        variant.engine_code ?? "—",
                                                                                    ],
                                                                                    [
                                                                                        t("instructor.simulator.vehicles.fuel"),
                                                                                        variant.fuel_type ?? "—",
                                                                                    ],
                                                                                    [
                                                                                        t(
                                                                                            "instructor.simulator.vehicles.transmission",
                                                                                        ),
                                                                                        variant.transmission ?? "—",
                                                                                    ],
                                                                                    [
                                                                                        t("instructor.simulator.vehicles.years"),
                                                                                        years ?? "—",
                                                                                    ],
                                                                                    [
                                                                                        t("instructor.simulator.vehicles.vin"),
                                                                                        (meta.vin as string) ?? "—",
                                                                                    ],
                                                                                    [
                                                                                        t("instructor.simulator.vehicles.odometer"),
                                                                                        meta.odometer_km !== undefined
                                                                                            ? `${Number(meta.odometer_km).toLocaleString(i18n.language)} km`
                                                                                            : "—",
                                                                                    ],
                                                                                    [
                                                                                        t("instructor.simulator.vehicles.installed"),
                                                                                        (meta.installed
                                                                                            ? t("instructor.simulator.vehicles.yes")
                                                                                            : t(
                                                                                                  "instructor.simulator.vehicles.no",
                                                                                              )) as string,
                                                                                    ],
                                                                                    [
                                                                                        t("instructor.simulator.vehicles.origin"),
                                                                                        custom
                                                                                            ? t("instructor.simulator.vehicles.custom")
                                                                                            : t("instructor.simulator.vehicles.stock"),
                                                                                    ],
                                                                                ] as [string, string][]
                                                                            ).map(([k, v]) => (
                                                                                <div
                                                                                    key={k}
                                                                                    className="rounded-xl border border-[#3A3A3A]/8 bg-[#FCFCFC] px-3 py-2"
                                                                                >
                                                                                    <dt className="text-[10px] font-bold uppercase tracking-[.08em] text-[#3A3A3A]/40">
                                                                                        {k}
                                                                                    </dt>
                                                                                    <dd
                                                                                        dir="ltr"
                                                                                        className="mt-0.5 font-mono text-xs font-bold text-[#3A3A3A]"
                                                                                    >
                                                                                        {v}
                                                                                    </dd>
                                                                                </div>
                                                                            ))}
                                                                        </dl>
                                                                        <div className="mt-3">
                                                                            <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#3A3A3A]/40">
                                                                                {t("instructor.simulator.vehicles.coverage")}
                                                                            </p>
                                                                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                                                {["scanner", "multimeter", "oscilloscope", "location", "schematic"].map(
                                                                                    (tool) => {
                                                                                        const value = coverage[tool] ?? "—";
                                                                                        const tone =
                                                                                            value === "ok"
                                                                                                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
                                                                                                : value === "avail"
                                                                                                  ? "border-[#F47822]/25 bg-[#F47822]/10 text-[#F47822]"
                                                                                                  : value === "none"
                                                                                                    ? "border-red-500/25 bg-red-500/10 text-red-600"
                                                                                                    : "border-[#3A3A3A]/12 bg-[#3A3A3A]/[.06] text-[#3A3A3A]/50";
                                                                                        return (
                                                                                            <span
                                                                                                key={tool}
                                                                                                className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${tone}`}
                                                                                            >
                                                                                                {tool}:{value}
                                                                                            </span>
                                                                                        );
                                                                                    },
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}

                {tab === "variants" && (
                    <section className="rounded-[28px] border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_10px_30px_rgba(58,58,58,.045)] sm:p-6" data-testid="simulator-variants">
                        <VariantPicker
                            onPick={(id) => setVariantId(id)}
                            activeId={variantId}
                        />
                        {variantId && (
                            <div className="mt-5">
                                <div className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#3A3A3A]/8 bg-white px-4 py-3 shadow-sm">
                                    <p className="text-xs font-bold uppercase tracking-[.14em] text-[#3A3A3A]/40">
                                        {t("instructor.simulator.variants.faultSetup")}
                                    </p>
                                    <button
                                        type="button"
                                        data-testid="simulator-new-pack"
                                        onClick={() => {
                                            setEditingPack(null);
                                            setShowPackForm(true);
                                        }}
                                        className="group inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-4 text-xs font-black text-white shadow-[0_6px_16px_rgba(244,120,34,.22)] transition hover:brightness-[1.06] active:scale-[0.98]"
                                    >
                                        <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/20 transition group-hover:bg-white/30">
                                            <Plus className="h-3.5 w-3.5" />
                                        </span>
                                        {t("instructor.simulator.variants.newFaultVariant")}
                                    </button>
                                </div>
                                {showPackForm && (
                                    <div className="relative z-0 mt-4">
                                        <PackForm
                                            variantId={variantId}
                                            initial={editingPack}
                                            onClose={() => {
                                                setShowPackForm(false);
                                                setEditingPack(null);
                                            }}
                                            onSaved={() => {
                                                setShowPackForm(false);
                                                setEditingPack(null);
                                                refresh();
                                            }}
                                            onError={setError}
                                        />
                                    </div>
                                )}
                                <ul className="mt-4 space-y-2.5">
                                    {packs.isPending && (
                                        <li className="h-24 animate-pulse rounded-2xl border border-[#3A3A3A]/8 bg-[#FCFCFC]" />
                                    )}
                                    {packs.data?.map((pack) => {
                                        const manifestEntry = Array.isArray(pack.manifest) ? (pack.manifest[0] as Record<string, unknown>) : null;
                                        const toolLabel = manifestEntry?.procedures ? "Multimeter" : manifestEntry?.exercises ? "Oscilloscope" : manifestEntry?.components && (manifestEntry.components as unknown[])[0] && "hot" in ((manifestEntry.components as unknown[])[0] as Record<string, unknown>) ? "Location" : manifestEntry?.wires || manifestEntry?.traces ? "Schematic" : manifestEntry?.nodes || manifestEntry?.dtcs ? "Scanner" : "Pack";
                                        const itemCount = manifestEntry?.procedures ? (manifestEntry.procedures as unknown[]).length : manifestEntry?.exercises ? (manifestEntry.exercises as unknown[]).length : manifestEntry?.components ? (manifestEntry.components as unknown[]).length : manifestEntry?.wires ? (manifestEntry.wires as unknown[]).length : Array.isArray(pack.manifest) ? pack.manifest.length : 0;
                                        return (
                                            <li
                                                key={pack.id}
                                                className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-4 py-3.5 transition hover:border-[#F47822]/30 hover:shadow-[0_8px_20px_rgba(58,58,58,.06)]"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-mono text-sm font-black text-[#3A3A3A]" dir="ltr">
                                                        {pack.code} · v{pack.version}{" "}
                                                        <span className="ms-2 rounded-full border border-[#3A3A3A]/10 bg-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#3A3A3A]/60">
                                                            {toolLabel}
                                                        </span>
                                                    </p>
                                                    <p className="mt-0.5 font-mono text-[11px] text-[#3A3A3A]/45" dir="ltr">
                                                        {itemCount}{" "}
                                                        {toolLabel === "Multimeter"
                                                            ? "procedures"
                                                            : toolLabel === "Oscilloscope"
                                                              ? "exercises"
                                                              : toolLabel === "Location"
                                                                ? "components"
                                                                : toolLabel === "Schematic"
                                                                  ? "items"
                                                                  : t("instructor.simulator.variants.faultEntries", { count: Array.isArray(pack.manifest) ? pack.manifest.length : 0 })}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-black uppercase ${STATUS_STYLES[pack.status] ?? ""}`}
                                                >
                                                    {statusLabel(pack.status)}
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingPack(pack)}
                                                        className="rounded-lg border border-[#3A3A3A]/12 bg-white px-3 py-1.5 text-[11px] font-black text-[#3A3A3A]/70 transition hover:border-[#3A3A3A]/25 hover:text-[#3A3A3A]"
                                                    >
                                                        View
                                                    </button>
                                                    {(pack.status === "draft" || pack.status === "rejected" || pack.status === "published") && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingPack(pack);
                                                                setShowPackForm(true);
                                                            }}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-[#3A3A3A]/12 px-3 py-1.5 text-[11px] font-black text-[#3A3A3A]/70 transition hover:border-[#F47822]/35 hover:text-[#F47822]"
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                            {t("instructor.simulator.variants.edit")}
                                                        </button>
                                                    )}
                                                    {(pack.status === "draft" || pack.status === "rejected") && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => void mutate(() => simulatorBuilderApi.submitPack(pack.id))}
                                                                className="rounded-lg bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-3.5 py-1.5 text-[11px] font-black text-white shadow-[0_6px_14px_rgba(244,120,34,.25)] transition hover:brightness-[1.06]"
                                                            >
                                                                {t("instructor.simulator.variants.submit")}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (window.confirm(t("instructor.simulator.variants.deleteConfirm", { title: `${pack.code} v${pack.version}` }))) {
                                                                        void mutate(() => simulatorBuilderApi.destroyPack(pack.id));
                                                                    }
                                                                }}
                                                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-black text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                                {t("instructor.simulator.variants.delete")}
                                                            </button>
                                                        </>
                                                    )}
                                                    {pack.status === "published" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (window.confirm(t("instructor.simulator.variants.archiveConfirm", { title: `${pack.code} v${pack.version}` }))) {
                                                                    void mutate(() => simulatorBuilderApi.archivePack(pack.id));
                                                                }
                                                            }}
                                                            className="rounded-lg border border-[#3A3A3A]/12 px-3 py-1.5 text-[11px] font-black text-[#3A3A3A]/70 transition hover:border-[#3A3A3A]/25 hover:text-[#3A3A3A]"
                                                        >
                                                            {t("instructor.simulator.variants.archive")}
                                                        </button>
                                                    )}
                                                    {pack.status === "archived" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => void mutate(() => simulatorBuilderApi.restorePack(pack.id))}
                                                            className="rounded-lg border border-[#F47822]/30 bg-[#F47822]/[.06] px-3 py-1.5 text-[11px] font-black text-[#F47822] transition hover:bg-[#F47822]/[.12]"
                                                        >
                                                            {t("instructor.simulator.variants.restore")}
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                    {packs.data?.length === 0 && (
                                        <li className="rounded-2xl border border-dashed border-[#3A3A3A]/15 p-8 text-center">
                                            <FlaskConical className="mx-auto h-7 w-7 text-[#3A3A3A]/25" />
                                            <p className="mt-3 text-sm font-bold text-[#3A3A3A]">{t("instructor.simulator.variants.noVariants")}</p>
                                        </li>
                                    )}
                                </ul>
                                {viewingPack && (
                                    <div
                                        role="dialog"
                                        aria-modal="true"
                                        onClick={() => setViewingPack(null)}
                                        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1115]/60 p-4 backdrop-blur-sm"
                                    >
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-[#3A3A3A]/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1b1b20]"
                                        >
                                            <div className="flex items-center justify-between gap-3 border-b border-[#3A3A3A]/10 bg-[#F8F7F6] px-5 py-4 dark:border-white/10 dark:bg-white/[0.04]">
                                                <div>
                                                    <p className="font-mono text-sm font-black text-[#3A3A3A] dark:text-[#F7F7F7]" dir="ltr">
                                                        {viewingPack.code} · v{viewingPack.version}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-[#3A3A3A]/50">
                                                        {statusLabel(viewingPack.status)} · {Array.isArray(viewingPack.manifest) ? viewingPack.manifest.length : 0} entries
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {(viewingPack.status === "draft" || viewingPack.status === "rejected" || viewingPack.status === "published") && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingPack(viewingPack);
                                                                setViewingPack(null);
                                                                setShowPackForm(true);
                                                            }}
                                                            className="rounded-xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-4 py-2 text-xs font-black text-white"
                                                        >
                                                            {t("instructor.simulator.variants.edit")}
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingPack(null)}
                                                        className="rounded-xl border border-[#3A3A3A]/12 px-4 py-2 text-xs font-black text-[#3A3A3A]/70"
                                                    >
                                                        {t("instructor.simulator.variants.cancel")}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="max-h-[60vh] overflow-auto p-5">
                                                <pre
                                                    dir="ltr"
                                                    className="overflow-auto rounded-2xl bg-[#0f1115] p-4 font-mono text-xs leading-5 text-emerald-300"
                                                >
                                                    {JSON.stringify(viewingPack.manifest, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {tab === "review" && (
                    <section className="space-y-3" data-testid="simulator-review">
                        {review.isPending && (
                            <div className="space-y-3">
                                {[0, 1].map((row) => (
                                    <div key={row} className="h-32 animate-pulse rounded-[28px] border border-[#3A3A3A]/8 bg-white" />
                                ))}
                            </div>
                        )}
                        {review.data?.map((pack) => (
                            <article
                                key={pack.id}
                                className="rounded-[28px] border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_10px_30px_rgba(58,58,58,.045)] sm:p-6"
                            >
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-mono text-sm font-black text-[#3A3A3A]" dir="ltr">
                                            {pack.code} · v{pack.version}
                                        </p>
                                        <p className="mt-0.5 text-xs text-[#3A3A3A]/50">
                                            {pack.variant?.name ?? pack.vehicle_variant_id} · {pack.variant?.engine_code ?? ""}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => void mutate(() => simulatorBuilderApi.approvePack(pack.id))}
                                        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-xs font-black text-white shadow-[0_8px_18px_rgba(16,185,129,.25)] transition hover:brightness-[1.06]"
                                    >
                                        <CheckCircle2 className="h-4 w-4" /> {t("instructor.simulator.review.approve")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void mutate(() => simulatorBuilderApi.rejectPack(pack.id))}
                                        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-red-200 px-4 text-xs font-black text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                                    >
                                        <XCircle className="h-4 w-4" /> {t("instructor.simulator.review.reject")}
                                    </button>
                                </div>
                                <details className="mt-4 rounded-2xl border border-[#3A3A3A]/8 bg-[#FCFCFC] p-3">
                                    <summary className="cursor-pointer font-mono text-[11px] font-bold text-[#3A3A3A]/60">
                                        {t("instructor.simulator.review.manifestJson")}
                                    </summary>
                                    <pre dir="ltr" className="mt-2 max-h-56 overflow-auto rounded-xl bg-[#0f1115] p-3 font-mono text-[11px] leading-5 text-emerald-300">
                                        {JSON.stringify(pack.manifest, null, 2)}
                                    </pre>
                                </details>
                            </article>
                        ))}
                        {review.data?.length === 0 && (
                            <div className="rounded-[28px] border border-dashed border-[#3A3A3A]/15 bg-white p-10 text-center">
                                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
                                    <ShieldCheck className="h-7 w-7" />
                                </span>
                                <p className="mt-4 text-sm font-bold text-[#3A3A3A]">{t("instructor.simulator.review.queueClear")}</p>
                                <p className="mt-1 text-xs text-[#3A3A3A]/50">{t("instructor.simulator.review.queueClearDesc")}</p>
                            </div>
                        )}
                    </section>
                )}

                {tab === "activity" && <SimulatorActivityTab />}
            </div>
        </main>
    );
}

function VariantPicker({ onPick, activeId }: { onPick: (id: string) => void; activeId: string | null }) {
    const { t } = useTranslation();
    const vehicles = useQuery({
        queryKey: ["instructor", "simulator", "vehicles"],
        queryFn: () => simulatorBuilderApi.vehicles(),
    });
    const flat: { id: string; label: string }[] = [];
    for (const make of vehicles.data ?? []) {
        for (const model of make.models) {
            for (const variant of model.variants) {
                flat.push({ id: variant.id, label: `${make.name} ${model.name} ${variant.name}` });
            }
        }
    }
    return (
        <label className="block rounded-2xl border border-[#3A3A3A]/8 bg-[#FCFCFC] p-4 text-xs font-bold text-[#3A3A3A]">
            {t("instructor.simulator.variants.selectVehicle")}
            <select
                value={activeId ?? ""}
                onChange={(e) => onPick(e.target.value)}
                data-testid="simulator-vehicle-picker"
                className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/12 bg-white px-3 text-sm font-normal text-[#3A3A3A] shadow-sm transition focus:border-[#F47822]/40 focus:outline-none focus:ring-2 focus:ring-[#F47822]/20"
            >
                <option value="">{t("instructor.simulator.variants.chooseVehicle")}</option>
                {flat.map((v) => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                ))}
            </select>
        </label>
    );
}

const COVERAGE_TOOLS = ["scanner", "multimeter", "oscilloscope", "location", "schematic"] as const;

function VehicleForm({
    initial,
    onClose,
    onSaved,
    onError,
}: {
    initial: { variant: SimCatalogVariant; makeName: string; modelName: string } | null;
    onClose: () => void;
    onSaved: () => void;
    onError: (msg: string) => void;
}) {
    const { t } = useTranslation();
    const editing = initial !== null;
    const meta = ((initial?.variant.metadata ?? {}) as Record<string, unknown>);
    const metaCoverage = (meta.coverage ?? {}) as Record<string, string>;
    const [form, setForm] = useState({
        make_name: initial?.makeName ?? "",
        model_name: initial?.modelName ?? "",
        name: initial?.variant.name ?? "",
        engine_code: initial?.variant.engine_code ?? "",
        fuel_type: initial?.variant.fuel_type ?? "",
        transmission: initial?.variant.transmission ?? "",
        year_from: initial?.variant.year_from?.toString() ?? "",
        year_to: initial?.variant.year_to?.toString() ?? "",
        vin: (meta.vin as string) ?? "",
        odometer_km: meta.odometer_km !== undefined ? String(meta.odometer_km) : "",
        coverage: Object.fromEntries(COVERAGE_TOOLS.map((tool) => [tool, metaCoverage[tool] ?? "avail"])) as Record<string, string>,
    });
    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
    const setCoverage = (tool: string, v: string) => setForm((f) => ({ ...f, coverage: { ...f.coverage, [tool]: v } }));
    const save = async () => {
        try {
            if (editing && initial) {
                await simulatorBuilderApi.updateVariant(initial.variant.id, {
                    name: form.name.trim(),
                    engine_code: form.engine_code.trim() || undefined,
                    fuel_type: form.fuel_type.trim() || undefined,
                    transmission: form.transmission.trim() || undefined,
                    year_from: form.year_from ? Number(form.year_from) : undefined,
                    year_to: form.year_to ? Number(form.year_to) : undefined,
                    vin: form.vin.trim() || undefined,
                    odometer_km: form.odometer_km ? Number(form.odometer_km) : undefined,
                    coverage: form.coverage,
                });
            } else {
                await simulatorBuilderApi.createVariant({
                    make_name: form.make_name.trim(),
                    model_name: form.model_name.trim(),
                    name: form.name.trim(),
                    engine_code: form.engine_code.trim() || undefined,
                    transmission: form.transmission.trim() || undefined,
                    vin: form.vin.trim() || undefined,
                    odometer_km: form.odometer_km ? Number(form.odometer_km) : undefined,
                    coverage: form.coverage,
                });
            }
            onSaved();
        } catch (cause) {
            onError(cause instanceof Error ? cause.message : t("instructor.simulator.vehicleForm.saveError"));
        }
    };
    return (
        <div className="rounded-[28px] border border-[#F47822]/25 bg-[#FFF8F4] p-5 shadow-[0_10px_28px_rgba(244,120,34,.08)]" data-testid="vehicle-form">
            <p className="text-sm font-black text-[#3A3A3A]">
                {editing
                    ? t("instructor.simulator.vehicleForm.editTitle", {
                          make: initial?.makeName ?? "",
                          model: initial?.modelName ?? "",
                          variant: initial?.variant.name ?? "",
                      })
                    : t("instructor.simulator.vehicleForm.newTitle")}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {(
                    [
                        ["make_name", t("instructor.simulator.vehicleForm.make"), editing],
                        ["model_name", t("instructor.simulator.vehicleForm.model"), editing],
                        ["name", t("instructor.simulator.vehicleForm.variant"), false],
                        ["engine_code", t("instructor.simulator.vehicleForm.engineCode"), false],
                        ["fuel_type", t("instructor.simulator.vehicleForm.fuelType"), false],
                        ["transmission", t("instructor.simulator.vehicleForm.transmission"), false],
                        ["year_from", t("instructor.simulator.vehicleForm.yearFrom"), false],
                        ["year_to", t("instructor.simulator.vehicleForm.yearTo"), false],
                        ["vin", t("instructor.simulator.vehicleForm.vin"), false],
                        ["odometer_km", t("instructor.simulator.vehicleForm.odometerKm"), false],
                    ] as [string, string, boolean][]
                ).map(([key, label, locked]) => (
                    <label key={key} className="block text-xs font-bold text-[#3A3A3A]">
                        {label}
                        <input
                            value={form[key as keyof typeof form] as string}
                            onChange={(e) => set(key, e.target.value)}
                            disabled={locked as boolean}
                            className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 bg-white px-3 text-sm font-normal text-[#3A3A3A] shadow-sm transition focus:border-[#F47822]/40 focus:outline-none focus:ring-2 focus:ring-[#F47822]/20 disabled:opacity-50"
                        />
                    </label>
                ))}
                {COVERAGE_TOOLS.map((tool) => (
                    <label key={tool} className="block text-xs font-bold capitalize text-[#3A3A3A]">
                        {t("instructor.simulator.vehicleForm.coverage.label", { tool: tool.charAt(0).toUpperCase() + tool.slice(1) })}
                        <select
                            value={form.coverage[tool] ?? "avail"}
                            onChange={(e) => setCoverage(tool, e.target.value)}
                            className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 bg-white px-3 text-sm font-normal text-[#3A3A3A] shadow-sm transition focus:border-[#F47822]/40 focus:outline-none focus:ring-2 focus:ring-[#F47822]/20"
                        >
                            <option value="ok">{t("instructor.simulator.vehicleForm.coverage.ok")}</option>
                            <option value="avail">{t("instructor.simulator.vehicleForm.coverage.avail")}</option>
                            <option value="none">{t("instructor.simulator.vehicleForm.coverage.none")}</option>
                        </select>
                    </label>
                ))}
            </div>
            <div className="mt-4 flex gap-2">
                <button
                    type="button"
                    onClick={() => void save()}
                    className="rounded-xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-5 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(244,120,34,.25)] transition hover:brightness-[1.06]"
                >
                    {t("instructor.simulator.vehicleForm.save")}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-[#3A3A3A]/12 px-5 py-2.5 text-xs font-black text-[#3A3A3A]/60 transition hover:border-[#3A3A3A]/25 hover:text-[#3A3A3A]"
                >
                    {t("instructor.simulator.vehicleForm.cancel")}
                </button>
            </div>
        </div>
    );
}

export interface FaultNodeDraft {
    id: string;
    status: "normal" | "fault" | "warn" | "none" | "offline";
    dtc: string;
}

export interface FaultDtcDraft {
    code: string;
    desc: string;
    ecu: string;
    status: "Current" | "Stored" | "Pending" | "Intermittent";
    severity: "high" | "medium" | "low";
    count: string;
}

export interface FaultPidDraft {
    id: string;
    base: string;
    fault: boolean;
}

export interface FaultEntryDraft {
    key: string;
    title: string;
    nodes: FaultNodeDraft[];
    dtcs: FaultDtcDraft[];
    pids: FaultPidDraft[];
    adasDone: boolean[];
    tree: TreeStep[];
}

const NODE_STATUSES = ["normal", "fault", "warn", "none", "offline"] as const;
const DTC_STATUSES = ["Current", "Stored", "Pending", "Intermittent"] as const;
const SEVERITIES = ["high", "medium", "low"] as const;

let faultKeySeq = 0;
function nextFaultKey(): string {
    faultKeySeq += 1;
    return `fault-${Date.now().toString(36)}-${faultKeySeq}`;
}

function blankFaultEntry(): FaultEntryDraft {
    return { key: nextFaultKey(), title: "", nodes: [], dtcs: [], pids: [], adasDone: [false, false, false, false, false, false], tree: [] };
}

function entryFromLibrary(entry: FaultLibraryEntry): FaultEntryDraft {
    return {
        key: nextFaultKey(),
        title: entry.title,
        nodes: entry.nodes.map((n) => ({ id: n.id, status: n.status, dtc: String(n.dtc) })),
        dtcs: entry.dtcs.map((d) => ({ code: d.code, desc: d.desc, ecu: d.ecu, status: d.status, severity: d.severity, count: String(d.count) })),
        pids: entry.pids.map((p) => ({ id: p.id, base: String(p.base), fault: p.fault ?? false })),
        adasDone: [...entry.adasDone],
        tree: [],
    };
}

function faultsFromManifest(manifest: unknown): FaultEntryDraft[] {
    if (!Array.isArray(manifest)) return [];
    return manifest
        .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
        .map((e, i) => {
            const asArr = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object") : []);
            return {
                key: `fault-${i}`,
                title: typeof e.title === "string" && e.title ? e.title : "",
                nodes: asArr(e.nodes).map((n) => ({
                    id: String(n.id ?? "ECM"),
                    status: (NODE_STATUSES as readonly string[]).includes(String(n.status)) ? (n.status as FaultNodeDraft["status"]) : "normal",
                    dtc: String(n.dtc ?? 0),
                })),
                dtcs: asArr(e.dtcs).map((d) => ({
                    code: String(d.code ?? ""),
                    desc: String(d.desc ?? ""),
                    ecu: String(d.ecu ?? "ECM"),
                    status: (DTC_STATUSES as readonly string[]).includes(String(d.status)) ? (d.status as FaultDtcDraft["status"]) : "Stored",
                    severity: (SEVERITIES as readonly string[]).includes(String(d.severity)) ? (d.severity as FaultDtcDraft["severity"]) : "medium",
                    count: String(d.count ?? 1),
                })),
                pids: asArr(e.pids).map((p) => ({
                    id: String(p.id ?? "RPM"),
                    base: String(p.base ?? 0),
                    fault: p.fault === true,
                })),
                adasDone: Array.isArray(e.adasDone) ? [0, 1, 2, 3, 4, 5].map((k) => (e.adasDone as unknown[])[k] === true) : [false, false, false, false, false, false],
                tree: Array.isArray(e.tree)
                    ? (e.tree as Record<string, unknown>[])
                        .filter((s) => s && typeof s === "object" && typeof s.id === "string" && s.id)
                        .map((s) => ({
                            id: String(s.id),
                            label: typeof s.label === "string" ? s.label : String(s.id),
                            measure: typeof s.measure === "string" ? s.measure : "—",
                            expected: typeof s.expected === "string" ? s.expected : "—",
                            ok: s.ok === true,
                            terminal: s.terminal === true ? true : undefined,
                        }))
                    : [],
            };
        });
}

function faultsToManifest(faults: FaultEntryDraft[]): { entries: Record<string, unknown>[]; errorKey: string | null; errorIndex: number } {
    if (faults.length === 0) return { entries: [], errorKey: "instructor.simulator.variants.manifestErrorEmpty", errorIndex: 0 };
    const entries: Record<string, unknown>[] = [];
    for (const [fi, f] of faults.entries()) {
        const nodes = [];
        for (const n of f.nodes) {
            const dtc = Number(n.dtc);
            if (!n.id || !Number.isInteger(dtc) || dtc < 0) return { entries: [], errorKey: "instructor.simulator.variants.manifestErrorEcu", errorIndex: fi + 1 };
            nodes.push({ id: n.id, status: n.status, dtc });
        }
        const dtcs = [];
        for (const d of f.dtcs) {
            const count = Number(d.count);
            if (!d.code.trim() || !Number.isInteger(count) || count < 0) return { entries: [], errorKey: "instructor.simulator.variants.manifestErrorDtc", errorIndex: fi + 1 };
            dtcs.push({ code: d.code.trim(), desc: d.desc, ecu: d.ecu, status: d.status, severity: d.severity, count });
        }
        const pids = [];
        for (const p of f.pids) {
            const base = Number(p.base);
            if (!p.id || !Number.isFinite(base)) return { entries: [], errorKey: "instructor.simulator.variants.manifestErrorPid", errorIndex: fi + 1 };
            pids.push({ id: p.id, base, ...(p.fault ? { fault: true } : {}) });
        }
        entries.push({
            nodes,
            dtcs,
            pids,
            adasDone: [...f.adasDone],
            ...(fi === 0 && f.tree.length > 0
                ? {
                      tree: f.tree.map((s) => ({
                          id: s.id,
                          label: s.label,
                          measure: s.measure,
                          expected: s.expected,
                          ok: s.ok,
                          ...(s.terminal ? { terminal: true } : {}),
                      })),
                  }
                : {}),
        });
    }
    return { entries, errorKey: null, errorIndex: 0 };
}

function inferToolFromManifest(manifest: unknown): string {
    if (!Array.isArray(manifest) || manifest.length === 0) return "scanner";
    const entry = manifest[0] as Record<string, unknown>;
    if (entry.procedures) return "multimeter";
    if (entry.exercises) return "oscilloscope";
    if (entry.components && Array.isArray(entry.components) && entry.components.length > 0) {
        const first = entry.components[0] as Record<string, unknown>;
        if (first && "hot" in first) return "location";
        if (first && "w" in first) return "schematic";
    }
    if (entry.wires || entry.traces) return "schematic";
    if (entry.nodes || entry.dtcs) return "scanner";
    return "scanner";
}

export function PackForm({
    variantId,
    initial,
    onClose,
    onSaved,
    onError,
}: {
    variantId: string;
    initial: SimFaultPack | null;
    onClose: () => void;
    onSaved: () => void;
    onError: (msg: string) => void;
}) {
    const { t } = useTranslation();
    const [tool, setTool] = useState<string>(() => (initial ? inferToolFromManifest(initial.manifest) : "scanner"));
    const [editorTab, setEditorTab] = useState<"fault" | "training">("fault");
    const [code, setCode] = useState(initial?.code ?? "");
    const [version, setVersion] = useState(initial?.version ?? "1.0.0");
    const [faults, setFaults] = useState<FaultEntryDraft[]>(() => faultsFromManifest(initial?.manifest));
    const [activeFault, setActiveFault] = useState<number | null>(null);
    const [libraryPick, setLibraryPick] = useState<string>("");
    const [sessions, setSessions] = useState<TrainingSessionDraft[]>(() =>
        initial ? sessionsFromManifest(initial.manifest) : [],
    );
    const [activeSession, setActiveSession] = useState<number | null>(null);
    const [manifestError, setManifestError] = useState<string | null>(null);
    // Fault tree (vehicle-specific diagnostic path on the first fault entry)
    const treeFromInitial = (): TreeStep[] => {
        const entry = Array.isArray(initial?.manifest) ? (initial!.manifest[0] as Record<string, unknown> | undefined) : null;
        const raw = entry?.tree;
        if (!Array.isArray(raw)) return [];
        return (raw as Record<string, unknown>[])
            .filter((s) => s && typeof s === "object" && typeof s.id === "string" && s.id)
            .map((s) => ({
                id: String(s.id),
                label: typeof s.label === "string" ? s.label : String(s.id),
                measure: typeof s.measure === "string" ? s.measure : "—",
                expected: typeof s.expected === "string" ? s.expected : "—",
                ok: s.ok === true,
                terminal: s.terminal === true ? true : undefined,
            }));
    };
    const [treeSteps, setTreeSteps] = useState<TreeStep[]>(treeFromInitial);
    // Multimeter
    type MmStepDraft = { mode: string; red: string; black: string; spec: string; good: string; bad: string; unit: string };
    type MmProcDraft = {
        ref: string;
        name: string;
        group: string;
        code: string;
        sym: string;
        pins: string[];
        pinFn: Record<string, string>;
        ecu: { code: string; name: string; pins: string[] };
        links: Record<string, string>;
        supply: string[];
        steps: MmStepDraft[];
    };
    const emptyMmStep = (): MmStepDraft => ({ mode: "VDC", red: "c1", black: "gnd", spec: "4.8 – 5.2 V", good: "5.00", bad: "0.02", unit: "V" });
    const emptyMmProc = (): MmProcDraft => ({
        ref: "",
        name: "",
        group: "Air & fuel",
        code: "",
        sym: "generic",
        pins: ["1", "2"],
        pinFn: {},
        ecu: { code: "E1", name: "Engine control unit", pins: [] },
        links: {},
        supply: [],
        steps: [emptyMmStep()],
    });
    const procToDraft = (proc: Record<string, unknown>): MmProcDraft => {
        const pins = Array.isArray(proc.pins) ? proc.pins.map(String) : [];
        const rawPinFn = (proc.pinFn ?? {}) as Record<string, unknown>;
        const rawLinks = (proc.links ?? {}) as Record<string, unknown>;
        const rawSupply = Array.isArray(proc.supply) ? proc.supply.map(String) : [];
        const ecu = (proc.ecu ?? {}) as Record<string, unknown>;
        const stepsRaw = Array.isArray(proc.steps) ? (proc.steps as Record<string, unknown>[]) : [];
        return {
            ref: String(proc.ref ?? ""),
            name: String(proc.name ?? ""),
            group: String(proc.group ?? "Air & fuel"),
            code: String(proc.code ?? proc.ref ?? ""),
            sym: String(proc.sym ?? "generic"),
            pins,
            pinFn: Object.fromEntries(Object.entries(rawPinFn).map(([k, v]) => [String(k), String(v)])),
            ecu: {
                code: String(ecu.code ?? "E1"),
                name: String(ecu.name ?? "Engine control unit"),
                pins: Array.isArray(ecu.pins) ? ecu.pins.map(String) : [],
            },
            links: Object.fromEntries(Object.entries(rawLinks).map(([k, v]) => [String(k), String(v)])),
            supply: rawSupply,
            steps: stepsRaw.map((s) => ({
                mode: String(s.mode ?? "VDC"),
                red: String(s.red ?? "c1"),
                black: String(s.black ?? "gnd"),
                spec: String(s.spec ?? ""),
                good: String(s.good ?? ""),
                bad: String(s.bad ?? ""),
                unit: String(s.unit ?? ""),
            })),
        };
    };
    const [mmProcedures, setMmProcedures] = useState<unknown[]>(() => {
        if (!initial) return [];
        const entry = Array.isArray(initial.manifest) ? (initial.manifest[0] as Record<string, unknown>) : null;
        return Array.isArray(entry?.procedures) ? (entry.procedures as unknown[]) : [];
    });
    const [mmDraft, setMmDraft] = useState<MmProcDraft>(emptyMmProc);
    const [mmEditIdx, setMmEditIdx] = useState<number | null>(null);
    // Oscilloscope
    const [scopeExercises, setScopeExercises] = useState<unknown[]>(() => {
        if (!initial) return [];
        const entry = Array.isArray(initial.manifest) ? (initial.manifest[0] as Record<string, unknown>) : null;
        return Array.isArray(entry?.exercises) ? (entry.exercises as unknown[]) : [];
    });
    const [scopeDraft, setScopeDraft] = useState({ id: "", code: "", name: "", template: "inj", period: "20", faults: ["open", "shortGnd"] });
    // Location
    const [locComponents, setLocComponents] = useState<unknown[]>(() => {
        if (!initial) return [];
        const entry = Array.isArray(initial.manifest) ? (initial.manifest[0] as Record<string, unknown>) : null;
        const list = (entry?.components ?? (entry as Record<string, unknown>)?.locationComponents) as unknown[] | undefined;
        return Array.isArray(list) ? list : [];
    });
    const [locDraft, setLocDraft] = useState({ key: "", ref: "", name: "", cat: "Sensors", kind: "sensor", view: "sensors", x: "100", y: "100", w: "40", h: "30" });
    // Schematic
    const [schComponents, setSchComponents] = useState<unknown[]>(() => {
        if (!initial) return [];
        const entry = Array.isArray(initial.manifest) ? (initial.manifest[0] as Record<string, unknown>) : null;
        return Array.isArray(entry?.components) ? (entry.components as unknown[]) : [];
    });
    const [schWires, setSchWires] = useState<unknown[]>(() => {
        if (!initial) return [];
        const entry = Array.isArray(initial.manifest) ? (initial.manifest[0] as Record<string, unknown>) : null;
        return Array.isArray(entry?.wires) ? (entry.wires as unknown[]) : [];
    });
    const [schDraftComp, setSchDraftComp] = useState({ key: "", code: "", name: "", type: "sensor", x: "1000", y: "700", w: "80", h: "40" });
    const [schDraftWire, setSchDraftWire] = useState({ ecuPin: "A 1", ecuColour: "red", target: "R16", targetPin: "1", targetColour: "red", connector: "A" });
    const patchFault = (index: number, patch: Partial<FaultEntryDraft>) =>
        setFaults((list) => list.map((f, i) => (i === index ? { ...f, ...patch } : f)));
    const save = async () => {
        let manifest: unknown[] = [];
        if (tool === "scanner") {
            const sessionsManifest = sessionsToManifest(sessions);
            if (faults.length === 0) {
                if (sessionsManifest.length === 0) {
                    setManifestError(t("instructor.simulator.variants.manifestErrorEmpty", { index: 0 }));
                    return;
                }
                manifest = [{ trainingSessions: sessionsManifest }];
            } else {
                const built = faultsToManifest(faults.map((f, i) => (i === 0 ? { ...f, tree: treeSteps } : f)));
                if (built.errorKey) {
                    setManifestError(t(built.errorKey, { index: built.errorIndex }));
                    return;
                }
                manifest = built.entries.map((entry, i) => (i === 0 ? { ...entry, trainingSessions: sessionsManifest } : entry));
            }
        } else if (tool === "multimeter") {
            if (mmProcedures.length === 0) {
                setManifestError(t("instructor.simulator.packForm.needProcedures", { defaultValue: "Add at least one procedure." }));
                return;
            }
            manifest = [{ procedures: mmProcedures }];
        } else if (tool === "oscilloscope") {
            if (scopeExercises.length === 0) {
                setManifestError(t("instructor.simulator.packForm.needExercises", { defaultValue: "Add at least one exercise." }));
                return;
            }
            // Rehydrate fn from template if missing
            const hydrated = (scopeExercises as Record<string, unknown>[]).map((ex) => {
                if (typeof ex.fn === "function") return ex;
                const tpl = SCOPE_EXERCISES.find((s) => s.id === ex.id);
                return tpl ? { ...tpl, ...ex, fn: tpl.fn } : ex;
            });
            manifest = [{ exercises: hydrated }];
        } else if (tool === "location") {
            if (locComponents.length === 0) {
                setManifestError(t("instructor.simulator.packForm.needComponents", { defaultValue: "Add at least one component." }));
                return;
            }
            manifest = [{ components: locComponents }];
        } else if (tool === "schematic") {
            manifest = [{ components: schComponents.length ? schComponents : SCH_COMPONENTS.slice(0, 3), wires: schWires.length ? schWires : SCH_WIRES.slice(0, 5), traces: SCH_TRACES.slice(0, 2) }];
        } else {
            setManifestError("Unknown tool");
            return;
        }
        setManifestError(null);
        try {
            if (initial) {
                await simulatorBuilderApi.updatePack(initial.id, { code: code.trim(), version: version.trim(), manifest });
            } else {
                await simulatorBuilderApi.createPack(variantId, { code: code.trim(), version: version.trim(), manifest });
            }
            onSaved();
        } catch (cause) {
            onError(cause instanceof Error ? cause.message : t("instructor.simulator.packForm.saveError"));
        }
    };
    const patchSession = (index: number, patch: Partial<TrainingSessionDraft>) =>
        setSessions((list) => list.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    return (
        <div className="relative z-0 rounded-2xl border border-[#F47822]/25 bg-[#FFF8F4] p-5" data-testid="pack-form">
            <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-xs font-bold text-[#3A3A3A]">
                    {t("instructor.simulator.packForm.code")}
                    <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("instructor.simulator.packForm.codePh")} dir="ltr" className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 font-mono text-sm font-normal" />
                </label>
                <label className="block text-xs font-bold text-[#3A3A3A]">
                    {t("instructor.simulator.packForm.version")}
                    <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder={t("instructor.simulator.packForm.versionPh")} dir="ltr" className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 font-mono text-sm font-normal" />
                </label>
                <label className="block text-xs font-bold text-[#3A3A3A]">
                    Lab
                    <select value={tool} onChange={(e) => setTool(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm font-bold">
                        <option value="scanner">Scanner</option>
                        <option value="multimeter">Multimeter</option>
                        <option value="oscilloscope">Oscilloscope</option>
                        <option value="location">Location</option>
                        <option value="schematic">Schematic</option>
                    </select>
                </label>
            </div>
            {tool === "scanner" && (
                <div className="mt-4 inline-flex rounded-xl border border-[#3A3A3A]/10 bg-white p-1">
                    {(["fault", "training"] as const).map((id) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setEditorTab(id)}
                            className={`rounded-lg px-4 py-2 text-xs font-black transition ${editorTab === id ? "bg-[#3A3A3A] text-white" : "text-[#3A3A3A]/55 hover:text-[#3A3A3A]"}`}
                        >
                            {id === "fault" ? t("instructor.simulator.packForm.faultSetup") : t("instructor.simulator.packForm.trainingSessions", { count: sessions.length })}
                        </button>
                    ))}
                </div>
            )}
            {tool === "scanner" && editorTab === "fault" ? (
                <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white p-3">
                        <label className="min-w-[200px] flex-1 text-xs font-bold text-[#3A3A3A]">
                            {t("instructor.simulator.packForm.faultLibrary", { count: FAULT_LIBRARY.length })}
                            <select
                                value={libraryPick}
                                onChange={(e) => setLibraryPick(e.target.value)}
                                className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-xs font-normal"
                            >
                                <option value="">{t("instructor.simulator.packForm.chooseFault")}</option>
                                {FAULT_LIBRARY.map((entry) => (
                                    <option key={entry.id} value={entry.id}>{entry.title}</option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            disabled={!libraryPick}
                            onClick={() => {
                                const found = libraryEntryById(libraryPick);
                                if (!found) return;
                                setFaults((list) => [...list, entryFromLibrary(found)]);
                                setActiveFault(faults.length);
                                setLibraryPick("");
                            }}
                            className="self-end rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-black text-white transition hover:bg-black disabled:opacity-40"
                        >
                            {t("instructor.simulator.packForm.addFromLibrary")}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setFaults((list) => [...list, blankFaultEntry()]);
                                setActiveFault(faults.length);
                            }}
                            className="self-end rounded-xl border border-dashed border-[#3A3A3A]/20 px-4 py-2.5 text-xs font-black text-[#3A3A3A]/60 hover:text-[#3A3A3A]"
                        >
                            {t("instructor.simulator.packForm.blankFault")}
                        </button>
                    </div>
                    {faults.map((fault, fi) => {
                        const faultEcus = fault.nodes.filter((n) => n.status === "fault").map((n) => n.id);
                        return (
                            <div key={fault.key} className="rounded-xl border border-[#3A3A3A]/10 bg-white p-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveFault(activeFault === fi ? null : fi)}
                                        className="min-w-0 flex-1 truncate text-start text-sm font-black text-[#3A3A3A]"
                                    >
                                        {fault.title.trim() || t("instructor.simulator.variants.faultFallback", { index: fi + 1 })}
                                        <span className="ms-2 font-mono text-[10px] font-bold text-[#3A3A3A]/45">
                                            {t("instructor.simulator.variants.faultSummary", { ecus: fault.nodes.length, dtcs: fault.dtcs.length, pids: fault.pids.length })}
                                            {faultEcus.length > 0 && ` · ${faultEcus.join(", ")}`}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (window.confirm(t("instructor.simulator.variants.deleteConfirm", { title: fault.title.trim() || t("instructor.simulator.variants.faultFallback", { index: fi + 1 }) }))) {
                                                setFaults((list) => list.filter((_, i) => i !== fi));
                                                setActiveFault(null);
                                            }
                                        }}
                                        className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-black text-red-600 hover:bg-red-50"
                                    >
                                        {t("instructor.simulator.packForm.delete")}
                                    </button>
                                </div>
                                {activeFault === fi && (
                                    <div className="mt-3 space-y-4 border-t border-[#3A3A3A]/[.07] pt-3">
                                        <label className="block text-xs font-bold text-[#3A3A3A]">
                                            {t("instructor.simulator.packForm.faultTitle")}
                                            <input
                                                value={fault.title}
                                                onChange={(e) => patchFault(fi, { title: e.target.value })}
                                                placeholder={t("instructor.simulator.packForm.faultTitlePh")}
                                                className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-xs font-normal"
                                            />
                                        </label>
                                        <div>
                                            <p className="text-xs font-bold text-[#3A3A3A]">{t("instructor.simulator.packForm.ecus")}</p>
                                            <ul className="mt-2 space-y-2">
                                                {fault.nodes.map((node, ni) => (
                                                    <li key={ni} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#3A3A3A]/[.03] p-2.5">
                                                        <select
                                                            value={node.id}
                                                            onChange={(e) => patchFault(fi, { nodes: fault.nodes.map((n, j) => (j === ni ? { ...n, id: e.target.value } : n)) })}
                                                            dir="ltr"
                                                            className="h-9 min-w-[110px] flex-1 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 font-mono text-xs font-bold"
                                                        >
                                                            {NODES.map((n) => (
                                                                <option key={n.id} value={n.id}>{n.id} · {n.name}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={node.status}
                                                            onChange={(e) => patchFault(fi, { nodes: fault.nodes.map((n, j) => (j === ni ? { ...n, status: e.target.value as FaultNodeDraft["status"] } : n)) })}
                                                            className="h-9 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 text-xs font-bold"
                                                        >
                                                            {NODE_STATUSES.map((s) => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#3A3A3A]/60">
                                                            {t("instructor.simulator.packForm.dtcLabel")}
                                                            <input
                                                                value={node.dtc}
                                                                onChange={(e) => patchFault(fi, { nodes: fault.nodes.map((n, j) => (j === ni ? { ...n, dtc: e.target.value } : n)) })}
                                                                inputMode="numeric"
                                                                dir="ltr"
                                                                className="h-9 w-16 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 font-mono text-xs"
                                                            />
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => patchFault(fi, { nodes: fault.nodes.filter((_, j) => j !== ni) })}
                                                            className="rounded-lg px-2.5 py-2 text-[11px] font-black text-red-600 hover:bg-red-50"
                                                        >
                                                            ✕
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                            <button
                                                type="button"
                                                onClick={() => patchFault(fi, { nodes: [...fault.nodes, { id: "ECM", status: "normal", dtc: "0" }] })}
                                                className="mt-2 rounded-lg border border-dashed border-[#3A3A3A]/20 px-3 py-2 text-[11px] font-black text-[#3A3A3A]/60 hover:text-[#3A3A3A]"
                                            >
                                                {t("instructor.simulator.packForm.addEcu")}
                                            </button>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#3A3A3A]">{t("instructor.simulator.packForm.faultCodes")}</p>
                                            <ul className="mt-2 space-y-2">
                                                {fault.dtcs.map((dtc, di) => (
                                                    <li key={di} className="grid gap-2 rounded-xl bg-[#3A3A3A]/[.03] p-2.5 sm:grid-cols-[110px_1fr_110px_130px_110px_80px_auto]">
                                                        <input
                                                            value={dtc.code}
                                                            onChange={(e) => patchFault(fi, { dtcs: fault.dtcs.map((d, j) => (j === di ? { ...d, code: e.target.value } : d)) })}
                                                            placeholder="P0000"
                                                            dir="ltr"
                                                            className="h-9 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 font-mono text-xs font-bold"
                                                        />
                                                        <input
                                                            value={dtc.desc}
                                                            onChange={(e) => patchFault(fi, { dtcs: fault.dtcs.map((d, j) => (j === di ? { ...d, desc: e.target.value } : d)) })}
                                                            placeholder={t("instructor.simulator.packForm.description")}
                                                            className="h-9 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 text-xs"
                                                        />
                                                        <select
                                                            value={dtc.ecu}
                                                            onChange={(e) => patchFault(fi, { dtcs: fault.dtcs.map((d, j) => (j === di ? { ...d, ecu: e.target.value } : d)) })}
                                                            dir="ltr"
                                                            className="h-9 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 font-mono text-xs font-bold"
                                                        >
                                                            {NODES.map((n) => (
                                                                <option key={n.id} value={n.id}>{n.id}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={dtc.status}
                                                            onChange={(e) => patchFault(fi, { dtcs: fault.dtcs.map((d, j) => (j === di ? { ...d, status: e.target.value as FaultDtcDraft["status"] } : d)) })}
                                                            className="h-9 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 text-xs font-bold"
                                                        >
                                                            {DTC_STATUSES.map((s) => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={dtc.severity}
                                                            onChange={(e) => patchFault(fi, { dtcs: fault.dtcs.map((d, j) => (j === di ? { ...d, severity: e.target.value as FaultDtcDraft["severity"] } : d)) })}
                                                            className="h-9 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 text-xs font-bold"
                                                        >
                                                            {SEVERITIES.map((s) => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            value={dtc.count}
                                                            onChange={(e) => patchFault(fi, { dtcs: fault.dtcs.map((d, j) => (j === di ? { ...d, count: e.target.value } : d)) })}
                                                            inputMode="numeric"
                                                            dir="ltr"
                                                            title={t("instructor.simulator.packForm.countLabel")}
                                                            className="h-9 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 font-mono text-xs"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => patchFault(fi, { dtcs: fault.dtcs.filter((_, j) => j !== di) })}
                                                            className="rounded-lg px-2.5 py-2 text-[11px] font-black text-red-600 hover:bg-red-50"
                                                        >
                                                            ✕
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                            <button
                                                type="button"
                                                onClick={() => patchFault(fi, { dtcs: [...fault.dtcs, { code: "", desc: "", ecu: "ECM", status: "Stored", count: "1", severity: "medium" }] })}
                                                className="mt-2 rounded-lg border border-dashed border-[#3A3A3A]/20 px-3 py-2 text-[11px] font-black text-[#3A3A3A]/60 hover:text-[#3A3A3A]"
                                            >
                                                {t("instructor.simulator.packForm.addDtc")}
                                            </button>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#3A3A3A]">{t("instructor.simulator.packForm.liveValues")}</p>
                                            <ul className="mt-2 space-y-2">
                                                {fault.pids.map((pid, pi) => (
                                                    <li key={pi} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#3A3A3A]/[.03] p-2.5">
                                                        <select
                                                            value={pid.id}
                                                            onChange={(e) => patchFault(fi, { pids: fault.pids.map((p, j) => (j === pi ? { ...p, id: e.target.value } : p)) })}
                                                            dir="ltr"
                                                            className="h-9 min-w-[150px] flex-1 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 font-mono text-xs font-bold"
                                                        >
                                                            {PARAMS.map((p) => (
                                                                <option key={p.id} value={p.id}>{p.id} · {p.name}</option>
                                                            ))}
                                                        </select>
                                                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#3A3A3A]/60">
                                                            {t("instructor.simulator.packForm.baseLabel")}
                                                            <input
                                                                value={pid.base}
                                                                onChange={(e) => patchFault(fi, { pids: fault.pids.map((p, j) => (j === pi ? { ...p, base: e.target.value } : p)) })}
                                                                inputMode="decimal"
                                                                dir="ltr"
                                                                className="h-9 w-24 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 font-mono text-xs"
                                                            />
                                                        </label>
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={pid.fault}
                                                            aria-label={t("instructor.simulator.packForm.faultFlag")}
                                                            onClick={() => patchFault(fi, { pids: fault.pids.map((p, j) => (j === pi ? { ...p, fault: !p.fault } : p)) })}
                                                            className={`relative h-6 w-11 shrink-0 rounded-full transition ${pid.fault ? "bg-[#F47822]" : "bg-[#3A3A3A]/15"}`}
                                                        >
                                                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${pid.fault ? "start-[22px]" : "start-0.5"}`} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => patchFault(fi, { pids: fault.pids.filter((_, j) => j !== pi) })}
                                                            className="rounded-lg px-2.5 py-2 text-[11px] font-black text-red-600 hover:bg-red-50"
                                                        >
                                                            ✕
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                            <button
                                                type="button"
                                                onClick={() => patchFault(fi, { pids: [...fault.pids, { id: "RPM", base: "820", fault: false }] })}
                                                className="mt-2 rounded-lg border border-dashed border-[#3A3A3A]/20 px-3 py-2 text-[11px] font-black text-[#3A3A3A]/60 hover:text-[#3A3A3A]"
                                            >
                                                {t("instructor.simulator.packForm.addPid")}
                                            </button>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#3A3A3A]">{t("instructor.simulator.packForm.faultTree")}</p>
                                            <p className="mt-0.5 text-[11px] text-[#3A3A3A]/50">{t("instructor.simulator.packForm.treeStepsHint")}</p>
                                            {treeSteps.length === 0 && (
                                                <p className="mt-2 rounded-lg border border-dashed border-[#3A3A3A]/15 px-3 py-2 text-[11px] text-[#3A3A3A]/45">
                                                    {t("instructor.simulator.packForm.treeEmpty")}
                                                </p>
                                            )}
                                            <ul className="mt-2 space-y-2">
                                                {treeSteps.map((step, ti) => (
                                                    <li key={ti} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#3A3A3A]/[.03] p-2.5">
                                                        <span className="font-mono text-[10px] font-black uppercase text-[#F47822]">#{ti + 1}</span>
                                                        <input
                                                            value={step.label}
                                                            onChange={(e) => setTreeSteps((list) => list.map((s, j) => (j === ti ? { ...s, label: e.target.value, id: s.id || `step-${j + 1}` } : s)))}
                                                            placeholder={t("instructor.simulator.packForm.treeStepLabel")}
                                                            className="h-9 min-w-[160px] flex-1 rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 text-xs"
                                                        />
                                                        <input
                                                            value={step.measure}
                                                            onChange={(e) => setTreeSteps((list) => list.map((s, j) => (j === ti ? { ...s, measure: e.target.value } : s)))}
                                                            placeholder={t("instructor.simulator.packForm.treeMeasure")}
                                                            dir="ltr"
                                                            className="h-9 w-24 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 font-mono text-xs"
                                                        />
                                                        <input
                                                            value={step.expected}
                                                            onChange={(e) => setTreeSteps((list) => list.map((s, j) => (j === ti ? { ...s, expected: e.target.value } : s)))}
                                                            placeholder={t("instructor.simulator.packForm.treeExpected")}
                                                            dir="ltr"
                                                            className="h-9 w-28 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 font-mono text-xs"
                                                        />
                                                        <label className="flex items-center gap-1 text-[11px] font-bold text-[#3A3A3A]/70">
                                                            <input
                                                                type="checkbox"
                                                                checked={!step.ok}
                                                                onChange={() => setTreeSteps((list) => list.map((s, j) => (j === ti ? { ...s, ok: !s.ok } : s)))}
                                                                className="h-3.5 w-3.5 accent-red-600"
                                                            />
                                                            {t("instructor.simulator.packForm.treeOk")}
                                                        </label>
                                                        <label className="flex items-center gap-1 text-[11px] font-bold text-[#3A3A3A]/70">
                                                            <input
                                                                type="checkbox"
                                                                checked={step.terminal === true}
                                                                onChange={() => setTreeSteps((list) => list.map((s, j) => (j === ti ? { ...s, terminal: s.terminal ? undefined : true } : s)))}
                                                                className="h-3.5 w-3.5 accent-red-600"
                                                            />
                                                            {t("instructor.simulator.packForm.treeTerminal")}
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setTreeSteps((list) => list.filter((_, j) => j !== ti))}
                                                            className="rounded-lg px-2.5 py-2 text-[11px] font-black text-red-600 hover:bg-red-50"
                                                        >
                                                            ✕
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setTreeSteps((list) => [
                                                        ...list,
                                                        { id: `step-${list.length + 1}`, label: "", measure: "—", expected: "—", ok: true },
                                                    ])
                                                }
                                                className="mt-2 rounded-lg border border-dashed border-[#3A3A3A]/20 px-3 py-2 text-[11px] font-black text-[#3A3A3A]/60 hover:text-[#3A3A3A]"
                                            >
                                                {t("instructor.simulator.packForm.addTreeStep")}
                                            </button>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#3A3A3A]">{t("instructor.simulator.packForm.adasFlags")}</p>
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {fault.adasDone.map((done, ai) => (
                                                    <button
                                                        key={ai}
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={done}
                                                        aria-label={t("instructor.simulator.packForm.adasItem", { index: ai + 1 })}
                                                        onClick={() => patchFault(fi, { adasDone: fault.adasDone.map((d, j) => (j === ai ? !d : d)) })}
                                                        className={`h-8 w-8 rounded-lg font-mono text-[11px] font-black transition ${done ? "bg-emerald-500 text-white" : "bg-[#3A3A3A]/10 text-[#3A3A3A]/40"}`}
                                                    >
                                                        {ai + 1}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {faults.length === 0 && (
                        <p className="rounded-xl border border-dashed border-[#3A3A3A]/15 bg-white p-5 text-center text-xs text-[#3A3A3A]/50">
                            {t("instructor.simulator.variants.noVariants")}
                        </p>
                    )}
                    {manifestError && <p role="alert" className="text-xs font-bold text-red-600">{manifestError}</p>}
                    <details className="rounded-xl border border-[#3A3A3A]/10 bg-white p-3">
                        <summary className="cursor-pointer font-mono text-[11px] font-bold text-[#3A3A3A]/60">{t("instructor.simulator.variants.previewManifest")}</summary>
                        <pre dir="ltr" className="mt-2 max-h-48 overflow-auto rounded-lg bg-[#0f1115] p-3 font-mono text-[11px] leading-5 text-emerald-300">
                            {tool === "scanner" ? JSON.stringify(faultsToManifest(faults).entries, null, 2) : tool === "multimeter" ? JSON.stringify(mmProcedures, null, 2) : tool === "oscilloscope" ? JSON.stringify(scopeExercises, null, 2) : tool === "location" ? JSON.stringify(locComponents, null, 2) : JSON.stringify({ components: schComponents, wires: schWires }, null, 2)}
                        </pre>
                    </details>
                </div>
            ) : tool === "multimeter" ? (
                <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-[#3A3A3A]/10 bg-white p-4">
                        <h4 className="text-sm font-black">Multimeter Procedures — {mmProcedures.length} in pack</h4>
                        <p className="mt-1 text-xs text-[#3A3A3A]/60">
                            Each procedure defines a component (pins, pin functions, ECU links) and measurement steps (mode, probes, spec, good/bad).
                        </p>
                        <div className="mt-3 max-h-48 space-y-2 overflow-auto">
                            {(mmProcedures as Record<string, unknown>[]).map((proc, idx) => (
                                <div key={idx} className="flex items-center gap-2 rounded-xl bg-[#F8F7F6] p-3">
                                    <span className="font-mono text-xs font-black">{String(proc.ref)}</span>
                                    <span className="flex-1 truncate text-sm font-bold">{String(proc.name)}</span>
                                    <span className="rounded-full bg-[#3A3A3A]/10 px-2 py-0.5 font-mono text-[10px] text-[#3A3A3A]/60">
                                        {Array.isArray(proc.steps) ? (proc.steps as unknown[]).length : 0} steps
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMmDraft(procToDraft(proc));
                                            setMmEditIdx(idx);
                                        }}
                                        className="text-xs font-bold text-[#1F6AE1]"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMmProcedures((l) => l.filter((_, i) => i !== idx))}
                                        className="text-xs font-bold text-red-600"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            {mmProcedures.length === 0 && (
                                <p className="rounded-xl border-2 border-dashed p-4 text-center text-sm text-[#3A3A3A]/40">No procedures yet.</p>
                            )}
                        </div>

                        {/* Procedure draft editor */}
                        <div className="mt-4 grid gap-2 rounded-xl bg-[#FFF8F4] p-3 sm:grid-cols-3">
                            <label className="block text-xs font-bold">
                                Ref{" "}
                                <input
                                    value={mmDraft.ref}
                                    onChange={(e) => setMmDraft((d) => ({ ...d, ref: e.target.value, code: e.target.value }))}
                                    placeholder="A1"
                                    dir="ltr"
                                    className="mt-1 h-9 w-full rounded-xl border bg-white px-2 font-mono text-sm"
                                />
                            </label>
                            <label className="block text-xs font-bold sm:col-span-2">
                                Name{" "}
                                <input
                                    value={mmDraft.name}
                                    onChange={(e) => setMmDraft((d) => ({ ...d, name: e.target.value }))}
                                    placeholder="Injector 1"
                                    className="mt-1 h-9 w-full rounded-xl border bg-white px-2 text-sm"
                                />
                            </label>
                            <label className="block text-xs font-bold">
                                Group{" "}
                                <input
                                    value={mmDraft.group}
                                    onChange={(e) => setMmDraft((d) => ({ ...d, group: e.target.value }))}
                                    className="mt-1 h-9 w-full rounded-xl border bg-white px-2 text-sm"
                                />
                            </label>
                            <label className="block text-xs font-bold">
                                Art sym{" "}
                                <select
                                    value={mmDraft.sym}
                                    onChange={(e) => setMmDraft((d) => ({ ...d, sym: e.target.value }))}
                                    className="mt-1 h-9 w-full rounded-xl border bg-white px-2 text-sm"
                                >
                                    {["maf", "map", "inj", "motorpot", "coil", "knock", "ind", "hall", "pot2", "lambda", "ntc", "generic"].map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block text-xs font-bold">
                                Pins (comma){" "}
                                <input
                                    value={mmDraft.pins.join(",")}
                                    onChange={(e) =>
                                        setMmDraft((d) => ({
                                            ...d,
                                            pins: e.target.value
                                                .split(",")
                                                .map((s) => s.trim())
                                                .filter(Boolean),
                                        }))
                                    }
                                    placeholder="1,2,3"
                                    dir="ltr"
                                    className="mt-1 h-9 w-full rounded-xl border bg-white px-2 font-mono text-sm"
                                />
                            </label>
                        </div>

                        {/* Pin functions + ECU */}
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] p-3">
                                <p className="text-xs font-black text-[#3A3A3A]">Pin functions</p>
                                <p className="mt-0.5 text-[11px] text-[#3A3A3A]/50">One row per pin — function text shown on the wiring diagram.</p>
                                <div className="mt-2 space-y-1.5">
                                    {mmDraft.pins.map((pin) => (
                                        <div key={pin} className="flex gap-2">
                                            <span className="grid h-8 w-10 shrink-0 place-items-center rounded-lg bg-[#3A3A3A] font-mono text-[11px] font-black text-white">
                                                {pin}
                                            </span>
                                            <input
                                                value={mmDraft.pinFn[pin] ?? ""}
                                                onChange={(e) =>
                                                    setMmDraft((d) => ({ ...d, pinFn: { ...d.pinFn, [pin]: e.target.value } }))
                                                }
                                                placeholder="Signal / earth / supply…"
                                                className="h-8 flex-1 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 text-xs outline-none focus:border-[#F47822]"
                                            />
                                            <label className="flex items-center gap-1 text-[10px] font-bold text-[#3A3A3A]/60">
                                                <input
                                                    type="checkbox"
                                                    checked={mmDraft.supply.includes(pin)}
                                                    onChange={(e) =>
                                                        setMmDraft((d) => ({
                                                            ...d,
                                                            supply: e.target.checked
                                                                ? [...d.supply, pin]
                                                                : d.supply.filter((p) => p !== pin),
                                                        }))
                                                    }
                                                    className="accent-[#B85708]"
                                                />
                                                SUP
                                            </label>
                                        </div>
                                    ))}
                                    {mmDraft.pins.length === 0 && <p className="text-[11px] text-[#3A3A3A]/40">Add pins above first.</p>}
                                </div>
                            </div>
                            <div className="rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] p-3">
                                <p className="text-xs font-black text-[#3A3A3A]">ECU link</p>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <label className="block text-[11px] font-bold">
                                        ECU code
                                        <input
                                            value={mmDraft.ecu.code}
                                            onChange={(e) => setMmDraft((d) => ({ ...d, ecu: { ...d.ecu, code: e.target.value } }))}
                                            dir="ltr"
                                            className="mt-1 h-8 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2 font-mono text-xs"
                                        />
                                    </label>
                                    <label className="block text-[11px] font-bold">
                                        ECU pins (comma)
                                        <input
                                            value={mmDraft.ecu.pins.join(",")}
                                            onChange={(e) =>
                                                setMmDraft((d) => ({
                                                    ...d,
                                                    ecu: {
                                                        ...d.ecu,
                                                        pins: e.target.value
                                                            .split(",")
                                                            .map((s) => s.trim())
                                                            .filter(Boolean),
                                                    },
                                                }))
                                            }
                                            placeholder="B20,B92"
                                            dir="ltr"
                                            className="mt-1 h-8 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2 font-mono text-xs"
                                        />
                                    </label>
                                </div>
                                <p className="mt-2 text-[11px] font-bold text-[#3A3A3A]/50">Pin → ECU pin links</p>
                                <div className="mt-1 max-h-32 space-y-1 overflow-auto">
                                    {mmDraft.pins.map((pin) => (
                                        <div key={pin} className="flex items-center gap-2">
                                            <span className="w-8 font-mono text-[11px] font-black">{pin}</span>
                                            <span className="text-[#3A3A3A]/30">→</span>
                                            <select
                                                value={mmDraft.links[pin] ?? ""}
                                                onChange={(e) =>
                                                    setMmDraft((d) => {
                                                        const links = { ...d.links };
                                                        if (e.target.value) links[pin] = e.target.value;
                                                        else delete links[pin];
                                                        return { ...d, links };
                                                    })
                                                }
                                                className="h-7 flex-1 rounded-lg border border-[#3A3A3A]/10 bg-white px-1.5 font-mono text-[11px]"
                                            >
                                                <option value="">—</option>
                                                {mmDraft.ecu.pins.map((ep) => (
                                                    <option key={ep} value={ep}>
                                                        {ep}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Measurement steps */}
                        <div className="mt-3 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] p-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-[#3A3A3A]">Measurement steps · {mmDraft.steps.length}</p>
                                <button
                                    type="button"
                                    onClick={() => setMmDraft((d) => ({ ...d, steps: [...d.steps, emptyMmStep()] }))}
                                    className="rounded-lg border border-[#3A3A3A]/15 px-2.5 py-1 text-[11px] font-bold text-[#3A3A3A]/70"
                                >
                                    + Step
                                </button>
                            </div>
                            <div className="mt-2 space-y-2">
                                {mmDraft.steps.map((step, si) => (
                                    <div key={si} className="rounded-xl border border-[#3A3A3A]/10 bg-white p-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#1F6AE1] text-[10px] font-black text-white">
                                                {si + 1}
                                            </span>
                                            <select
                                                value={step.mode}
                                                onChange={(e) =>
                                                    setMmDraft((d) => ({
                                                        ...d,
                                                        steps: d.steps.map((st, i) => (i === si ? { ...st, mode: e.target.value } : st)),
                                                    }))
                                                }
                                                className="h-8 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 font-mono text-xs font-bold"
                                            >
                                                {["VDC", "VAC", "OHM", "MA", "A", "HZ"].map((m) => (
                                                    <option key={m} value={m}>
                                                        {m}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                value={step.red}
                                                onChange={(e) =>
                                                    setMmDraft((d) => ({
                                                        ...d,
                                                        steps: d.steps.map((st, i) => (i === si ? { ...st, red: e.target.value } : st)),
                                                    }))
                                                }
                                                placeholder="red c1"
                                                dir="ltr"
                                                className="h-8 w-24 rounded-lg border border-red-200 bg-red-50/50 px-2 font-mono text-xs"
                                            />
                                            <input
                                                value={step.black}
                                                onChange={(e) =>
                                                    setMmDraft((d) => ({
                                                        ...d,
                                                        steps: d.steps.map((st, i) => (i === si ? { ...st, black: e.target.value } : st)),
                                                    }))
                                                }
                                                placeholder="black gnd"
                                                dir="ltr"
                                                className="h-8 w-24 rounded-lg border border-zinc-200 bg-zinc-50 px-2 font-mono text-xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setMmDraft((d) => ({ ...d, steps: d.steps.filter((_, i) => i !== si) }))}
                                                className="ms-auto text-xs font-bold text-red-600"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                                            <label className="block text-[10px] font-bold text-[#3A3A3A]/60 sm:col-span-2">
                                                Spec
                                                <input
                                                    value={step.spec}
                                                    onChange={(e) =>
                                                        setMmDraft((d) => ({
                                                            ...d,
                                                            steps: d.steps.map((st, i) => (i === si ? { ...st, spec: e.target.value } : st)),
                                                        }))
                                                    }
                                                    dir="ltr"
                                                    className="mt-0.5 h-8 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2 font-mono text-xs"
                                                />
                                            </label>
                                            <label className="block text-[10px] font-bold text-[#3A3A3A]/60">
                                                Good
                                                <input
                                                    value={step.good}
                                                    onChange={(e) =>
                                                        setMmDraft((d) => ({
                                                            ...d,
                                                            steps: d.steps.map((st, i) => (i === si ? { ...st, good: e.target.value } : st)),
                                                        }))
                                                    }
                                                    dir="ltr"
                                                    className="mt-0.5 h-8 w-full rounded-lg border border-emerald-200 bg-emerald-50/50 px-2 font-mono text-xs"
                                                />
                                            </label>
                                            <label className="block text-[10px] font-bold text-[#3A3A3A]/60">
                                                Bad
                                                <input
                                                    value={step.bad}
                                                    onChange={(e) =>
                                                        setMmDraft((d) => ({
                                                            ...d,
                                                            steps: d.steps.map((st, i) => (i === si ? { ...st, bad: e.target.value } : st)),
                                                        }))
                                                    }
                                                    dir="ltr"
                                                    className="mt-0.5 h-8 w-full rounded-lg border border-red-200 bg-red-50/50 px-2 font-mono text-xs"
                                                />
                                            </label>
                                            <label className="block text-[10px] font-bold text-[#3A3A3A]/60">
                                                Unit
                                                <input
                                                    value={step.unit}
                                                    onChange={(e) =>
                                                        setMmDraft((d) => ({
                                                            ...d,
                                                            steps: d.steps.map((st, i) => (i === si ? { ...st, unit: e.target.value } : st)),
                                                        }))
                                                    }
                                                    dir="ltr"
                                                    className="mt-0.5 h-8 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2 font-mono text-xs"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                ))}
                                {mmDraft.steps.length === 0 && (
                                    <p className="rounded-lg border border-dashed p-3 text-center text-xs text-[#3A3A3A]/40">Add at least one step.</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!mmDraft.ref.trim() || !mmDraft.name.trim() || mmDraft.steps.length === 0) return;
                                    const proc = {
                                        ref: mmDraft.ref.trim(),
                                        code: mmDraft.code.trim() || mmDraft.ref.trim(),
                                        name: mmDraft.name.trim(),
                                        group: mmDraft.group,
                                        sym: mmDraft.sym,
                                        pins: mmDraft.pins,
                                        pinFn: mmDraft.pinFn,
                                        ecu: mmDraft.ecu,
                                        links: mmDraft.links,
                                        supply: mmDraft.supply,
                                        steps: mmDraft.steps,
                                    };
                                    setMmProcedures((l) =>
                                        mmEditIdx === null ? [...l, proc] : l.map((_, i) => (i === mmEditIdx ? proc : l[i])),
                                    );
                                    setMmDraft(emptyMmProc());
                                    setMmEditIdx(null);
                                }}
                                disabled={!mmDraft.ref.trim() || !mmDraft.name.trim() || mmDraft.steps.length === 0}
                                className="rounded-xl bg-[#B85708] px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                            >
                                {mmEditIdx === null ? "Add procedure" : "Update procedure"}
                            </button>
                            {mmEditIdx !== null && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMmDraft(emptyMmProc());
                                        setMmEditIdx(null);
                                    }}
                                    className="rounded-xl border border-[#3A3A3A]/15 px-4 py-2 text-xs font-bold text-[#3A3A3A]/60"
                                >
                                    Cancel edit
                                </button>
                            )}
                        </div>
                        <div className="mt-2 flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const s = MM_PROCEDURES[0];
                                    if (s) setMmProcedures((l) => [...l, s as unknown]);
                                }}
                                className="flex-1 rounded-xl border px-3 py-2 text-xs font-bold"
                            >
                                + Sample
                            </button>
                            <button type="button" onClick={() => setMmProcedures([])} className="rounded-xl border px-3 py-2 text-xs font-bold">
                                Clear
                            </button>
                        </div>
                        {manifestError && <p className="mt-2 text-xs font-bold text-red-600">{manifestError}</p>}
                    </div>
                </div>
            ) : tool === "oscilloscope" ? (
                <div className="mt-4 space-y-3">
                    <div className="rounded-xl border bg-white p-4">
                        <h4 className="text-sm font-black">Oscilloscope Exercises — {scopeExercises.length} in pack</h4>
                        <p className="mt-1 text-xs text-[#3A3A3A]/60">Each exercise defines a waveform and fault set.</p>
                        <div className="mt-3 max-h-40 space-y-2 overflow-auto">
                            {(scopeExercises as Record<string, unknown>[]).map((ex, idx) => (
                                <div key={idx} className="flex items-center gap-2 rounded-xl bg-[#F8F7F6] p-3">
                                    <span className="font-mono text-xs font-black">{String(ex.id)}</span>
                                    <span className="flex-1 truncate text-sm font-bold">{String(ex.name)}</span>
                                    <button type="button" onClick={() => setScopeExercises((l) => l.filter((_, i) => i !== idx))} className="text-xs font-bold text-red-600">Remove</button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 grid gap-2 rounded-xl bg-[#FFF8F4] p-3 sm:grid-cols-2">
                            <label className="block text-xs font-bold">ID <input value={scopeDraft.id} onChange={(e) => setScopeDraft((d) => ({ ...d, id: e.target.value }))} placeholder="inj-custom" className="mt-1 h-9 w-full rounded-xl border bg-white px-2 font-mono text-sm" /></label>
                            <label className="block text-xs font-bold">Code <input value={scopeDraft.code} onChange={(e) => setScopeDraft((d) => ({ ...d, code: e.target.value }))} placeholder="INJ-99" className="mt-1 h-9 w-full rounded-xl border bg-white px-2 font-mono text-sm" /></label>
                            <label className="block text-xs font-bold">Name <input value={scopeDraft.name} onChange={(e) => setScopeDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Fuel Injector (custom)" className="mt-1 h-9 w-full rounded-xl border bg-white px-2 text-sm" /></label>
                            <label className="block text-xs font-bold">Template <select value={scopeDraft.template} onChange={(e) => setScopeDraft((d) => ({ ...d, template: e.target.value }))} className="mt-1 h-9 w-full rounded-xl border bg-white px-2 text-sm">{SCOPE_EXERCISES.map((s) => <option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}</select></label>
                        </div>
                        <button type="button" onClick={() => { if (!scopeDraft.id.trim()) return; const tpl = SCOPE_EXERCISES.find((s) => s.id === scopeDraft.template) ?? SCOPE_EXERCISES[0]; const ex = { ...tpl, id: scopeDraft.id.trim(), code: scopeDraft.code.trim() || tpl.code, name: scopeDraft.name.trim() || tpl.name, faults: scopeDraft.faults.length ? scopeDraft.faults : tpl.faults }; setScopeExercises((l) => [...l, ex as unknown]); setScopeDraft({ id: "", code: "", name: "", template: "inj", period: "20", faults: ["open", "shortGnd"] }); }} className="mt-3 w-full rounded-xl bg-[#0E9F6E] px-4 py-2 text-xs font-black text-white">Add exercise</button>
                        {manifestError && <p className="mt-2 text-xs font-bold text-red-600">{manifestError}</p>}
                    </div>
                </div>
            ) : tool === "location" ? (
                <div className="mt-4 space-y-3">
                    <div className="rounded-xl border bg-white p-4">
                        <h4 className="text-sm font-black">Location Components — {locComponents.length} in pack</h4>
                        <p className="mt-1 text-xs text-[#3A3A3A]/60">Define hotspots on the vehicle diagram.</p>
                        <div className="mt-3 max-h-40 space-y-1 overflow-auto">
                            {(locComponents as Record<string, unknown>[]).map((c, idx) => (
                                <div key={idx} className="flex items-center gap-2 rounded-xl bg-[#F8F7F6] p-2">
                                    <span className="font-mono text-xs font-black">{String(c.key)}</span>
                                    <span className="flex-1 truncate text-xs">{String(c.name)}</span>
                                    <button type="button" onClick={() => setLocComponents((l) => l.filter((_, i) => i !== idx))} className="text-xs font-bold text-red-600">✕</button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 grid gap-2 rounded-xl bg-[#FFF8F4] p-3 sm:grid-cols-2">
                            <label className="block text-xs font-bold">Key <input value={locDraft.key} onChange={(e) => setLocDraft((d) => ({ ...d, key: e.target.value }))} placeholder="R99" className="mt-1 h-9 w-full rounded-xl border bg-white px-2 font-mono text-sm" /></label>
                            <label className="block text-xs font-bold">Ref <input value={locDraft.ref} onChange={(e) => setLocDraft((d) => ({ ...d, ref: e.target.value }))} placeholder="R99" className="mt-1 h-9 w-full rounded-xl border bg-white px-2 font-mono text-sm" /></label>
                            <label className="block text-xs font-bold">Name <input value={locDraft.name} onChange={(e) => setLocDraft((d) => ({ ...d, name: e.target.value }))} placeholder="New Sensor" className="mt-1 h-9 w-full rounded-xl border bg-white px-2 text-sm" /></label>
                            <label className="block text-xs font-bold">Category <select value={locDraft.cat} onChange={(e) => setLocDraft((d) => ({ ...d, cat: e.target.value }))} className="mt-1 h-9 w-full rounded-xl border bg-white px-2 text-sm"><option>Sensors</option><option>Actuators</option><option>ECUs</option><option>Relays</option><option>Fuses</option><option>Ground points</option></select></label>
                        </div>
                        <button type="button" onClick={() => { if (!locDraft.key.trim()) return; const comp = { key: locDraft.key.trim(), ref: locDraft.ref.trim() || locDraft.key.trim(), name: locDraft.name.trim() || locDraft.key.trim(), cat: locDraft.cat, kind: locDraft.kind, view: locDraft.view, oem: "", sys: "Engine", zone: "Bay", img: "", hot: { x: Number(locDraft.x) || 0, y: Number(locDraft.y) || 0, w: Number(locDraft.w) || 40, h: Number(locDraft.h) || 30, W: 1000, H: 636 } }; setLocComponents((l) => [...l, comp as unknown]); setLocDraft({ key: "", ref: "", name: "", cat: "Sensors", kind: "sensor", view: "sensors", x: "100", y: "100", w: "40", h: "30" }); }} className="mt-3 w-full rounded-xl bg-[#06B6D4] px-4 py-2 text-xs font-black text-white">Add component</button>
                        {manifestError && <p className="mt-2 text-xs font-bold text-red-600">{manifestError}</p>}
                    </div>
                </div>
            ) : tool === "schematic" ? (
                <div className="mt-4 space-y-3">
                    <div className="rounded-xl border bg-white p-4">
                        <h4 className="text-sm font-black">Schematic — {schComponents.length} comps / {schWires.length} wires</h4>
                        <p className="mt-1 text-xs text-[#3A3A3A]/60">Add E1-hub components and pin-table wires.</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-xl bg-[#F8F7F6] p-3">
                                <p className="text-xs font-black">Components ({schComponents.length})</p>
                                <div className="mt-2 max-h-32 space-y-1 overflow-auto">
                                    {(schComponents as Record<string, unknown>[]).map((c, idx) => (
                                        <div key={idx} className="flex items-center gap-2 rounded-lg bg-white p-2">
                                            <span className="font-mono text-xs font-black">{String(c.key)}</span>
                                            <span className="flex-1 truncate text-xs">{String(c.name)}</span>
                                            <button type="button" onClick={() => setSchComponents((l) => l.filter((_, i) => i !== idx))} className="text-xs text-red-600">✕</button>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <input value={schDraftComp.key} onChange={(e) => setSchDraftComp((d) => ({ ...d, key: e.target.value }))} placeholder="KEY" className="h-8 rounded-lg border px-2 font-mono text-xs" />
                                    <input value={schDraftComp.code} onChange={(e) => setSchDraftComp((d) => ({ ...d, code: e.target.value }))} placeholder="CODE" className="h-8 rounded-lg border px-2 font-mono text-xs" />
                                </div>
                                <input value={schDraftComp.name} onChange={(e) => setSchDraftComp((d) => ({ ...d, name: e.target.value }))} placeholder="Component name" className="mt-2 h-8 w-full rounded-lg border px-2 text-xs" />
                                <button type="button" onClick={() => { if (!schDraftComp.key.trim()) return; setSchComponents((l) => [...l, { key: schDraftComp.key.trim(), code: schDraftComp.code.trim() || schDraftComp.key.trim(), name: schDraftComp.name.trim() || schDraftComp.key.trim(), type: schDraftComp.type, x: Number(schDraftComp.x) || 1000, y: Number(schDraftComp.y) || 700, w: Number(schDraftComp.w) || 80, h: Number(schDraftComp.h) || 40 } as unknown]); setSchDraftComp({ key: "", code: "", name: "", type: "sensor", x: "1000", y: "700", w: "80", h: "40" }); }} className="mt-2 w-full rounded-lg bg-[#8B5CF6] px-3 py-1.5 text-xs font-black text-white">+ Add component</button>
                            </div>
                            <div className="rounded-xl bg-[#F8F7F6] p-3">
                                <p className="text-xs font-black">Wires ({schWires.length})</p>
                                <div className="mt-2 max-h-32 space-y-1 overflow-auto">
                                    {(schWires as Record<string, unknown>[]).map((w, idx) => (
                                        <div key={idx} className="flex items-center gap-2 rounded-lg bg-white p-2">
                                            <span className="font-mono text-xs font-black">{String(w.ecuPin)}</span>
                                            <span className="flex-1 truncate text-xs">{String(w.target)}:{String(w.targetPin)}</span>
                                            <button type="button" onClick={() => setSchWires((l) => l.filter((_, i) => i !== idx))} className="text-xs text-red-600">✕</button>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <input value={schDraftWire.ecuPin} onChange={(e) => setSchDraftWire((d) => ({ ...d, ecuPin: e.target.value }))} placeholder="A 1" className="h-8 rounded-lg border px-2 font-mono text-xs" />
                                    <input value={schDraftWire.target} onChange={(e) => setSchDraftWire((d) => ({ ...d, target: e.target.value }))} placeholder="R16" className="h-8 rounded-lg border px-2 font-mono text-xs" />
                                </div>
                                <button type="button" onClick={() => { if (!schDraftWire.ecuPin.trim()) return; setSchWires((l) => [...l, { ecuPin: schDraftWire.ecuPin.trim(), ecuColour: schDraftWire.ecuColour, target: schDraftWire.target.trim(), targetPin: schDraftWire.targetPin, targetColour: schDraftWire.targetColour, connector: schDraftWire.connector, mismatch: schDraftWire.ecuColour !== schDraftWire.targetColour } as unknown]); }} className="mt-2 w-full rounded-lg bg-[#8B5CF6] px-3 py-1.5 text-xs font-black text-white">+ Add wire</button>
                            </div>
                        </div>
                        {manifestError && <p className="mt-2 text-xs font-bold text-red-600">{manifestError}</p>}
                    </div>
                </div>
            ) : tool === "scanner" ? (
                <div className="mt-3 space-y-3">
                    {sessions.map((session, si) => (
                        <div key={si} className="rounded-xl border border-[#3A3A3A]/10 bg-white p-4">
                            <div className="flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveSession(activeSession === si ? null : si)}
                                    className="min-w-0 flex-1 truncate text-start text-sm font-black text-[#3A3A3A]"
                                >
                                    {session.title.trim() || t("instructor.simulator.packForm.sessionFallback", { index: si + 1 })} · {t("instructor.simulator.packForm.stepsCount", { count: session.steps.length })}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSessions((list) => list.filter((_, i) => i !== si));
                                        setActiveSession(null);
                                    }}
                                    className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-black text-red-600 hover:bg-red-50"
                                >
                                    {t("instructor.simulator.packForm.removeSession")}
                                </button>
                            </div>
                            {activeSession === si && (
                                <div className="mt-3 space-y-3 border-t border-[#3A3A3A]/[.07] pt-3">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block text-xs font-bold text-[#3A3A3A]">
                                            {t("instructor.simulator.packForm.sessionId")}
                                            <input value={session.id} onChange={(e) => patchSession(si, { id: e.target.value })} placeholder={t("instructor.simulator.packForm.sessionIdPh")} dir="ltr" className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 font-mono text-xs font-normal" />
                                        </label>
                                        <label className="block text-xs font-bold text-[#3A3A3A]">
                                            {t("instructor.simulator.packForm.sessionTitle")}
                                            <input value={session.title} onChange={(e) => patchSession(si, { title: e.target.value })} placeholder={t("instructor.simulator.packForm.sessionTitlePh")} className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-xs font-normal" />
                                        </label>
                                    </div>
                                    <label className="block text-xs font-bold text-[#3A3A3A]">
                                        {t("instructor.simulator.packForm.sessionDesc")}
                                        <input value={session.description} onChange={(e) => patchSession(si, { description: e.target.value })} placeholder={t("instructor.simulator.packForm.sessionDescPh")} className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-xs font-normal" />
                                    </label>
                                            <div>
                                        <p className="text-xs font-bold text-[#3A3A3A]">{t("instructor.simulator.packForm.guidedSteps")}</p>
                                        <p className="mt-0.5 text-[11px] text-[#3A3A3A]/50">{t("instructor.simulator.packForm.stepsHint")}</p>
                                        <ul className="mt-2 space-y-3">
                                            {session.steps.map((step, stepIdx) => (
                                                <li key={stepIdx} className="rounded-xl bg-[#3A3A3A]/[.03] p-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-mono text-[10px] font-black uppercase text-[#F47822]">#{stepIdx + 1}</span>
                                                        <input
                                                            value={step.id}
                                                            onChange={(e) => patchSession(si, { steps: session.steps.map((st, j) => (j === stepIdx ? { ...st, id: e.target.value } : st)) })}
                                                            placeholder={t("instructor.simulator.packForm.stepId")}
                                                            dir="ltr"
                                                            className="h-9 min-w-[100px] flex-1 rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 font-mono text-xs"
                                                        />
                                                        <select
                                                            value={step.screen}
                                                            onChange={(e) => patchSession(si, { steps: session.steps.map((st, j) => (j === stepIdx ? { ...st, screen: e.target.value } : st)) })}
                                                            className="h-9 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 text-xs font-bold"
                                                        >
                                                            {TRAINING_SCREENS.map((screen) => (
                                                                <option key={screen} value={screen}>{screen}</option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            value={step.label}
                                                            onChange={(e) => patchSession(si, { steps: session.steps.map((st, j) => (j === stepIdx ? { ...st, label: e.target.value } : st)) })}
                                                            placeholder={t("instructor.simulator.packForm.stepLabel")}
                                                            className="h-9 min-w-[120px] flex-1 rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 text-xs"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => patchSession(si, { steps: session.steps.filter((_, j) => j !== stepIdx) })}
                                                            className="rounded-lg px-2.5 py-2 text-[11px] font-black text-red-600 hover:bg-red-50"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                    <label className="mt-2 block text-[11px] font-bold text-[#3A3A3A]/70">
                                                        {t("instructor.simulator.packForm.stepQuestion")}
                                                        <input
                                                            value={step.question}
                                                            onChange={(e) => patchSession(si, { steps: session.steps.map((st, j) => (j === stepIdx ? { ...st, question: e.target.value } : st)) })}
                                                            placeholder={t("instructor.simulator.packForm.stepQuestionPh")}
                                                            className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 text-xs"
                                                        />
                                                    </label>
                                                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                                                        {step.options.map((opt, oi) => (
                                                            <label key={oi} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${step.correctIndex === oi ? "border-emerald-300 bg-emerald-50" : "border-[#3A3A3A]/10 bg-white"}`}>
                                                                <input
                                                                    type="radio"
                                                                    name={`step-correct-${si}-${stepIdx}`}
                                                                    checked={step.correctIndex === oi}
                                                                    onChange={() => patchSession(si, { steps: session.steps.map((st, j) => (j === stepIdx ? { ...st, correctIndex: oi } : st)) })}
                                                                    className="h-3.5 w-3.5 accent-emerald-600"
                                                                />
                                                                <input
                                                                    value={opt}
                                                                    onChange={(e) => patchSession(si, { steps: session.steps.map((st, j) => (j === stepIdx ? { ...st, options: st.options.map((o, k) => (k === oi ? e.target.value : o)) as [string, string, string, string] } : st)) })}
                                                                    placeholder={t("instructor.simulator.packForm.optionPh", { index: oi + 1 })}
                                                                    className="h-8 min-w-0 flex-1 bg-transparent text-[11px] font-bold outline-none"
                                                                />
                                                            </label>
                                                        ))}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            type="button"
                                            onClick={() => patchSession(si, { steps: [...session.steps, { ...EMPTY_STEP, options: ["", "", "", ""] }] })}
                                            className="mt-2 rounded-lg border border-dashed border-[#3A3A3A]/20 px-3 py-2 text-[11px] font-black text-[#3A3A3A]/60 hover:text-[#3A3A3A]"
                                        >
                                            {t("instructor.simulator.packForm.addStep")}
                                        </button>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[#3A3A3A]">{t("instructor.simulator.packForm.diagnosisOptions")} <span className="font-normal text-[#3A3A3A]/50">{t("instructor.simulator.packForm.optionsFallbackHint")}</span></p>
                                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                            {session.options.map((opt, oi) => (
                                                <label key={oi} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${session.correctIndex === oi ? "border-emerald-300 bg-emerald-50" : "border-[#3A3A3A]/10 bg-white"}`}>
                                                    <input
                                                        type="radio"
                                                        name={`correct-${si}`}
                                                        checked={session.correctIndex === oi}
                                                        onChange={() => patchSession(si, { correctIndex: oi })}
                                                        className="h-4 w-4 accent-emerald-600"
                                                    />
                                                    <input
                                                        value={opt}
                                                        onChange={(e) => patchSession(si, { options: session.options.map((o, j) => (j === oi ? e.target.value : o)) as [string, string, string, string] })}
                                                        placeholder={t("instructor.simulator.packForm.optionPh", { index: oi + 1 })}
                                                        className="h-9 min-w-0 flex-1 bg-transparent text-xs font-bold outline-none"
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                                        {[
                                            ["hintBudget", t("instructor.simulator.packForm.hintBudget")],
                                            ["passScore", t("instructor.simulator.packForm.passScore")],
                                            ["accuracy", t("instructor.simulator.packForm.accuracyWeight")],
                                            ["process", t("instructor.simulator.packForm.processWeight")],
                                            ["time", t("instructor.simulator.packForm.timeWeight")],
                                        ].map(([key, label]) => (
                                            <label key={key} className="block text-xs font-bold text-[#3A3A3A]">
                                                {label}
                                                <input
                                                    value={session[key as keyof TrainingSessionDraft] as string}
                                                    onChange={(e) => patchSession(si, { [key]: e.target.value } as Partial<TrainingSessionDraft>)}
                                                    inputMode="numeric"
                                                    dir="ltr"
                                                    className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 font-mono text-xs"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                            setSessions((list) => (list.length === 0 ? [blankSession()] : [...list, blankSession()]));
                            setActiveSession(sessions.length);
                        }}
                        className="rounded-xl border border-dashed border-[#3A3A3A]/20 px-4 py-2.5 text-xs font-black text-[#3A3A3A]/60 hover:text-[#3A3A3A]"
                    >
                        {sessions.length === 0 ? t("instructor.simulator.packForm.newSession") : t("instructor.simulator.packForm.newSession")}
                    </button>
                    {sessions.length === 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setSessions([blankSession()]);
                                setActiveSession(0);
                            }}
                            className="rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-black text-white hover:bg-[#E96D18]"
                        >
                            {t("instructor.simulator.packForm.startSession")}
                        </button>
                    )}
                </div>
            ) : null}
            <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => void save()} className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-black text-white hover:bg-[#E96D18]">
                    {t("instructor.simulator.packForm.saveVariant")}
                </button>
                <button type="button" onClick={onClose} className="rounded-xl border border-[#3A3A3A]/10 px-5 py-2.5 text-xs font-black text-[#3A3A3A]/60">
                    {t("instructor.simulator.packForm.cancel")}
                </button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#3A3A3A]/50">
                <Car className="h-3.5 w-3.5" /> {t("instructor.simulator.packForm.draftNote")}
            </p>
        </div>
    );
}
