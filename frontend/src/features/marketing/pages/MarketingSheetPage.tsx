import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Upload, Users } from "lucide-react";

import {
    marketingApi,
    LEAD_STATUSES,
    type ConvertedUser,
    type Lead,
    type LeadOwner,
    type LeadStatus,
} from "../api/marketing.api";

type Tab = "sheet" | "customers";

const COLUMNS = ["name", "email", "phone", "status", "score", "owner", "interest", "source", "followUp", "created"] as const;
type ColumnKey = (typeof COLUMNS)[number];

/**
 * The Sales Sheet: a dense, spreadsheet-style grid over the same lead
 * pipeline — inline stage/owner/follow-up editing, CSV import/export.
 * Built in-app (no Google dependency) so it scales with our own data.
 */
export function MarketingSheetPage() {
    const { t } = useTranslation();
    const [tab, setTab] = useState<Tab>("sheet");
    const [rows, setRows] = useState<Lead[]>([]);
    const [customers, setCustomers] = useState<ConvertedUser[]>([]);
    const [team, setTeam] = useState<LeadOwner[]>([]);
    const [summary, setSummary] = useState<{ total: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"" | LeadStatus>("");
    const [busyCells, setBusyCells] = useState<Set<number>>(new Set());
    const [importing, setImporting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const query = useMemo(() => {
        const params = new URLSearchParams({ per_page: "200", sort: "created_at", dir: "asc" });
        if (search.trim()) params.set("search", search.trim());
        if (statusFilter) params.set("status", statusFilter);
        return `?${params.toString()}`;
    }, [search, statusFilter]);

    const load = useCallback(() => {
        let cancelled = false;
        setError(null);
        void marketingApi
            .leads(query)
            .then((response) => {
                if (cancelled) return;
                setRows(response.data);
                setSummary({ total: response.summary.total });
            })
            .catch((cause: unknown) => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : t("marketing.sheet.error"));
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
        if (tab !== "customers") return;
        let cancelled = false;
        void marketingApi
            .convertedUsers("?per_page=50")
            .then((response) => {
                if (!cancelled) setCustomers(response.data);
            })
            .catch((cause: unknown) => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : t("marketing.sheet.error"));
            });
        return () => {
            cancelled = true;
        };
    }, [tab, t]);

    const edit = async (lead: Lead, body: Record<string, unknown>) => {
        setBusyCells((current) => new Set(current).add(lead.id));
        try {
            const updated = await marketingApi.updateLead(lead.id, body);
            setRows((current) => current.map((row) => (row.id === lead.id ? { ...row, ...updated } : row)));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("marketing.sheet.error"));
        } finally {
            setBusyCells((current) => {
                const next = new Set(current);
                next.delete(lead.id);
                return next;
            });
        }
    };

    const exportCsv = async () => {
        try {
            const blob = await marketingApi.exportLeadsCsv(query);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = "sales-sheet.csv";
            anchor.click();
            URL.revokeObjectURL(url);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("marketing.sheet.error"));
        }
    };

    const importFile = async (file: File) => {
        setImporting(true);
        setError(null);
        try {
            const result = await marketingApi.importLeads(file);
            setNotice(result.message ?? t("marketing.sheet.imported"));
            load();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("marketing.sheet.error"));
        } finally {
            setImporting(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const cellInput = "h-8 w-full min-w-[90px] rounded-lg border border-transparent bg-transparent px-2 text-xs outline-none transition focus:border-[#F47822] focus:bg-white dark:focus:bg-[#1b1b20]";

    return (
        <main className="mx-auto max-w-[1500px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">{t("marketing.shared.eyebrow")}</p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">{t("marketing.sheet.title")}</h1>
                    <p className="mt-1 text-sm text-[#3A3A3A]/55 dark:text-white/55">
                        {summary
                            ? t("marketing.sheet.summary", { rows: rows.length, total: summary.total })
                            : t("marketing.shared.loading")}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1 rounded-xl border border-[#3A3A3A]/8 bg-white p-1 shadow-sm dark:border-white/8 dark:bg-[#1b1b20]">
                        {(["sheet", "customers"] as const).map((entry) => (
                            <button
                                key={entry}
                                type="button"
                                onClick={() => setTab(entry)}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${tab === entry ? "bg-[#3A3A3A] text-white dark:bg-[#F47822]" : "text-[#3A3A3A]/55 hover:text-[#3A3A3A] dark:text-white/55"}`}
                            >
                                {entry === "customers" && <Users className="h-3.5 w-3.5" />}
                                {t(`marketing.sheet.tabs.${entry}`)}
                            </button>
                        ))}
                    </div>
                    {tab === "sheet" && (
                        <>
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                disabled={importing}
                                className="flex h-9 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs font-bold text-[#3A3A3A]/70 shadow-sm transition hover:-translate-y-0.5 hover:border-[#F47822]/35 hover:text-[#F47822] disabled:opacity-50 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/70"
                            >
                                <Upload className="h-3.5 w-3.5" />
                                {t("marketing.sheet.import")}
                            </button>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".csv,text/csv"
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) void importFile(file);
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => void exportCsv()}
                                className="flex h-9 items-center gap-1.5 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white shadow-[0_7px_16px_rgba(244,120,34,.25)] transition hover:-translate-y-0.5"
                            >
                                <Download className="h-3.5 w-3.5" />
                                {t("marketing.sheet.export")}
                            </button>
                        </>
                    )}
                </div>
            </header>

            {notice && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
            {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">{error}</p>}

            {tab === "sheet" ? (
                <>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={t("marketing.leads.searchPh")}
                            className="h-9 min-w-[220px] flex-1 rounded-xl border border-[#3A3A3A]/10 bg-white px-4 text-sm outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-[#1b1b20]"
                        />
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value as "" | LeadStatus)}
                            className="h-9 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs font-bold text-[#3A3A3A]/70 outline-none dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/70"
                        >
                            <option value="">{t("marketing.leads.filters.all")}</option>
                            {LEAD_STATUSES.map((status) => (
                                <option key={status} value={status}>{t(`marketing.leads.filters.${status}`)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="overflow-x-auto rounded-3xl border border-[#3A3A3A]/8 bg-white shadow-sm dark:border-white/8 dark:bg-[#1b1b20]">
                        <table className="w-full min-w-[1100px] text-start text-xs">
                            <thead className="sticky top-0 z-10 bg-[#FAFAFA] dark:bg-[#141418]">
                                <tr className="border-b border-[#3A3A3A]/8 text-[10px] uppercase tracking-[0.12em] text-[#3A3A3A]/40 dark:text-white/40">
                                    <th className="px-3 py-2.5 text-start font-bold">#</th>
                                    {COLUMNS.map((column) => (
                                        <th key={column} className="px-3 py-2.5 text-start font-bold">
                                            {t(`marketing.sheet.columns.${column}`)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((lead) => (
                                    <tr key={lead.id} className={`border-b border-[#3A3A3A]/5 last:border-0 hover:bg-[#F47822]/3 dark:hover:bg-white/3 ${busyCells.has(lead.id) ? "opacity-60" : ""}`}>
                                        <td className="px-3 py-1 text-[10px] text-[#3A3A3A]/35 dark:text-white/35">{lead.id}</td>
                                        <td className="px-1 py-1">
                                            <input
                                                defaultValue={lead.name ?? ""}
                                                onBlur={(event) => {
                                                    const value = event.target.value.trim();
                                                    const [first_name, ...rest] = value.split(" ");
                                                    if (value !== (lead.name ?? "")) {
                                                        void edit(lead, { first_name: first_name || lead.name || "Lead", last_name: rest.join(" ") || null });
                                                    }
                                                }}
                                                className={cellInput}
                                            />
                                        </td>
                                        <td className="px-1 py-1">
                                            <input
                                                dir="ltr"
                                                defaultValue={lead.email ?? ""}
                                                onBlur={(event) => {
                                                    const value = event.target.value.trim();
                                                    if (value && value !== lead.email) void edit(lead, { email: value });
                                                }}
                                                className={cellInput}
                                            />
                                        </td>
                                        <td className="px-1 py-1">
                                            <input dir="ltr" defaultValue={lead.phone ?? ""} onBlur={(event) => {
                                                const value = event.target.value.trim();
                                                if (value !== (lead.phone ?? "")) void edit(lead, { phone: value || null });
                                            }} className={cellInput} />
                                        </td>
                                        <td className="px-1 py-1">
                                            <select
                                                value={lead.status}
                                                onChange={(event) => void edit(lead, { status: event.target.value })}
                                                className={`${cellInput} font-bold`}
                                            >
                                                {LEAD_STATUSES.map((status) => (
                                                    <option key={status} value={status}>{t(`marketing.leads.filters.${status}`)}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-3 py-1 text-xs font-bold text-[#3A3A3A] dark:text-white/85">{lead.score}</td>
                                        <td className="px-1 py-1">
                                            <select
                                                value={lead.owner?.id ?? ""}
                                                onChange={(event) => void edit(lead, { owner_id: event.target.value || null })}
                                                className={cellInput}
                                            >
                                                <option value="">{t("marketing.leads.unassigned")}</option>
                                                {team.map((member) => (
                                                    <option key={member.id} value={member.id}>{member.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-1 py-1">
                                            <input
                                                defaultValue={lead.course_interest ?? ""}
                                                onBlur={(event) => {
                                                    const value = event.target.value.trim();
                                                    if (value !== (lead.course_interest ?? "")) void edit(lead, { course_interest: value || null });
                                                }}
                                                className={cellInput}
                                            />
                                        </td>
                                        <td className="px-3 py-1 text-[11px] text-[#3A3A3A]/60 dark:text-white/60">{lead.source ?? "—"}</td>
                                        <td className="px-1 py-1">
                                            <input
                                                type="date"
                                                defaultValue={lead.next_follow_up_at ? lead.next_follow_up_at.slice(0, 10) : ""}
                                                onChange={(event) => void edit(lead, { next_follow_up_at: event.target.value || null })}
                                                className={cellInput}
                                            />
                                        </td>
                                        <td className="px-3 py-1 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "—"}
                                        </td>
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={COLUMNS.length + 1} className="px-4 py-10 text-center text-xs text-[#3A3A3A]/40 dark:text-white/40">
                                            {t("marketing.leads.empty.title")}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="overflow-x-auto rounded-3xl border border-[#3A3A3A]/8 bg-white shadow-sm dark:border-white/8 dark:bg-[#1b1b20]">
                    <table className="w-full min-w-[900px] text-start text-sm">
                        <thead>
                            <tr className="border-b border-[#3A3A3A]/8 text-[10px] uppercase tracking-[0.12em] text-[#3A3A3A]/40 dark:text-white/40">
                                <th className="px-4 py-3 text-start font-bold">{t("marketing.sheet.customers.name")}</th>
                                <th className="px-4 py-3 text-start font-bold">{t("marketing.sheet.customers.joined")}</th>
                                <th className="px-4 py-3 text-start font-bold">{t("marketing.sheet.customers.source")}</th>
                                <th className="px-4 py-3 text-start font-bold">{t("marketing.sheet.customers.course")}</th>
                                <th className="px-4 py-3 text-start font-bold">{t("marketing.sheet.customers.enrollments")}</th>
                                <th className="px-4 py-3 text-start font-bold">{t("marketing.sheet.customers.paid")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((customer) => (
                                <tr key={customer.id} className="border-b border-[#3A3A3A]/5 last:border-0 hover:bg-[#F47822]/3 dark:hover:bg-white/3">
                                    <td className="px-4 py-2.5">
                                        <p className="font-bold text-[#3A3A3A] dark:text-[#ececef]">{customer.name}</p>
                                        <p dir="ltr" className="text-xs text-[#3A3A3A]/50 rtl:text-end dark:text-white/50">{customer.email}</p>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-[#3A3A3A]/60 dark:text-white/60">
                                        {customer.joined_at ? new Date(customer.joined_at).toLocaleDateString() : "—"}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-[#3A3A3A]/60 dark:text-white/60">{customer.source ?? "—"}</td>
                                    <td className="px-4 py-2.5 text-xs text-[#3A3A3A]/60 dark:text-white/60">{customer.first_course ?? customer.course_interest ?? "—"}</td>
                                    <td className="px-4 py-2.5 text-xs font-bold text-[#3A3A3A] dark:text-white/85">{customer.enrollments}</td>
                                    <td className="px-4 py-2.5 text-xs font-bold text-emerald-600">{customer.paid_total} DZD</td>
                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-xs text-[#3A3A3A]/40 dark:text-white/40">
                                        {t("marketing.sheet.customers.empty")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}
