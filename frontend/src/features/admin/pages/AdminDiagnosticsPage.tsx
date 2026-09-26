import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Stethoscope, X } from "lucide-react";

import { useTranslation } from "react-i18next";

import { adminApi } from "../api/adminApi";
import {
    AdminHeading,
    AdminPanel,
    ErrorAdminPage,
    LoadingAdminPage,
    PageControls,
    Status,
} from "../components/AdminUi";

export function AdminDiagnosticsPage() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const analytics = useQuery({
        queryKey: ["admin", "diagnostics", "analytics"],
        queryFn: () => adminApi.diagnosticAnalytics(),
    });

    const scenarios = useQuery({
        queryKey: ["admin", "diagnostics", search, status, page],
        queryFn: () => adminApi.diagnostics({ search, status, page }),
    });

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <AdminHeading
                eyebrow={t("admin.diagnostics.eyebrow")}
                title={t("admin.diagnostics.title")}
                description={t("admin.diagnostics.description")}
                action={
                    <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#d95d0d]"
                    >
                        <Plus className="h-4 w-4" /> {t("admin.diagnostics.newScenario")}
                    </button>
                }
            />

            {analytics.data && (
                <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40">{t("admin.diagnostics.stats.scenarios")}</p>
                        <p className="mt-1 text-2xl font-bold text-[#3A3A3A]">{analytics.data.total_scenarios}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40">{t("admin.diagnostics.stats.attempts")}</p>
                        <p className="mt-1 text-2xl font-bold text-[#3A3A3A]">{analytics.data.total_attempts}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40">{t("admin.diagnostics.stats.avgScore")}</p>
                        <p className="mt-1 text-2xl font-bold text-[#3A3A3A]">{analytics.data.avg_score !== null ? `${analytics.data.avg_score}%` : "—"}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40">{t("admin.diagnostics.stats.passRate")}</p>
                        <p className="mt-1 text-2xl font-bold text-[#3A3A3A]">{analytics.data.pass_rate !== null ? `${analytics.data.pass_rate}%` : "—"}</p>
                    </div>
                </div>
            )}

            <AdminPanel>
                <div className="flex flex-wrap gap-3">
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        placeholder={t("admin.diagnostics.searchPh")}
                        className="h-10 min-w-52 flex-1 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-sm outline-none focus:border-[#F47822]"
                    />
                    <select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setPage(1);
                        }}
                        className="h-10 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-sm outline-none focus:border-[#F47822]"
                    >
                        <option value="">{t("admin.diagnostics.filters.allStatuses")}</option>
                        <option value="draft">{t("admin.diagnostics.filters.draft")}</option>
                        <option value="published">{t("admin.diagnostics.filters.published")}</option>
                        <option value="archived">{t("admin.diagnostics.filters.archived")}</option>
                    </select>
                </div>

                {scenarios.isLoading && <LoadingAdminPage />}
                {scenarios.isError && <ErrorAdminPage onRetry={() => void scenarios.refetch()} />}

                {scenarios.data && (
                    <>
                        <div className="mt-4 divide-y divide-[#3A3A3A]/7">
                            {scenarios.data.data.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setSelectedId(item.id)}
                                    className="flex w-full flex-wrap items-center gap-3 px-2 py-3.5 text-left transition hover:bg-[#FCFCFC] rtl:text-right"
                                >
                                    <Stethoscope className="h-4 w-4 shrink-0 text-[#F47822]" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-[#3A3A3A]">
                                            {item.title}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-[#3A3A3A]/45">
                                            v{item.version} · {item.course ?? t("admin.diagnostics.row.noCourse")} · {item.steps_count} {t("admin.diagnostics.row.steps")} ·{" "}
                                            {item.attempts_count} {t("admin.diagnostics.row.attempts")}
                                            {item.pass_rate !== null ? t("admin.diagnostics.row.passSuffix", { rate: item.pass_rate }) : ""}
                                        </span>
                                    </span>
                                    <Status value={item.status} />
                                </button>
                            ))}
                        </div>
                        <PageControls
                            page={scenarios.data.meta.current_page}
                            lastPage={scenarios.data.meta.last_page}
                            onPage={setPage}
                        />
                    </>
                )}
            </AdminPanel>

            {showCreate && (
                <CreateScenarioPanel
                    onClose={() => setShowCreate(false)}
                    onCreated={(id) => {
                        setShowCreate(false);
                        setSelectedId(id);
                        void scenarios.refetch();
                    }}
                />
            )}

            {selectedId && (
                <ScenarioDrawer
                    scenarioId={selectedId}
                    onClose={() => setSelectedId(null)}
                    onChanged={() => void scenarios.refetch()}
                />
            )}
        </div>
    );
}

