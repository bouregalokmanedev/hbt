import { ArrowLeft, Loader2, MessageSquareQuote, Plus, Send, Star, StickyNote, Tag, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { supportDeskApi, type CannedReply, type DeskTicketDetails, type DeskTicketReply } from "../api/supportDesk.api";

/**
 * Assign/resolve/close/escalate return a ticket payload that may omit
 * `replies`. Always hand the renderer a real array so `replies.length` and
 * `replies.map` can never run against `undefined`.
 */
function withReplies(
    ticket: DeskTicketDetails | null | undefined,
    fallback: DeskTicketReply[] = [],
): DeskTicketDetails | null {
    if (!ticket) return null;
    return { ...ticket, replies: Array.isArray(ticket.replies) ? ticket.replies : fallback };
}

export function SupportDeskTicketPage() {
    const { t } = useTranslation();
    const { ticketId } = useParams<{ ticketId: string }>();
    const { user } = useAuth();
    const [ticket, setTicket] = useState<DeskTicketDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [draft, setDraft] = useState("");
    const [internal, setInternal] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);
    const [canned, setCanned] = useState<CannedReply[]>([]);
    const [showCanned, setShowCanned] = useState(false);
    const [tagDraft, setTagDraft] = useState("");
    const [savingTag, setSavingTag] = useState(false);

    const load = useCallback(async () => {
        if (!ticketId) return;
        try {
            setTicket(withReplies(await supportDeskApi.get(ticketId)));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("supportDesk.ticket.loadFail"));
        }
    }, [ticketId, t]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        let cancelled = false;
        void supportDeskApi
            .cannedReplies()
            .then((rows) => {
                if (!cancelled) setCanned(rows);
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, []);

    const run = async (label: string, task: () => Promise<DeskTicketDetails | unknown>) => {
        if (!ticketId || busy) return;
        setBusy(label);
        setError(null);
        try {
            const result = await task();
            if (result && typeof result === "object" && "id" in (result as Record<string, unknown>)) {
                const next = result as DeskTicketDetails;
                setTicket((current) => withReplies(next, current?.replies ?? []));
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

    const applyCanned = (reply: CannedReply) => {
        setDraft((current) => (current.trim() ? `${current.trim()}\n\n${reply.body}` : reply.body));
        setShowCanned(false);
    };

    const saveTags = async (tags: string[]) => {
        if (!ticketId || savingTag) return;
        setSavingTag(true);
        try {
            const updated = await supportDeskApi.setTags(ticketId, tags);
            setTicket((current) => withReplies(updated, current?.replies ?? []));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("supportDesk.ticket.actionFail"));
        } finally {
            setSavingTag(false);
        }
    };

    const addTag = () => {
        const tag = tagDraft.trim().toLowerCase();
        if (!tag || ticket?.tags?.includes(tag)) return;
        void saveTags([...(ticket?.tags ?? []), tag]);
        setTagDraft("");
    };

    const removeTag = (tag: string) => {
        void saveTags((ticket?.tags ?? []).filter((entry) => entry !== tag));
    };

    if (error && !ticket) {
        return (
            <main className="mx-auto max-w-4xl px-4 py-6">
                <p role="alert" className="rounded-2xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>
                <Link to="/support-desk/tickets" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#F47822]">
                    <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" /> {t("supportDesk.ticket.backToQueue")}
                </Link>
            </main>
        );
    }

    if (!ticket) {
        return (
            <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
                <div className="h-40 animate-pulse rounded-3xl bg-white dark:bg-[#1b1b20]" />
                <div className="h-64 animate-pulse rounded-3xl bg-white dark:bg-[#1b1b20]" />
            </main>
        );
    }

    const closed = ticket.status === "closed" || ticket.status === "resolved";
    const replies = ticket.replies ?? [];
    const me = user ? `${user.first_name} ${user.last_name}`.trim() : "";
    const isMine = Boolean(me && ticket.assignee && ticket.assignee === me);
    const level = ticket.level ?? "support";
    const canEscalate = level !== "super_admin";
    const escalateTo: "admin" | "super_admin" = level === "support" ? "admin" : "super_admin";

    return (
        <main className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">
            <Link to="/support-desk/tickets" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3A3A3A]/50 dark:text-white/50 hover:text-[#3A3A3A]">
                <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" /> {t("supportDesk.ticket.backToQueue")}
            </Link>

            <section className="rounded-3xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{ticket.category ?? t("supportDesk.ticket.defaultCategory")} · {ticket.priority}</p>
                        <h1 className="mt-2 text-xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">{ticket.subject}</h1>
                        <p className="mt-1 text-xs text-[#3A3A3A]/50 dark:text-white/50">
                            {ticket.user}{ticket.email ? ` · ${ticket.email}` : ""} · {ticket.assignee ? t("supportDesk.ticket.assignedTo", { name: ticket.assignee }) : t("supportDesk.ticket.unassigned")}
                        </p>
                        {ticket.user_uuid && (
                            <Link
                                to={`/support-desk/students/${ticket.user_uuid}`}
                                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#F47822] hover:underline"
                            >
                                {t("supportDesk.ticket.viewStudent")}
                            </Link>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-[#F7F7F7] dark:bg-[#101013] px-3 py-1.5 text-xs font-bold capitalize">{ticket.status}</span>
                        {Boolean(ticket.rating) && (
                            <span
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#F47822]/10 px-3 py-1.5 text-[11px] font-bold text-[#F47822]"
                                title={ticket.rating_comment ?? undefined}
                            >
                                <span className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            aria-hidden
                                            className={`h-3.5 w-3.5 ${
                                                star <= (ticket.rating ?? 0)
                                                    ? "fill-[#F47822] text-[#F47822]"
                                                    : "text-[#3A3A3A]/25 dark:text-white/25"
                                            }`}
                                        />
                                    ))}
                                </span>
                                {t("supportDesk.ticket.studentRating", { score: ticket.rating })}
                            </span>
                        )}
                    </div>
                </div>

                {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-xs text-red-600 dark:text-red-400">{error}</p>}

                {/* Free-form tags agents can stick on a ticket. */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-[#3A3A3A]/40 dark:text-white/40" />
                    {(ticket.tags ?? []).map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[#F47822]/10 px-2.5 py-1 text-[11px] font-bold text-[#F47822]">
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} aria-label={t("supportDesk.ticket.removeTag", { tag })} className="hover:text-red-500">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            addTag();
                        }}
                        className="inline-flex items-center gap-1"
                    >
                        <input
                            value={tagDraft}
                            onChange={(event) => setTagDraft(event.target.value)}
                            placeholder={t("supportDesk.ticket.addTagPh")}
                            aria-label={t("supportDesk.ticket.addTagAria")}
                            maxLength={32}
                            className="h-7 w-28 rounded-full border border-[#3A3A3A]/10 dark:border-white/10 bg-[#FAFAFA] px-3 text-[11px] outline-none focus:border-[#F47822]"
                        />
                        <button type="submit" disabled={savingTag || !tagDraft.trim()} aria-label={t("supportDesk.ticket.addTagAria")} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F47822]/10 text-[#F47822] disabled:opacity-40">
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    </form>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                    {user && (
                        <button
                            type="button"
                            disabled={!!busy}
                            onClick={() => void run("assign", () => supportDeskApi.assign(ticket.id, user.id))}
                            className="rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 bg-white dark:bg-[#1b1b20] px-4 py-2 text-xs font-bold text-[#3A3A3A] hover:bg-[#F7F7F7] dark:bg-[#101013] disabled:opacity-50"
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
                            {canEscalate && (
                                <button
                                    type="button"
                                    disabled={!!busy}
                                    onClick={() => void run("escalate", () => supportDeskApi.escalate(ticket.id, { level: escalateTo }))}
                                    className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100 disabled:opacity-50"
                                >
                                    {busy === "escalate"
                                        ? t("supportDesk.ticket.escalating")
                                        : t(escalateTo === "super_admin" ? "supportDesk.ticket.escalateToSuper" : "supportDesk.ticket.escalate")}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </section>

            <section className="rounded-3xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-5 shadow-sm sm:p-6">
                <h2 className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("supportDesk.ticket.conversation")}</h2>
                <div className="mt-4 space-y-3">
                    {replies.length === 0 && <p className="text-xs text-[#3A3A3A]/45 dark:text-white/45">{t("supportDesk.ticket.noReplies")}</p>}
                    {replies.map((reply) => (
                        <div key={reply.id} className={`rounded-2xl px-4 py-3 ${reply.internal ? "border border-dashed border-amber-300 bg-amber-50/60" : "bg-[#F7F7F7] dark:bg-[#101013]"}`}>
                            <p className="flex items-center gap-2 text-[11px] font-bold text-[#3A3A3A]/60 dark:text-white/60">
                                {reply.internal && <StickyNote className="h-3 w-3 text-amber-600 dark:text-amber-400" />}
                                {reply.author ?? t("supportDesk.ticket.authorFallback")}
                                {reply.internal && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] uppercase tracking-wide text-amber-700 dark:text-amber-400">{t("supportDesk.ticket.internal")}</span>}
                            </p>
                            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-[#3A3A3A]/80 dark:text-white/80">{reply.body}</p>
                        </div>
                    ))}
                </div>

                {!closed && (
                    <div className="mt-5 border-t border-[#3A3A3A]/8 dark:border-white/8 pt-5">
                        {canned.length > 0 && (
                            <div className="relative mb-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCanned((open) => !open)}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 px-3 py-2 text-xs font-bold text-[#3A3A3A]/70 dark:text-white/70 hover:bg-[#F7F7F7] dark:hover:bg-white/5"
                                >
                                    <MessageSquareQuote className="h-3.5 w-3.5" /> {t("supportDesk.ticket.cannedReplies")}
                                </button>
                                {showCanned && (
                                    <ul className="absolute z-10 mt-1 w-72 rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-1 shadow-lg">
                                        {canned.map((reply) => (
                                            <li key={reply.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => applyCanned(reply)}
                                                    className="w-full rounded-lg px-3 py-2 text-start text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef] hover:bg-[#F7F7F7] dark:hover:bg-white/5"
                                                >
                                                    {reply.title}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                        <textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            rows={4}
                            maxLength={5000}
                            placeholder={t("supportDesk.ticket.replyPh")}
                            className="w-full resize-none rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-[#FAFAFA] px-4 py-3 text-sm leading-6 outline-none focus:border-[#F47822] focus:bg-white dark:focus:bg-[#1b1b20]"
                        />
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <label className="flex items-center gap-2 text-xs text-[#3A3A3A]/60 dark:text-white/60">
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
