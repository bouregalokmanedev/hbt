import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    AlertTriangle,
    Building2,
    Download,
    Flame,
    LayoutGrid,
    Mail,
    MessageCircle,
    Phone,
    Plus,
    Search,
    StickyNote,
    Trash2,
    UserPlus,
    Users,
    X,
} from "lucide-react";

import {
    marketingApi,
    LEAD_STATUSES,
    type Lead,
    type LeadDetail,
    type LeadOwner,
    type LeadStatus,
    type LeadSummary,
} from "../api/marketing.api";

type View = "table" | "board";
type FilterKey = "all" | "unread" | "converted" | "due" | "hot" | LeadStatus;

const STAGE_TONE: Record<LeadStatus, string> = {
    new: "bg-[#F47822]/10 text-[#F47822]",
    contacted: "bg-sky-50 text-sky-700",
    qualified: "bg-violet-50 text-violet-700",
    proposal: "bg-amber-50 text-amber-700",
    won: "bg-emerald-50 text-emerald-700",
    lost: "bg-rose-50 text-rose-700",
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
    note: StickyNote,
    call: Phone,
    email: Mail,
    whatsapp: MessageCircle,
};

function StageChip({ status, t }: { status: LeadStatus; t: (key: string) => string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STAGE_TONE[status] ?? "bg-[#3A3A3A]/8 text-[#3A3A3A]/60"}`}>
            {t(`marketing.leads.filters.${status}`)}
        </span>
    );
}

function ScoreBadge({ score, hotLabel }: { score: number; hotLabel: string }) {
    const tone = score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : "text-[#3A3A3A]/45";
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-bold ${tone}`}>
            {score >= 70 && <Flame className="h-3.5 w-3.5" aria-label={hotLabel} />}
            {score}
        </span>
    );
}

