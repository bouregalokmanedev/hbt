import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Search, Stethoscope, X, XCircle, Plus, Edit, Eye, Archive, Flag, Trash2, BookOpen, Loader2, ChevronLeft, ChevronRight, ShieldCheck, AlertCircle, Trash, Save, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import {
    getInstructorCourses,
    getInstructorDiagnosticAnalytics,
    getInstructorDiagnosticAttempts,
    getInstructorDiagnosticResult,
    getInstructorDiagnosticScenarios,
    getInstructorDiagnosticScenario,
    createInstructorDiagnosticScenario,
    updateInstructorDiagnosticScenario,
    publishInstructorDiagnosticScenario,
    unpublishInstructorDiagnosticScenario,
    archiveInstructorDiagnosticScenario,
    forkInstructorDiagnosticScenario,
    createInstructorDiagnosticStep,
    updateInstructorDiagnosticStep,
    deleteInstructorDiagnosticStep,
    reorderInstructorDiagnosticSteps,
    createInstructorDiagnosticCriterion,
    deleteInstructorDiagnosticCriterion,
    createInstructorDiagnosticHint,
    deleteInstructorDiagnosticHint,
    type InstructorDiagnosticAttempt,
    type InstructorDiagnosticScenario,
    type InstructorDiagnosticScenarioDetail,
    type InstructorDiagnosticStep,
} from "../api/instructorApi";
import { simulatorBuilderApi, type SimCatalogMake, type SimFaultPack } from "../api/simulatorBuilder.api";

function useDiagnosticStatusLabel(status: string): string {
    const { t } = useTranslation();
    switch (status) {
        case "published":
            return t("instructor.diagnostics.status.published");
        case "archived":
            return t("instructor.diagnostics.status.archived");
        case "draft":
            return t("instructor.diagnostics.status.draft");
        default:
            return status.replace("_", " ");
    }
}

