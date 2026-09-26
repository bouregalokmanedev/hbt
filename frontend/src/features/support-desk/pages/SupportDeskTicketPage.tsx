import { ArrowLeft, Loader2, Send, StickyNote } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { supportDeskApi, type DeskTicketDetails } from "../api/supportDesk.api";

export function SupportDeskTicketPage() {
    const { t } = useTranslation();
    const { ticketId } = useParams<{ ticketId: string }>();
    const { user } = useAuth();
    const [ticket, setTicket] = useState<DeskTicketDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [draft, setDraft] = useState("");
    const [internal, setInternal] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!ticketId) return;
        try {
            setTicket(await supportDeskApi.get(ticketId));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("supportDesk.ticket.loadFail"));
        }
    }, [ticketId, t]);

    useEffect(() => {
        void load();
    }, [load]);

    const run = async (label: string, task: () => Promise<DeskTicketDetails | unknown>) => {
        if (!ticketId || busy) return;
        setBusy(label);
        setError(null);
        try {
            const result = await task();
            if (result && typeof result === "object" && "id" in (result as Record<string, unknown>)) {
                setTicket(result as DeskTicketDetails);
            } else {
                await load();
            }
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("supportDesk.ticket.actionFail"));
        } finally {
            setBusy(null);
        }
    };

    const sendReply = () => {
        if (!draft.trim()) return;
        void run("reply", async () => {
            const updated = await supportDeskApi.reply(ticketId ?? "", { message: draft.trim(), internal });
            setDraft("");
            setInternal(false);
            return updated;
        });
    };

    if (error && !ticket) {
        return (
            <main className="mx-auto max-w-4xl px-4 py-6">
                <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
                <Link to="/support-desk/tickets" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#F47822]">
                    <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" /> {t("supportDesk.ticket.backToQueue")}
                </Link>
            </main>
        );
    }

    if (!ticket) {
        return (
            <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
                <div className="h-40 animate-pulse rounded-3xl bg-white" />
                <div className="h-64 animate-pulse rounded-3xl bg-white" />
            </main>
        );
    }

    const closed = ticket.status === "closed" || ticket.status === "resolved";
    const isMine = user && ticket.assignee && ticket.user !== ticket.assignee;

    return (
        <main className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">
            <Link to="/support-desk/tickets" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3A3A3A]/50 hover:text-[#3A3A3A]">
                <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" /> {t("supportDesk.ticket.backToQueue")}
            </Link>

            <section className="rounded-3xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{ticket.category ?? t("supportDesk.ticket.defaultCategory")} · {ticket.priority}</p>
                        <h1 className="mt-2 text-xl font-bold tracking-tight text-[#3A3A3A]">{ticket.subject}</h1>
                        <p className="mt-1 text-xs text-[#3A3A3A]/50">
                            {ticket.user}{ticket.email ? ` · ${ticket.email}` : ""} · {ticket.assignee ? t("supportDesk.ticket.assignedTo", { name: ticket.assignee }) : t("supportDesk.ticket.unassigned")}
                        </p>
                    </div>
                    <span className="rounded-full bg-[#F7F7F7] px-3 py-1.5 text-xs font-bold capitalize">{ticket.status}</span>
                </div>

                {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-600">{error}</p>}

                <div className="mt-5 flex flex-wrap gap-2">
                    {user && (
                        <button
                            type="button"
                            disabled={!!busy}
                            onClick={() => void run("assign", () => supportDeskApi.assign(ticket.id, user.id))}
                            className="rounded-xl border border-[#3A3A3A]/12 bg-white px-4 py-2 text-xs font-bold text-[#3A3A3A] hover:bg-[#F7F7F7] disabled:opacity-50"
                        >
                            {busy === "assign" ? t("supportDesk.ticket.assigning") : isMine ? t("supportDesk.ticket.reassignToMe") : t("supportDesk.ticket.assignToMe")}
                        </button>
                    )}
                    {!closed && (
                        <>
                            <button
                                type="button"
                                disabled={!!busy}
                                onClick={() => void run("resolve", () => supportDeskApi.resolve(ticket.id))}
                                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {busy === "resolve" ? t("supportDesk.ticket.resolving") : t("supportDesk.ticket.resolve")}
                            </button>
                            <button
                                type="button"
                                disabled={!!busy}
                                onClick={() => void run("close", () => supportDeskApi.close(ticket.id))}
                                className="rounded-xl bg-[#3A3A3A] px-4 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-50"
                            >
                                {busy === "close" ? t("supportDesk.ticket.closing") : t("supportDesk.ticket.close")}
                            </button>
                            <button
                                type="button"
                                disabled={!!busy}
                                onClick={() => void run("escalate", () => supportDeskApi.escalate(ticket.id, { level: "admin" }))}
                                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                            >
                                {busy === "escalate" ? t("supportDesk.ticket.escalating") : t("supportDesk.ticket.escalate")}
                            </button>
                        </>
                    )}
                </div>
            </section>

            <section className="rounded-3xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-sm font-bold text-[#3A3A3A]">{t("supportDesk.ticket.conversation")}</h2>
                <div className="mt-4 space-y-3">
                    {ticket.replies.length === 0 && <p className="text-xs text-[#3A3A3A]/45">{t("supportDesk.ticket.noReplies")}</p>}
                    {ticket.replies.map((reply) => (
                        <div key={reply.id} className={`rounded-2xl px-4 py-3 ${reply.internal ? "border border-dashed border-amber-300 bg-amber-50/60" : "bg-[#F7F7F7]"}`}>
                            <p className="flex items-center gap-2 text-[11px] font-bold text-[#3A3A3A]/60">
                                {reply.internal && <StickyNote className="h-3 w-3 text-amber-600" />}
                                {reply.author ?? t("supportDesk.ticket.authorFallback")}
                                {reply.internal && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] uppercase tracking-wide text-amber-700">{t("supportDesk.ticket.internal")}</span>}
                            </p>
                            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-[#3A3A3A]/80">{reply.body}</p>
                        </div>
                    ))}
                </div>

                {!closed && (
                    <div className="mt-5 border-t border-[#3A3A3A]/8 pt-5">
                        <textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            rows={4}
                            maxLength={5000}
                            placeholder={t("supportDesk.ticket.replyPh")}
                            className="w-full resize-none rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-4 py-3 text-sm leading-6 outline-none focus:border-[#F47822] focus:bg-white"
                        />
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <label className="flex items-center gap-2 text-xs text-[#3A3A3A]/60">
                                <input
                                    type="checkbox"
                                    checked={internal}
                                    onChange={(event) => setInternal(event.target.checked)}
                                    className="h-4 w-4 rounded accent-[#F47822]"
                                />
                                {t("supportDesk.ticket.internalNote")}
                            </label>
                            <button
                                type="button"
                                onClick={sendReply}
                                disabled={!draft.trim() || !!busy}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#E96D18] disabled:opacity-50"
                            >
                                {busy === "reply" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 rtl:-scale-x-100" />}
                                {t("supportDesk.ticket.sendReply")}
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
