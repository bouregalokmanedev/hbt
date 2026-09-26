import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getDiagnosticResult } from "../api/diagnostics.api";

import type { DiagnosticResult } from "../types/diagnostic.types";

export function DiagnosticResultPage() {
    const { t } = useTranslation();
    const { attemptId } = useParams<{ attemptId: string }>();
    const [result, setResult] = useState<DiagnosticResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!attemptId) {
            return;
        }

        void getDiagnosticResult(attemptId)
            .then(setResult)
            .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : t("diagnostics.result.loadFail")))
            .finally(() => setLoading(false));
    }, [attemptId]);

    if (loading) {
        return <main className="min-h-full bg-background p-8 text-sm text-muted-foreground">{t("diagnostics.result.loading")}</main>;
    }

    if (error || !result) {
        return (
            <main className="min-h-full bg-background p-8">
                <div className="rounded-2xl bg-red-50 dark:bg-red-500/10 p-5 text-red-700 dark:text-red-400">{error ?? t("diagnostics.result.notFound")}</div>
                <Link to="/diagnostics" className="mt-4 inline-block text-sm font-semibold text-[#F47822]">
                    ← {t("diagnostics.result.back")}
                </Link>
            </main>
        );
    }

    const entries = Object.values(result.breakdown);

    return (
        <main className="min-h-full bg-background">
            <div className="mx-auto max-w-[960px] px-5 py-6 sm:px-8 sm:py-8">
                <section className="rounded-3xl bg-[#3A3A3A] p-8 text-center text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">
                        {t("diagnostics.result.complete")}
                    </p>
                    <p className="mt-3 text-5xl font-bold">{result.score}%</p>
                    <p
                        className={`mx-auto mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${
                            result.passed ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                        }`}
                    >
                        {result.passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        {result.passed ? t("diagnostics.result.passed") : t("diagnostics.result.notPassed")}
                    </p>

                    <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-3 text-xs">
                        <div className="rounded-2xl bg-white/10 p-3">
                            <p className="text-white/50">{t("diagnostics.result.accuracy")}</p>
                            <p className="mt-1 text-base font-bold">{result.accuracy ?? "—"}%</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-3">
                            <p className="text-white/50">{t("diagnostics.result.process")}</p>
                            <p className="mt-1 text-base font-bold">{result.process_score ?? "—"}%</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-3">
                            <p className="text-white/50">{t("diagnostics.result.points")}</p>
                            <p className="mt-1 text-base font-bold">
                                {result.points_earned}/{result.points_possible}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mt-6 rounded-3xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-6">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-[#3A3A3A]/60 dark:text-white/60">{t("diagnostics.result.breakdown")}</h2>
                    <ul className="mt-4 space-y-2">
                        {entries.map((entry) => (
                            <li
                                key={entry.step_id}
                                className="flex items-center justify-between gap-3 rounded-xl bg-[#F7F7F7] dark:bg-[#101013] px-4 py-3 text-sm"
                            >
                                <span className="flex items-center gap-2 font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                                    {entry.is_correct ? (
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                        <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                                    )}
                                    {entry.title}
                                </span>
                                <span className="font-mono text-xs text-[#3A3A3A]/60 dark:text-white/60">
                                    {entry.points_earned}/{entry.points_possible}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-emerald-600/20 bg-emerald-50/50 p-6">
                        <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">{t("diagnostics.result.strengths")}</h2>
                        {result.strengths.length === 0 ? (
                            <p className="mt-2 text-sm text-[#3A3A3A]/50 dark:text-white/50">{t("diagnostics.result.noneRecorded")}</p>
                        ) : (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#3A3A3A]/80 dark:text-white/80">
                                {result.strengths.map((strength) => (
                                    <li key={strength}>{strength}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="rounded-3xl border border-[#F47822]/20 bg-[#F47822]/5 p-6">
                        <h2 className="text-sm font-bold uppercase tracking-wide text-[#F47822]">{t("diagnostics.result.improve")}</h2>
                        {result.weaknesses.length === 0 ? (
                            <p className="mt-2 text-sm text-[#3A3A3A]/50 dark:text-white/50">{t("diagnostics.result.nothingFlagged")}</p>
                        ) : (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#3A3A3A]/80 dark:text-white/80">
                                {result.weaknesses.map((weakness) => (
                                    <li key={weakness}>{weakness}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                <Link
                    to="/diagnostics"
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3A3A3A] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-black"
                >
                    {t("diagnostics.result.continue")} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                </Link>
            </div>
        </main>
    );
}
