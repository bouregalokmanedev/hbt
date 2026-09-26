import { Activity, CheckCircle2, Clock3, Gauge, GitBranch, LockKeyhole, MapPin, Play, RotateCcw, ScanSearch, ShieldCheck, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import type { DiagnosticHubItem } from "../types/diagnostic.types";

const toolIconKeys = [
    { icon: ScanSearch, key: "scanner" },
    { icon: Gauge, key: "multimeter" },
    { icon: Activity, key: "scope" },
    { icon: MapPin, key: "location" },
    { icon: GitBranch, key: "schematic" },
] as const;

function StateBadge({ state }: { state: DiagnosticHubItem["state"] }) {
    const { t } = useTranslation();
    if (state === "completed") return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-sm"><CheckCircle2 className="h-3.5 w-3.5" /> {t("diagnostics.card.completed")}</span>;
    if (state === "in_progress") return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F47822] px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-sm"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> {t("diagnostics.card.live")}</span>;
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#3A3A3A] dark:text-[#ececef] shadow-sm backdrop-blur"><Play className="h-3 w-3" /> {t("diagnostics.card.available")}</span>;
}

export function DiagnosticCard({ item }: { item: DiagnosticHubItem }) {
    const { t } = useTranslation();
    const toolLabels: Record<string, string> = {
        scanner: t("diagnostics.briefing.toolNames.scanner"),
        multimeter: t("diagnostics.briefing.toolNames.multimeter"),
        scope: t("diagnostics.briefing.toolNames.scope"),
        location: t("diagnostics.briefing.toolNames.location"),
        schematic: t("diagnostics.briefing.toolNames.schematic"),
    };
    const attemptsLeft = item.max_attempts !== null ? Math.max(0, item.max_attempts - item.attempts_used) : null;
    const locked = attemptsLeft !== null && attemptsLeft <= 0 && !item.completed;
    const score = item.best_score;
    const scoreColor = score === null ? "text-[#3A3A3A]/30 dark:text-white/30" : score >= 80 ? "text-emerald-600 dark:text-emerald-400" : score >= 60 ? "text-amber-600 dark:text-amber-400" : "text-[#3A3A3A] dark:text-[#ececef]";

    return (
        <motion.article
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.22 }}
            className="group relative flex flex-col overflow-hidden rounded-[28px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] shadow-[0_8px_30px_rgba(58,58,58,0.06)] hover:shadow-[0_16px_40px_rgba(58,58,58,0.12)]"
        >
            {/* Header — workshop bench header */}
            <div className="relative h-[112px] overflow-hidden bg-[#0f1115] p-5">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3A3A3A] via-[#2a2a2a] to-[#0f1115]" />
                <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#F47822]/20 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/5 blur-2xl" />
                {/* faint grid */}
                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "22px 22px" }} />

                <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <StateBadge state={item.state} />
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] ${item.is_required ? "bg-[#F47822] text-white" : "bg-white/10 text-white/70 backdrop-blur"}`}>{item.is_required ? t("diagnostics.card.required") : t("diagnostics.card.optional")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {toolIconKeys.map(({ icon: Icon, key }) => (
                            <span key={key} title={toolLabels[key]} className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/80 backdrop-blur border border-white/10"><Icon className="h-3.5 w-3.5" /></span>
                        ))}
                        <span className="ms-2 text-[10px] font-bold uppercase tracking-[.14em] text-white/40">{t("diagnostics.card.workshop")}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 flex-col p-6">
                {item.course ? <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#F47822]"><Wrench className="h-3 w-3" />{item.course.title}</p> : null}
                <h2 className="mt-1.5 line-clamp-2 text-[18px] font-bold leading-6 tracking-tight text-[#3A3A3A] dark:text-[#ececef] group-hover:text-black dark:group-hover:text-white">{item.title}</h2>
                {item.description ? <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-[#3A3A3A]/60 dark:text-white/60">{item.description}</p> : null}

                {/* Stats — tactile tiles */}
                <div className="mt-5 grid grid-cols-3 gap-2.5">
                    <div className="rounded-2xl border border-[#3A3A3A]/5 dark:border-white/5 bg-[#FCFCFC] dark:bg-[#232329] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.card.steps")}</p>
                        <p className="mt-1 flex items-baseline gap-1 text-lg font-black tracking-tight text-[#3A3A3A] dark:text-[#ececef]">{item.steps_count}<span className="text-[11px] font-semibold text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.card.tasks")}</span></p>
                    </div>
                    <div className="rounded-2xl border border-[#3A3A3A]/5 dark:border-white/5 bg-[#FCFCFC] dark:bg-[#232329] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("diagnostics.card.pass")}</p>
                        <p className="mt-1 text-lg font-black tracking-tight text-[#3A3A3A] dark:text-[#ececef]">{item.min_score}<span className="text-sm font-bold text-[#3A3A3A]/40 dark:text-white/40">%</span></p>
                    </div>
                    <div className={`rounded-2xl border p-3 ${score !== null && score >= 70 ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60" : "border-[#3A3A3A]/5 dark:border-white/5 bg-[#FCFCFC] dark:bg-[#232329]"}`}>
                        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40"><Clock3 className="h-3 w-3" /> {t("diagnostics.card.best")}</p>
                        <p className={`mt-1 text-lg font-black tracking-tight ${scoreColor}`}>{score !== null ? `${score}%` : "—"}</p>
                    </div>
                </div>

                {/* Meta row */}
                <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-[#3A3A3A]/45 dark:text-white/45">
                    <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {t("diagnostics.card.attempts")} {item.attempts_used}{item.max_attempts !== null ? `/${item.max_attempts}` : ""}</span>
                    {attemptsLeft !== null && !locked ? <span className="text-[#3A3A3A]/25 dark:text-white/25">·</span> : null}
                    {attemptsLeft !== null && !locked ? <span className={attemptsLeft <= 1 ? "text-amber-600 dark:text-amber-400 font-bold" : ""}>{attemptsLeft} {t("diagnostics.card.left")}</span> : null}
                </div>

                {/* CTA — feels like hardware button */}
                <div className="mt-5">
                    {locked ? (
                        <button disabled className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3A3A3A]/10 dark:bg-white/10 px-4 py-3.5 text-sm font-bold text-[#3A3A3A]/40 dark:text-white/40 shadow-inner"><LockKeyhole className="h-4 w-4" /> {t("diagnostics.card.noAttempts")}</button>
                    ) : item.in_progress_attempt_id ? (
                        <Link
                            to={`/diagnostics/attempts/${item.in_progress_attempt_id}`}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#F47822]/45 bg-[#F47822]/10 px-4 py-3.5 text-sm font-black text-[#c45a12] shadow-sm transition hover:border-[#F47822] hover:bg-[#F47822] hover:text-white active:scale-[0.99] dark:text-[#F47822] dark:hover:text-white"
                        >
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#F47822]/15 text-[#F47822] transition group-hover:bg-white/20">
                                <RotateCcw className="h-3.5 w-3.5" />
                            </span>
                            <span className="truncate">{t("diagnostics.card.resume")}</span>
                        </Link>
                    ) : (
                        <Link to={`/diagnostics/${item.id}`} className="group/btn flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F47822] px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.3)] transition hover:bg-[#df6817] active:scale-[0.99]">
                            {t("diagnostics.card.enter")} <Play className="h-4 w-4 transition group-hover/btn:translate-x-0.5 rtl:-scale-x-100" />
                        </Link>
                    )}
                </div>
            </div>
        </motion.article>
    );
}
