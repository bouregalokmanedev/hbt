import { useDeferredValue, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Search, UserCheck, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { adminApi } from "../api/adminApi";
import type { AdminSupportTicket } from "../types/admin";
import {
  AdminHeading,
  AdminPanel,
  ErrorAdminPage,
  LoadingAdminPage,
  PageControls,
} from "../components/AdminUi";
import { SupportTicketDrawer } from "../components/SupportTicketDrawer";

export function AdminSupportPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [level, setLevel] = useState("");
  const [assigned, setAssigned] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const deferred = useDeferredValue(search);
  const client = useQueryClient();

  const tickets = useQuery({
    queryKey: ["admin", "support", deferred, status, level, assigned, overdueOnly, page],
    queryFn: () =>
      adminApi.supportTickets({
        search: deferred,
        status: status || undefined,
        level: level || undefined,
        assigned: assigned || undefined,
        overdue: overdueOnly ? "true" : undefined,
        page,
        per_page: 12,
      }),
  });

  if (tickets.isLoading) return <LoadingAdminPage />;
  if (tickets.isError || !tickets.data) return <ErrorAdminPage onRetry={() => void tickets.refetch()} />;

  const data = tickets.data;
  const summary = (data as { summary?: Record<string, number> }).summary ?? { open: 0, pending: 0, overdue: 0, unassigned: 0 };
  const rows: AdminSupportTicket[] = Array.isArray((data as { data?: AdminSupportTicket[] }).data) ? (data as { data: AdminSupportTicket[] }).data : [];
  const selected: AdminSupportTicket | undefined = selectedId
    ? rows.find((entry) => entry.id === selectedId)
    : undefined;

  const reset = () => {
    setSearch("");
    setStatus("");
    setLevel("");
    setAssigned("");
    setOverdueOnly(false);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <AdminHeading
        eyebrow={t("admin.support.eyebrow")}
        title={t("admin.support.title")}
        description={t("admin.support.description")}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Mini label={t("admin.support.metrics.open")} value={summary.open ?? 0} tone="amber" />
        <Mini label={t("admin.support.metrics.pending")} value={summary.pending ?? 0} tone="brand" />
        <Mini label={t("admin.support.metrics.overdue")} value={summary.overdue ?? 0} tone="red" />
        <Mini label={t("admin.support.metrics.unassigned")} value={summary.unassigned ?? 0} tone="dark" />
      </div>

      <AdminPanel>
        <div className="flex flex-wrap gap-3">
          <label className="relative min-w-[200px] flex-1">
            <Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/40 ${isRTL ? "right-3" : "left-3"}`} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("admin.support.searchPh")}
              className={`h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] text-sm outline-none transition focus:border-[#F47822] ${isRTL ? "pl-3 pr-10" : "pl-10 pr-3"}`}
            />
          </label>
          <FilterSelect value={status} onChange={setStatus} setPage={setPage} options={[["", t("admin.support.filters.allStatuses")], ["open", t("admin.support.filters.open")], ["pending", t("admin.support.filters.pending")], ["resolved", t("admin.support.filters.resolved")], ["closed", t("admin.support.filters.closed")]]} />
          <FilterSelect value={level} onChange={setLevel} setPage={setPage} options={[["", t("admin.support.filters.allLevels")], ["support", t("admin.support.filters.support")], ["admin", t("admin.support.filters.admin")], ["super_admin", t("admin.support.filters.superAdmin")]]} />
          <FilterSelect value={assigned} onChange={setAssigned} setPage={setPage} options={[["", t("admin.support.filters.anyAssignee")], ["me", t("admin.support.filters.assignedToMe")], ["unassigned", t("admin.support.filters.unassigned")]]} />
          <button
            type="button"
            onClick={() => {
              setOverdueOnly((value) => !value);
              setPage(1);
            }}
            className={`inline-flex h-11 items-center rounded-xl border px-4 text-xs font-bold transition ${
              overdueOnly ? "border-red-300 bg-red-50 text-red-600" : "border-[#3A3A3A]/10 text-[#3A3A3A]/60 hover:text-red-600"
            }`}
          >
            {t("admin.support.overdueOnly")}
          </button>
          {(search || status || level || assigned || overdueOnly) && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 px-4 text-xs font-bold text-[#3A3A3A]/60 transition hover:border-[#F47822]/40 hover:text-[#F47822]"
            >
              <X className="h-3.5 w-3.5" /> {t("admin.support.clear")}
            </button>
          )}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left rtl:text-right">
            <thead className="border-b border-[#3A3A3A]/8 text-[10px] font-bold uppercase tracking-[.13em] text-[#3A3A3A]/40">
              <tr>
                <th className="pb-3">{t("admin.support.headers.ticket")}</th>
                <th className="pb-3">{t("admin.support.headers.student")}</th>
                <th className="pb-3">{t("admin.support.headers.priority")}</th>
                <th className="pb-3">{t("admin.support.headers.status")}</th>
                <th className="pb-3">{t("admin.support.headers.level")}</th>
                <th className="pb-3">{t("admin.support.headers.assignee")}</th>
                <th className="pb-3 text-right rtl:text-left">{t("admin.support.headers.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3A3A3A]/7">
              {rows.map((ticket) => (
                <tr key={ticket.id} className="transition hover:bg-[#FCFCFC]">
                  <td className="py-4">
                    <button type="button" onClick={() => setSelectedId(ticket.id)} className="max-w-xs text-left rtl:text-right">
                      <span className="flex items-center gap-1.5 text-sm font-semibold hover:text-[#F47822]">
                        {ticket.overdue && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" title={t("admin.support.overdueTitle")} />}
                        <span className="truncate">{ticket.subject}</span>
                      </span>
                      <span className="mt-0.5 block text-xs capitalize text-[#3A3A3A]/45">{ticket.category}</span>
                    </button>
                  </td>
                  <td className="py-4 text-xs text-[#3A3A3A]/60">{ticket.user ?? "—"}</td>
                  <td className="py-4">
                    <PriorityPill priority={ticket.priority} />
                  </td>
                  <td className="py-4">
                    <StatusPill status={ticket.status} />
                  </td>
                  <td className="py-4 text-xs font-bold capitalize text-[#3A3A3A]/60">
                    {ticket.level.replace("_", " ")}
                  </td>
                  <td className="py-4 text-xs text-[#3A3A3A]/60">
                    {ticket.assignee ?? <span className="text-[#3A3A3A]/35">{t("admin.support.unassigned")}</span>}
                  </td>
                  <td className="py-4 text-right rtl:text-left">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(ticket.id);
                        void client.invalidateQueries({ queryKey: ["admin", "support", "ticket"] });
                      }}
                      className="rounded-lg border border-[#3A3A3A]/10 px-3 py-2 text-xs font-bold text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                    >
                      {t("admin.support.open")}
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <Inbox className="mx-auto h-8 w-8 text-[#3A3A3A]/20" />
                    <p className="mt-3 text-sm text-[#3A3A3A]/45">{t("admin.support.empty")}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5">
          <PageControls page={data.meta.current_page} lastPage={data.meta.last_page} onPage={setPage} />
        </div>
      </AdminPanel>

      {selected && <SupportTicketDrawer ticketId={selected.id} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: number; tone: "amber" | "brand" | "red" | "dark" }) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    brand: "bg-[#F47822]/10 text-[#F47822]",
    red: "bg-red-50 text-red-500",
    dark: "bg-[#3A3A3A]/8 text-[#3A3A3A]",
  } as const;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#3A3A3A]/8 bg-white px-4 py-3.5 shadow-[0_4px_14px_rgba(58,58,58,.04)]">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>
        <UserCheck className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-[10px] font-bold uppercase tracking-[.12em] text-[#3A3A3A]/42">{label}</span>
        <span className="mt-0.5 block text-lg font-bold leading-none">{value}</span>
      </span>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  setPage,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  setPage: (value: number) => void;
  options: Array<[string, string]>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
        setPage(1);
      }}
      className="h-11 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-xs font-semibold capitalize text-[#3A3A3A]/70 outline-none transition focus:border-[#F47822]"
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue || "all"} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function PriorityPill({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    urgent: "bg-red-50 text-red-600",
    high: "bg-amber-50 text-amber-700",
    normal: "bg-[#3A3A3A]/8 text-[#3A3A3A]/60",
    low: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${styles[priority] ?? styles.normal}`}>
      {priority}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-[#F47822]/10 text-[#F47822]",
    pending: "bg-amber-50 text-amber-700",
    resolved: "bg-emerald-50 text-emerald-700",
    closed: "bg-[#3A3A3A]/8 text-[#3A3A3A]/55",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${styles[status] ?? styles.closed}`}>
      {status}
    </span>
  );
}
