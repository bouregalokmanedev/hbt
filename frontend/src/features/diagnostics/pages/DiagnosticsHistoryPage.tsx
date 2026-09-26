import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Eye, Play } from "lucide-react";

import { getDiagnosticHistory } from "../api/diagnostics.api";
import type { DiagnosticAttempt } from "../types/diagnostic.types";

function fmt(date: string | null | undefined, locale?: string) {
    if (!date) return "—";
    return new Date(date).toLocaleString(locale);
}

export function DiagnosticsHistoryPage() {
    const { t, i18n } = useTranslation();
    const [items, setItems] = useState<DiagnosticAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        void getDiagnosticHistory()
            .then(setItems)
            .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : t("diagnostics.history.loadFail")))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <main className="min-h-full bg-background p-8 text-sm text-muted-foreground">{t("diagnostics.history.loading")}</main>;
    if (error) return <main className="min-h-full bg-background p-8"><div className="rounded-2xl bg-red-50 dark:bg-red-500/10 p-5 text-red-700 dark:text-red-400">{error}</div></main>;

    return (
        <main className="min-h-full bg-background">
            <div className="mx-auto max-w-[960px] px-5 py-6 sm:px-8">
                <Link
                  to="/diagnostics"
                  className="group inline-flex w-fit items-center gap-2 rounded-full border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-4 py-2 text-sm font-semibold text-[#3A3A3A]/60 dark:text-white/60 shadow-sm transition-all hover:-translate-x-0.5 hover:border-[#F47822]/40 hover:bg-[#F47822]/5 hover:text-[#F47822] rtl:hover:translate-x-0.5"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
                  {t("diagnostics.history.back")}
                </Link>
                <h1 className="mt-4 text-2xl font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("diagnostics.history.title")}</h1>
                <p className="mt-1 text-sm text-[#3A3A3A]/60 dark:text-white/60">{t("diagnostics.history.description")}</p>

                {items.length === 0 ? (
                    <p className="mt-6 rounded-2xl border border-dashed border-[#3A3A3A]/15 dark:border-white/15 bg-white dark:bg-[#1b1b20] p-8 text-center text-sm text-[#3A3A3A]/50 dark:text-white/50">
                        {t("diagnostics.history.empty")}
                    </p>
                ) : (
                    <div className="mt-6 divide-y divide-[#3A3A3A]/10 dark:divide-white/10 overflow-hidden rounded-2xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20]">
                        {items.map((a) => (
                            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                                <div>
                                    <p className="text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{a.scenario?.title ?? a.scenario_id.slice(0, 8)} · {t("diagnostics.history.attempt", { n: a.attempt_number })}</p>
                                    <p className="text-xs text-[#3A3A3A]/50 dark:text-white/50">{a.status === "in_progress" ? t("diagnostics.history.statusInProgress") : t("diagnostics.history.statusSubmitted")} · {fmt(a.started_at as unknown as string, i18n.language)} → {fmt(a.submitted_at as unknown as string, i18n.language)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {a.score !== null && a.score !== undefined && (
                                        <span className="rounded-full bg-[#3A3A3A] px-2.5 py-1 text-xs font-bold text-white">{a.score}%</span>
                                    )}
                                    <Link
                                        to={a.status === "in_progress" ? `/diagnostics/attempts/${a.id}` : `/diagnostics/attempts/${a.id}/result`}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-3.5 py-2 text-xs font-bold text-white shadow-[0_6px_16px_rgba(244,120,34,0.25)] transition-all hover:-translate-y-px hover:bg-[#E96D18] hover:shadow-[0_8px_20px_rgba(244,120,34,0.3)] active:translate-y-0"
                                    >
                                        {a.status === "in_progress" ? (
                                            <>
                                                <Play className="h-3.5 w-3.5 fill-current" />
                                                {t("diagnostics.history.resume")}
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="h-3.5 w-3.5" />
                                                {t("diagnostics.history.view")}
                                            </>
                                        )}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
