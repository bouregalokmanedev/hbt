import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/lib/api/errors";

import { adminApi } from "../api/adminApi";
import { ErrorAdminPage, LoadingAdminPage } from "./AdminUi";
import { PriorityPill, StatusPill } from "../pages/AdminSupportPage";

function errorMessage(reason: unknown, fallback: string): string {
  if (reason instanceof ApiError && reason.errors) {
    const first = Object.values(reason.errors).flat().find((item): item is string => typeof item === "string");
    if (first) return first;
  }
  return reason instanceof Error ? reason.message : fallback;
}

export function SupportTicketDrawer({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const client = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [escalating, setEscalating] = useState(false);
  const [escalateLevel, setEscalateLevel] = useState("admin");
  const [escalateNote, setEscalateNote] = useState("");

  const detail = useQuery({
    queryKey: ["admin", "support", "ticket", ticketId],
    queryFn: () => adminApi.supportTicketDetail(ticketId),
  });

  const staff = useQuery({
    queryKey: ["admin", "support", "staff"],
    queryFn: () => adminApi.users({ per_page: 100 }),
  });

  const run = async (key: string, work: () => Promise<unknown>, success: string, close = false) => {
    if (busy !== null) return;
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await work();
      await client.invalidateQueries({ queryKey: ["admin", "support"] });
      setNotice(success);
      if (close) onClose();
    } catch (reason) {
      setError(errorMessage(reason, t("admin.drawers.ticket.actionError")));
    } finally {
      setBusy(null);
    }
  };

  const staffOptions = (staff.data?.data ?? []).filter((entry) =>
    (entry.roles ?? []).some((role) => ["Support", "Admin", "Super Admin"].includes(role)),
  );

  const resolveAssignee = () => {
    const match = staffOptions.find((entry) => entry.email.toLowerCase() === assigneeEmail.trim().toLowerCase());
    return match?.id ?? null;
  };

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={t("admin.drawers.ticket.dialogAria")}>
      <button type="button" aria-label={t("admin.drawers.ticket.closeTicket")} onClick={onClose} className="absolute inset-0 bg-[#3A3A3A]/45 backdrop-blur-[2px]" />
      <aside className="absolute inset-y-0 end-0 flex w-full max-w-xl flex-col overflow-hidden bg-[#F7F7F7] shadow-2xl">
        <div className="h-1.5 w-full bg-[#F47822]" />
        <div className="flex items-start justify-between gap-3 border-b border-[#3A3A3A]/8 bg-white p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">{t("admin.drawers.ticket.eyebrow")}</p>
            <h2 className="mt-1 truncate text-lg font-bold text-[#3A3A3A]">{detail.data?.subject ?? t("admin.drawers.ticket.loadingTitle")}</h2>
            {detail.data && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <StatusPill status={detail.data.status} />
                <PriorityPill priority={detail.data.priority} />
                <span className="rounded-full bg-[#3A3A3A]/5 px-2.5 py-1 text-[10px] font-bold capitalize text-[#3A3A3A]/55">
                  {detail.data.level.replace("_", " ")} · {detail.data.category}
                </span>
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label={t("admin.drawers.ticket.close")} className="rounded-lg p-1.5 text-[#3A3A3A]/45 transition hover:bg-[#F3F3F3] hover:text-[#3A3A3A]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {notice && (
            <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {notice}
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {detail.isLoading && <LoadingAdminPage />}
          {detail.isError && <ErrorAdminPage onRetry={() => void detail.refetch()} />}
          {detail.data && (
            <>
              <section className="rounded-2xl bg-white px-4 py-3 text-xs leading-5 text-[#3A3A3A]/60">
                <p>
                  {t("admin.drawers.ticket.from")} <strong className="text-[#3A3A3A]">{detail.data.user ?? "—"}</strong> ({detail.data.email ?? "—"})
                </p>
                <p className="mt-1">
                  {t("admin.drawers.ticket.assigneeLabel")} <strong className="text-[#3A3A3A]">{detail.data.assignee ?? t("admin.drawers.ticket.unassigned")}</strong>
                  {detail.data.due_at && (
                    <> · {t("admin.drawers.ticket.duePrefix")} {new Date(detail.data.due_at).toLocaleString(i18n.language)}{detail.data.overdue ? ` ${t("admin.drawers.ticket.overdueSuffix")}` : ""}</>
                  )}
                </p>
              </section>

              <section>
                <SectionTitle>{t("admin.drawers.ticket.conversation")}</SectionTitle>
                <ul className="mt-2.5 space-y-2">
                  {detail.data.replies.map((reply) => (
                    <li
                      key={reply.id}
                      className={`rounded-2xl px-4 py-3 ${
                        reply.internal ? "border border-dashed border-[#3A3A3A]/20 bg-[#F1F1F1]" : "bg-white"
                      }`}
                    >
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#3A3A3A]/45">
                        {reply.internal && <Lock className="h-3 w-3" />}
                        {reply.internal ? `${t("admin.drawers.ticket.internal")} · ${reply.author ?? t("admin.drawers.ticket.staffFallback")}` : (reply.author ?? t("admin.drawers.ticket.studentFallback"))}
                        <span className="font-normal normal-case tracking-normal">
                          · {reply.created_at ? new Date(reply.created_at).toLocaleString(i18n.language) : "—"}
                        </span>
                      </p>
                      <p className="mt-1.5 whitespace-pre-line text-xs leading-5 text-[#3A3A3A]/75">{reply.body}</p>
                    </li>
                  ))}
                </ul>
              </section>

              {detail.data.status !== "closed" && (
                <section className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-4">
                  <SectionTitle>{t("admin.drawers.ticket.reply")}</SectionTitle>
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={3}
                    placeholder={t("admin.drawers.ticket.replyPh")}
                    className="mt-2.5 w-full resize-none rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3.5 py-2.5 text-xs leading-5 outline-none transition focus:border-[#F47822]"
                  />
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#3A3A3A]/65">
                      <input
                        type="checkbox"
                        checked={internal}
                        onChange={(event) => setInternal(event.target.checked)}
                        className="h-4 w-4 rounded accent-[#3A3A3A]"
                      />
                      {t("admin.drawers.ticket.internalNote")}
                    </label>
                    <button
                      type="button"
                      disabled={busy !== null || !reply.trim()}
                      onClick={() => {
                        const body = reply.trim();
                        setReply("");
                        void run("reply", () => adminApi.supportReply(ticketId, body, internal), internal ? t("admin.drawers.ticket.notices.noteSaved") : t("admin.drawers.ticket.notices.replySent"));
                      }}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white transition hover:bg-[#e96916] disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5 rtl:-scale-x-100" /> {t("admin.drawers.ticket.send")}
                    </button>
                  </div>
                </section>
              )}

              <section className="grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-4">
                  <SectionTitle>{t("admin.drawers.ticket.assignTitle")}</SectionTitle>
                  {!assigning ? (
                    <button
                      type="button"
                      onClick={() => setAssigning(true)}
                      className="mt-2.5 w-full rounded-xl border border-[#3A3A3A]/10 px-3 py-2.5 text-xs font-bold text-[#3A3A3A]/65 transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                    >
                      {detail.data.assignee ? t("admin.drawers.ticket.reassignNow", { name: detail.data.assignee }) : t("admin.drawers.ticket.assignAgent")}
                    </button>
                  ) : (
                    <div className="mt-2.5 grid gap-2">
                      <input
                        value={assigneeEmail}
                        onChange={(event) => setAssigneeEmail(event.target.value)}
                        placeholder={t("admin.drawers.ticket.agentEmailPh")}
                        list="support-staff"
                        className="h-10 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-xs outline-none focus:border-[#F47822]"
                      />
                      <datalist id="support-staff">
                        {staffOptions.map((entry) => (
                          <option key={entry.id} value={entry.email}>
                            {entry.first_name} {entry.last_name} · {(entry.roles ?? []).join(", ")}
                          </option>
                        ))}
                      </datalist>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy !== null || !resolveAssignee()}
                          onClick={() => {
                            const uuid = resolveAssignee();
                            if (!uuid) return;
                            setAssigning(false);
                            void run("assign", () => adminApi.supportAssign(ticketId, uuid), t("admin.drawers.ticket.notices.assigned"));
                          }}
                          className="flex-1 rounded-xl bg-[#3A3A3A] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#F47822] disabled:opacity-50"
                        >
                          {t("admin.drawers.ticket.confirm")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssigning(false)}
                          className="rounded-xl border border-[#3A3A3A]/10 px-3 py-2.5 text-xs font-bold text-[#3A3A3A]/60"
                        >
                          {t("admin.drawers.ticket.cancel")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                  <SectionTitle>{t("admin.drawers.ticket.escalateTitle")}</SectionTitle>
                  {!escalating ? (
                    <button
                      type="button"
                      onClick={() => setEscalating(true)}
                      className="mt-2.5 w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-xs font-bold text-amber-700 transition hover:bg-amber-50"
                    >
                      {t("admin.drawers.ticket.escalateUpward")}
                    </button>
                  ) : (
                    <div className="mt-2.5 grid gap-2">
                      <select
                        value={escalateLevel}
                        onChange={(event) => setEscalateLevel(event.target.value)}
                        className="h-10 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs font-semibold outline-none focus:border-[#F47822]"
                      >
                        <option value="admin">{t("admin.drawers.ticket.adminLevel")}</option>
                        <option value="super_admin">{t("admin.drawers.ticket.superAdminLevel")}</option>
                      </select>
                      <input
                        value={escalateNote}
                        onChange={(event) => setEscalateNote(event.target.value)}
                        placeholder={t("admin.drawers.ticket.escalateNotePh")}
                        className="h-10 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs outline-none focus:border-[#F47822]"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => {
                            setEscalating(false);
                            void run("escalate", () => adminApi.supportEscalate(ticketId, escalateLevel, escalateNote || undefined), t("admin.drawers.ticket.notices.escalated"));
                          }}
                          className="flex-1 rounded-xl bg-amber-500 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-50"
                        >
                          {t("admin.drawers.ticket.confirm")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEscalating(false)}
                          className="rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-2.5 text-xs font-bold text-[#3A3A3A]/60"
                        >
                          {t("admin.drawers.ticket.cancel")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {detail.data.status !== "closed" && (
                <section className="flex flex-wrap gap-2">
                  {detail.data.status !== "resolved" && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void run("resolve", () => adminApi.supportResolve(ticketId), t("admin.drawers.ticket.notices.resolved"))}
                      className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {t("admin.drawers.ticket.markResolved")}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void run("close", () => adminApi.supportClose(ticketId), t("admin.drawers.ticket.notices.closed"), true)}
                    className="flex-1 rounded-xl bg-[#3A3A3A] px-4 py-3 text-xs font-bold text-white transition hover:bg-black disabled:opacity-60"
                  >
                    {t("admin.drawers.ticket.closeTicket")}
                  </button>
                </section>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3A3A3A]/45">{children}</h3>;
}
