import { ArrowRight, CheckCircle2, Eye, FlaskConical, LogIn, Play, RotateCcw, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Link } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { getDiagnostics } from "@/features/diagnostics/api/diagnostics.api";
import type { DiagnosticHubItem } from "@/features/diagnostics/types/diagnostic.types";

function ctaFor(item: DiagnosticHubItem, t: TFunction): string {
    if (item.state === "completed") return t("lessonPlayer.scenarios.ctaReview");
    if (item.state === "in_progress") return t("lessonPlayer.scenarios.ctaContinue");
    return t("lessonPlayer.scenarios.ctaStart");
}

/**
 * State-aware CTA: primary orange to start, tinted orange to resume,
 * quiet ghost to review — mirrors DiagnosticCard's hardware-button feel.
 */
function ScenarioCta({ item, t }: { item: DiagnosticHubItem; t: TFunction }) {
    const label = ctaFor(item, t);

    if (item.state === "in_progress") {
        return (
            <Link
                to={`/diagnostics/${item.id}`}
                className="group/cta inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-[#F47822]/45 bg-[#F47822]/10 px-5 py-3 text-xs font-black text-[#c45a12] shadow-sm transition-all hover:border-[#F47822] hover:bg-[#F47822] hover:text-white hover:shadow-[0_8px_20px_rgba(244,120,34,0.25)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/40 focus-visible:ring-offset-2 dark:text-[#F47822] dark:hover:text-white sm:w-auto"
            >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#F47822]/15 text-[#F47822] transition group-hover/cta:bg-white/20 group-hover/cta:text-white">
                    <RotateCcw className="h-3.5 w-3.5" />
                </span>
                {label}
            </Link>
        );
    }

    if (item.state === "completed") {
        return (
            <Link
                to={`/diagnostics/${item.id}`}
                className="group/cta inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-xs font-bold text-[#3A3A3A] transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-[#1b1b20] dark:text-[#ececef] dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 sm:w-auto"
            >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {item.best_score !== null ? <Eye className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                </span>
                {label}
            </Link>
        );
    }

    return (
        <Link
            to={`/diagnostics/${item.id}`}
            className="group/cta inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#F47822] px-5 py-3 text-xs font-black text-white shadow-[0_8px_20px_rgba(244,120,34,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#df6817] hover:shadow-[0_12px_26px_rgba(244,120,34,0.4)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/40 focus-visible:ring-offset-2 sm:w-auto"
        >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20">
                <Play className="h-3 w-3 fill-current" />
            </span>
            {label}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/cta:-translate-x-0.5" />
        </Link>
    );
}

/**
 * Diagnostics strip pinned to the bottom of the lesson page. Shows the
 * hands-on scenarios attached to this course so learners can jump from
 * theory straight into practice.
 */
export function LessonDiagnostics({ courseId }: { courseId: string }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [items, setItems] = useState<DiagnosticHubItem[] | null>(null);

    useEffect(() => {
        if (!user) {
            setItems(null);
            return;
        }
        let cancelled = false;
        void getDiagnostics(courseId)
            .then((data) => {
                if (!cancelled) setItems(data);
            })
            .catch(() => {
                if (!cancelled) setItems([]);
            });
        return () => {
            cancelled = true;
        };
    }, [courseId, user]);

    if (!user) {
        return (
            <section className="mt-6 overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F47822]/10">
                        <FlaskConical className="h-5 w-5 text-[#F47822]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("lessonPlayer.scenarios.eyebrow")}</p>
                        <h2 className="mt-1 text-base font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("lessonPlayer.scenarios.title")}</h2>
                        <p className="mt-1 text-xs leading-5 text-gray-500">
                            {t("lessonPlayer.scenarios.loginDesc")}
                        </p>
                    </div>
                    <Link
                        to="/login"
                        className="group/login inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#F47822] px-5 py-3 text-xs font-black text-white shadow-[0_8px_20px_rgba(244,120,34,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#df6817] hover:shadow-[0_12px_26px_rgba(244,120,34,0.4)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/40 focus-visible:ring-offset-2"
                    >
                        <LogIn className="h-4 w-4" />
                        {t("lessonPlayer.scenarios.login")}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/login:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/login:-translate-x-0.5" />
                    </Link>
                </div>
            </section>
        );
    }

    if (items === null) {
        return (
            <section className="mt-6 rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-5 sm:p-6">
                <div className="h-4 w-52 animate-pulse rounded bg-gray-100 dark:bg-white/[0.07]" />
                <div className="mt-3 h-3 w-80 animate-pulse rounded bg-gray-100 dark:bg-white/[0.07]" />
            </section>
        );
    }

    if (items.length === 0) return null;

    return (
        <section className="mt-6 overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
            <div className="border-b border-gray-100 dark:border-white/10 px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F47822]/10">
                        <FlaskConical className="h-5 w-5 text-[#F47822]" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("lessonPlayer.scenarios.eyebrow")}</p>
                        <h2 className="mt-0.5 text-base font-bold text-[#3A3A3A] dark:text-[#ececef] sm:text-lg">{t("lessonPlayer.scenarios.title")}</h2>
                    </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-gray-500 sm:text-sm sm:leading-6">
                    {t("lessonPlayer.scenarios.listDesc")}
                </p>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-white/10">
                {items.map((item) => (
                    <li
                        key={item.id}
                        className="group/row flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-[#F47822]/[0.03] sm:flex-row sm:items-center sm:px-6"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{item.title}</h3>
                                {item.state === "completed" && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="h-3 w-3" />
                                        {t("lessonPlayer.scenarios.completed")}
                                    </span>
                                )}
                                {item.state === "in_progress" && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F47822]/10 px-2 py-0.5 text-[10px] font-bold text-[#F47822]">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F47822]" />
                                        {t("lessonPlayer.scenarios.inProgress")}
                                    </span>
                                )}
                            </div>
                            {item.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{item.description}</p>}
                            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                                <span>{t("lessonPlayer.scenarios.steps", { n: item.steps_count })}</span>
                                <span>{t("lessonPlayer.scenarios.passAt", { pct: item.passing_score })}</span>
                                {item.best_score !== null && (
                                    <span className="inline-flex items-center gap-1 font-semibold text-[#F47822]">
                                        <Target className="h-3 w-3" /> {t("lessonPlayer.scenarios.best", { pct: item.best_score })}
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="w-full sm:w-auto sm:shrink-0">
                            <ScenarioCta item={item} t={t} />
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
