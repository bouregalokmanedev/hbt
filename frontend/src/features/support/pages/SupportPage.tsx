import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LifeBuoy, Plus, Send, X } from "lucide-react";

import { useTranslation } from "react-i18next";
import { supportApi, type SupportTicket } from "../api/support.api";
import { SupportThread } from "../components/SupportThread";

const CATEGORIES = ["general", "courses", "certification", "simulator", "technical", "billing", "account", "other"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export function SupportPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const client = useQueryClient();
  const tickets = useQuery({ queryKey: ["support", "tickets", page], queryFn: () => supportApi.list(page) });

  const create = async () => {
    if (!subject.trim() || message.trim().length < 10 || sending) return;
    setSending(true);
    setError(null);
    try {
      const created = await supportApi.create({
        subject: subject.trim(),
        category,
        priority,
        message: message.trim(),
      });
      setSubject("");
      setMessage("");
      setCategory("general");
      setPriority("normal");
      setComposing(false);
      setSelectedId(created.id);
      setNotice(t("support.created"));
      await client.invalidateQueries({ queryKey: ["support", "tickets"] });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("support.createFail"));
    } finally {
      setSending(false);
    }
  };

  const openCount = tickets.data?.items.filter((ticket) => ticket.status === "open" || ticket.status === "pending").length ?? 0;

  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        <section className="overflow-hidden rounded-3xl bg-[#3A3A3A] p-7 text-white shadow-[0_12px_35px_rgba(58,58,58,0.12)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("support.eyebrow")}</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="flex items-center gap-2.5 text-2xl font-bold">
                {t("support.title")}
                <LifeBuoy className="h-6 w-6 text-[#F47822]" />
              </h1>
              <p className="mt-1 text-sm text-white/60">{t("support.description")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex min-w-[142px] items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-3.5 py-3 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822] text-white shadow-[0_6px_16px_rgba(244,120,34,0.25)]"><LifeBuoy className="h-5 w-5" /></div>
                <div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">{t("support.openTickets")}</p><p className="mt-0.5 text-lg font-bold leading-none text-white">{openCount}</p></div>
              </div>
              <button
                type="button"
                onClick={() => setComposing((open) => !open)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,.25)] transition hover:bg-[#E96D18]"
              >
                {composing ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {composing ? t("support.cancel") : t("support.newTicket")}
              </button>
            </div>
          </div>
        </section>

        {notice && (
          <div role="status" className="mt-6 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {notice}
          </div>
        )}
        {error && (
          <div role="alert" className="mt-6 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {composing && (
          <section className="mt-6 rounded-3xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] dark:bg-[#1b1b20] p-6 shadow-[0_8px_30px_rgba(58,58,58,0.05)]">
            <h2 className="text-base font-bold text-[#3A3A3A] dark:text-[#ececef] dark:text-[#ececef]">{t("support.formTitle")}</h2>
            <div className="mt-4 grid gap-3">
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={t("support.subjectPh")}
                className="h-12 rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-[#FCFCFC] dark:bg-[#232329] dark:bg-[#232329] px-4 text-sm outline-none transition focus:border-[#F47822]"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-[#FCFCFC] dark:bg-[#232329] dark:bg-[#232329] px-3 text-sm font-semibold capitalize outline-none focus:border-[#F47822]">
                  {CATEGORIES.map((entry) => (
                    <option key={entry} value={entry}>
                      {t(`support.categories.${entry}`)}
                    </option>
                  ))}
                </select>
                <select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-12 rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-[#FCFCFC] dark:bg-[#232329] dark:bg-[#232329] px-3 text-sm font-semibold capitalize outline-none focus:border-[#F47822]">
                  {PRIORITIES.map((entry) => (
                    <option key={entry} value={entry}>
                      {t("support.prioritySuffix", { entry: t(`support.priorities.${entry}`) })}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                placeholder={t("support.messagePh")}
                className="w-full resize-none rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-[#FCFCFC] dark:bg-[#232329] dark:bg-[#232329] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#F47822]"
              />
              <button
                type="button"
                disabled={sending || !subject.trim() || message.trim().length < 10}
                onClick={() => void create()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F47822] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,.22)] transition hover:bg-[#E96D18] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {sending ? t("support.sending") : t("support.sendTicket")}
              </button>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-3xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] dark:bg-[#1b1b20] p-4 shadow-[0_8px_30px_rgba(58,58,58,0.05)] sm:p-6">
          <h2 className="text-base font-bold text-[#3A3A3A] dark:text-[#ececef] dark:text-[#ececef]">{t("support.myTickets")}</h2>
          {tickets.isLoading && <p className="mt-3 text-sm text-[#3A3A3A]/50 dark:text-white/50">{t("support.loading")}</p>}
          {tickets.isError && (
            <div className="mt-4 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-6 py-8 text-center">
              <p className="text-sm font-bold text-red-700 dark:text-red-400">{t("support.loadFail")}</p>
              <button
                type="button"
                onClick={() => void tickets.refetch()}
                className="mt-3 rounded-xl bg-[#3A3A3A] px-4 py-2 text-xs font-bold text-white transition hover:bg-black"
              >
                {t("support.retry")}
              </button>
            </div>
          )}
          {tickets.data && tickets.data.items.length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-[#3A3A3A]/15 dark:border-white/15 bg-[#FCFCFC] dark:bg-[#232329] dark:bg-[#232329] px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F47822]/10">
                <LifeBuoy className="h-7 w-7 text-[#F47822]" />
              </div>
              <p className="mt-4 text-sm font-bold text-[#3A3A3A] dark:text-[#ececef] dark:text-[#ececef]">{t("support.emptyTitle")}</p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">{t("support.emptyDesc")}</p>
              {!composing && (
                <button
                  type="button"
                  onClick={() => setComposing(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,.22)] transition hover:bg-[#E96D18]"
                >
                  <Plus className="h-4 w-4" />
                  {t("support.emptyCta")}
                </button>
              )}
            </div>
          )}
          {tickets.data && tickets.data.items.length > 0 && (
            <ul className="mt-4 space-y-2.5">
              {tickets.data.items.map((ticket: SupportTicket) => (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(ticket.id);
                      setNotice(null);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-start transition ${
                      selectedId === ticket.id
                        ? "border-[#F47822]/50 bg-[#F47822]/5"
                        : "border-[#3A3A3A]/8 dark:border-white/8 bg-[#FCFCFC] dark:bg-[#232329] dark:bg-[#232329] hover:border-[#F47822]/30"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[#3A3A3A] dark:text-[#ececef] dark:text-[#ececef]">{ticket.subject}</span>
                      <span className="mt-1 block text-[11px] capitalize text-[#3A3A3A]/50 dark:text-white/50">
                        {ticket.status} · {t(`support.priorities.${ticket.priority}`)} · {t("support.replies", { count: ticket.replies_count })}
                      </span>
                    </span>
                    <StatusDot status={ticket.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {tickets.data && tickets.data.meta.last_page > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-[#3A3A3A]/50 dark:text-white/50">
              <span>
                {t("support.pageOf", { current: tickets.data.meta.current_page, total: tickets.data.meta.last_page })}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  className="rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 px-3 py-2 font-bold disabled:opacity-40"
                >
                  {t("support.prev")}
                </button>
                <button
                  type="button"
                  disabled={page >= tickets.data.meta.last_page}
                  onClick={() => setPage((value) => value + 1)}
                  className="rounded-lg bg-[#3A3A3A] px-3 py-2 font-bold text-white disabled:opacity-40"
                >
                  {t("support.next")}
                </button>
              </div>
            </div>
          )}
        </section>

        {selectedId && (
          <SupportThread
            ticketId={selectedId}
            onClose={() => setSelectedId(null)}
            onChanged={() => {
              void tickets.refetch();
            }}
          />
        )}
      </div>
    </main>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "bg-[#F47822]",
    pending: "bg-amber-400",
    resolved: "bg-emerald-500",
    closed: "bg-[#3A3A3A]/25 dark:bg-white/25",
  };
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#3A3A3A]/5 dark:bg-white/5 px-2.5 py-1 text-[10px] font-bold capitalize text-[#3A3A3A]/60 dark:text-white/60">
      <span className={`h-1.5 w-1.5 rounded-full ${colors[status] ?? colors.closed}`} />
      {status}
    </span>
  );
}