export function MarketingLeadsPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<Awaited<ReturnType<typeof marketingApi.leads>> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterKey>("all");
    const [sort, setSort] = useState<"created_at" | "score" | "next_follow_up_at">("created_at");
    const [page, setPage] = useState(1);
    const [view, setView] = useState<View>("table");
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [detailVersion, setDetailVersion] = useState(0);
    const [detail, setDetail] = useState<LeadDetail | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [team, setTeam] = useState<LeadOwner[]>([]);
    const [addOpen, setAddOpen] = useState(false);
    const [dragId, setDragId] = useState<number | null>(null);

    const query = useMemo(() => {
        const params = new URLSearchParams({ page: String(page), per_page: view === "board" ? "100" : "15", sort });
        if (search.trim()) params.set("search", search.trim());
        if (filter === "unread") params.set("unread", "true");
        else if (filter === "converted") params.set("converted", "true");
        else if (filter === "due") params.set("due", "today");
        else if (filter === "hot") params.set("hot", "true");
        else if (filter !== "all") params.set("status", filter);
        return `?${params.toString()}`;
    }, [page, search, filter, sort, view]);

    const load = useCallback(() => {
        let cancelled = false;
        setError(null);
        void marketingApi
            .leads(query)
            .then((response) => {
                if (!cancelled) setData(response);
            })
            .catch((cause: unknown) => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : t("marketing.leads.error"));
            });
        return () => {
            cancelled = true;
        };
    }, [query, t]);

    useEffect(() => load(), [load]);

    useEffect(() => {
        void marketingApi.team().then(setTeam).catch(() => undefined);
    }, []);

    useEffect(() => {
        if (!selectedId) {
            setDetail(null);
            setDetailError(null);
            return;
        }
        let cancelled = false;
        setDetailError(null);
        void marketingApi
            .lead(selectedId)
            .then((response) => {
                if (!cancelled) setDetail(response);
            })
            .catch((cause: unknown) => {
                if (!cancelled) setDetailError(cause instanceof Error ? cause.message : t("marketing.leads.error"));
            });
        return () => {
            cancelled = true;
        };
    }, [selectedId, detailVersion, t]);

    const patchLead = async (id: number, body: Record<string, unknown>) => {
        const updated = await marketingApi.updateLead(id, body);
        setData((current) =>
            current ? { ...current, data: current.data.map((row) => (row.id === id ? { ...row, ...updated } : row)) } : current,
        );
        setDetail((current) => (current && current.id === id ? { ...current, ...updated } : current));
        return updated;
    };

    const moveLead = async (id: number, status: LeadStatus) => {
        try {
            await patchLead(id, { status });
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("marketing.leads.error"));
        }
    };

    const openDetail = async (lead: Lead) => {
        setSelectedId(lead.id);
        if (!lead.read) {
            try {
                const updated = await marketingApi.readLead(lead.id);
                setData((current) =>
                    current ? { ...current, data: current.data.map((row) => (row.id === lead.id ? updated : row)) } : current,
                );
            } catch {
                // Reading still works; the unread flag can wait.
            }
        }
    };

    const exportCsv = async () => {
        try {
            const blob = await marketingApi.exportLeadsCsv(query);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = "leads.csv";
            anchor.click();
            URL.revokeObjectURL(url);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("marketing.leads.error"));
        }
    };

    const summary: LeadSummary | undefined = data?.summary;
    const boardLeads = data?.data ?? [];
    const filterOptions: FilterKey[] = ["all", "unread", "due", "hot", "converted", ...LEAD_STATUSES];

    return (
        <main className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">{t("marketing.shared.eyebrow")}</p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">{t("marketing.leads.title")}</h1>
                    <p className="mt-1 text-sm text-[#3A3A3A]/55 dark:text-white/55">
                        {summary
                            ? t("marketing.leads.summaryLine", {
                                  total: summary.total,
                                  unread: summary.unread,
                                  due: summary.due_today + summary.overdue,
                                  hot: summary.hot,
                              })
                            : t("marketing.shared.loading")}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1 rounded-xl border border-[#3A3A3A]/8 bg-white p-1 shadow-sm dark:border-white/8 dark:bg-[#1b1b20]">
                        {(["table", "board"] as const).map((entry) => {
                            const Icon = entry === "table" ? LayoutGrid : Users;
                            return (
                                <button
                                    key={entry}
                                    type="button"
                                    onClick={() => setView(entry)}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === entry ? "bg-[#3A3A3A] text-white dark:bg-[#F47822]" : "text-[#3A3A3A]/55 hover:text-[#3A3A3A] dark:text-white/55"}`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {t(`marketing.leads.view.${entry}`)}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        type="button"
                        onClick={() => void exportCsv()}
                        className="flex h-9 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs font-bold text-[#3A3A3A]/70 shadow-sm transition hover:-translate-y-0.5 hover:border-[#F47822]/35 hover:text-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/70"
                    >
                        <Download className="h-3.5 w-3.5" />
                        {t("marketing.leads.export")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="flex h-9 items-center gap-1.5 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white shadow-[0_7px_16px_rgba(244,120,34,.25)] transition hover:-translate-y-0.5"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        {t("marketing.leads.add")}
                    </button>
                </div>
            </header>

            <div className="flex flex-wrap items-center gap-2">
                <label className="relative min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/35" />
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        placeholder={t("marketing.leads.searchPh")}
                        className="h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white ps-9 pe-4 text-sm outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-[#1b1b20]"
                    />
                </label>
                <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as typeof sort)}
                    className="h-10 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs font-bold text-[#3A3A3A]/70 outline-none dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/70"
                >
                    <option value="created_at">{t("marketing.leads.sort.created")}</option>
                    <option value="score">{t("marketing.leads.sort.score")}</option>
                    <option value="next_follow_up_at">{t("marketing.leads.sort.followUp")}</option>
                </select>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {filterOptions.map((entry) => {
                    const count = entry === "all" ? summary?.total : entry === "due" ? summary?.due_today : entry === "hot" ? summary?.hot : summary?.by_stage?.[entry];
                    return (
                        <button
                            key={entry}
                            type="button"
                            onClick={() => {
                                setFilter(entry);
                                setPage(1);
                            }}
                            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold capitalize transition ${
                                filter === entry
                                    ? "border-[#F47822] bg-[#F47822] text-white"
                                    : "border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/60 hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/60"
                            }`}
                        >
                            {t(`marketing.leads.filters.${entry}`)}
                            {typeof count === "number" && count > 0 && <span className="ms-1 opacity-70">{count}</span>}
                        </button>
                    );
                })}
            </div>

            {notice && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
            {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">{error}</p>}

            {!data ? (
                <div className="h-64 animate-pulse rounded-3xl bg-white dark:bg-[#1b1b20]" />
            ) : data.data.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#3A3A3A]/15 bg-white p-10 text-center dark:border-white/10 dark:bg-[#1b1b20]">
                    <p className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("marketing.leads.empty.title")}</p>
                    <p className="mt-1 text-xs text-[#3A3A3A]/50 dark:text-white/50">{t("marketing.leads.empty.hint")}</p>
                </div>
            ) : view === "table" ? (
                <div className="overflow-x-auto rounded-3xl border border-[#3A3A3A]/8 bg-white shadow-sm dark:border-white/8 dark:bg-[#1b1b20]">
                    <table className="w-full min-w-[900px] text-start text-sm">
                        <thead>
                            <tr className="border-b border-[#3A3A3A]/8 text-[10px] uppercase tracking-[0.12em] text-[#3A3A3A]/40 dark:text-white/40">
                                <th className="px-4 py-3 text-start font-bold">{t("marketing.leads.columns.lead")}</th>
                                <th className="px-4 py-3 text-start font-bold">{t("marketing.leads.columns.stage")}</th>
                                <th className="px-4 py-3 text-start font-bold">{t("marketing.leads.columns.score")}</th>
                                <th className="px-4 py-3 text-start font-bold">{t("marketing.leads.columns.owner")}</th>
                                <th className="px-4 py-3 text-start font-bold">{t("marketing.leads.columns.interest")}</th>
                                <th className="px-4 py-3 text-start font-bold">{t("marketing.leads.columns.followUp")}</th>
                                <th className="px-4 py-3 text-start font-bold">{t("marketing.leads.columns.created")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.data.map((lead) => (
                                <tr
                                    key={lead.id}
                                    onClick={() => void openDetail(lead)}
                                    className="cursor-pointer border-b border-[#3A3A3A]/5 transition last:border-0 hover:bg-[#F47822]/4 dark:hover:bg-white/4"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black ${lead.read ? "bg-[#3A3A3A]/8 text-[#3A3A3A]/50" : "bg-[#F47822] text-white"}`}>
                                                {(lead.name ?? lead.email ?? "?").slice(0, 1).toUpperCase()}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate font-bold text-[#3A3A3A] dark:text-[#ececef]">{lead.name || lead.email}</p>
                                                <p dir="ltr" className="truncate text-xs text-[#3A3A3A]/50 rtl:text-end dark:text-white/50">{lead.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><StageChip status={lead.status} t={t} /></td>
                                    <td className="px-4 py-3"><ScoreBadge score={lead.score} hotLabel={t("marketing.leads.filters.hot")} /></td>
                                    <td className="px-4 py-3 text-xs text-[#3A3A3A]/65 dark:text-white/65">{lead.owner?.name ?? t("marketing.leads.unassigned")}</td>
                                    <td className="max-w-[140px] truncate px-4 py-3 text-xs text-[#3A3A3A]/65 dark:text-white/65">{lead.course_interest ?? "—"}</td>
                                    <td className="px-4 py-3 text-xs">
                                        {lead.next_follow_up_at ? (
                                            <span className={lead.overdue ? "font-bold text-rose-600" : "text-[#3A3A3A]/65 dark:text-white/65"}>
                                                {lead.overdue && <AlertTriangle className="me-1 inline h-3 w-3" />}
                                                {lead.overdue ? `${t("marketing.leads.overdue")} · ` : ""}
                                                {new Date(lead.next_follow_up_at).toLocaleDateString()}
                                            </span>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-[#3A3A3A]/50 dark:text-white/50">
                                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "—"}
                                        {lead.converted && (
                                            <span className="ms-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                {t("marketing.leads.signedUp")}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
                    {LEAD_STATUSES.map((status) => {
                        const column = boardLeads.filter((lead) => lead.status === status);
                        return (
                            <section
                                key={status}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => {
                                    event.preventDefault();
                                    const id = Number(event.dataTransfer.getData("text/plain"));
                                    if (dragId && id === dragId) void moveLead(id, status);
                                    setDragId(null);
                                }}
                                className="min-h-[220px] rounded-3xl border border-[#3A3A3A]/8 bg-[#FAFAFA]/80 p-3 dark:border-white/8 dark:bg-[#141418]/80"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <StageChip status={status} t={t} />
                                    <span className="text-[11px] font-bold text-[#3A3A3A]/40 dark:text-white/40">{column.length}</span>
                                </div>
                                <div className="space-y-2">
                                    {column.length === 0 && (
                                        <p className="rounded-2xl border border-dashed border-[#3A3A3A]/10 p-4 text-center text-[10px] text-[#3A3A3A]/35 dark:border-white/10 dark:text-white/35">
                                            {t("marketing.leads.board.empty")}
                                        </p>
                                    )}
                                    {column.map((lead) => (
                                        <article
                                            key={lead.id}
                                            draggable
                                            onDragStart={(event) => {
                                                setDragId(lead.id);
                                                event.dataTransfer.setData("text/plain", String(lead.id));
                                            }}
                                            onClick={() => void openDetail(lead)}
                                            className="cursor-grab rounded-2xl border border-[#3A3A3A]/8 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing dark:border-white/8 dark:bg-[#1b1b20]"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">{lead.name || lead.email}</p>
                                                <ScoreBadge score={lead.score} hotLabel={t("marketing.leads.filters.hot")} />
                                            </div>
                                            <p dir="ltr" className="mt-0.5 truncate text-[11px] text-[#3A3A3A]/50 rtl:text-end dark:text-white/50">{lead.email}</p>
                                            {(lead.course_interest || lead.owner) && (
                                                <p className="mt-1.5 truncate text-[10px] text-[#3A3A3A]/45 dark:text-white/45">
                                                    {[lead.course_interest, lead.owner?.name].filter(Boolean).join(" · ")}
                                                </p>
                                            )}
                                            {lead.overdue && (
                                                <p className="mt-1 text-[10px] font-bold text-rose-600">
                                                    <AlertTriangle className="me-1 inline h-3 w-3" />
                                                    {t("marketing.leads.overdue")}
                                                </p>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}

            {data && view === "table" && data.meta.last_page > 1 && (
                <div className="flex items-center justify-between text-xs text-[#3A3A3A]/50 dark:text-white/50">
                    <span>{t("marketing.leads.page", { page: data.meta.current_page, pages: data.meta.last_page, total: data.meta.total })}</span>
                    <span className="flex gap-2">
                        <button type="button" disabled={data.meta.current_page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-xl border border-[#3A3A3A]/10 bg-white px-4 py-2 font-bold disabled:opacity-40 dark:border-white/10 dark:bg-[#1b1b20]">
                            {t("marketing.leads.previous")}
                        </button>
                        <button type="button" disabled={data.meta.current_page >= data.meta.last_page} onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-[#3A3A3A]/10 bg-white px-4 py-2 font-bold disabled:opacity-40 dark:border-white/10 dark:bg-[#1b1b20]">
                            {t("marketing.leads.next")}
                        </button>
                    </span>
                </div>
            )}

            {selectedId !== null && (
                <LeadDrawer
                    detail={detail}
                    error={detailError}
                    team={team}
                    onClose={() => setSelectedId(null)}
                    onPatch={patchLead}
                    onDeleted={() => {
                        setSelectedId(null);
                        setNotice(t("marketing.leads.drawer.deleted"));
                        load();
                    }}
                    onRefresh={() => {
                        setDetailVersion((version) => version + 1);
                        load();
                    }}
                />
            )}

            {addOpen && (
                <AddLeadModal
                    team={team}
                    onClose={() => setAddOpen(false)}
                    onCreated={() => {
                        setAddOpen(false);
                        setNotice(t("marketing.leads.addModal.created"));
                        load();
                    }}
                />
            )}
        </main>
    );
}

function LeadDrawer({
    detail,
    error,
    team,
    onClose,
    onPatch,
    onDeleted,
    onRefresh,
}: {
    detail: LeadDetail | null;
    error: string | null;
    team: LeadOwner[];
    onClose: () => void;
    onPatch: (id: number, body: Record<string, unknown>) => Promise<Lead>;
    onDeleted: () => void;
    onRefresh: () => void;
}) {
    const { t } = useTranslation();
    const [activityType, setActivityType] = useState("note");
    const [activityBody, setActivityBody] = useState("");
    const [busy, setBusy] = useState(false);

    const logActivity = async () => {
        if (!detail || !activityBody.trim()) return;
        setBusy(true);
        try {
            await marketingApi.addLeadActivity(detail.id, { type: activityType, body: activityBody.trim() });
            setActivityBody("");
            onRefresh();
        } catch {
            // Non-fatal: the drawer stays open.
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!detail || !window.confirm(t("marketing.leads.drawer.deleteConfirm"))) return;
        try {
            await marketingApi.deleteLead(detail.id);
            onDeleted();
        } catch {
            // Handled by parent error state on next load.
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#3A3A3A]/45 backdrop-blur-sm" onClick={onClose}>
            <aside
                className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl dark:bg-[#141418]"
                onClick={(event) => event.stopPropagation()}
            >
                {!detail && !error && <div className="m-6 h-40 animate-pulse rounded-3xl bg-[#3A3A3A]/5" />}
                {error && <p role="alert" className="m-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
                {detail && (
                    <>
                        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#3A3A3A]/8 bg-white/95 p-5 backdrop-blur dark:border-white/8 dark:bg-[#141418]/95">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <StageChip status={detail.status} t={t} />
                                    <ScoreBadge score={detail.score} hotLabel={t("marketing.leads.filters.hot")} />
                                    {detail.converted && (
                                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{t("marketing.leads.signedUp")}</span>
                                    )}
                                </div>
                                <h2 className="mt-2 truncate text-lg font-bold text-[#3A3A3A] dark:text-[#ececef]">{detail.name || detail.email}</h2>
                                <p dir="ltr" className="truncate text-xs text-[#3A3A3A]/55 rtl:text-end dark:text-white/55">
                                    {detail.email}{detail.phone ? ` · ${detail.phone}` : ""}
                                </p>
                            </div>
                            <button type="button" onClick={onClose} aria-label={t("marketing.leads.drawer.close")} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#3A3A3A]/40 hover:bg-[#3A3A3A]/5">
                                <X className="h-4 w-4" />
                            </button>
                        </header>

                        <div className="space-y-5 p-5">
                            <div className="grid grid-cols-2 gap-3">
                                <label className="text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                                    {t("marketing.leads.drawer.stage")}
                                    <select
                                        value={detail.status}
                                        onChange={(event) => void onPatch(detail.id, { status: event.target.value })}
                                        className="mt-1 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm font-bold text-[#3A3A3A] outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                                    >
                                        {LEAD_STATUSES.map((status) => (
                                            <option key={status} value={status}>{t(`marketing.leads.filters.${status}`)}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                                    {t("marketing.leads.drawer.owner")}
                                    <select
                                        value={detail.owner?.id ?? ""}
                                        onChange={(event) => void onPatch(detail.id, { owner_id: event.target.value || null })}
                                        className="mt-1 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm text-[#3A3A3A] outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                                    >
                                        <option value="">{t("marketing.leads.unassigned")}</option>
                                        {team.map((member) => (
                                            <option key={member.id} value={member.id}>{member.name}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                                    {t("marketing.leads.drawer.followUp")}
                                    <input
                                        type="date"
                                        value={detail.next_follow_up_at ? detail.next_follow_up_at.slice(0, 10) : ""}
                                        onChange={(event) => void onPatch(detail.id, { next_follow_up_at: event.target.value || null })}
                                        className="mt-1 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm text-[#3A3A3A] outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                                    />
                                </label>
                                <label className="text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                                    {t("marketing.leads.drawer.interest")}
                                    <input
                                        defaultValue={detail.course_interest ?? ""}
                                        onBlur={(event) => {
                                            const value = event.target.value.trim();
                                            if (value !== (detail.course_interest ?? "")) void onPatch(detail.id, { course_interest: value || null });
                                        }}
                                        className="mt-1 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm text-[#3A3A3A] outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                                    />
                                </label>
                            </div>

                            <div className="rounded-2xl border border-[#3A3A3A]/8 bg-[#FAFAFA] p-4 dark:border-white/8 dark:bg-[#1b1b20]">
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">{t("marketing.leads.drawer.details")}</p>
                                <p className="mt-2 text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{detail.subject}</p>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#3A3A3A]/70 dark:text-white/70">{detail.message}</p>
                                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-bold">
                                    {[
                                        detail.source && ["source", detail.source],
                                        detail.utm.source && ["utm_source", detail.utm.source],
                                        detail.utm.medium && ["utm_medium", detail.utm.medium],
                                        detail.utm.campaign && ["utm_campaign", detail.utm.campaign],
                                    ].filter(Boolean).map((pair) => {
                                        const [, value] = pair as [string, string];
                                        return (
                                            <span key={value} className="rounded-full bg-[#F47822]/10 px-2.5 py-1 text-[#F47822]">{value}</span>
                                        );
                                    })}
                                </div>
                            </div>

                            {detail.account && (
                                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                                    <Building2 className="h-5 w-5 shrink-0 text-emerald-600" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-emerald-800">{t("marketing.leads.drawer.account")}</p>
                                        <p className="truncate text-sm text-emerald-700">
                                            {detail.account.name} · {t("marketing.leads.drawer.enrollments", { count: detail.account.enrollments })} · {detail.account.paid_total} DZD
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">{t("marketing.leads.drawer.activities")}</p>
                                <div className="mt-3 space-y-2">
                                    {detail.activities.length === 0 && (
                                        <p className="text-xs text-[#3A3A3A]/40 dark:text-white/40">{t("marketing.leads.drawer.activitiesEmpty")}</p>
                                    )}
                                    {detail.activities.map((activity) => {
                                        const Icon = ACTIVITY_ICONS[activity.type] ?? StickyNote;
                                        return (
                                            <div key={activity.id} className="flex gap-3 rounded-2xl border border-[#3A3A3A]/6 bg-white p-3 dark:border-white/6 dark:bg-[#1b1b20]">
                                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F47822]/10 text-[#F47822]">
                                                    <Icon className="h-3.5 w-3.5" />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-bold text-[#3A3A3A]/50 dark:text-white/50">
                                                        {t(`marketing.leads.drawer.types.${activity.type}`)}
                                                        {activity.by ? ` · ${activity.by}` : ""}
                                                        {activity.at ? ` · ${new Date(activity.at).toLocaleString()}` : ""}
                                                    </p>
                                                    {activity.body && <p className="mt-0.5 text-sm text-[#3A3A3A] dark:text-white/85">{activity.body}</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-3 rounded-2xl border border-[#3A3A3A]/8 bg-[#FAFAFA] p-3 dark:border-white/8 dark:bg-[#1b1b20]">
                                    <div className="flex flex-wrap gap-1.5">
                                        {(["note", "call", "email", "whatsapp"] as const).map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setActivityType(type)}
                                                className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${activityType === type ? "bg-[#F47822] text-white" : "bg-white text-[#3A3A3A]/55 dark:bg-[#26262c] dark:text-white/55"}`}
                                            >
                                                {t(`marketing.leads.drawer.types.${type}`)}
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={activityBody}
                                        onChange={(event) => setActivityBody(event.target.value)}
                                        placeholder={t("marketing.leads.drawer.activityPh")}
                                        rows={2}
                                        className="mt-2 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-[#1b1b20]"
                                    />
                                    <button
                                        type="button"
                                        disabled={busy || !activityBody.trim()}
                                        onClick={() => void logActivity()}
                                        className="mt-2 h-9 rounded-xl bg-[#3A3A3A] px-4 text-xs font-bold text-white transition hover:bg-black disabled:opacity-40 dark:bg-[#F47822]"
                                    >
                                        {t("marketing.leads.drawer.addActivity")}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">{t("marketing.leads.drawer.journey")}</p>
                                {detail.journey.length === 0 ? (
                                    <p className="mt-2 text-xs text-[#3A3A3A]/40 dark:text-white/40">{t("marketing.leads.drawer.journeyEmpty")}</p>
                                ) : (
                                    <ol className="mt-3 space-y-1.5 border-s-2 border-[#F47822]/20 ps-4">
                                        {detail.journey.map((event, index) => (
                                            <li key={index} className="text-xs">
                                                <span className="font-bold text-[#3A3A3A] dark:text-[#ececef]">{t(`marketing.leads.drawer.events.${event.event}`, event.event)}</span>
                                                {event.page && <span dir="ltr" className="ms-1 text-[#3A3A3A]/50 rtl:text-end dark:text-white/50">{event.page}</span>}
                                                <span className="ms-1 text-[#3A3A3A]/35 dark:text-white/35">{event.at ? new Date(event.at).toLocaleString() : ""}</span>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </div>

                            <div className="flex justify-between border-t border-[#3A3A3A]/8 pt-4 dark:border-white/8">
                                <button type="button" onClick={() => void remove()} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50">
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {t("marketing.leads.drawer.delete")}
                                </button>
                                <button type="button" onClick={onClose} className="rounded-xl bg-[#3A3A3A] px-5 py-2.5 text-xs font-bold text-white hover:bg-black dark:bg-[#F47822]">
                                    {t("marketing.leads.drawer.close")}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </aside>
        </div>
    );
}

function AddLeadModal({
    team,
    onClose,
    onCreated,
}: {
    team: LeadOwner[];
    onClose: () => void;
    onCreated: () => void;
}) {
    const { t } = useTranslation();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        course_interest: "",
        source: "manual",
        owner_id: "",
        next_follow_up_at: "",
    });

    const field = (key: keyof typeof form) => ({
        value: form[key],
        onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            setForm((current) => ({ ...current, [key]: event.target.value })),
    });

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            await marketingApi.createLead({
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim() || null,
                email: form.email.trim(),
                phone: form.phone.trim() || null,
                subject: form.subject.trim(),
                message: form.message.trim(),
                course_interest: form.course_interest.trim() || null,
                source: form.source.trim() || "manual",
                owner_id: form.owner_id || null,
                next_follow_up_at: form.next_follow_up_at || null,
            });
            onCreated();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("marketing.leads.error"));
        } finally {
            setBusy(false);
        }
    };

    const inputClass = "mt-1 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-[#1b1b20]";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]/45 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#141418]" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("marketing.leads.addModal.title")}</h2>
                    <button type="button" onClick={onClose} aria-label={t("marketing.leads.drawer.close")} className="grid h-9 w-9 place-items-center rounded-xl text-[#3A3A3A]/40 hover:bg-[#3A3A3A]/5">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
                <div className="mt-4 grid grid-cols-2 gap-3">
                    <label className="text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                        {t("marketing.leads.addModal.first")}
                        <input {...field("first_name")} className={inputClass} />
                    </label>
                    <label className="text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                        {t("marketing.leads.addModal.last")}
                        <input {...field("last_name")} className={inputClass} />
                    </label>
                    <label className="col-span-2 text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                        {t("marketing.leads.addModal.email")}
                        <input {...field("email")} type="email" dir="ltr" className={inputClass} />
                    </label>
                    <label className="text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                        {t("marketing.leads.addModal.phone")}
                        <input {...field("phone")} dir="ltr" className={inputClass} />
                    </label>
                    <label className="text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                        {t("marketing.leads.addModal.interest")}
                        <input {...field("course_interest")} className={inputClass} />
                    </label>
                    <label className="col-span-2 text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                        {t("marketing.leads.addModal.subject")}
                        <input {...field("subject")} className={inputClass} />
                    </label>
                    <label className="col-span-2 text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                        {t("marketing.leads.addModal.message")}
                        <textarea {...field("message")} rows={3} className="mt-1 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-[#1b1b20]" />
                    </label>
                    <label className="text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                        {t("marketing.leads.addModal.source")}
                        <input {...field("source")} className={inputClass} />
                    </label>
                    <label className="text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                        {t("marketing.leads.drawer.owner")}
                        <select {...field("owner_id")} className={inputClass}>
                            <option value="">{t("marketing.leads.unassigned")}</option>
                            {team.map((member) => (
                                <option key={member.id} value={member.id}>{member.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="col-span-2 text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                        {t("marketing.leads.drawer.followUp")}
                        <input {...field("next_follow_up_at")} type="date" className={inputClass} />
                    </label>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-xl border border-[#3A3A3A]/10 px-5 py-2.5 text-xs font-bold text-[#3A3A3A]/60 dark:border-white/10 dark:text-white/60">
                        {t("marketing.leads.drawer.close")}
                    </button>
                    <button
                        type="button"
                        disabled={busy || !form.first_name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()}
                        onClick={() => void submit()}
                        className="flex items-center gap-1.5 rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white shadow-[0_7px_16px_rgba(244,120,34,.25)] disabled:opacity-40"
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        {t("marketing.leads.addModal.submit")}
                    </button>
                </div>
            </div>
        </div>
    );
}
