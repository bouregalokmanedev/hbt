import { AlertTriangle, CheckCircle2, Clock3, Inbox, Ticket, Trophy, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { supportDeskApi, type DeskAgentPerf, type DeskOverview } from "../api/supportDesk.api";

function Stat({ label, value, tone }: { label: string; value: number | string; tone: string }) {
    return (
        <div className="rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40 dark:text-white/40">{label}</p>
            <p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p>
        </div>
    );
}

function statusColor(status: string): string {
    if (status === "open") return "bg-[#F47822]/10 text-[#F47822]";
    if (status === "pending") return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400";
    if (status === "resolved") return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    return "bg-[#3A3A3A]/8 dark:bg-white/8 text-[#3A3A3A]/60 dark:text-white/60";
}

export function SupportDeskDashboardPage() {
    const { t, i18n } = useTranslation();
    const [overview, setOverview] = useState<DeskOverview | null>(null);
    const [agents, setAgents] = useState<DeskAgentPerf[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        void supportDeskApi
            .overview()
            .then((data) => {
                if (!cancelled) setOverview(data);
            })
            .catch((cause: unknown) => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : t("supportDesk.dashboard.loadFail"));
            });
        void supportDeskApi
            .agents()
            .then((rows) => {
                if (!cancelled) setAgents(rows);
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [t]);

    if (error) {
        return (
            <main className="p-6">
                <p role="alert" className="rounded-2xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>
            </main>
        );
    }

    if (!overview) {
        return (
            <main className="space-y-4 p-6">
                <div className="h-28 animate-pulse rounded-3xl bg-white dark:bg-[#1b1b20]" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 animate-pulse rounded-2xl bg-white dark:bg-[#1b1b20]" />
                    ))}
                </div>
            </main>
        );
    }

    const { summary, recent, my_queue, csat } = overview;

    return (
        <main className="mx-auto max-w-[1280px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <header className="overflow-hidden rounded-3xl bg-[#3A3A3A] px-6 py-7 text-white sm:px-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">{t("supportDesk.dashboard.eyebrow")}</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{t("supportDesk.dashboard.title")}</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                    {t("supportDesk.dashboard.summary", {
                        attention: summary.open + summary.pending,
                        mine: summary.mine,
                        overdue: summary.overdue,
                    })}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                    <Link to="/support-desk/tickets" className="inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#E96D18]">
                        <Inbox className="h-3.5 w-3.5" /> {t("supportDesk.dashboard.openQueue")}
                    </Link>
                    <Link to="/support-desk/my-tickets" className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10">
                        <UserCheck className="h-3.5 w-3.5" /> {t("supportDesk.dashboard.myTickets", { count: summary.mine })}
                    </Link>
                </div>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <Stat label={t("supportDesk.dashboard.stats.open")} value={summary.open} tone="text-[#F47822]" />
                <Stat label={t("supportDesk.dashboard.stats.pending")} value={summary.pending} tone="text-amber-600 dark:text-amber-400" />
                <Stat label={t("supportDesk.dashboard.stats.overdue")} value={summary.overdue} tone="text-red-600 dark:text-red-400" />
                <Stat label={t("supportDesk.dashboard.stats.unassigned")} value={summary.unassigned} tone="text-[#3A3A3A]" />
                <Stat
                    label={t("supportDesk.dashboard.stats.csat", { count: csat?.count ?? 0 })}
                    value={csat && csat.count > 0 ? csat.average.toFixed(1) : "—"}
                    tone="text-emerald-600 dark:text-emerald-400"
                />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded-3xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-5 shadow-sm sm:p-6">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                        <UserCheck className="h-4 w-4 text-[#F47822]" /> {t("supportDesk.dashboard.myQueue")}
                    </h2>
                    {my_queue.length === 0 ? (
                        <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#F7F7F7] dark:bg-[#101013] px-4 py-4 text-xs text-[#3A3A3A]/50 dark:text-white/50">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t("supportDesk.dashboard.myQueueEmpty")}
                        </p>
                    ) : (
                        <ul className="mt-3 divide-y divide-[#3A3A3A]/6">
                            {my_queue.map((ticket) => (
                                <li key={ticket.id}>
                                    <Link to={`/support-desk/tickets/${ticket.id}`} className="flex items-center gap-3 py-3">
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{ticket.subject}</span>
                                            <span className="mt-0.5 block text-[11px] text-[#3A3A3A]/45 dark:text-white/45">{ticket.user ?? "—"}</span>
                                        </span>
                                        {ticket.overdue && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />}
                                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusColor(ticket.status)}`}>{ticket.status}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="rounded-3xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-5 shadow-sm sm:p-6">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                        <Ticket className="h-4 w-4 text-[#F47822]" /> {t("supportDesk.dashboard.latest")}
                    </h2>
                    <ul className="mt-3 divide-y divide-[#3A3A3A]/6">
                        {recent.map((ticket) => (
                            <li key={ticket.id}>
                                <Link to={`/support-desk/tickets/${ticket.id}`} className="flex items-center gap-3 py-3">
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{ticket.subject}</span>
                                        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                                            <Clock3 className="h-3 w-3" />
                                            {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString(i18n.language) : "—"} · {ticket.assignee ?? t("supportDesk.dashboard.unassigned")}
                                        </span>
                                    </span>
                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusColor(ticket.status)}`}>{ticket.status}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    {recent.length === 0 && <p className="mt-3 text-xs text-[#3A3A3A]/50 dark:text-white/50">{t("supportDesk.dashboard.latestEmpty")}</p>}
                </section>
            </div>

            {/* Team leaderboard: who is carrying the load this month. */}
            <section className="rounded-3xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                    <Trophy className="h-4 w-4 text-[#F47822]" /> {t("supportDesk.dashboard.leaderboard")}
                </h2>
                {agents.length === 0 ? (
                    <p className="mt-3 text-xs text-[#3A3A3A]/50 dark:text-white/50">{t("supportDesk.dashboard.leaderboardEmpty")}</p>
                ) : (
                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-start text-xs">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
                                    <th className="pb-2 text-start font-bold">{t("supportDesk.dashboard.agentCol")}</th>
                                    <th className="pb-2 text-end font-bold">{t("supportDesk.dashboard.openCol")}</th>
                                    <th className="pb-2 text-end font-bold">{t("supportDesk.dashboard.resolvedCol")}</th>
                                    <th className="pb-2 text-end font-bold">{t("supportDesk.dashboard.csatCol")}</th>
                                    <th className="pb-2 text-end font-bold">{t("supportDesk.dashboard.responseCol")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3A3A3A]/6">
                                {agents.map((agent) => (
                                    <tr key={agent.id}>
                                        <td className="py-2.5">
                                            <p className="font-semibold text-[#3A3A3A] dark:text-[#ececef]">{agent.name}</p>
                                            <p dir="ltr" className="text-[10px] text-[#3A3A3A]/40 dark:text-white/40 rtl:text-right">{agent.email}</p>
                                        </td>
                                        <td className="py-2.5 text-end tabular-nums text-[#3A3A3A]/70 dark:text-white/70">{agent.open}</td>
                                        <td className="py-2.5 text-end font-bold tabular-nums text-[#F47822]">{agent.resolved_month}</td>
                                        <td className="py-2.5 text-end tabular-nums text-emerald-600 dark:text-emerald-400">
                                            {agent.csat_count > 0 ? agent.csat_average.toFixed(1) : "—"}
                                        </td>
                                        <td className="py-2.5 text-end tabular-nums text-[#3A3A3A]/70 dark:text-white/70">
                                            {agent.avg_first_response_hours !== null ? `${agent.avg_first_response_hours}h` : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
