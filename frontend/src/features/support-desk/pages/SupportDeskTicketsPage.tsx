import { AlertTriangle, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";

import { supportDeskApi, type DeskTicketFilters, type DeskTicketListResponse } from "../api/supportDesk.api";
import { loadDeskPrefs } from "../deskPrefs";

const STATUSES = ["", "open", "pending", "resolved", "closed"];

function statusColor(status: string): string {
    if (status === "open") return "bg-[#F47822]/10 text-[#F47822]";
    if (status === "pending") return "bg-amber-50 text-amber-700";
    if (status === "resolved") return "bg-emerald-50 text-emerald-700";
    return "bg-[#3A3A3A]/8 text-[#3A3A3A]/60";
}

export function SupportDeskTicketsPage({ lockedAssigned }: { lockedAssigned?: "me" } = {}) {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const [params, setParams] = useSearchParams();
    const [data, setData] = useState<DeskTicketListResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState(params.get("search") ?? "");

    const status = params.get("status") ?? "";
    const assigned = lockedAssigned ?? params.get("assigned") ?? "";
    const overdue = params.get("overdue") === "true";
    const page = Number(params.get("page") ?? 1) || 1;

    const appliedDeskPrefs = useRef(false);
    useEffect(() => {
        if (appliedDeskPrefs.current) return;
        appliedDeskPrefs.current = true;
        if (params.has("status") || params.has("assigned")) return;
        const prefs = loadDeskPrefs();
        const next = new URLSearchParams(params);
        let changed = false;
        if (prefs.defaultStatus) {
            next.set("status", prefs.defaultStatus);
            changed = true;
        }
        if (!lockedAssigned && prefs.defaultAssigned) {
            next.set("assigned", prefs.defaultAssigned);
            changed = true;
        }
        if (changed) setParams(next, { replace: true });
    }, [lockedAssigned, params, setParams]);

    useEffect(() => {
        let cancelled = false;
        setError(null);
        const filters: DeskTicketFilters = { page, per_page: 15 };
        if (status) filters.status = status;
        if (assigned === "me" || assigned === "unassigned") filters.assigned = assigned;
        if (overdue) filters.overdue = true;
        const needle = params.get("search");
        if (needle) filters.search = needle;
        void supportDeskApi
            .tickets(filters)
            .then((response) => {
                if (!cancelled) setData(response);
            })
            .catch((cause: unknown) => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : t("supportDesk.tickets.loadFail"));
            });
        return () => {
            cancelled = true;
        };
    }, [status, assigned, overdue, page, params, t]);

    const set = (patch: Record<string, string | undefined>, resetPage = true) => {
        const next = new URLSearchParams(params);
        Object.entries(patch).forEach(([key, value]) => {
            if (value) next.set(key, value);
            else next.delete(key);
        });
        if (resetPage) next.delete("page");
        setParams(next, { replace: true });
    };

    const statusLabel = (entry: string): string => {
        if (entry === "open") return t("supportDesk.tickets.filters.open");
        if (entry === "pending") return t("supportDesk.tickets.filters.pending");
        if (entry === "resolved") return t("supportDesk.tickets.filters.resolved");
        if (entry === "closed") return t("supportDesk.tickets.filters.closed");
        return t("supportDesk.tickets.filters.all");
    };

    return (
        <main className="mx-auto max-w-[1280px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <header>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">{t("supportDesk.tickets.eyebrow")}</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A]">
                    {lockedAssigned === "me" ? t("supportDesk.tickets.myTitle") : t("supportDesk.tickets.title")}
                </h1>
                {lockedAssigned === "me" && (
                    <p className="mt-1 text-sm text-[#3A3A3A]/55">{t("supportDesk.tickets.myDescription")}</p>
                )}
            </header>

            <div className="flex flex-col gap-3 rounded-2xl border border-[#3A3A3A]/8 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
                <label className="relative flex-1">
                    <Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/30 ${isRTL ? "right-3" : "left-3"}`} />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") set({ search: search.trim() || undefined });
                        }}
                        placeholder={t("supportDesk.tickets.searchPh")}
                        aria-label={t("supportDesk.tickets.searchAria")}
                        className={`h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] pr-3 text-sm outline-none focus:border-[#F47822] ${isRTL ? "pl-3 pr-9" : "pl-9"}`}
                    />
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((entry) => (
                        <button
                            key={entry || "all"}
                            type="button"
                            onClick={() => set({ status: entry || undefined })}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition ${status === entry ? "bg-[#F47822] text-white" : "bg-[#F7F7F7] text-[#3A3A3A]/55 hover:text-[#3A3A3A]"}`}
                        >
                            {statusLabel(entry)}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {!lockedAssigned && (
                        <>
                            <button
                                type="button"
                                onClick={() => set({ assigned: assigned === "me" ? undefined : "me" })}
                                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${assigned === "me" ? "bg-[#3A3A3A] text-white" : "bg-[#F7F7F7] text-[#3A3A3A]/55"}`}
                            >
                                {t("supportDesk.tickets.filters.mine")}
                            </button>
                            <button
                                type="button"
                                onClick={() => set({ assigned: assigned === "unassigned" ? undefined : "unassigned" })}
                                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${assigned === "unassigned" ? "bg-[#3A3A3A] text-white" : "bg-[#F7F7F7] text-[#3A3A3A]/55"}`}
                            >
                                {t("supportDesk.tickets.filters.unassigned")}
                            </button>
                        </>
                    )}
                    <button
                        type="button"
                        onClick={() => set({ overdue: overdue ? undefined : "true" })}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${overdue ? "bg-red-600 text-white" : "bg-[#F7F7F7] text-[#3A3A3A]/55"}`}
                    >
                        {t("supportDesk.tickets.filters.overdue")}
                    </button>
                </div>
            </div>

            {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

            {!data ? (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />
                    ))}
                </div>
            ) : data.data.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#3A3A3A]/15 bg-white p-10 text-center">
                    <p className="text-sm font-semibold text-[#3A3A3A]">{t("supportDesk.tickets.emptyTitle")}</p>
                    <p className="mt-1 text-xs text-[#3A3A3A]/45">{t("supportDesk.tickets.emptyDesc")}</p>
                </div>
            ) : (
                <>
                    <ul className="space-y-3">
                        {data.data.map((ticket) => (
                            <li key={ticket.id}>
                                <Link
                                    to={`/support-desk/tickets/${ticket.id}`}
                                    className="flex items-center gap-4 rounded-2xl border border-[#3A3A3A]/8 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-bold text-[#3A3A3A]">{ticket.subject}</span>
                                        <span className="mt-1 block truncate text-xs text-[#3A3A3A]/45">
                                            {ticket.user ?? "—"}{ticket.email ? ` · ${ticket.email}` : ""} · {ticket.assignee ? t("supportDesk.tickets.assignedTo", { name: ticket.assignee }) : t("supportDesk.tickets.unassigned")}
                                        </span>
                                    </span>
                                    {ticket.overdue && <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />}
                                    <span className="hidden shrink-0 rounded-full bg-[#F7F7F7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/50 sm:block">{ticket.priority}</span>
                                    <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold capitalize ${statusColor(ticket.status)}`}>{ticket.status}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="flex items-center justify-between text-xs text-[#3A3A3A]/50">
                        <span>{t("supportDesk.tickets.pageOf", { current: data.meta.current_page, last: data.meta.last_page, total: data.meta.total })}</span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={data.meta.current_page <= 1}
                                onClick={() => set({ page: String(data.meta.current_page - 1) }, false)}
                                className="rounded-xl border border-[#3A3A3A]/10 bg-white px-4 py-2 font-bold disabled:opacity-40"
                            >
                                {t("supportDesk.tickets.previous")}
                            </button>
                            <button
                                type="button"
                                disabled={data.meta.current_page >= data.meta.last_page}
                                onClick={() => set({ page: String(data.meta.current_page + 1) }, false)}
                                className="rounded-xl border border-[#3A3A3A]/10 bg-white px-4 py-2 font-bold disabled:opacity-40"
                            >
                                {t("supportDesk.tickets.next")}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </main>
    );
}
