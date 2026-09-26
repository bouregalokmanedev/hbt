import { AlertTriangle, CheckCircle2, Clock3, Inbox, Ticket, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { supportDeskApi, type DeskOverview } from "../api/supportDesk.api";

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
    return (
        <div className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40">{label}</p>
            <p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p>
        </div>
    );
}

function statusColor(status: string): string {
    if (status === "open") return "bg-[#F47822]/10 text-[#F47822]";
    if (status === "pending") return "bg-amber-50 text-amber-700";
    if (status === "resolved") return "bg-emerald-50 text-emerald-700";
    return "bg-[#3A3A3A]/8 text-[#3A3A3A]/60";
}

export function SupportDeskDashboardPage() {
    const { t, i18n } = useTranslation();
    const [overview, setOverview] = useState<DeskOverview | null>(null);
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
        return () => {
            cancelled = true;
        };
    }, [t]);

    if (error) {
        return (
            <main className="p-6">
                <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            </main>
        );
    }

    if (!overview) {
        return (
            <main className="space-y-4 p-6">
                <div className="h-28 animate-pulse rounded-3xl bg-white" />
                <div className="grid gap-4 sm:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
                    ))}
                </div>
            </main>
        );
    }

    const { summary, recent, my_queue } = overview;

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

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label={t("supportDesk.dashboard.stats.open")} value={summary.open} tone="text-[#F47822]" />
                <Stat label={t("supportDesk.dashboard.stats.pending")} value={summary.pending} tone="text-amber-600" />
                <Stat label={t("supportDesk.dashboard.stats.overdue")} value={summary.overdue} tone="text-red-600" />
                <Stat label={t("supportDesk.dashboard.stats.unassigned")} value={summary.unassigned} tone="text-[#3A3A3A]" />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded-3xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-[#3A3A3A]">
                        <UserCheck className="h-4 w-4 text-[#F47822]" /> {t("supportDesk.dashboard.myQueue")}
                    </h2>
                    {my_queue.length === 0 ? (
                        <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#F7F7F7] px-4 py-4 text-xs text-[#3A3A3A]/50">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t("supportDesk.dashboard.myQueueEmpty")}
                        </p>
                    ) : (
                        <ul className="mt-3 divide-y divide-[#3A3A3A]/6">
                            {my_queue.map((ticket) => (
                                <li key={ticket.id}>
                                    <Link to={`/support-desk/tickets/${ticket.id}`} className="flex items-center gap-3 py-3">
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-[#3A3A3A]">{ticket.subject}</span>
                                            <span className="mt-0.5 block text-[11px] text-[#3A3A3A]/45">{ticket.user ?? "—"}</span>
                                        </span>
                                        {ticket.overdue && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />}
                                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusColor(ticket.status)}`}>{ticket.status}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="rounded-3xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-[#3A3A3A]">
                        <Ticket className="h-4 w-4 text-[#F47822]" /> {t("supportDesk.dashboard.latest")}
                    </h2>
                    <ul className="mt-3 divide-y divide-[#3A3A3A]/6">
                        {recent.map((ticket) => (
                            <li key={ticket.id}>
                                <Link to={`/support-desk/tickets/${ticket.id}`} className="flex items-center gap-3 py-3">
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-[#3A3A3A]">{ticket.subject}</span>
                                        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#3A3A3A]/45">
                                            <Clock3 className="h-3 w-3" />
                                            {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString(i18n.language) : "—"} · {ticket.assignee ?? t("supportDesk.dashboard.unassigned")}
                                        </span>
                                    </span>
                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusColor(ticket.status)}`}>{ticket.status}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    {recent.length === 0 && <p className="mt-3 text-xs text-[#3A3A3A]/50">{t("supportDesk.dashboard.latestEmpty")}</p>}
                </section>
            </div>
        </main>
    );
}