function CreateScenarioPanel({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
    const { t } = useTranslation();
    const [courseId, setCourseId] = useState("");
    const [query, setQuery] = useState("");
    const [title, setTitle] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const courses = useQuery({
        queryKey: ["admin", "courses", "picker", query],
        queryFn: () => adminApi.courses({ search: query, per_page: 8 } as unknown as Record<string, string | number | boolean | undefined>),
        enabled: query.trim().length >= 2,
    });
    const picks = (courses.data as unknown as { data?: Array<{ id: string; title: string }> } | undefined)?.data ?? [];

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            const created = await adminApi.createDiagnostic({ course_id: courseId.trim(), title: title.trim() });
            onCreated(created.id);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : t("admin.diagnostics.create.createFailed"));
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]/60 p-5 backdrop-blur-sm">
            <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[#3A3A3A]">{t("admin.diagnostics.create.title")}</h2>
                    <button type="button" onClick={onClose} aria-label={t("admin.diagnostics.create.closeAria")} className="rounded-lg p-1.5 text-[#3A3A3A]/50 hover:bg-[#F7F7F7]">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="mt-4 space-y-3">
                    <label className="block text-sm">
                        <span className="font-semibold text-[#3A3A3A]/70">{t("admin.diagnostics.create.courseIdLabel")}</span>
                        <input
                            value={courseId}
                            onChange={(event) => setCourseId(event.target.value)}
                            placeholder={t("admin.diagnostics.create.courseIdPh")}
                            className="mt-1 h-10 w-full rounded-xl border border-[#3A3A3A]/10 px-3 outline-none focus:border-[#F47822]"
                        />
                    </label>
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t("admin.diagnostics.create.searchCoursesPh")}
                        className="h-9 w-full rounded-xl border border-[#3A3A3A]/10 px-3 text-sm outline-none focus:border-[#F47822]"
                    />
                    {picks.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {picks.slice(0, 6).map((course) => (
                                <button
                                    key={course.id}
                                    type="button"
                                    onClick={() => setCourseId(course.id)}
                                    className={`rounded-full border px-2.5 py-1 text-[11px] ${courseId === course.id ? "border-[#F47822] bg-[#F47822] text-white" : "border-[#3A3A3A]/15 bg-white text-[#3A3A3A]/70 hover:border-[#F47822]/40"}`}
                                >
                                    {course.title}
                                </button>
                            ))}
                        </div>
                    )}
                    <label className="block text-sm">
                        <span className="font-semibold text-[#3A3A3A]/70">{t("admin.diagnostics.create.titleLabel")}</span>
                        <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder={t("admin.diagnostics.create.titlePh")}
                            className="mt-1 h-10 w-full rounded-xl border border-[#3A3A3A]/10 px-3 outline-none focus:border-[#F47822]"
                        />
                    </label>
                    {error && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
                    <button
                        type="button"
                        disabled={busy || !courseId.trim() || !title.trim()}
                        onClick={() => void submit()}
                        className="h-11 w-full rounded-xl bg-[#F47822] text-sm font-bold text-white transition hover:bg-[#d95d0d] disabled:opacity-50"
                    >
                        {busy ? t("admin.diagnostics.create.creating") : t("admin.diagnostics.create.createDraft")}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ScenarioDrawer({
    scenarioId,
    onClose,
    onChanged,
}: {
    scenarioId: string;
    onClose: () => void;
    onChanged: () => void;
}) {
    const { t } = useTranslation();
    const client = useQueryClient();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const detail = useQuery({
        queryKey: ["admin", "diagnostic", scenarioId],
        queryFn: () => adminApi.diagnosticDetail(scenarioId),
    });

    const refresh = async () => {
        await client.invalidateQueries({ queryKey: ["admin", "diagnostic", scenarioId] });
        await client.invalidateQueries({ queryKey: ["admin", "diagnostics"] });
        onChanged();
    };

    const run = async (task: () => Promise<unknown>) => {
        setBusy(true);
        setError(null);
        try {
            await task();
            await refresh();
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : t("admin.diagnostics.drawer.actionFailed"));
        } finally {
            setBusy(false);
        }
    };

    const scenario = detail.data;
    const isDraft = scenario?.status === "draft";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]/60 p-5 backdrop-blur-sm">
            <div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
                <header className="sticky top-0 flex items-center justify-between gap-3 bg-[#3A3A3A] px-6 py-5 text-white">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">
                            {t("admin.diagnostics.drawer.scenarioLabel")}{scenario ? ` ${t("admin.diagnostics.drawer.scenarioMeta", { version: scenario.version, status: scenario.status })}` : ""}
                        </p>
                        <h2 className="mt-1 text-lg font-bold">{scenario?.title ?? t("admin.diagnostics.drawer.loadingTitle")}</h2>
                    </div>
                    <button type="button" onClick={onClose} aria-label={t("admin.diagnostics.drawer.closeAria")} className="rounded-lg p-1.5 text-white/55 hover:bg-white/10 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </header>

                <div className="space-y-6 p-6">
                    {detail.isError && <p className="text-sm text-red-700">{t("admin.diagnostics.drawer.loadFailed")}</p>}
                    {error && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}

                    {scenario && (
                        <>
                            <section className="flex flex-wrap gap-2">
                                {scenario.status !== "published" && (
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => void run(() => adminApi.diagnosticLifecycle(scenario.id, "publish"))}
                                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                                    >
                                        {t("admin.diagnostics.drawer.publish")}
                                    </button>
                                )}
                                {scenario.status === "published" && (
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => void run(() => adminApi.diagnosticLifecycle(scenario.id, "unpublish"))}
                                        className="rounded-xl bg-[#3A3A3A] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                                    >
                                        {t("admin.diagnostics.drawer.unpublish")}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void run(() => adminApi.diagnosticLifecycle(scenario.id, "archive"))}
                                    className="rounded-xl border border-[#3A3A3A]/15 px-4 py-2 text-xs font-bold text-[#3A3A3A]/70 disabled:opacity-50"
                                >
                                    {t("admin.diagnostics.drawer.archive")}
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void run(() => adminApi.forkDiagnosticVersion(scenario.id))}
                                    className="rounded-xl bg-[#F47822] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                                >
                                    {t("admin.diagnostics.drawer.fork", { version: scenario.version + 1 })}
                                </button>
                            </section>

                            {!isDraft && (
                                <p className="rounded-xl bg-[#F47822]/5 p-3 text-xs text-[#3A3A3A]/60">
                                    {t("admin.diagnostics.drawer.immutableNote")}
                                </p>
                            )}

                            <DrawerSection title={t("admin.diagnostics.drawer.steps", { count: scenario.steps.length })}>
                                <ul className="space-y-1.5">
                                    {scenario.steps.map((step) => (
                                        <StepRow
                                            key={step.id}
                                            step={step}
                                            editable={isDraft}
                                            disabled={busy}
                                            onSave={(payload) => run(() => adminApi.updateDiagnosticStep(step.id, payload))}
                                            onDelete={() => run(() => adminApi.deleteDiagnosticStep(step.id))}
                                        />
                                    ))}
                                </ul>
                                {isDraft && <AddStepForm scenarioId={scenario.id} onDone={() => void refresh()} />}
                            </DrawerSection>

                            <DrawerSection title={t("admin.diagnostics.drawer.grading", { count: scenario.scoring_criteria.length })}>
                                <ul className="space-y-1.5">
                                    {scenario.scoring_criteria.map((criterion) => (
                                        <li key={criterion.id} className="flex items-center justify-between gap-2 rounded-xl bg-[#F7F7F7] px-3 py-2 text-xs">
                                            <span className="text-[#3A3A3A]">
                                                <b>{criterion.key}</b> · {criterion.title} · {criterion.points} {t("admin.diagnostics.pointsUnit")} ·{" "}
                                                {criterion.evaluation_type}
                                            </span>
                                            {isDraft && (
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => void run(() => adminApi.deleteDiagnosticCriterion(criterion.id))}
                                                    className="font-bold text-red-600 disabled:opacity-40"
                                                >
                                                    {t("admin.diagnostics.drawer.delete")}
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                {isDraft && (
                                    <AddCriterionForm scenarioId={scenario.id} steps={scenario.steps} onDone={() => void refresh()} />
                                )}
                            </DrawerSection>

                            <DrawerSection title={t("admin.diagnostics.drawer.hints", { count: scenario.hints.length })}>
                                <ul className="space-y-1.5">
                                    {scenario.hints.map((hint) => (
                                        <HintRow
                                            key={hint.id}
                                            hint={hint}
                                            editable={isDraft}
                                            disabled={busy}
                                            onSave={(payload) => run(() => adminApi.updateDiagnosticHint(hint.id, payload))}
                                            onDelete={() => run(() => adminApi.deleteDiagnosticHint(hint.id))}
                                        />
                                    ))}
                                </ul>
                                {isDraft && (
                                    <AddHintForm scenarioId={scenario.id} steps={scenario.steps} onDone={() => void refresh()} />
                                )}
                            </DrawerSection>

                            <DrawerSection title={t("admin.diagnostics.drawer.assignments", { count: scenario.assignments.length })}>
                                <ul className="space-y-1.5">
                                    {scenario.assignments.map((assignment) => (
                                        <li key={assignment.id} className="flex items-center justify-between gap-2 rounded-xl bg-[#F7F7F7] px-3 py-2 text-xs">
                                            <span className="text-[#3A3A3A]">
                                                {assignment.course?.title ?? assignment.id} · {t("admin.diagnostics.drawer.minLabel", { value: assignment.min_score })}
                                                {assignment.max_attempts ? t("admin.diagnostics.drawer.maxSuffix", { value: assignment.max_attempts }) : ""}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => void run(() => adminApi.deleteDiagnosticAssignment(assignment.id))}
                                                className="font-bold text-red-600 disabled:opacity-40"
                                            >
                                                {t("admin.diagnostics.drawer.remove")}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <AddAssignmentForm scenarioId={scenario.id} onDone={() => void refresh()} />
                            </DrawerSection>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#3A3A3A]/50">{title}</h3>
            <div className="mt-2">{children}</div>
        </section>
    );
}

function AddStepForm({ scenarioId, onDone }: { scenarioId: string; onDone: () => void }) {
    const { t } = useTranslation();
    const [title, setTitle] = useState("");
    const [actionType, setActionType] = useState("inspect");
    const [busy, setBusy] = useState(false);

    return (
        <div className="mt-2 flex flex-wrap gap-2">
            <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("admin.diagnostics.addStep.titlePh")}
                className="h-9 min-w-40 flex-1 rounded-lg border border-[#3A3A3A]/10 px-3 text-xs outline-none focus:border-[#F47822]"
            />
            <select
                value={actionType}
                onChange={(event) => setActionType(event.target.value)}
                className="h-9 rounded-lg border border-[#3A3A3A]/10 px-2 text-xs outline-none focus:border-[#F47822]"
            >
                {["inspect", "scan", "measure", "test", "identify", "diagnose", "repair"].map((action) => (
                    <option key={action} value={action}>
                        {action}
                    </option>
                ))}
            </select>
            <button
                type="button"
                disabled={busy || !title.trim()}
                onClick={() => {
                    setBusy(true);
                    void adminApi
                        .createDiagnosticStep(scenarioId, { title: title.trim(), action_type: actionType })
                        .then(() => {
                            setTitle("");
                            onDone();
                        })
                        .finally(() => setBusy(false));
                }}
                className="h-9 rounded-lg bg-[#3A3A3A] px-3 text-xs font-bold text-white disabled:opacity-50"
            >
                {t("admin.diagnostics.addStep.addStep")}
            </button>
        </div>
    );
}

function AddCriterionForm({
    scenarioId,
    steps,
    onDone,
}: {
    scenarioId: string;
    steps: Array<{ id: string; title: string }>;
    onDone: () => void;
}) {
    const { t } = useTranslation();
    const [key, setKey] = useState("");
    const [title, setTitle] = useState("");
    const [points, setPoints] = useState("10");
    const [evaluationType, setEvaluationType] = useState("boolean");
    const [stepId, setStepId] = useState("");
    const [field, setField] = useState("");
    const [expected, setExpected] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = () => {
        const parsedPoints = Number(points);
        const rules: Record<string, unknown> =
            evaluationType === "numeric_range"
                ? { field: field.trim(), min: Number(expected.split(",")[0] ?? 0), max: Number(expected.split(",")[1] ?? 0) }
                : evaluationType === "set_match"
                  ? { field: field.trim(), expected: expected.split(",").map((part) => part.trim()).filter(Boolean) }
                  : { field: field.trim(), expected: expected.trim() };

        setBusy(true);
        void adminApi
            .createDiagnosticCriterion(scenarioId, {
                key: key.trim(),
                title: title.trim(),
                points: Number.isNaN(parsedPoints) ? 10 : parsedPoints,
                evaluation_type: evaluationType,
                step_id: stepId || null,
                rules,
            })
            .then(() => {
                setKey("");
                setTitle("");
                setField("");
                setExpected("");
                onDone();
            })
            .finally(() => setBusy(false));
    };

    return (
        <div className="mt-2 space-y-2 rounded-xl border border-[#3A3A3A]/10 p-3">
            <div className="flex flex-wrap gap-2">
                <input
                    value={key}
                    onChange={(event) => setKey(event.target.value)}
                    placeholder={t("admin.diagnostics.addCriterion.keyPh")}
                    className="h-9 min-w-32 flex-1 rounded-lg border border-[#3A3A3A]/10 px-3 text-xs outline-none focus:border-[#F47822]"
                />
                <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={t("admin.diagnostics.addCriterion.titlePh")}
                    className="h-9 min-w-32 flex-1 rounded-lg border border-[#3A3A3A]/10 px-3 text-xs outline-none focus:border-[#F47822]"
                />
                <input
                    value={points}
                    onChange={(event) => setPoints(event.target.value)}
                    placeholder={t("admin.diagnostics.addCriterion.ptsPh")}
                    inputMode="numeric"
                    className="h-9 w-20 rounded-lg border border-[#3A3A3A]/10 px-3 text-xs outline-none focus:border-[#F47822]"
                />
            </div>
            <div className="flex flex-wrap gap-2">
                <select
                    value={evaluationType}
                    onChange={(event) => setEvaluationType(event.target.value)}
                    className="h-9 rounded-lg border border-[#3A3A3A]/10 px-2 text-xs outline-none focus:border-[#F47822]"
                >
                    {["boolean", "contains", "numeric_range", "set_match"].map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
                <select
                    value={stepId}
                    onChange={(event) => setStepId(event.target.value)}
                    className="h-9 rounded-lg border border-[#3A3A3A]/10 px-2 text-xs outline-none focus:border-[#F47822]"
                >
                    <option value="">{t("admin.diagnostics.addCriterion.scenarioWide")}</option>
                    {steps.map((step) => (
                        <option key={step.id} value={step.id}>
                            {step.title}
                        </option>
                    ))}
                </select>
                <input
                    value={field}
                    onChange={(event) => setField(event.target.value)}
                    placeholder={t("admin.diagnostics.addCriterion.answerFieldPh")}
                    className="h-9 min-w-28 flex-1 rounded-lg border border-[#3A3A3A]/10 px-3 text-xs outline-none focus:border-[#F47822]"
                />
                <input
                    value={expected}
                    onChange={(event) => setExpected(event.target.value)}
                    placeholder={evaluationType === "numeric_range" ? t("admin.diagnostics.addCriterion.rangePh") : t("admin.diagnostics.addCriterion.expectedPh")}
                    className="h-9 min-w-28 flex-1 rounded-lg border border-[#3A3A3A]/10 px-3 text-xs outline-none focus:border-[#F47822]"
                />
            </div>
            <button
                type="button"
                disabled={busy || !key.trim() || !title.trim() || !field.trim()}
                onClick={submit}
                className="h-9 rounded-lg bg-[#3A3A3A] px-3 text-xs font-bold text-white disabled:opacity-50"
            >
                {t("admin.diagnostics.addCriterion.addRule")}
            </button>
        </div>
    );
}

function AddHintForm({
    scenarioId,
    steps,
    onDone,
}: {
    scenarioId: string;
    steps: Array<{ id: string; title: string }>;
    onDone: () => void;
}) {
    const { t } = useTranslation();
    const [content, setContent] = useState("");
    const [stepId, setStepId] = useState("");
    const [busy, setBusy] = useState(false);

    return (
        <div className="mt-2 flex flex-wrap gap-2">
            <input
                value={content}
                onChange={(event) => setContent(event.target.value)}
                    placeholder={t("admin.diagnostics.addHint.contentPh")}
                className="h-9 min-w-40 flex-1 rounded-lg border border-[#3A3A3A]/10 px-3 text-xs outline-none focus:border-[#F47822]"
            />
            <select
                value={stepId}
                onChange={(event) => setStepId(event.target.value)}
                className="h-9 rounded-lg border border-[#3A3A3A]/10 px-2 text-xs outline-none focus:border-[#F47822]"
            >
                <option value="">{t("admin.diagnostics.addHint.scenarioWide")}</option>
                {steps.map((step) => (
                    <option key={step.id} value={step.id}>
                        {step.title}
                    </option>
                ))}
            </select>
            <button
                type="button"
                disabled={busy || !content.trim()}
                onClick={() => {
                    setBusy(true);
                    void adminApi
                        .createDiagnosticHint(scenarioId, {
                            content: content.trim(),
                            diagnostic_scenario_step_id: stepId || null,
                        })
                        .then(() => {
                            setContent("");
                            onDone();
                        })
                        .finally(() => setBusy(false));
                }}
                className="h-9 rounded-lg bg-[#3A3A3A] px-3 text-xs font-bold text-white disabled:opacity-50"
            >
                {t("admin.diagnostics.addHint.addHint")}
            </button>
        </div>
    );
}

function AddAssignmentForm({ scenarioId, onDone }: { scenarioId: string; onDone: () => void }) {
    const { t } = useTranslation();
    const [courseId, setCourseId] = useState("");
    const [query, setQuery] = useState("");
    const [busy, setBusy] = useState(false);
    const courses = useQuery({
        queryKey: ["admin", "courses", "picker", query],
        queryFn: () => adminApi.courses({ search: query, per_page: 8 } as unknown as Record<string, string | number | boolean | undefined>),
        enabled: query.trim().length >= 2,
    });
    const picks = (courses.data as unknown as { data?: Array<{ id: string; title: string }> } | undefined)?.data ?? [];

    return (
        <div className="mt-2 space-y-2">
            <div className="flex flex-wrap gap-2">
                <input
                    value={courseId}
                    onChange={(event) => setCourseId(event.target.value)}
                    placeholder={t("admin.diagnostics.addAssignment.courseIdPh")}
                    className="h-9 min-w-40 flex-1 rounded-lg border border-[#3A3A3A]/10 px-3 text-xs outline-none focus:border-[#F47822]"
                />
            </div>
            <div className="flex gap-2">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("admin.diagnostics.addAssignment.searchCoursesPh")}
                    className="h-8 flex-1 rounded-lg border border-[#3A3A3A]/10 px-3 text-xs outline-none focus:border-[#F47822]"
                />
            </div>
            {picks.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {picks.slice(0, 6).map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => setCourseId(c.id)}
                            className={`rounded-full border px-2.5 py-1 text-[11px] ${courseId === c.id ? "border-[#F47822] bg-[#F47822] text-white" : "border-[#3A3A3A]/15 bg-white text-[#3A3A3A]/70 hover:border-[#F47822]/40"}`}
                        >
                            {c.title}
                        </button>
                    ))}
                </div>
            )}
            <button
                type="button"
                disabled={busy || !courseId.trim()}
                onClick={() => {
                    setBusy(true);
                    void adminApi
                        .createDiagnosticAssignment(scenarioId, { course_id: courseId.trim() })
                        .then(() => {
                            setCourseId("");
                            onDone();
                        })
                        .finally(() => setBusy(false));
                }}
                className="h-9 rounded-lg bg-[#3A3A3A] px-3 text-xs font-bold text-white disabled:opacity-50"
            >
                {t("admin.diagnostics.addAssignment.assignCourse")}
            </button>
        </div>
    );
}

