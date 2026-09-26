import { ArrowRight, FlaskConical, Lock, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { getDiagnostics } from "@/features/diagnostics/api/diagnostics.api";
import type { DiagnosticHubItem } from "@/features/diagnostics/types/diagnostic.types";

function StatePill({ state, completed, inProgress, available }: { state: DiagnosticHubItem["state"]; completed: string; inProgress: string; available: string }) {
    if (state === "completed") return <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{completed}</span>;
    if (state === "in_progress") return <span className="rounded-full bg-[#F47822]/10 px-2.5 py-1 text-[11px] font-bold text-[#F47822]">{inProgress}</span>;
    return <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">{available}</span>;
}

export function CourseDiagnostics({
    courseId,
    authenticated,
    enrolled,
}: {
    courseId: string;
    authenticated: boolean;
    enrolled: boolean;
}) {
    const { t } = useTranslation();
    const [items, setItems] = useState<DiagnosticHubItem[] | null>(null);

    useEffect(() => {
        if (!authenticated || !enrolled) {
            setItems(null);
            return;
        }
        void getDiagnostics(courseId)
            .then(setItems)
            .catch(() => setItems([]));
    }, [courseId, authenticated, enrolled]);

    if (!authenticated) {
        return (
            <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] sm:p-8">
                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F47822]/10">
                        <FlaskConical className="h-5 w-5 text-[#F47822]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("courseDetails.scenarios.eyebrow")}</p>
                        <h2 className="mt-2 text-xl font-bold text-foreground">{t("courseDetails.scenarios.title")}</h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {t("courseDetails.scenarios.loginDesc")}
                        </p>
                        <Link
                            to="/login"
                            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#e96b17]"
                        >
                            {t("courseDetails.scenarios.loginCta")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    if (!enrolled) {
        return (
            <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] sm:p-8">
                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F47822]/10">
                        <Lock className="h-5 w-5 text-[#F47822]" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("courseDetails.scenarios.eyebrow")}</p>
                        <h2 className="mt-2 text-xl font-bold text-foreground">{t("courseDetails.scenarios.title")}</h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {t("courseDetails.scenarios.enrollDesc")}
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    if (items === null) {
        return (
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
                <div className="h-5 w-48 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-4 w-72 animate-pulse rounded bg-muted" />
            </section>
        );
    }

    if (items.length === 0) return null;

    return (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("courseDetails.scenarios.eyebrow")}</p>
                    <h2 className="mt-2 text-xl font-bold text-foreground">{t("courseDetails.scenarios.title")}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("courseDetails.scenarios.listDesc")}</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F47822]/10">
                    <FlaskConical className="h-5 w-5 text-[#F47822]" />
                </div>
            </div>
            <div className="mt-6 space-y-3">
                {items.map((item, index) => (
                    <Link
                        key={item.id}
                        to={`/diagnostics/${item.id}`}
                        className="group flex flex-wrap items-center gap-4 rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-[#F7F7F7] dark:bg-[#101013] p-4 transition hover:border-[#F47822]/30 hover:bg-[#FFF8F4] dark:hover:bg-[#F47822]/[0.08]"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-[#1b1b20] text-xs font-bold text-[#F47822] shadow-sm">
                            {index + 1}
                        </div>
                        <div className="min-w-[180px] flex-1">
                            <h3 className="text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef] group-hover:text-[#F47822]">{item.title}</h3>
                            {item.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">{item.description}</p>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#3A3A3A]/55 dark:text-white/55">
                            <span>{t("courseDetails.scenarios.steps", { n: item.steps_count })}</span>
                            {item.best_score !== null && (
                                <span className="flex items-center gap-1 font-semibold text-[#F47822]">
                                    <Target className="h-3.5 w-3.5" />{item.best_score}%
                                </span>
                            )}
                            <StatePill state={item.state} completed={t("courseDetails.scenarios.completed")} inProgress={t("courseDetails.scenarios.inProgress")} available={t("courseDetails.scenarios.available")} />
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
