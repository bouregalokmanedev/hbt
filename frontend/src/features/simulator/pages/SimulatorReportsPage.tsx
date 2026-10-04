import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, ClipboardCheck, Gauge, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { simulatorApi, type SimulatorResult } from "../api/simulator.api";

function toolLabelOf(t: (key: string, opts?: { defaultValue?: string }) => string, tool: string) {
    return t(`simulator.toolNames.${tool}`, { defaultValue: tool });
}

function contentTextOf(t: (key: string) => string, raw: string) {
    return raw.startsWith("content:") ? t(`content.${raw.slice(8)}`) : raw;
}

function ReportDetail({ result }: { result: SimulatorResult }) {
    const { t, i18n } = useTranslation();
    const steps = result.steps ?? [];
    const passed = steps.filter((s) => s.ok).length;
    const meta = result.metadata ?? {};

    let when: string | null = null;
    if (result.created_at) {
        try {
            when = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.created_at));
        } catch {
            when = result.created_at;
        }
    }

    const facts: { label: string; value: string }[] = [
        { label: t("simulator.reports.factTool"), value: toolLabelOf(t, result.tool) },
        ...(result.scenario_key ? [{ label: t("simulator.reports.factScenario"), value: result.scenario_key }] : []),
        ...(meta.vehicleId ? [{ label: t("simulator.reports.factVehicle"), value: meta.vehicleId }] : []),
        ...(result.attempts != null ? [{ label: t("simulator.reports.factAttempts"), value: String(result.attempts) }] : []),
        ...(result.hints_used != null ? [{ label: t("simulator.reports.factHints"), value: String(result.hints_used) }] : []),
        ...(result.duration_seconds != null ? [{ label: t("simulator.reports.factDuration"), value: t("simulator.reports.seconds", { n: result.duration_seconds }) }] : []),
        ...(when ? [{ label: t("simulator.reports.factRecorded"), value: when }] : []),
    ];

    return (
        <div>
            <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
                        {toolLabelOf(t, result.tool)}
                        {result.verdict ? ` · ${contentTextOf(t, result.verdict)}` : ""}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#3A3A3A]/70 dark:text-white/65">
                        {result.outcome ?? t("simulator.reports.outcomeFallback")}
                    </p>
                </div>
                <div
                    className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-lg font-black ${
                        result.score >= 70
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                    }`}
                >
                    {result.score}
                </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                {facts.map((fact) => (
                    <div key={fact.label} className="rounded-xl bg-[#F8F7F6] px-3 py-2.5 dark:bg-[#101013]">
                        <dt className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{fact.label}</dt>
                        <dd className="mt-0.5 truncate text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]" title={fact.value}>{fact.value}</dd>
                    </div>
                ))}
            </dl>

            <div className="mt-6 flex items-center justify-between">
                <h2 className="text-sm font-black text-[#3A3A3A] dark:text-[#ececef]">{t("simulator.reports.steps")}</h2>
                {steps.length > 0 && (
                    <span className="text-xs font-bold text-[#3A3A3A]/45 dark:text-white/45">
                        {t("simulator.reports.stepsPassed", { n: passed, total: steps.length })}
                    </span>
                )}
            </div>
            {steps.length === 0 ? (
                <p className="mt-2 text-sm text-[#3A3A3A]/45 dark:text-white/45">{t("simulator.reports.noSteps")}</p>
            ) : (
                <ul className="mt-2 flex flex-col gap-1.5">
                    {steps.map((step, idx) => (
                        <li
                            key={`${step.label}-${idx}`}
                            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm ${
                                step.ok
                                    ? "bg-emerald-50/70 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                                    : "bg-red-50/70 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                            }`}
                        >
                            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-white ${step.ok ? "bg-emerald-500" : "bg-red-500"}`}>
                                {step.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            </span>
                            <span className="min-w-0 flex-1 truncate font-bold" title={step.label}>{contentTextOf(t, step.label)}</span>
                            <span className="shrink-0 text-[11px] font-black uppercase opacity-70">
                                {step.ok ? t("simulator.reports.stepPass") : t("simulator.reports.stepFail")}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export function SimulatorReportsPage() {
    const { t } = useTranslation();
    const [results, setResults] = useState<SimulatorResult[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    // Master-detail on one page: the picked run deep-links via ?r=<id>.
    const [params, setParams] = useSearchParams();
    const selectedId = params.get("r");

    useEffect(() => {
        void simulatorApi
            .results()
            .then(setResults)
            .catch((cause: unknown) =>
                setError(cause instanceof Error ? cause.message : t("simulator.reports.loadFail")),
            );
    }, [t]);

    // Default to the newest run so the bench never opens on an empty detail pane.
    const selected = useMemo(
        () => results?.find((r) => r.id === selectedId) ?? results?.[0] ?? null,
        [results, selectedId],
    );
    const select = (id: string) => {
        setParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set("r", id);
            return next;
        }, { replace: true });
    };

    return (
        <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013]">
            <div className="mx-auto max-w-[1240px] px-5 py-6 sm:px-8">
                <Link to="/simulator" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3A3A3A]/50 dark:text-white/50 hover:text-[#3A3A3A] dark:hover:text-[#ececef]">
                    <ArrowLeft className="h-4 w-4" /> {t("simulator.lab.backLabs")}
                </Link>
                <div className="mt-4 rounded-[24px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-6 shadow-sm sm:p-8">
                    <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#3A3A3A] text-white">
                            <ClipboardCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-[#3A3A3A] dark:text-[#ececef]">{t("simulator.reports.title")}</h1>
                            <p className="text-xs font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
                                {t("simulator.reports.persisted")}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <p role="alert" className="mt-5 rounded-2xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                            {error}
                        </p>
                    )}

                    {results === null && !error && (
                        <p className="mt-5 text-sm text-[#3A3A3A]/50 dark:text-white/50">{t("simulator.reports.loading")}</p>
                    )}

                    {results !== null && results.length === 0 && (
                        <div className="mt-5 rounded-2xl bg-[#F8F7F6] dark:bg-[#101013] p-8 text-center">
                            <Gauge className="mx-auto h-8 w-8 text-[#3A3A3A]/20 dark:text-white/20" />
                            <p className="mt-3 text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("simulator.reports.empty")}</p>
                            <p className="mt-1 text-xs text-[#3A3A3A]/50 dark:text-white/50">
                                {t("simulator.reports.emptyHint")}
                            </p>
                            <Link to="/simulator" className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#F47822] px-4 py-2 text-sm font-bold text-white">
                                {t("simulator.reports.openLabs")}
                            </Link>
                        </div>
                    )}

                    {results !== null && results.length > 0 && (
                        <div className="mt-5 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                            {/* Run list — pick a report, its full record opens beside it. */}
                            <ul className="flex flex-col gap-2 self-start rounded-2xl border border-[#3A3A3A]/8 bg-[#F8F7F6] p-2 dark:border-white/8 dark:bg-[#101013]">
                                {results.map((result) => {
                                    const active = selected?.id === result.id;
                                    return (
                                        <li key={result.id}>
                                            <button
                                                type="button"
                                                onClick={() => select(result.id)}
                                                aria-current={active ? "true" : undefined}
                                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start transition ${
                                                    active
                                                        ? "bg-white shadow-sm ring-2 ring-[#F47822]/40 dark:bg-[#1b1b20]"
                                                        : "hover:bg-white/70 dark:hover:bg-white/5"
                                                }`}
                                            >
                                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F47822]/10 text-xs font-black text-[#F47822]">
                                                    {toolLabelOf(t, result.tool).slice(0, 3).toUpperCase()}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                                                        {toolLabelOf(t, result.tool)}
                                                        {result.verdict ? ` — ${contentTextOf(t, result.verdict)}` : ""}
                                                    </p>
                                                    <p className="truncate text-xs text-[#3A3A3A]/45 dark:text-white/45">
                                                        {t("simulator.reports.score", { score: result.score, outcome: result.outcome ?? t("simulator.reports.outcomeFallback") })}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                                                        result.score >= 70
                                                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                                    }`}
                                                >
                                                    {result.score}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>

                            {/* The report itself — steps, verdict and run metadata inline. */}
                            <section
                                aria-label={t("simulator.reports.detailTitle")}
                                className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 dark:border-white/8 dark:bg-[#1b1b20] sm:p-6"
                            >
                                {selected ? (
                                    <ReportDetail result={selected} />
                                ) : (
                                    <p className="text-sm text-[#3A3A3A]/50 dark:text-white/50">{t("simulator.reports.selectHint")}</p>
                                )}
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