function StepRow({
    step,
    editable,
    disabled,
    onSave,
    onDelete,
}: {
    step: { id: string; position: number; title: string; action_type: string; is_required: boolean; is_terminal: boolean };
    editable: boolean;
    disabled: boolean;
    onSave: (payload: { title: string; action_type: string; is_required: boolean; is_terminal: boolean }) => void;
    onDelete: () => void;
}) {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(step.title);
    const [actionType, setActionType] = useState(step.action_type);
    const [isRequired, setIsRequired] = useState(step.is_required);
    const [isTerminal, setIsTerminal] = useState(step.is_terminal);

    if (isEditing) {
        return (
            <li className="flex flex-wrap gap-2 rounded-xl bg-[#F7F7F7] px-3 py-2 text-xs">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-8 min-w-40 flex-1 rounded-lg border border-[#3A3A3A]/10 px-2 text-xs outline-none focus:border-[#F47822]"
                />
                <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="h-8 rounded-lg border border-[#3A3A3A]/10 px-2 text-xs outline-none focus:border-[#F47822]"
                >
                    {["inspect", "scan", "measure", "test", "identify", "diagnose", "repair"].map((action) => (
                        <option key={action} value={action}>
                            {action}
                        </option>
                    ))}
                </select>
                <label className="flex items-center gap-1.5 text-xs text-[#3A3A3A]/70">
                    <input
                        type="checkbox"
                        checked={isRequired}
                        onChange={(e) => setIsRequired(e.target.checked)}
                        className="h-3 w-3 rounded border-[#3A3A3A]/20 accent-[#F47822]"
                    />
                    {t("admin.diagnostics.stepRow.required")}
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[#3A3A3A]/70">
                    <input
                        type="checkbox"
                        checked={isTerminal}
                        onChange={(e) => setIsTerminal(e.target.checked)}
                        className="h-3 w-3 rounded border-[#3A3A3A]/20 accent-[#F47822]"
                    />
                    {t("admin.diagnostics.stepRow.terminal")}
                </label>
                <button
                    type="button"
                    disabled={disabled || !title.trim()}
                    onClick={() => { onSave({ title: title.trim(), action_type: actionType, is_required: isRequired, is_terminal: isTerminal }); setIsEditing(false); }}
                    className="h-8 rounded-lg bg-emerald-600 px-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                    {t("admin.diagnostics.stepRow.save")}
                </button>
                <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="h-8 rounded-lg border border-[#3A3A3A]/10 px-2.5 text-xs font-bold text-[#3A3A3A]/70"
                >
                    {t("admin.diagnostics.stepRow.cancel")}
                </button>
            </li>
        );
    }

    return (
        <li className="flex items-center justify-between gap-2 rounded-xl bg-[#F7F7F7] px-3 py-2 text-xs">
            <span className="font-semibold text-[#3A3A3A] min-w-0">
                <span className="text-[#3A3A3A]/40">{step.position}. </span>
                {step.title}
                <span className="ml-2 text-[#3A3A3A]/45">{step.action_type}</span>
                {step.is_required ? <span className="ml-2 rounded bg-emerald-100 px-1.5 text-[9px] font-bold text-emerald-800">{t("admin.diagnostics.stepRow.reqBadge")}</span> : null}
                {step.is_terminal ? <span className="ml-2 rounded bg-amber-100 px-1.5 text-[9px] font-bold text-amber-800">{t("admin.diagnostics.stepRow.termBadge")}</span> : null}
            </span>
            {editable && (
                <div className="flex gap-1">
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setIsEditing(true)}
                        className="h-6 rounded-lg border border-[#3A3A3A]/10 px-2 text-[10px] font-bold text-[#3A3A3A]/70 hover:bg-white"
                    >
                        {t("admin.diagnostics.stepRow.edit")}
                    </button>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={onDelete}
                        className="h-6 rounded-lg font-bold text-red-600 hover:bg-red-50"
                    >
                        {t("admin.diagnostics.stepRow.delete")}
                    </button>
                </div>
            )}
        </li>
    );
}

function HintRow({
    hint,
    editable,
    disabled,
    onSave,
    onDelete,
}: {
    hint: { id: string; level: number; title: string | null; content: string; penalty_points: number };
    editable: boolean;
    disabled: boolean;
    onSave: (payload: { title: string | null; content: string; level: number; penalty_points: number }) => void;
    onDelete: () => void;
}) {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(hint.title ?? "");
    const [content, setContent] = useState(hint.content);
    const [level, setLevel] = useState(hint.level);
    const [penalty, setPenalty] = useState(hint.penalty_points);

    if (isEditing) {
        return (
            <li className="flex flex-wrap gap-2 rounded-xl bg-[#F7F7F7] px-3 py-2 text-xs">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("admin.diagnostics.hintRow.titlePh")}
                    className="h-8 min-w-40 flex-1 rounded-lg border border-[#3A3A3A]/10 px-2 text-xs outline-none focus:border-[#F47822]"
                />
                <input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                placeholder={t("admin.diagnostics.hintRow.contentPh")}
                    className="h-8 min-w-40 flex-1 rounded-lg border border-[#3A3A3A]/10 px-2 text-xs outline-none focus:border-[#F47822]"
                />
<select
                        value={level}
                        onChange={(e) => setLevel(Number(e.target.value))}
                        className="h-8 w-16 rounded-lg border border-[#3A3A3A]/10 px-2 text-xs outline-none focus:border-[#F47822]"
                    >
                        {[1, 2, 3].map((l) => (
                            <option key={l} value={l}>L{l}</option>
                        ))}
                    </select>
                <input
                    type="number"
                    value={penalty}
                    onChange={(e) => setPenalty(Number(e.target.value) || 0)}
                    min="0"
                    max="50"
                    className="h-8 w-16 rounded-lg border border-[#3A3A3A]/10 px-2 text-xs outline-none focus:border-[#F47822]"
                    placeholder={t("admin.diagnostics.hintRow.penaltyPh")}
                />
                <button
                    type="button"
                    disabled={disabled || !content.trim()}
                    onClick={() => { onSave({ title: title.trim() || null, content: content.trim(), level, penalty_points: penalty }); setIsEditing(false); }}
                    className="h-8 rounded-lg bg-emerald-600 px-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                    {t("admin.diagnostics.hintRow.save")}
                </button>
                <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="h-8 rounded-lg border border-[#3A3A3A]/10 px-2.5 text-xs font-bold text-[#3A3A3A]/70"
                >
                    {t("admin.diagnostics.hintRow.cancel")}
                </button>
            </li>
        );
    }

    return (
        <li className="flex items-center justify-between gap-2 rounded-xl bg-[#F7F7F7] px-3 py-2 text-xs">
            <span className="text-[#3A3A3A] flex-1 min-w-0 truncate">
                <b>L{hint.level}</b> · {hint.title ?? hint.content.slice(0, 80)} · −{hint.penalty_points} {t("admin.diagnostics.pointsUnit")}
            </span>
            {editable && (
                <div className="flex gap-1">
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setIsEditing(true)}
                        className="h-6 rounded-lg border border-[#3A3A3A]/10 px-2 text-[10px] font-bold text-[#3A3A3A]/70 hover:bg-white"
                    >
                        {t("admin.diagnostics.hintRow.edit")}
                    </button>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={onDelete}
                        className="h-6 rounded-lg font-bold text-red-600 hover:bg-red-50"
                    >
                        {t("admin.diagnostics.hintRow.delete")}
                    </button>
                </div>
            )}
        </li>
    );
}