export function InstructorDiagnosticsPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"attempts" | "scenarios">("attempts");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const attempts = useQuery({
        queryKey: ["instructor", "diagnostics", "attempts"],
        queryFn: () => getInstructorDiagnosticAttempts({ per_page: 50 }),
        staleTime: 20_000,
    });

    const scenarios = useQuery({
        queryKey: ["instructor", "diagnostics", "scenarios"],
        queryFn: () => getInstructorDiagnosticScenarios({ page: 1, per_page: 20 }),
        staleTime: 20_000,
    });

    const analytics = useQuery({
        queryKey: ["instructor", "diagnostics", "analytics"],
        queryFn: () => getInstructorDiagnosticAnalytics(),
        staleTime: 30_000,
    });

    const items = (attempts.data?.items ?? []).filter((item) => {
        const needle = search.trim().toLowerCase();
        if (!needle) return true;
        return (
            item.student?.name.toLowerCase().includes(needle) ||
            item.student?.email.toLowerCase().includes(needle) ||
            item.scenario_id.toLowerCase().includes(needle)
        );
    });

    const scenariosData = scenarios.data;
    const scenariosList = scenariosData?.data ?? [];
    const filteredScenarios = scenariosList.filter((s) => {
        const needle = search.trim().toLowerCase();
        if (!needle) return true;
        return (
            s.title.toLowerCase().includes(needle) ||
            (s.course?.title.toLowerCase().includes(needle) ?? false)
        );
    });

    const passed = items.filter((item) => item.passed).length;

    const refreshScenarios = async () => {
        await queryClient.invalidateQueries({ queryKey: ["instructor", "diagnostics", "scenarios"] });
    };

    const handleCreateScenario = async (data: { course_id: string; title: string; description?: string; passing_score?: number; time_limit?: number | null; is_required?: boolean }) => {
        await createInstructorDiagnosticScenario(data);
        setActiveTab("scenarios");
        await refreshScenarios();
    };

    const handleUpdateScenario = async (scenarioId: string, data: Record<string, string | number | boolean | null>) => {
        await updateInstructorDiagnosticScenario(scenarioId, data);
    };

    const runScenarioAction = async (fn: () => Promise<unknown>) => {
        setActionError(null);
        try {
            await fn();
            await refreshScenarios();
        } catch (cause) {
            setActionError(cause instanceof Error ? cause.message : t("instructor.diagnostics.actionFailed"));
        }
    };

    const handlePublish = (scenarioId: string) => void runScenarioAction(() => publishInstructorDiagnosticScenario(scenarioId));

    const handleUnpublish = (scenarioId: string) => void runScenarioAction(() => unpublishInstructorDiagnosticScenario(scenarioId));

    const handleDeleteScenario = (scenarioId: string) => {
        if (!confirm(t("instructor.diagnostics.archiveConfirm"))) return;
        void runScenarioAction(() => archiveInstructorDiagnosticScenario(scenarioId));
    };

    const handleFork = async (scenarioId: string) => {
        setActionError(null);
        try {
            const forked = await forkInstructorDiagnosticScenario(scenarioId);
            setActiveTab("scenarios");
            await refreshScenarios();
            setEditingId(forked.id);
        } catch (cause) {
            setActionError(cause instanceof Error ? cause.message : t("instructor.diagnostics.forkFailed"));
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 lg:space-y-7">
            <section className="rounded-3xl bg-[#3A3A3A] p-6 text-white shadow-[0_18px_45px_rgba(58,58,58,.13)] sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#F9A16C]">{t("instructor.diagnostics.eyebrow")}</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("instructor.diagnostics.title")}</h1>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                            {t("instructor.diagnostics.description")}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="rounded-xl bg-white/10 px-4 py-3 text-xs font-semibold text-white/85">
                            {t("instructor.diagnostics.statsBadge", { scenarios: analytics.data?.total_scenarios ?? 0, attempts: analytics.data?.total_attempts ?? 0 })}
                        </span>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#df6817]"
                        >
                            <Plus className="h-3.5 w-3.5" /> {t("instructor.diagnostics.newScenario")}
                        </button>
                    </div>
                </div>

                <div className="mt-6 flex gap-2">
                    <button
                        onClick={() => setActiveTab("attempts")}
                        className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                            activeTab === "attempts"
                                ? "bg-[#3A3A3A] text-white shadow"
                                : "text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                    >
                        {t("instructor.diagnostics.tabs.attempts")}
                    </button>
                    <button
                        onClick={() => setActiveTab("scenarios")}
                        className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                            activeTab === "scenarios"
                                ? "bg-[#3A3A3A] text-white shadow"
                                : "text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                    >
                        {t("instructor.diagnostics.tabs.scenarios")}
                    </button>
                    {activeTab === "scenarios" && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#df6817]"
                        >
                            <Plus className="h-3.5 w-3.5" /> {t("instructor.diagnostics.newScenario")}
                        </button>
                    )}
                </div>
            </section>

            {attempts.isLoading && scenarios.isLoading && (
                <div className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-8 text-sm text-[#3A3A3A]/50">
                    {t("instructor.diagnostics.loadingDiagnostics")}
                </div>
            )}

            {actionError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    {actionError}
                </div>
            )}

            {attempts.isError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                    {t("instructor.diagnostics.loadError")}
                    {attempts.error instanceof Error && (
                        <span className="mt-1 block text-xs text-red-600">{t("instructor.diagnostics.loadErrorDetail", { message: attempts.error.message })}</span>
                    )}
                </div>
            )}

            {!attempts.isLoading && !attempts.isError && !scenarios.isLoading && !scenarios.isError && (
                <>
                    {activeTab === "attempts" && (
                        <section className="overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_10px_30px_rgba(58,58,58,.045)]">
                            {items.length ? (
                                <>
                                    <div className="flex flex-wrap items-center gap-2 border-b border-[#3A3A3A]/7 bg-[#FCFCFC] px-4 py-3 text-xs sm:px-6">
                                        <span className="rounded-full bg-[#3A3A3A] px-2.5 py-1 font-mono font-bold text-white">
                                            {t("instructor.diagnostics.attemptsCount", { count: items.length })}
                                        </span>
                                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-bold text-emerald-700">
                                            {t("instructor.diagnostics.passedCount", { count: passed })}
                                        </span>
                                        <span className="ms-auto text-[11px] font-semibold text-[#3A3A3A]/45">
                                            {t("instructor.diagnostics.selectAttemptHint")}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-[#3A3A3A]/7">
                                        {items.map((item) => (
                                            <AttemptRow key={item.id} item={item} onSelect={() => setSelectedId(item.id)} />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="p-10 text-center">
                                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#F47822]/10">
                                        <Stethoscope className="h-6 w-6 text-[#F47822]" />
                                    </div>
                                    <p className="mt-4 text-sm font-bold text-[#3A3A3A]">{t("instructor.diagnostics.emptyAttemptsTitle")}</p>
                                    <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#3A3A3A]/50">
                                        {t("instructor.diagnostics.emptyAttemptsDesc")}
                                    </p>
                                </div>
                            )}
                        </section>
                    )}

                    {activeTab === "scenarios" && (
                        <section className="overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_10px_30px_rgba(58,58,58,.045)]">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3A3A3A]/7 px-4 py-4 sm:px-6">
                                <div className="flex flex-wrap items-center gap-3">
                                    <ScenariosSearch value={search} onChange={setSearch} />
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.22)] transition hover:bg-[#df6817]"
                                >
                                    <Plus className="h-4 w-4" /> {t("instructor.diagnostics.newScenario")}
                                </button>
                            </div>
                            {scenariosList.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 border-b border-[#3A3A3A]/7 bg-[#FCFCFC] px-4 py-3 text-xs sm:px-6">
                                    <span className="rounded-full bg-[#3A3A3A] px-2.5 py-1 font-mono font-bold text-white">
                                        {t("instructor.diagnostics.scenariosCount", { count: scenariosList.length })}
                                    </span>
                                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-bold text-emerald-700">
                                        {t("instructor.diagnostics.publishedCount", { count: scenariosList.filter((s) => s.status === "published").length })}
                                    </span>
                                    <span className="rounded-full bg-[#3A3A3A]/[.06] px-2.5 py-1 font-bold text-[#3A3A3A]/60">
                                        {t("instructor.diagnostics.draftsCount", { count: scenariosList.filter((s) => s.status === "draft").length })}
                                    </span>
                                    <span className="ms-auto text-[11px] font-semibold text-[#3A3A3A]/45">
                                        {t("instructor.diagnostics.selectScenarioHint")}
                                    </span>
                                </div>
                            )}

                            {scenarios.isLoading ? (
                                <div className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-8 text-sm text-[#3A3A3A]/50">
                                    {t("instructor.diagnostics.loadingScenarios")}
                                </div>
                            ) : scenarios.isError ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                                    {t("instructor.diagnostics.scenariosError")}
                                </div>
                            ) : filteredScenarios.length === 0 ? (
                                <div className="p-10 text-center">
                                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#F47822]/10">
                                        <Stethoscope className="h-6 w-6 text-[#F47822]" />
                                    </div>
                                    <p className="mt-4 text-sm font-bold text-[#3A3A3A]">
                                        {search ? t("instructor.diagnostics.noMatchTitle") : t("instructor.diagnostics.noneTitle")}
                                    </p>
                                    <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#3A3A3A]/50">
                                        {search
                                            ? t("instructor.diagnostics.noMatchDesc")
                                            : t("instructor.diagnostics.noneDesc")}
                                    </p>
                                    {!search && (
                                        <button onClick={() => setShowCreateModal(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-4 py-2 text-sm font-bold text-white hover:bg-[#df6817]">
                                            <Plus className="h-4 w-4" /> {t("instructor.diagnostics.createScenario")}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-b-2xl divide-y divide-[#3A3A3A]/7">
                                    {filteredScenarios.map((scenario) => (
                                        <ScenarioRow
                                            key={scenario.id}
                                            scenario={scenario}
                                            onEdit={() => setEditingId(scenario.id)}
                                            onView={() => setEditingId(scenario.id)}
                                            onPublish={scenario.status !== "published" ? () => handlePublish(scenario.id) : undefined}
                                            onUnpublish={scenario.status === "published" ? () => handleUnpublish(scenario.id) : undefined}
                                            onArchive={() => handleDeleteScenario(scenario.id)}
                                            onFork={() => handleFork(scenario.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </>
            )}

            {showCreateModal && (
                <CreateScenarioModal
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={async (data) => {
                        await handleCreateScenario(data);
                        setShowCreateModal(false);
                    }}
                />
            )}

            {editingId && (
                <ScenarioEditor
                    scenarioId={editingId}
                    onClose={() => setEditingId(null)}
                    onChanged={refreshScenarios}
                    onOpenScenario={(id) => setEditingId(id)}
                />
            )}

            {selectedId && <AttemptDrawer attemptId={selectedId} onClose={() => setSelectedId(null)} />}
        </div>
    );
}

function ScenariosSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    return (
        <label className="relative max-w-xs">
            <Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/30 ${isRTL ? "right-3" : "left-3"}`} />
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t("instructor.diagnostics.searchPh")}
                className={`h-10 w-full max-w-xs rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] pr-3 text-sm outline-none focus:border-[#F47822] ${isRTL ? "pl-3 pr-10" : "pl-10"}`}
            />
        </label>
    );
}

function initialsOf(name?: string | null): string {
    if (!name) return "•";
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

function formatAttemptDate(value: string | null | undefined, locale: string): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}

function AttemptRow({ item, onSelect }: { item: InstructorDiagnosticAttempt; onSelect: () => void }) {
    const { t, i18n } = useTranslation();
    const score = item.score ?? null;
    return (
        <div
            onClick={onSelect}
            className="flex w-full cursor-pointer flex-wrap items-center gap-3 px-4 py-3.5 text-start transition hover:bg-[#FCFCFC] sm:px-6"
        >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#3A3A3A] text-xs font-black text-white">
                {initialsOf(item.student?.name)}
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#3A3A3A]">
                    {item.student?.name ?? t("instructor.diagnostics.row.unknownStudent")}
                    {item.attempt_number != null && (
                        <span className="ms-2 font-mono text-[11px] font-bold text-[#3A3A3A]/40">
                            #{item.attempt_number}
                        </span>
                    )}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#3A3A3A]/50">
                    {item.scenario?.title ?? item.scenario_id.slice(0, 8)}
                    {item.student?.email ? ` · ${item.student.email}` : ""}
                </p>
            </div>
            <div className="hidden items-center gap-2 text-xs text-[#3A3A3A]/50 md:flex">
                <span className="rounded-full bg-[#3A3A3A]/[.05] px-2.5 py-1 font-bold">
                    {t("instructor.diagnostics.row.hints", { count: item.hints_used ?? 0 })}
                </span>
                <span>{formatAttemptDate(item.submitted_at ?? item.started_at, i18n.language)}</span>
            </div>
            <span
                dir="ltr"
                className={`shrink-0 rounded-xl px-3 py-1.5 font-mono text-sm font-black tabular-nums ${
                    score === null
                        ? "bg-[#3A3A3A]/[.06] text-[#3A3A3A]/50"
                        : score >= 70
                          ? "bg-emerald-50 text-emerald-700"
                          : score >= 40
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                }`}
            >
                {score === null ? "—" : `${score}`}
            </span>
            <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${
                    item.passed ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"
                }`}
            >
                {item.passed ? t("instructor.diagnostics.row.pass") : t("instructor.diagnostics.row.fail")}
            </span>
            <span className="hidden shrink-0 items-center gap-1 text-xs font-black text-[#F47822] sm:inline-flex">
                {t("instructor.diagnostics.row.review")} <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
            </span>
        </div>
    );
}

function AttemptDrawer({ attemptId, onClose }: { attemptId: string; onClose: () => void }) {
    const { t } = useTranslation();
    const result = useQuery({
        queryKey: ["instructor", "diagnostics", "attempt-result", attemptId],
        queryFn: () => getInstructorDiagnosticResult(attemptId),
        retry: false,
    });
    const detail = result.data;
    const breakdown = detail?.breakdown ? Object.values(detail.breakdown) : [];

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
            <div className="flex h-full w-full max-w-xl flex-col bg-[#F8F7F6] shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-[#3A3A3A]/10 bg-white px-6 py-5">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                            {t("instructor.diagnostics.drawer.eyebrow")}
                        </p>
                        <h2 className="mt-1 truncate font-mono text-sm font-black text-[#3A3A3A]" dir="ltr">
                            {attemptId.slice(0, 8)}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("instructor.diagnostics.drawer.closeAria")}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#3A3A3A]/10 text-[#3A3A3A]/60 hover:bg-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
                    {result.isLoading ? (
                        <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#3A3A3A]/50">{t("instructor.diagnostics.drawer.loading")}</p>
                    ) : result.isError || !detail ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                            {t("instructor.diagnostics.drawer.empty")}
                        </div>
                    ) : (
                        <>
                            <section className="rounded-2xl bg-[#3A3A3A] p-6 text-white">
                                <div className="flex flex-wrap items-end justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">{t("instructor.diagnostics.drawer.finalScore")}</p>
                                        <p dir="ltr" className="mt-1 font-mono text-5xl font-black tabular-nums">
                                            {detail.score ?? "—"}
                                        </p>
                                    </div>
                                    <span
                                        className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wide ${
                                            detail.passed ? "bg-emerald-500 text-white" : "bg-white/10 text-white/70"
                                        }`}
                                    >
                                        {detail.passed ? t("instructor.diagnostics.drawer.passed") : t("instructor.diagnostics.drawer.notPassed")}
                                    </span>
                                </div>
                                <div className="mt-5 grid grid-cols-3 gap-2">
                                    {[
                                        { label: t("instructor.diagnostics.drawer.accuracy"), value: detail.accuracy },
                                        { label: t("instructor.diagnostics.drawer.process"), value: detail.process_score },
                                        { label: t("instructor.diagnostics.drawer.points"), value: detail.points_earned != null && detail.points_possible != null ? `${detail.points_earned}/${detail.points_possible}` : null },
                                    ].map((stat) => (
                                        <div key={stat.label} className="rounded-xl bg-white/[0.07] p-3 text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">{stat.label}</p>
                                            <p dir="ltr" className="mt-1 font-mono text-lg font-black tabular-nums">{stat.value ?? "—"}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {breakdown.length > 0 && (
                                <section className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-5">
                                    <h3 className="text-sm font-black uppercase tracking-wide text-[#3A3A3A]/60">{t("instructor.diagnostics.drawer.breakdown")}</h3>
                                    <ul className="mt-3 space-y-1.5">
                                        {breakdown.map((entry) => (
                                            <li key={entry.step_id} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm">
                                                <span className={`h-2 w-2 shrink-0 rounded-full ${entry.is_correct ? "bg-emerald-500" : "bg-red-500"}`} />
                                                <span className="min-w-0 flex-1 truncate font-semibold text-[#3A3A3A]">{entry.title}</span>
                                                <span dir="ltr" className="shrink-0 font-mono text-[11px] font-bold text-[#3A3A3A]/50">
                                                    {entry.points_earned}/{entry.points_possible}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {((detail.strengths ?? []).length > 0 || (detail.weaknesses ?? []).length > 0) && (
                                <section className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                                        <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-700">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> {t("instructor.diagnostics.drawer.strengths")}
                                        </h3>
                                        <ul className="mt-2 space-y-1 text-xs leading-5 text-emerald-900">
                                            {(detail.strengths ?? []).map((line) => (
                                                <li key={line}>· {line}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
                                        <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-red-700">
                                            <XCircle className="h-3.5 w-3.5" /> {t("instructor.diagnostics.drawer.improve")}
                                        </h3>
                                        <ul className="mt-2 space-y-1 text-xs leading-5 text-red-900">
                                            {(detail.weaknesses ?? []).map((line) => (
                                                <li key={line}>· {line}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function ScenarioRow({
    scenario,
    onEdit,
    onView,
    onPublish,
    onUnpublish,
    onArchive,
    onFork,
}: {
    scenario: {
        id: string;
        title: string;
        slug: string;
        version: number;
        status: string;
        course: { id: string; title: string } | null;
        passing_score: number;
        is_required: boolean;
        steps_count: number;
        hints_count: number;
        assignments_count: number;
        attempts_count: number;
        pass_rate: number | null;
        updated_at?: string | null;
    };
    onEdit: () => void;
    onView: () => void;
    onPublish?: () => void;
    onUnpublish?: () => void;
    onArchive: () => void;
    onFork: () => void;
}) {
    const { t } = useTranslation();
    const statusLabel = useDiagnosticStatusLabel(scenario.status);
    return (
        <div
            onClick={onView}
            className="flex w-full cursor-pointer flex-wrap items-center gap-3 px-4 py-3.5 text-start transition hover:bg-[#FCFCFC] sm:px-6"
        >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                <Stethoscope className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-bold text-[#3A3A3A]">
                        {scenario.title}
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${scenario.status === "published" ? "bg-emerald-500/10 text-emerald-700" : scenario.status === "archived" ? "bg-red-500/10 text-red-700" : "bg-[#3A3A3A]/[.06] text-[#3A3A3A]/55"}`}>
                        {statusLabel}
                    </span>
                </p>
                <p className="mt-1 truncate text-xs text-[#3A3A3A]/50">
                    {scenario.course?.title ?? t("instructor.diagnostics.row.noCourse")} · <span>{t("instructor.diagnostics.row.version", { version: scenario.version })}</span> · {t("instructor.diagnostics.row.stepsAttempts", { steps: scenario.steps_count, attempts: scenario.attempts_count })}
                    {scenario.is_required && <span className="ms-1.5 rounded-full bg-[#F47822]/10 px-2 py-0.5 text-[10px] font-bold text-[#F47822]">{t("instructor.diagnostics.row.required")}</span>}
                </p>
            </div>
            <span
                dir="ltr"
                className={`hidden shrink-0 rounded-xl px-3 py-1.5 font-mono text-sm font-black tabular-nums sm:inline-block ${
                    scenario.pass_rate === null
                        ? "bg-[#3A3A3A]/[.06] text-[#3A3A3A]/50"
                        : scenario.pass_rate >= 70
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                }`}
            >
                {scenario.pass_rate === null ? "—" : `${scenario.pass_rate}%`}
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
                {onPublish && (
                    <button onClick={(e) => { e.stopPropagation(); onPublish(); }} title={t("instructor.diagnostics.row.publish")} className="h-8 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700">
                        {t("instructor.diagnostics.row.publish")}
                    </button>
                )}
                {onUnpublish && (
                    <button onClick={(e) => { e.stopPropagation(); onUnpublish(); }} title={t("instructor.diagnostics.row.unpublish")} className="h-8 rounded-lg border border-[#3A3A3A]/10 bg-white px-3 text-xs font-bold text-[#3A3A3A] hover:bg-[#FCFCFC]">
                        {t("instructor.diagnostics.row.unpublish")}
                    </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} title={t("instructor.diagnostics.row.openEditor")} className="grid h-8 w-8 place-items-center rounded-lg border border-[#3A3A3A]/10 text-[#3A3A3A]/60 hover:border-[#F47822]/40 hover:text-[#F47822]">
                    <Edit className="h-3.5 w-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onFork(); }} title={t("instructor.diagnostics.row.forkNewVersion")} className="hidden h-8 rounded-lg border border-[#3A3A3A]/10 px-3 text-xs font-bold text-[#3A3A3A]/60 hover:text-[#3A3A3A] sm:block">
                    {t("instructor.diagnostics.row.fork")}
                </button>
                <button onClick={(e) => { e.stopPropagation(); onArchive(); }} title={t("instructor.diagnostics.row.archive")} className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                    <Archive className="h-3.5 w-3.5" />
                </button>
            </span>
        </div>
    );
}
function CreateScenarioModal({
    onClose,
    onSubmit,
}: {
    onClose: () => void;
    onSubmit: (data: {
        course_id: string;
        title: string;
        passing_score?: number;
        time_limit?: number | null;
        is_required?: boolean;
    }) => Promise<void>;
}) {
    const { t } = useTranslation();
    const [courseId, setCourseId] = useState("");
    const [title, setTitle] = useState("");
    const [passingScore, setPassingScore] = useState(80);
    const [timeLimit, setTimeLimit] = useState(0);
    const [isRequired, setIsRequired] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const courses = useQuery({
        queryKey: ["instructor", "diagnostics", "courses"],
        queryFn: () => getInstructorCourses({ per_page: 100 }),
        staleTime: 60_000,
    });

    const courseOptions = courses.data?.data ?? [];
    const canSubmit = courseId !== "" && title.trim() !== "" && !saving;

    const handleCreate = async () => {
        if (!canSubmit) return;
        setSaving(true);
        setError(null);
        try {
            await onSubmit({
                course_id: courseId,
                title: title.trim(),
                passing_score: passingScore,
                time_limit: timeLimit > 0 ? timeLimit : null,
                is_required: isRequired,
            });
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : t("instructor.diagnostics.createModal.createFailed"));
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-bl-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-8">
                <h2 className="mb-6 text-xl font-semibold text-[#3A3A3A]">{t("instructor.diagnostics.createModal.title")}</h2>
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleCreate();
                    }}
                >
                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#3A3A3A]">{t("instructor.diagnostics.createModal.courseLabel")}</label>
                        <select
                            value={courseId}
                            onChange={(e) => setCourseId(e.target.value)}
                            className="w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-2 text-sm focus:border-[#F47822] focus:outline-none"
                        >
                            <option value="">{t("instructor.diagnostics.createModal.selectCourse")}</option>
                            {courses.isLoading && <option value="" disabled>{t("instructor.diagnostics.createModal.loadingCourses")}</option>}
                            {courseOptions.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>
                        {courses.isError && (
                            <p className="mt-1 text-xs text-red-600">{t("instructor.diagnostics.createModal.coursesFailed")}</p>
                        )}
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#3A3A3A]">{t("instructor.diagnostics.createModal.titleLabel")}</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t("instructor.diagnostics.createModal.titlePh")}
                            className="w-full rounded-xl border border-[#3A3A3A]/10 px-3 py-2 text-sm focus:border-[#F47822] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#3A3A3A]">{t("instructor.diagnostics.createModal.passingScore")}</label>
                        <input
                            type="number"
                            value={passingScore}
                            onChange={(e) => setPassingScore(Number(e.target.value))}
                            min="0"
                            max="100"
                            className="w-full rounded-xl border border-[#3A3A3A]/10 px-3 py-2 text-sm focus:border-[#F47822] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#3A3A3A]">{t("instructor.diagnostics.createModal.timeLimit")}</label>
                        <input
                            type="number"
                            value={timeLimit}
                            onChange={(e) => setTimeLimit(Number(e.target.value))}
                            min="0"
                            className="w-full rounded-xl border border-[#3A3A3A]/10 px-3 py-2 text-sm focus:border-[#F47822] focus:outline-none"
                        />
                        <p className="mt-1 text-xs text-[#3A3A3A]/60">{t("instructor.diagnostics.createModal.noLimitHint")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isRequired}
                            onChange={(e) => setIsRequired(e.target.checked)}
                            className="h-4 w-4 rounded border-[#3A3A3A]/10"
                        />
                        <span className="text-sm text-[#3A3A3A]">{t("instructor.diagnostics.createModal.required")}</span>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="mt-6 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-[#3A3A3A]/20 bg-white px-4 py-2 text-sm font-medium text-[#3A3A3A] hover:bg-[#FCFCFC]"
                        >
                            {t("instructor.diagnostics.createModal.cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="flex-1 rounded-xl bg-[#F47822] px-4 py-2 text-sm font-bold text-white hover:bg-[#df6817] disabled:opacity-50"
                        >
                            {saving ? t("instructor.diagnostics.createModal.creating") : t("instructor.diagnostics.createModal.create")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const ACTION_TYPES = ["inspect", "scan", "measure", "test", "identify", "diagnose", "repair"] as const;

const STATUS_CHIP: Record<string, string> = {
    draft: "bg-[#3A3A3A]/[.06] text-[#3A3A3A]/60",
    published: "bg-emerald-50 text-emerald-700",
    archived: "bg-red-50 text-red-600",
};

function ScenarioEditor({
    scenarioId,
    onClose,
    onChanged,
    onOpenScenario,
}: {
    scenarioId: string;
    onClose: () => void;
    onChanged: () => void;
    onOpenScenario: (id: string) => void;
}) {
    const { t } = useTranslation();
    const statusLabel = (status: string) => {
        switch (status) {
            case "published":
                return t("instructor.diagnostics.status.published");
            case "archived":
                return t("instructor.diagnostics.status.archived");
            default:
                return t("instructor.diagnostics.status.draft");
        }
    };
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);
    const [savingDetails, setSavingDetails] = useState(false);
    const [expandedStep, setExpandedStep] = useState<string | null>(null);
    const [showAddStep, setShowAddStep] = useState(false);
    const [showAddCriterion, setShowAddCriterion] = useState(false);
    const [showAddHint, setShowAddHint] = useState(false);
    const [criterionDraft, setCriterionDraft] = useState({
        key: "",
        title: "",
        points: 10,
        evaluation_type: "boolean",
        step_id: "",
        rules: "",
    });
    const [hintDraft, setHintDraft] = useState({
        level: 1,
        title: "",
        content: "",
        penalty_points: 5,
        diagnostic_scenario_step_id: "",
    });

    const detail = useQuery({
        queryKey: ["instructor", "diagnostics", "scenario", scenarioId],
        queryFn: () => getInstructorDiagnosticScenario(scenarioId),
    });

    const vehicles = useQuery({
        queryKey: ["instructor", "simulator", "vehicles"],
        queryFn: () => simulatorBuilderApi.vehicles(),
        staleTime: 60_000,
        retry: 1,
    });

    const scenario = detail.data;
    const isDraft = scenario?.status === "draft";

    const [draft, setDraft] = useState({
        title: "",
        description: "",
        passing_score: 70,
        time_limit: "",
        is_required: false,
        customer_complaint: "",
        fault_codes: "",
        system_tag: "",
        data_pack_id: "",
        max_hints: 3,
    });
    const [draftLoadedFor, setDraftLoadedFor] = useState<string | null>(null);
    if (scenario && draftLoadedFor !== scenario.id) {
        setDraft({
            title: scenario.title ?? "",
            description: scenario.description ?? "",
            passing_score: scenario.passing_score ?? 70,
            time_limit: scenario.time_limit?.toString() ?? "",
            is_required: scenario.is_required ?? false,
            customer_complaint: scenario.customer_complaint ?? "",
            fault_codes: (scenario.fault_codes ?? []).join(", "),
            system_tag: scenario.system_tag ?? "",
            data_pack_id: scenario.data_pack_id ?? "",
            max_hints: scenario.max_hints ?? 3,
        });
        setDraftLoadedFor(scenario.id);
    }

    // Variant catalog for vehicle picker (packs loaded per selected variant).
    const variantOptions: { id: string; label: string }[] = [];
    for (const make of (vehicles.data ?? []) as SimCatalogMake[]) {
        for (const model of make.models ?? []) {
            for (const variant of model.variants ?? []) {
                variantOptions.push({
                    id: variant.id,
                    label: `${make.name} ${model.name} ${variant.name}${variant.engine_code ? ` · ${variant.engine_code}` : ""}`,
                });
            }
        }
    }

    const [selectedVariantId, setSelectedVariantId] = useState<string>("");

    const packs = useQuery({
        queryKey: ["instructor", "simulator", "packs", selectedVariantId],
        queryFn: () => simulatorBuilderApi.packs(selectedVariantId),
        enabled: selectedVariantId !== "",
        staleTime: 30_000,
        retry: 1,
    });

    const publishedPackOptions = ((packs.data ?? []) as SimFaultPack[])
        .filter((pack) => pack.status === "published")
        .map((pack) => ({
            id: pack.id,
            label: `${pack.code} · ${pack.version}`,
        }));

    const reload = async () => {
        await queryClient.invalidateQueries({ queryKey: ["instructor", "diagnostics", "scenario", scenarioId] });
        onChanged();
    };

    const fail = (cause: unknown, fallback: string) =>
        setError(cause instanceof Error ? cause.message : fallback);

    const saveDetails = async () => {
        if (!scenario) return;
        setError(null);
        setSavingDetails(true);
        try {
            const faultCodes = draft.fault_codes
                .split(",")
                .map((code) => code.trim())
                .filter(Boolean);
            await updateInstructorDiagnosticScenario(scenario.id, {
                title: draft.title.trim(),
                description: draft.description.trim() || null,
                customer_complaint: draft.customer_complaint.trim() || null,
                fault_codes: faultCodes,
                system_tag: draft.system_tag.trim() || null,
                data_pack_id: draft.data_pack_id || null,
                passing_score: Number(draft.passing_score),
                time_limit: draft.time_limit === "" ? null : Number(draft.time_limit),
                max_hints: Number(draft.max_hints) || 0,
                is_required: draft.is_required,
            });
            await reload();
        } catch (cause) {
            fail(cause, t("instructor.diagnostics.editor.saveDetailsFailed"));
        } finally {
            setSavingDetails(false);
        }
    };

    const saveCriterion = async () => {
        if (!scenario || !criterionDraft.key.trim() || !criterionDraft.title.trim()) return;
        setError(null);
        try {
            let rules: Record<string, unknown> | null = null;
            if (criterionDraft.rules.trim()) {
                try {
                    rules = JSON.parse(criterionDraft.rules) as Record<string, unknown>;
                } catch {
                    setError("Invalid rules JSON");
                    return;
                }
            }
            await createInstructorDiagnosticCriterion(scenario.id, {
                key: criterionDraft.key.trim(),
                title: criterionDraft.title.trim(),
                points: Number(criterionDraft.points) || 1,
                evaluation_type: criterionDraft.evaluation_type,
                step_id: criterionDraft.step_id || null,
                rules,
            });
            setShowAddCriterion(false);
            setCriterionDraft({ key: "", title: "", points: 10, evaluation_type: "boolean", step_id: "", rules: "" });
            await reload();
        } catch (cause) {
            fail(cause, t("instructor.diagnostics.editor.saveCriterionFailed"));
        }
    };

    const saveHint = async () => {
        if (!scenario || !hintDraft.content.trim()) return;
        setError(null);
        try {
            await createInstructorDiagnosticHint(scenario.id, {
                content: hintDraft.content.trim(),
                level: Number(hintDraft.level) || 1,
                title: hintDraft.title.trim() || null,
                penalty_points: Number(hintDraft.penalty_points) || 0,
                diagnostic_scenario_step_id: hintDraft.diagnostic_scenario_step_id || null,
            });
            setShowAddHint(false);
            setHintDraft({ level: 1, title: "", content: "", penalty_points: 5, diagnostic_scenario_step_id: "" });
            await reload();
        } catch (cause) {
            fail(cause, t("instructor.diagnostics.editor.saveHintFailed"));
        }
    };

    const removeCriterion = async (id: string) => {
        setError(null);
        try {
            await deleteInstructorDiagnosticCriterion(id);
            await reload();
        } catch (cause) {
            fail(cause, t("instructor.diagnostics.editor.deleteCriterionFailed"));
        }
    };

    const removeHint = async (id: string) => {
        setError(null);
        try {
            await deleteInstructorDiagnosticHint(id);
            await reload();
        } catch (cause) {
            fail(cause, t("instructor.diagnostics.editor.deleteHintFailed"));
        }
    };

    const moveStep = async (index: number, direction: -1 | 1) => {
        const steps = scenario?.steps ?? [];
        const next = index + direction;
        if (next < 0 || next >= steps.length) return;
        const ids = steps.map((s) => s.id);
        [ids[index], ids[next]] = [ids[next], ids[index]];
        setError(null);
        try {
            await reorderInstructorDiagnosticSteps(scenario!.id, ids);
            await reload();
        } catch (cause) {
            fail(cause, t("instructor.diagnostics.editor.reorderFailed"));
        }
    };

    const removeStep = async (stepId: string, title: string) => {
        if (!confirm(t("instructor.diagnostics.editor.deleteStepConfirm", { title }))) return;
        setError(null);
        try {
            await deleteInstructorDiagnosticStep(stepId);
            await reload();
        } catch (cause) {
            fail(cause, t("instructor.diagnostics.editor.deleteStepFailed"));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
            <div className="flex h-full w-full max-w-3xl flex-col bg-[#F8F7F6] shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-[#3A3A3A]/10 bg-white px-6 py-5">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                            {scenario?.version != null
                                ? t("instructor.diagnostics.editor.eyebrow", { version: scenario.version })
                                : t("instructor.diagnostics.editor.eyebrowNoVersion")}
                        </p>
                        <h2 className="mt-1 truncate text-xl font-bold text-[#3A3A3A]">
                            {detail.isLoading ? t("instructor.diagnostics.editor.loadingTitle") : (scenario?.title ?? t("instructor.diagnostics.editor.titleFallback"))}
                        </h2>
                        {scenario && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#3A3A3A]/55">
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_CHIP[scenario.status] ?? STATUS_CHIP.draft}`}>
                                    {statusLabel(scenario.status)}
                                </span>
                                {scenario.course && <span>{scenario.course.title}</span>}
                                <span>{t("instructor.diagnostics.editor.stepsCount", { count: scenario.steps?.length ?? 0 })}</span>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("instructor.diagnostics.editor.closeAria")}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#3A3A3A]/10 text-[#3A3A3A]/60 hover:bg-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                    {error && (
                        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                            {error}
                        </p>
                    )}
                    {detail.isLoading ? (
                        <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#3A3A3A]/50">{t("instructor.diagnostics.editor.loadingScenario")}</p>
                    ) : detail.isError || !scenario ? (
                        <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                            {t("instructor.diagnostics.editor.loadFailed")}
                        </p>
                    ) : (
                        <>
                            {!isDraft && (
                                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    {t("instructor.diagnostics.editor.immutableNote")}
                                </p>
                            )}

                            <section className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-5">
                                <h3 className="text-sm font-black uppercase tracking-wide text-[#3A3A3A]/60">{t("instructor.diagnostics.editor.details")}</h3>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <label className="block text-xs font-bold text-[#3A3A3A] sm:col-span-2">
                                        {t("instructor.diagnostics.editor.titleLabel")}
                                        <input
                                            value={draft.title}
                                            disabled={!isDraft}
                                            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                                            className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-sm font-normal outline-none focus:border-[#F47822] disabled:opacity-60"
                                        />
                                    </label>
                                    <label className="block text-xs font-bold text-[#3A3A3A] sm:col-span-2">
                                        {t("instructor.diagnostics.editor.descriptionLabel")}
                                        <textarea
                                            value={draft.description}
                                            disabled={!isDraft}
                                            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                                            rows={3}
                                            className="mt-1.5 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#F47822] disabled:opacity-60"
                                        />
                                    </label>
                                    <label className="block text-xs font-bold text-[#3A3A3A]">
                                        {t("instructor.diagnostics.editor.passingScoreLabel")}
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={draft.passing_score}
                                            disabled={!isDraft}
                                            onChange={(e) => setDraft((d) => ({ ...d, passing_score: Number(e.target.value) }))}
                                            className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-sm font-normal outline-none focus:border-[#F47822] disabled:opacity-60"
                                        />
                                    </label>
                                    <label className="block text-xs font-bold text-[#3A3A3A]">
                                        {t("instructor.diagnostics.editor.timeLimitLabel")}
                                        <input
                                            type="number"
                                            min={1}
                                            value={draft.time_limit}
                                            disabled={!isDraft}
                                            onChange={(e) => setDraft((d) => ({ ...d, time_limit: e.target.value }))}
                                            className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-sm font-normal outline-none focus:border-[#F47822] disabled:opacity-60"
                                        />
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-bold text-[#3A3A3A] sm:col-span-2">
                                        <input
                                            type="checkbox"
                                            checked={draft.is_required}
                                            disabled={!isDraft}
                                            onChange={(e) => setDraft((d) => ({ ...d, is_required: e.target.checked }))}
                                            className="h-4 w-4 accent-[#F47822]"
                                        />
                                        {t("instructor.diagnostics.editor.requiredForCompletion")}
                                    </label>
                                </div>

                                {/* Vehicle & fault */}
                                <div className="mt-5 rounded-2xl border border-[#3A3A3A]/10 bg-[#FCFCFC] p-4">
                                    <h4 className="text-xs font-black uppercase tracking-wide text-[#3A3A3A]/55">
                                        {t("instructor.diagnostics.editor.vehicleSection")}
                                    </h4>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                        <label className="block text-xs font-bold text-[#3A3A3A] sm:col-span-2">
                                            {t("instructor.diagnostics.editor.vehicleLabel")}
                                            <select
                                                value={selectedVariantId}
                                                disabled={!isDraft}
                                                onChange={(e) => {
                                                    setSelectedVariantId(e.target.value);
                                                    setDraft((d) => ({ ...d, data_pack_id: "" }));
                                                }}
                                                className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-2 text-sm disabled:opacity-60"
                                            >
                                                <option value="">
                                                    {scenario?.vehicle?.label ?? t("instructor.diagnostics.editor.vehicleNone")}
                                                </option>
                                                {variantOptions.map((opt) => (
                                                    <option key={opt.id} value={opt.id}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {vehicles.isError && (
                                                <p className="mt-1 text-xs text-red-600">{t("instructor.diagnostics.editor.vehicleLoadFailed")}</p>
                                            )}
                                        </label>
                                        <label className="block text-xs font-bold text-[#3A3A3A] sm:col-span-2">
                                            {t("instructor.diagnostics.editor.vehicleLabel")} · pack
                                            <select
                                                value={draft.data_pack_id}
                                                disabled={!isDraft || selectedVariantId === ""}
                                                onChange={(e) => setDraft((d) => ({ ...d, data_pack_id: e.target.value }))}
                                                className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-2 text-sm disabled:opacity-60"
                                            >
                                                <option value="">
                                                    {scenario?.data_pack_id
                                                        ? `${t("instructor.diagnostics.editor.vehicleLabel")} · ${scenario.data_pack_id.slice(0, 8)}`
                                                        : t("instructor.diagnostics.editor.vehicleNone")}
                                                </option>
                                                {publishedPackOptions.map((opt) => (
                                                    <option key={opt.id} value={opt.id}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="block text-xs font-bold text-[#3A3A3A] sm:col-span-2">
                                            {t("instructor.diagnostics.editor.complaintLabel")}
                                            <textarea
                                                value={draft.customer_complaint}
                                                disabled={!isDraft}
                                                onChange={(e) => setDraft((d) => ({ ...d, customer_complaint: e.target.value }))}
                                                rows={2}
                                                placeholder={t("instructor.diagnostics.editor.complaintPh")}
                                                className="mt-1.5 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[#F47822] disabled:opacity-60"
                                            />
                                        </label>
                                        <label className="block text-xs font-bold text-[#3A3A3A]">
                                            {t("instructor.diagnostics.editor.faultCodesLabel")}
                                            <input
                                                value={draft.fault_codes}
                                                disabled={!isDraft}
                                                onChange={(e) => setDraft((d) => ({ ...d, fault_codes: e.target.value }))}
                                                placeholder={t("instructor.diagnostics.editor.faultCodesPh")}
                                                className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 font-mono text-sm outline-none focus:border-[#F47822] disabled:opacity-60"
                                            />
                                        </label>
                                        <label className="block text-xs font-bold text-[#3A3A3A]">
                                            {t("instructor.diagnostics.editor.systemTagLabel")}
                                            <input
                                                value={draft.system_tag}
                                                disabled={!isDraft}
                                                onChange={(e) => setDraft((d) => ({ ...d, system_tag: e.target.value }))}
                                                placeholder={t("instructor.diagnostics.editor.systemTagPh")}
                                                className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm outline-none focus:border-[#F47822] disabled:opacity-60"
                                            />
                                        </label>
                                        <label className="block text-xs font-bold text-[#3A3A3A]">
                                            {t("instructor.diagnostics.editor.maxHintsLabel")}
                                            <input
                                                type="number"
                                                min={0}
                                                max={10}
                                                value={draft.max_hints}
                                                disabled={!isDraft}
                                                onChange={(e) => setDraft((d) => ({ ...d, max_hints: Number(e.target.value) }))}
                                                className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm outline-none focus:border-[#F47822] disabled:opacity-60"
                                            />
                                        </label>
                                    </div>
                                </div>
                                {isDraft && (
                                    <button
                                        type="button"
                                        onClick={() => void saveDetails()}
                                        disabled={savingDetails || !draft.title.trim()}
                                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-black text-white hover:bg-[#df6817] disabled:opacity-50"
                                    >
                                        <Save className="h-3.5 w-3.5" /> {savingDetails ? t("instructor.diagnostics.editor.saving") : t("instructor.diagnostics.editor.saveDetails")}
                                    </button>
                                )}
                            </section>

                            <section className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-wide text-[#3A3A3A]/60">
                                        {t("instructor.diagnostics.editor.stepsTitle", { count: scenario.steps?.length ?? 0 })}
                                    </h3>
                                    {isDraft && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddStep((v) => !v)}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#3A3A3A] px-3.5 py-2 text-xs font-black text-white hover:bg-black"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> {t("instructor.diagnostics.editor.addStep")}
                                        </button>
                                    )}
                                </div>
                                {isDraft && showAddStep && (
                                    <StepForm
                                        key="new"
                                        initial={null}
                                        onCancel={() => setShowAddStep(false)}
                                        onSaved={async (data) => {
                                            setError(null);
                                            try {
                                                await createInstructorDiagnosticStep(scenario.id, data);
                                                setShowAddStep(false);
                                                await reload();
                                            } catch (cause) {
                                                fail(cause, t("instructor.diagnostics.editor.createStepFailed"));
                                            }
                                        }}
                                    />
                                )}
                                <ul className="mt-4 space-y-2">
                                    {(scenario.steps ?? []).map((step, index) => (
                                        <li key={step.id} className="rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC]">
                                            <div className="flex items-center gap-2 px-3.5 py-3">
                                                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#3A3A3A] font-mono text-[11px] font-black text-white">
                                                    {step.position ?? index + 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                                                    className="min-w-0 flex-1 truncate text-start text-sm font-bold text-[#3A3A3A]"
                                                >
                                                    {step.title}
                                                    <span className="ms-2 rounded-full bg-[#F47822]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#F47822]">
                                                        {step.action_type}
                                                    </span>
                                                    {step.tool ? (
                                                        <span className="ms-1.5 rounded-full border border-[#3A3A3A]/10 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-[#3A3A3A]/55">
                                                            {step.tool}
                                                        </span>
                                                    ) : null}
                                                    {step.is_terminal && (
                                                        <span className="ms-1.5 rounded-full bg-[#3A3A3A]/[.06] px-2 py-0.5 text-[10px] font-bold text-[#3A3A3A]/55">
                                                            {t("instructor.diagnostics.editor.terminal")}
                                                        </span>
                                                    )}
                                                </button>
                                                {isDraft && (
                                                    <span className="flex shrink-0 items-center gap-1">
                                                        <button
                                                            type="button"
                                                            disabled={index === 0}
                                                            onClick={() => void moveStep(index, -1)}
                                                            aria-label={t("instructor.diagnostics.editor.moveUp")}
                                                            className="grid h-8 w-8 place-items-center rounded-lg border border-[#3A3A3A]/10 text-[#3A3A3A]/60 hover:text-[#3A3A3A] disabled:opacity-30"
                                                        >
                                                            ↑
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={index === (scenario.steps?.length ?? 1) - 1}
                                                            onClick={() => void moveStep(index, 1)}
                                                            aria-label={t("instructor.diagnostics.editor.moveDown")}
                                                            className="grid h-8 w-8 place-items-center rounded-lg border border-[#3A3A3A]/10 text-[#3A3A3A]/60 hover:text-[#3A3A3A] disabled:opacity-30"
                                                        >
                                                            ↓
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => void removeStep(step.id, step.title)}
                                                            aria-label={t("instructor.diagnostics.editor.deleteStepAria", { title: step.title })}
                                                            className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </span>
                                                )}
                                            </div>
                                            {expandedStep === step.id && (
                                                <StepForm
                                                    key={step.id}
                                                    initial={step}
                                                    readOnly={!isDraft}
                                                    onCancel={() => setExpandedStep(null)}
                                                    onSaved={async (data) => {
                                                        setError(null);
                                                        try {
                                                            await updateInstructorDiagnosticStep(step.id, data);
                                                            setExpandedStep(null);
                                                            await reload();
                                                        } catch (cause) {
                                                            fail(cause, t("instructor.diagnostics.editor.saveStepFailed"));
                                                        }
                                                    }}
                                                />
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                {(scenario.steps ?? []).length === 0 && (
                                    <p className="mt-3 rounded-xl border border-dashed border-[#3A3A3A]/15 p-5 text-center text-xs text-[#3A3A3A]/50">
                                        {t("instructor.diagnostics.editor.noSteps")}
                                    </p>
                                )}
                            </section>

                            {/* Scoring criteria */}
                            <section className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-5">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-sm font-black uppercase tracking-wide text-[#3A3A3A]/60">
                                        {t("instructor.diagnostics.editor.criteriaSection", {
                                            count: scenario.scoring_criteria?.length ?? 0,
                                        })}
                                    </h3>
                                    {isDraft && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddCriterion((v) => !v)}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#3A3A3A] px-3.5 py-2 text-xs font-black text-white hover:bg-black"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> {t("instructor.diagnostics.editor.addCriterion")}
                                        </button>
                                    )}
                                </div>
                                {!isDraft && (
                                    <p className="mt-2 text-xs text-[#3A3A3A]/50">{t("instructor.diagnostics.editor.draftOnlyCriteria")}</p>
                                )}
                                {isDraft && showAddCriterion && (
                                    <div className="mt-3 grid gap-2 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] p-3 sm:grid-cols-2">
                                        <label className="block text-xs font-bold text-[#3A3A3A]">
                                            {t("instructor.diagnostics.editor.criterionKey")}
                                            <input
                                                value={criterionDraft.key}
                                                onChange={(e) => setCriterionDraft((d) => ({ ...d, key: e.target.value }))}
                                                className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 text-xs outline-none focus:border-[#F47822]"
                                            />
                                        </label>
                                        <label className="block text-xs font-bold text-[#3A3A3A]">
                                            {t("instructor.diagnostics.editor.criterionTitle")}
                                            <input
                                                value={criterionDraft.title}
                                                onChange={(e) => setCriterionDraft((d) => ({ ...d, title: e.target.value }))}
                                                className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 text-xs outline-none focus:border-[#F47822]"
                                            />
                                        </label>
                                        <label className="block text-xs font-bold text-[#3A3A3A]">
                                            {t("instructor.diagnostics.editor.criterionPoints")}
                                            <input
                                                type="number"
                                                min={1}
                                                max={100}
                                                value={criterionDraft.points}
                                                onChange={(e) => setCriterionDraft((d) => ({ ...d, points: Number(e.target.value) }))}
                                                className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 text-xs outline-none focus:border-[#F47822]"
                                            />
                                        </label>
                                        <label className="block text-xs font-bold text-[#3A3A3A]">
                                            {t("instructor.diagnostics.editor.criterionEval")}
                                            <select
                                                value={criterionDraft.evaluation_type}
                                                onChange={(e) => setCriterionDraft((d) => ({ ...d, evaluation_type: e.target.value }))}
                                                className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2 text-xs"
                                            >
                                                <option value="boolean">boolean</option>
                                                <option value="contains">contains</option>
                                                <option value="numeric_range">numeric_range</option>
                                                <option value="set_match">set_match</option>
                                            </select>
                                        </label>
                                        <label className="block text-xs font-bold text-[#3A3A3A]">
                                            {t("instructor.diagnostics.editor.hintStep")}
                                            <select
                                                value={criterionDraft.step_id}
                                                onChange={(e) => setCriterionDraft((d) => ({ ...d, step_id: e.target.value }))}
                                                className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2 text-xs"
                                            >
                                                <option value="">{t("instructor.diagnostics.editor.hintStepGlobal")}</option>
                                                {(scenario.steps ?? []).map((s) => (
                                                    <option key={s.id} value={s.id}>{s.title}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="block text-xs font-bold text-[#3A3A3A] sm:col-span-2">
                                            {t("instructor.diagnostics.editor.criterionRules")}
                                            <input
                                                value={criterionDraft.rules}
                                                onChange={(e) => setCriterionDraft((d) => ({ ...d, rules: e.target.value }))}
                                                placeholder='{"expected": "P2118"}'
                                                className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 font-mono text-xs outline-none focus:border-[#F47822]"
                                            />
                                        </label>
                                        <div className="sm:col-span-2 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => void saveCriterion()}
                                                disabled={!criterionDraft.key.trim() || !criterionDraft.title.trim()}
                                                className="rounded-lg bg-[#F47822] px-3.5 py-1.5 text-xs font-black text-white hover:bg-[#df6817] disabled:opacity-50"
                                            >
                                                {t("instructor.diagnostics.editor.addCriterion")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowAddCriterion(false)}
                                                className="rounded-lg border border-[#3A3A3A]/10 px-3.5 py-1.5 text-xs font-bold text-[#3A3A3A]/60"
                                            >
                                                {t("instructor.diagnostics.stepForm.cancel")}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <ul className="mt-3 space-y-2">
                                    {(scenario.scoring_criteria ?? []).map((criterion) => (
                                        <li key={criterion.id} className="flex items-center gap-3 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 py-2.5">
                                            <span className="rounded-full bg-[#F47822]/10 px-2 py-0.5 font-mono text-[10px] font-black text-[#F47822]">
                                                {criterion.points}p
                                            </span>
                                            <span className="min-w-0 flex-1 truncate text-xs font-bold text-[#3A3A3A]">
                                                {criterion.title}
                                                <span className="ms-2 font-mono text-[10px] text-[#3A3A3A]/45">{criterion.key}</span>
                                            </span>
                                            <span className="shrink-0 rounded-full bg-[#3A3A3A]/[.06] px-2 py-0.5 font-mono text-[10px] text-[#3A3A3A]/55">
                                                {criterion.evaluation_type}
                                            </span>
                                            {isDraft && (
                                                <button
                                                    type="button"
                                                    onClick={() => void removeCriterion(criterion.id)}
                                                    aria-label={t("instructor.diagnostics.editor.deleteCriterion")}
                                                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                {(scenario.scoring_criteria ?? []).length === 0 && (
                                    <p className="mt-3 rounded-xl border border-dashed border-[#3A3A3A]/15 p-4 text-center text-xs text-[#3A3A3A]/50">
                                        {t("instructor.diagnostics.editor.noCriteria")}
                                    </p>
                                )}
                            </section>

                            {/* Hints */}
                            <section className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-5">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-sm font-black uppercase tracking-wide text-[#3A3A3A]/60">
                                        {t("instructor.diagnostics.editor.hintsSection", {
                                            count: scenario.hints?.length ?? 0,
                                        })}
                                    </h3>
                                    {isDraft && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddHint((v) => !v)}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#3A3A3A] px-3.5 py-2 text-xs font-black text-white hover:bg-black"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> {t("instructor.diagnostics.editor.addHint")}
                                        </button>
                                    )}
                                </div>
                                {!isDraft && (
                                    <p className="mt-2 text-xs text-[#3A3A3A]/50">{t("instructor.diagnostics.editor.draftOnlyHints")}</p>
                                )}
                                {isDraft && showAddHint && (
                                    <div className="mt-3 grid gap-2 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] p-3 sm:grid-cols-2">
                                        <label className="block text-xs font-bold text-[#3A3A3A]">
                                            {t("instructor.diagnostics.editor.hintLevel")}
                                            <select
                                                value={hintDraft.level}
                                                onChange={(e) => setHintDraft((d) => ({ ...d, level: Number(e.target.value) }))}
                                                className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2 text-xs"
                                            >
                                                <option value={1}>1</option>
                                                <option value={2}>2</option>
                                                <option value={3}>3</option>
                                            </select>
                                        </label>
                                        <label className="block text-xs font-bold text-[#3A3A3A]">
                                            {t("instructor.diagnostics.editor.hintPenalty")}
                                            <input
                                                type="number"
                                                min={0}
                                                max={50}
                                                value={hintDraft.penalty_points}
                                                onChange={(e) => setHintDraft((d) => ({ ...d, penalty_points: Number(e.target.value) }))}
                                                className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 text-xs outline-none focus:border-[#F47822]"
                                            />
                                        </label>
                                        <label className="block text-xs font-bold text-[#3A3A3A]">
                                            {t("instructor.diagnostics.editor.hintStep")}
                                            <select
                                                value={hintDraft.diagnostic_scenario_step_id}
                                                onChange={(e) => setHintDraft((d) => ({ ...d, diagnostic_scenario_step_id: e.target.value }))}
                                                className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2 text-xs"
                                            >
                                                <option value="">{t("instructor.diagnostics.editor.hintStepGlobal")}</option>
                                                {(scenario.steps ?? []).map((s) => (
                                                    <option key={s.id} value={s.id}>{s.title}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="block text-xs font-bold text-[#3A3A3A]">
                                            {t("instructor.diagnostics.editor.criterionTitle")}
                                            <input
                                                value={hintDraft.title}
                                                onChange={(e) => setHintDraft((d) => ({ ...d, title: e.target.value }))}
                                                className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 text-xs outline-none focus:border-[#F47822]"
                                            />
                                        </label>
                                        <label className="block text-xs font-bold text-[#3A3A3A] sm:col-span-2">
                                            {t("instructor.diagnostics.editor.hintText")}
                                            <textarea
                                                value={hintDraft.content}
                                                onChange={(e) => setHintDraft((d) => ({ ...d, content: e.target.value }))}
                                                rows={2}
                                                className="mt-1 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 py-2 text-xs outline-none focus:border-[#F47822]"
                                            />
                                        </label>
                                        <div className="sm:col-span-2 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => void saveHint()}
                                                disabled={!hintDraft.content.trim()}
                                                className="rounded-lg bg-[#F47822] px-3.5 py-1.5 text-xs font-black text-white hover:bg-[#df6817] disabled:opacity-50"
                                            >
                                                {t("instructor.diagnostics.editor.addHint")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowAddHint(false)}
                                                className="rounded-lg border border-[#3A3A3A]/10 px-3.5 py-1.5 text-xs font-bold text-[#3A3A3A]/60"
                                            >
                                                {t("instructor.diagnostics.stepForm.cancel")}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <ul className="mt-3 space-y-2">
                                    {(scenario.hints ?? []).map((hint) => (
                                        <li key={hint.id} className="flex items-center gap-3 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 py-2.5">
                                            <span className="rounded-full bg-[#3A3A3A] px-2 py-0.5 font-mono text-[10px] font-black text-white">
                                                L{hint.level}
                                            </span>
                                            <span className="min-w-0 flex-1 truncate text-xs font-bold text-[#3A3A3A]">
                                                {hint.title || hint.content.slice(0, 60)}
                                            </span>
                                            <span className="shrink-0 rounded-full bg-[#F47822]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#F47822]">
                                                −{hint.penalty_points}
                                            </span>
                                            {isDraft && (
                                                <button
                                                    type="button"
                                                    onClick={() => void removeHint(hint.id)}
                                                    aria-label={t("instructor.diagnostics.editor.deleteHint")}
                                                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                {(scenario.hints ?? []).length === 0 && (
                                    <p className="mt-3 rounded-xl border border-dashed border-[#3A3A3A]/15 p-4 text-center text-xs text-[#3A3A3A]/50">
                                        {t("instructor.diagnostics.editor.noHints")}
                                    </p>
                                )}
                            </section>

                            <section className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-5">
                                <h3 className="text-sm font-black uppercase tracking-wide text-[#3A3A3A]/60">{t("instructor.diagnostics.editor.lifecycle")}</h3>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {scenario.status !== "published" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void (async () => {
                                                    setError(null);
                                                    try {
                                                        await publishInstructorDiagnosticScenario(scenario.id);
                                                        await reload();
                                                    } catch (cause) {
                                                        fail(cause, t("instructor.diagnostics.editor.publishFailed"));
                                                    }
                                                })()
                                            }
                                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
                                        >
                                            {t("instructor.diagnostics.editor.publish")}
                                        </button>
                                    )}
                                    {scenario.status === "published" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void (async () => {
                                                    setError(null);
                                                    try {
                                                        await unpublishInstructorDiagnosticScenario(scenario.id);
                                                        await reload();
                                                    } catch (cause) {
                                                        fail(cause, t("instructor.diagnostics.editor.unpublishFailed"));
                                                    }
                                                })()
                                            }
                                            className="rounded-xl border border-[#3A3A3A]/10 px-4 py-2 text-xs font-black text-[#3A3A3A] hover:bg-[#FCFCFC]"
                                        >
                                            {t("instructor.diagnostics.editor.unpublish")}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            void (async () => {
                                                setError(null);
                                                try {
                                                    const forked = await forkInstructorDiagnosticScenario(scenario.id);
                                                    await reload();
                                                    onOpenScenario(forked.id);
                                                } catch (cause) {
                                                    fail(cause, t("instructor.diagnostics.editor.forkFailed"));
                                                }
                                            })()
                                        }
                                        className="rounded-xl border border-[#3A3A3A]/10 px-4 py-2 text-xs font-black text-[#3A3A3A]/70 hover:text-[#3A3A3A]"
                                    >
                                        {t("instructor.diagnostics.editor.forkNewVersion")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!confirm(t("instructor.diagnostics.archiveConfirm"))) return;
                                            void (async () => {
                                                setError(null);
                                                try {
                                                    await archiveInstructorDiagnosticScenario(scenario.id);
                                                    await reload();
                                                    onClose();
                                                } catch (cause) {
                                                    fail(cause, t("instructor.diagnostics.editor.archiveFailed"));
                                                }
                                            })();
                                        }}
                                        className="rounded-xl border border-red-200 px-4 py-2 text-xs font-black text-red-600 hover:bg-red-50"
                                    >
                                        {t("instructor.diagnostics.editor.archive")}
                                    </button>
                                </div>
                            </section>

                            {(scenario.recent_attempts ?? []).length > 0 && (
                                <section className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-5">
                                    <h3 className="text-sm font-black uppercase tracking-wide text-[#3A3A3A]/60">{t("instructor.diagnostics.editor.recentAttempts")}</h3>
                                    <ul className="mt-3 divide-y divide-[#3A3A3A]/[.06] text-sm">
                                        {(scenario.recent_attempts ?? []).slice(0, 5).map((attempt) => (
                                            <li key={attempt.id} className="flex items-center justify-between gap-3 py-2">
                                                <span className="min-w-0 truncate font-semibold text-[#3A3A3A]">
                                                    {attempt.student ?? attempt.id.slice(0, 8)}
                                                </span>
                                                <span className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] font-bold ${attempt.passed ? "bg-emerald-50 text-emerald-700" : "bg-[#3A3A3A]/[.06] text-[#3A3A3A]/60"}`}>
                                                    {attempt.score ?? "—"}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export function StepForm({
    initial,
    readOnly = false,
    onCancel,
    onSaved,
}: {
    initial: InstructorDiagnosticStep | null;
    readOnly?: boolean;
    onCancel: () => void;
    onSaved: (data: {
        title: string;
        description?: string | null;
        action_type: string;
        tool?: string | null;
        configuration?: Record<string, unknown> | null;
        evidence?: Record<string, unknown> | null;
        duration_seconds?: number | null;
        discipline?: string | null;
        is_required: boolean;
        is_terminal: boolean;
    }) => void;
}) {
    const { t } = useTranslation();
    const [title, setTitle] = useState(initial?.title ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [actionType, setActionType] = useState(initial?.action_type ?? "inspect");
    const [tool, setTool] = useState(initial?.tool ?? "");
    const [duration, setDuration] = useState(initial?.duration_seconds?.toString() ?? "");
    const [discipline, setDiscipline] = useState(initial?.discipline ?? "");
    const [isRequired, setIsRequired] = useState(initial?.is_required ?? true);
    const [isTerminal, setIsTerminal] = useState(initial?.is_terminal ?? false);

    const mmFromConfig = (() => {
        const raw = (initial?.configuration ?? {}) as Record<string, unknown>;
        const num = (v: unknown) => (v === undefined || v === null || v === "" ? "" : String(v));
        return {
            component_ref: typeof raw.component_ref === "string" ? raw.component_ref : "",
            required_mode: typeof raw.required_mode === "string" ? raw.required_mode : "",
            red_target: typeof raw.red_target === "string" ? raw.red_target : "",
            black_target: typeof raw.black_target === "string" ? raw.black_target : "",
            expected_min: num(raw.expected_min),
            expected_max: num(raw.expected_max),
            unit: typeof raw.unit === "string" ? raw.unit : "",
        };
    })();
    const [mmComponent, setMmComponent] = useState(mmFromConfig.component_ref);
    const [mmMode, setMmMode] = useState(mmFromConfig.required_mode);
    const [mmRed, setMmRed] = useState(mmFromConfig.red_target);
    const [mmBlack, setMmBlack] = useState(mmFromConfig.black_target);
    const [mmMin, setMmMin] = useState(mmFromConfig.expected_min);
    const [mmMax, setMmMax] = useState(mmFromConfig.expected_max);
    const [mmUnit, setMmUnit] = useState(mmFromConfig.unit);
    const MM_MODES = ["", "VDC", "VAC", "OHM", "MA", "A", "HZ"] as const;

    const initialEvidence = (() => {
        const raw = initial?.evidence;
        if (!raw) return [] as { key: string; value: string }[];
        if (Array.isArray(raw)) {
            return raw.flatMap((item) =>
                item && typeof item === "object" && "key" in item && "value" in item
                    ? [{ key: String((item as { key: unknown }).key), value: String((item as { value: unknown }).value) }]
                    : [],
            );
        }
        return Object.entries(raw).map(([key, value]) => ({ key, value: String(value) }));
    })();
    const [evidenceRows, setEvidenceRows] = useState<{ key: string; value: string }[]>(initialEvidence);

    const TOOLS = ["scanner", "multimeter", "oscilloscope", "location", "schematic"] as const;

    const buildEvidence = (): Record<string, unknown> | null => {
        const cleaned = evidenceRows
            .map((row) => ({ key: row.key.trim(), value: row.value.trim() }))
            .filter((row) => row.key !== "" || row.value !== "");
        if (cleaned.length === 0) return initial?.evidence ?? null;
        const asObject: Record<string, string> = {};
        for (const row of cleaned) {
            if (row.key) asObject[row.key] = row.value;
        }
        return asObject;
    };

    const buildConfiguration = (): Record<string, unknown> | null => {
        const base: Record<string, unknown> = { ...(initial?.configuration ?? {}) };
        // Drop stale multimeter keys so switching tools doesn't leave orphans.
        for (const k of ["component_ref", "required_mode", "red_target", "black_target", "expected_min", "expected_max", "unit"]) {
            delete base[k];
        }
        if (tool === "multimeter") {
            if (mmComponent.trim()) base.component_ref = mmComponent.trim();
            if (mmMode) base.required_mode = mmMode;
            if (mmRed.trim()) base.red_target = mmRed.trim();
            if (mmBlack.trim()) base.black_target = mmBlack.trim();
            if (mmMin.trim() !== "") base.expected_min = Number(mmMin);
            if (mmMax.trim() !== "") base.expected_max = Number(mmMax);
            if (mmUnit.trim()) base.unit = mmUnit.trim();
        }
        return Object.keys(base).length === 0 ? null : base;
    };

    return (
        <div className="border-t border-[#3A3A3A]/[.07] bg-white px-3.5 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-[#3A3A3A] sm:col-span-2">
                    {t("instructor.diagnostics.stepForm.titleLabel")}
                    <input
                        value={title}
                        disabled={readOnly}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t("instructor.diagnostics.stepForm.titlePh")}
                        className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-sm font-normal outline-none focus:border-[#F47822] disabled:opacity-60"
                    />
                </label>
                <label className="block text-xs font-bold text-[#3A3A3A] sm:col-span-2">
                    {t("instructor.diagnostics.stepForm.descriptionLabel")}
                    <textarea
                        value={description}
                        disabled={readOnly}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        placeholder={t("instructor.diagnostics.stepForm.descriptionPh")}
                        className="mt-1.5 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 py-2 text-sm font-normal outline-none focus:border-[#F47822] disabled:opacity-60"
                    />
                </label>
                <label className="block text-xs font-bold text-[#3A3A3A]">
                    {t("instructor.diagnostics.stepForm.actionType")}
                    <select
                        value={actionType}
                        disabled={readOnly}
                        onChange={(e) => setActionType(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-2 text-sm"
                    >
                        {ACTION_TYPES.map((kind) => (
                            <option key={kind} value={kind}>{kind}</option>
                        ))}
                    </select>
                </label>
                <label className="block text-xs font-bold text-[#3A3A3A]">
                    {t("instructor.diagnostics.stepForm.toolLabel")}
                    <select
                        value={tool}
                        disabled={readOnly}
                        onChange={(e) => setTool(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-2 text-sm"
                    >
                        <option value="">{t("instructor.diagnostics.stepForm.toolPh")}</option>
                        {TOOLS.map((key) => (
                            <option key={key} value={key}>{key}</option>
                        ))}
                    </select>
                </label>
                <label className="block text-xs font-bold text-[#3A3A3A]">
                    {t("instructor.diagnostics.stepForm.durationLabel")}
                    <input
                        type="number"
                        min={1}
                        value={duration}
                        disabled={readOnly}
                        onChange={(e) => setDuration(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-sm font-normal outline-none focus:border-[#F47822] disabled:opacity-60"
                    />
                </label>
                <label className="block text-xs font-bold text-[#3A3A3A]">
                    {t("instructor.diagnostics.stepForm.disciplineLabel")}
                    <select
                        value={discipline}
                        disabled={readOnly}
                        onChange={(e) => setDiscipline(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-2 text-sm"
                    >
                        <option value="">{t("instructor.diagnostics.stepForm.disciplineNone")}</option>
                        <option value="mechanical">{t("instructor.diagnostics.stepForm.disciplineMechanical")}</option>
                        <option value="electrical">{t("instructor.diagnostics.stepForm.disciplineElectrical")}</option>
                        <option value="both">{t("instructor.diagnostics.stepForm.disciplineBoth")}</option>
                    </select>
                </label>
                <div className="flex items-end gap-4 pb-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#3A3A3A]">
                        <input
                            type="checkbox"
                            checked={isRequired}
                            disabled={readOnly}
                            onChange={(e) => setIsRequired(e.target.checked)}
                            className="h-4 w-4 accent-[#F47822]"
                        />
                        {t("instructor.diagnostics.stepForm.required")}
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#3A3A3A]">
                        <input
                            type="checkbox"
                            checked={isTerminal}
                            disabled={readOnly}
                            onChange={(e) => setIsTerminal(e.target.checked)}
                            className="h-4 w-4 accent-[#F47822]"
                        />
                        {t("instructor.diagnostics.stepForm.terminal")}
                    </label>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] p-3">
                <p className="text-[11px] font-black uppercase tracking-wide text-[#3A3A3A]/50">
                    {t("instructor.diagnostics.stepForm.evidenceTitle")}
                </p>
                <div className="mt-2 space-y-2">
                    {evidenceRows.map((row, index) => (
                        <div key={index} className="flex gap-2">
                            <input
                                value={row.key}
                                disabled={readOnly}
                                onChange={(e) =>
                                    setEvidenceRows((rows) =>
                                        rows.map((r, i) => (i === index ? { ...r, key: e.target.value } : r)),
                                    )
                                }
                                placeholder={t("instructor.diagnostics.stepForm.evidenceKeyPh")}
                                className="h-9 w-1/3 rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 text-xs font-mono outline-none focus:border-[#F47822] disabled:opacity-60"
                            />
                            <input
                                value={row.value}
                                disabled={readOnly}
                                onChange={(e) =>
                                    setEvidenceRows((rows) =>
                                        rows.map((r, i) => (i === index ? { ...r, value: e.target.value } : r)),
                                    )
                                }
                                placeholder={t("instructor.diagnostics.stepForm.evidenceValuePh")}
                                className="h-9 flex-1 rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 text-xs outline-none focus:border-[#F47822] disabled:opacity-60"
                            />
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={() => setEvidenceRows((rows) => rows.filter((_, i) => i !== index))}
                                    aria-label={t("instructor.diagnostics.stepForm.evidenceRemove")}
                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                    {!readOnly && (
                        <button
                            type="button"
                            onClick={() => setEvidenceRows((rows) => [...rows, { key: "", value: "" }])}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#3A3A3A]/10 px-3 py-1.5 text-[11px] font-bold text-[#3A3A3A]/60 hover:text-[#3A3A3A]"
                        >
                            <Plus className="h-3 w-3" /> {t("instructor.diagnostics.stepForm.evidenceAdd")}
                        </button>
                    )}
                </div>
            </div>

            {tool === "multimeter" && (
                <div className="mt-3 rounded-xl border border-[#1F6AE1]/20 bg-[#FBFDFF] p-3">
                    <p className="text-[11px] font-black uppercase tracking-wide text-[#1F6AE1]">
                        {t("instructor.diagnostics.stepForm.mmTitle")}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#3A3A3A]/50">
                        {t("instructor.diagnostics.stepForm.mmHint")}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        <label className="block text-xs font-bold text-[#3A3A3A]">
                            {t("instructor.diagnostics.stepForm.mmComponent")}
                            <input
                                value={mmComponent}
                                disabled={readOnly}
                                onChange={(e) => setMmComponent(e.target.value)}
                                placeholder="A1"
                                dir="ltr"
                                className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 font-mono text-xs outline-none focus:border-[#F47822] disabled:opacity-60"
                            />
                        </label>
                        <label className="block text-xs font-bold text-[#3A3A3A]">
                            {t("instructor.diagnostics.stepForm.mmMode")}
                            <select
                                value={mmMode}
                                disabled={readOnly}
                                onChange={(e) => setMmMode(e.target.value)}
                                className="mt-1.5 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2 text-sm"
                            >
                                {MM_MODES.map((m) => (
                                    <option key={m || "none"} value={m}>
                                        {m || "—"}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-xs font-bold text-[#3A3A3A]">
                            {t("instructor.diagnostics.stepForm.mmUnit")}
                            <input
                                value={mmUnit}
                                disabled={readOnly}
                                onChange={(e) => setMmUnit(e.target.value)}
                                placeholder="V"
                                dir="ltr"
                                className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 font-mono text-xs outline-none focus:border-[#F47822] disabled:opacity-60"
                            />
                        </label>
                        <label className="block text-xs font-bold text-[#3A3A3A]">
                            {t("instructor.diagnostics.stepForm.mmRed")}
                            <input
                                value={mmRed}
                                disabled={readOnly}
                                onChange={(e) => setMmRed(e.target.value)}
                                placeholder="c1"
                                dir="ltr"
                                className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 font-mono text-xs outline-none focus:border-[#F47822] disabled:opacity-60"
                            />
                        </label>
                        <label className="block text-xs font-bold text-[#3A3A3A]">
                            {t("instructor.diagnostics.stepForm.mmBlack")}
                            <input
                                value={mmBlack}
                                disabled={readOnly}
                                onChange={(e) => setMmBlack(e.target.value)}
                                placeholder="gnd"
                                dir="ltr"
                                className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 font-mono text-xs outline-none focus:border-[#F47822] disabled:opacity-60"
                            />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="block text-xs font-bold text-[#3A3A3A]">
                                {t("instructor.diagnostics.stepForm.mmMin")}
                                <input
                                    type="number"
                                    step="any"
                                    value={mmMin}
                                    disabled={readOnly}
                                    onChange={(e) => setMmMin(e.target.value)}
                                    className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 font-mono text-xs outline-none focus:border-[#F47822] disabled:opacity-60"
                                />
                            </label>
                            <label className="block text-xs font-bold text-[#3A3A3A]">
                                {t("instructor.diagnostics.stepForm.mmMax")}
                                <input
                                    type="number"
                                    step="any"
                                    value={mmMax}
                                    disabled={readOnly}
                                    onChange={(e) => setMmMax(e.target.value)}
                                    className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 font-mono text-xs outline-none focus:border-[#F47822] disabled:opacity-60"
                                />
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {!readOnly && (
                <div className="mt-3 flex gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            onSaved({
                                title: title.trim(),
                                description: description.trim() || null,
                                action_type: actionType,
                                tool: tool || null,
                                configuration: buildConfiguration(),
                                evidence: buildEvidence(),
                                duration_seconds: duration === "" ? null : Number(duration),
                                discipline: discipline || null,
                                is_required: isRequired,
                                is_terminal: isTerminal,
                            })
                        }
                        disabled={!title.trim()}
                        className="rounded-xl bg-[#F47822] px-4 py-2 text-xs font-black text-white hover:bg-[#df6817] disabled:opacity-50"
                    >
                        {initial ? t("instructor.diagnostics.stepForm.saveStep") : t("instructor.diagnostics.stepForm.addStep")}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl border border-[#3A3A3A]/10 px-4 py-2 text-xs font-bold text-[#3A3A3A]/60"
                    >
                        {t("instructor.diagnostics.stepForm.cancel")}
                    </button>
                </div>
            )}
        </div>
    );
}
