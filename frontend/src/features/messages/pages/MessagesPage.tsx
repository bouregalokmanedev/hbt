import { Archive, BellOff, BellRing, CheckCheck, ChevronRight, Clock, Download, FileText, Forward, Image as ImageIcon, LoaderCircle, MailPlus, MessageCircle, Paperclip, Pencil, Reply, Search, Send, SmilePlus, Trash2, Users, WifiOff, X } from "lucide-react";
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState, type ElementType, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AVATAR_SQUARE_SHAPE } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { messagesApi, ATTACHMENT_ACCEPT, ATTACHMENT_MAX_BYTES, conversationMembers, formatAttachmentSize, isAllowedAttachment, isRecentEnoughForDeleteForAll, MESSAGE_REACTIONS, messageReactions, readReceiptFor, type Contact, type Conversation, type ConversationMember, type MessageAttachment, type MessageItem } from "../api/messages.api";
import { settingsApi } from "@/features/settings/api/settings.api";

export type MessagesMode = "messages" | "announcements" | "room";

/** Messages kept in the DOM at once; the rest render as the reader scrolls up. */
const RENDER_WINDOW = 80;
/** Minimum gap between "user is typing" pings — they are fire-and-forget. */
const TYPING_INTERVAL_MS = 2500;
const MAX_ATTACHMENTS = 5;
/** Conversations per inbox page; the server caps `limit` at 200. */
const INBOX_PAGE = 40;
const NO_REACTIONS: string[] = [];

/*
|--------------------------------------------------------------------------
| Read / delivered ticks (Messenger / WhatsApp style)
|--------------------------------------------------------------------------
| A message I sent is "delivered" once stored server-side. It becomes
| "read" once enough other participants have a last_read_at past it.
| Ticks only ever render on my own (outgoing) messages.
*/
function isMessageRead(createdAt: string, lastReadAt?: string | null): boolean {
    if (!lastReadAt) return false;
    const read = new Date(lastReadAt).getTime();
    const sent = new Date(createdAt).getTime();
    return Number.isFinite(read) && Number.isFinite(sent) && read >= sent;
}

function MessageTicks({ read, onDark = false }: { read: boolean; onDark?: boolean }) {
    const { t } = useTranslation();
    const label = read ? t("messages.ticks.read") : t("messages.ticks.delivered");
    return (
        <span role="img" aria-label={label} title={label} className="inline-flex shrink-0">
            <CheckCheck
                aria-hidden="true"
                className={`h-3.5 w-3.5 ${read ? "text-[#53bdeb]" : onDark ? "text-white/60" : "text-[#3A3A3A]/35 dark:text-white/35"}`}
            />
        </span>
    );
}

function ConfirmDialog({ title, description, confirmLabel, cancelLabel, danger, onConfirm, onCancel }: {
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#17202b]/40 p-4 backdrop-blur-sm" role="presentation" onClick={onCancel}>
            <div role="alertdialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-[24px] border border-[#3A3A3A]/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#1b1b20]">
                <h2 className="text-base font-bold text-[#3A3A3A] dark:text-[#ececef]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/65 dark:text-white/65">{description}</p>
                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#3A3A3A]/60 transition hover:bg-[#3A3A3A]/5 dark:text-white/60 dark:hover:bg-white/5">{cancelLabel}</button>
                    <button type="button" onClick={onConfirm} className={`rounded-xl px-4 py-2.5 text-xs font-bold text-white transition ${danger ? "bg-red-600 hover:bg-red-500" : "bg-[#3A3A3A] hover:bg-[#F47822]"}`}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}

export function MessagesPage({ mode = "messages", basePath = "", getProfilePath, announceHref, announcementsHref, embedded = false }: { mode?: MessagesMode; basePath?: string; getProfilePath?: (participant: Contact) => string | null; announceHref?: string; announcementsHref?: string; embedded?: boolean }) {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const myUuid = user?.id ?? null;
    const [params, setParams] = useSearchParams();
    const [items, setItems] = useState<Conversation[]>([]);
    const [active, setActive] = useState<Conversation | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [compose, setCompose] = useState(false);
    const [composeTo, setComposeTo] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [flash, setFlash] = useState<string | null>(null);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [inboxQuery, setInboxQuery] = useState("");
    const [inboxHasMore, setInboxHasMore] = useState(false);
    const [inboxLoadingMore, setInboxLoadingMore] = useState(false);
    const inboxOffsetRef = useRef(0);
    const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
    const receiptsLoaded = useRef(false);
    const receiptsOn = useRef(true);
    const isAnnouncements = mode === "announcements";
    const isRoom = mode === "room";
    const ModeIcon = isAnnouncements ? BellRing : isRoom ? Users : MessageCircle;

    /*
     * Deep link from the achievements podium (/messages?to=<userId>):
     * prefill the compose modal with that learner and drop the param.
     */
    useEffect(() => {
        if (isAnnouncements) return;
        const to = params.get("to");
        if (!to) return;
        const next = new URLSearchParams(params);
        next.delete("to");
        setParams(next, { replace: true });
        void (async () => {
            try {
                setContacts(await messagesApi.contacts());
            } catch {
                // Contacts stay empty; the recipient is still prefilled.
            }
            setComposeTo(to);
            setCompose(true);
        })();
    }, [params, isAnnouncements, setParams]);

    /* Connectivity is advisory: sends are blocked while offline so the reader
     * gets one clear message instead of a queue of failures to retry. */
    useEffect(() => {
        const goOnline = () => setOnline(true);
        const goOffline = () => setOnline(false);
        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);
        return () => {
            window.removeEventListener("online", goOnline);
            window.removeEventListener("offline", goOffline);
        };
    }, []);

    const openConversation = async (id: string) => {
        const conversation = await messagesApi.get(id);
        setActive(conversation);
        setFlash(null);
        if (!receiptsLoaded.current) {
            receiptsLoaded.current = true;
            try {
                const settings = await settingsApi.get();
                receiptsOn.current = settings.privacy?.send_read_receipts !== false;
            } catch {
                receiptsOn.current = true;
            }
        }
        if (receiptsOn.current) {
            await messagesApi.read(id);
        }
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, unread_count: 0 } : item)));
        window.dispatchEvent(new CustomEvent("hbt:refresh-badges"));
        setParams({ conversation: id }, { replace: true });
    };

    /**
     * `silent` refreshes the open thread in the background: no spinner, no
     * error banner, composer state untouched (Thread is not keyed, so React
     * keeps its draft).
     */
    const load = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // Server-side type scope keeps paging honest: an offset into a
            // mixed list would otherwise hand back rows the mode discards.
            const scope = isRoom ? "staff_room" : isAnnouncements ? "announcement" : "not_announcement";
            // A background poll must not collapse the list back to one page.
            const limit = silent ? Math.max(INBOX_PAGE, inboxOffsetRef.current) : INBOX_PAGE;
            const page = await messagesApi.list({ limit, type: scope });
            const filtered = page.filter((item) =>
                isRoom ? item.type === "staff_room"
                    : isAnnouncements ? item.type === "announcement"
                        : item.type !== "announcement",
            );
            setItems(filtered);
            inboxOffsetRef.current = page.length;
            setInboxHasMore(page.length >= limit);
            const requested = params.get("conversation");
            if (silent) {
                if (requested) await refreshOpenThread(requested);
                return;
            }
            if (requested) {
                // A deep link that does not belong in this mode must not
                // silently open the first unrelated conversation instead.
                if (filtered.some((item) => item.id === requested)) await openConversation(requested);
                else setActive(null);
            } else if (filtered[0]) await openConversation(filtered[0].id);
            else setActive(null);
        } catch (cause) {
            if (!silent) setError(cause instanceof Error ? cause.message : t("messages.loadFail"));
        } finally { if (!silent) setLoading(false); }
    };

    /** Fetch the next inbox page and append it; the offset lives in a ref so a
     *  concurrent background poll re-reads the same window instead of paging. */
    const loadMoreInbox = async () => {
        if (inboxLoadingMore) return;
        setInboxLoadingMore(true);
        try {
            const scope = isRoom ? "staff_room" : isAnnouncements ? "announcement" : "not_announcement";
            const page = await messagesApi.list({ limit: INBOX_PAGE, offset: inboxOffsetRef.current, type: scope });
            const filtered = page.filter((item) =>
                isRoom ? item.type === "staff_room"
                    : isAnnouncements ? item.type === "announcement"
                        : item.type !== "announcement",
            );
            inboxOffsetRef.current += page.length;
            setItems((prev) => {
                const seen = new Set(prev.map((item) => item.id));
                return [...prev, ...filtered.filter((item) => !seen.has(item.id))];
            });
            setInboxHasMore(page.length >= INBOX_PAGE);
        } catch {
            // A failed page is not worth a banner — the button stays for a retry.
        } finally { setInboxLoadingMore(false); }
    };

    const refreshOpenThread = async (id: string) => {
        try {
            const fresh = await messagesApi.get(id);
            if ((fresh.unread_count ?? 0) > 0) {
                await messagesApi.read(id);
                setActive({ ...fresh, unread_count: 0 });
                setItems((prev) => prev.map((item) => (item.id === id ? { ...fresh, unread_count: 0 } : item)));
                window.dispatchEvent(new CustomEvent("hbt:refresh-badges"));
                return;
            }
            setActive(fresh);
            setItems((prev) => prev.map((item) => (item.id === id ? fresh : item)));
        } catch {
            // A background poll failing is not worth interrupting the reader.
        }
    };

    const loadRef = useRef(load);

    useEffect(() => {
        loadRef.current = load;
    });

    useEffect(() => { void load(); }, [mode]);

    /*
     * Keep the inbox and the open thread live in every mode — not just the
     * staff room. Never polls in a background tab. The guard matters: a
     * successful refresh dispatches `hbt:refresh-badges` (to update the
     * sidebar), which this very effect listens to — without it one unread
     * message would immediately re-enter and spin round trips.
     */
    const polling = useRef(false);

    useEffect(() => {
        const tick = async () => {
            if (polling.current || document.visibilityState !== "visible") return;
            polling.current = true;
            try { await loadRef.current(true); } finally { polling.current = false; }
        };
        const onFocus = () => { void tick(); };
        const interval = window.setInterval(onFocus, isRoom ? 10000 : 20000);
        window.addEventListener("focus", onFocus);
        window.addEventListener("hbt:refresh-badges", onFocus);
        return () => {
            window.clearInterval(interval);
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("hbt:refresh-badges", onFocus);
        };
    }, [isRoom]);

    const archiveActive = async (id: string) => {
        try {
            await messagesApi.archive(id);
            setFlash(null);
            await load();
        } catch (cause) {
            setFlash(cause instanceof Error ? cause.message : t("messages.archiveFail"));
        }
    };

    const toggleMute = async (conversation: Conversation) => {
        try {
            const next = await messagesApi.mute(conversation.id, !conversation.muted);
            const muted = next.muted;
            setActive((prev) => (prev && prev.id === conversation.id ? { ...prev, muted } : prev));
            setItems((prev) => prev.map((item) => (item.id === conversation.id ? { ...item, muted } : item)));
            window.dispatchEvent(new CustomEvent("hbt:refresh-badges"));
        } catch (cause) {
            setFlash(cause instanceof Error ? cause.message : t("messages.muteFail"));
        }
    };

    const needle = inboxQuery.trim().toLowerCase();
    const visibleItems = items.filter((item) => {
        if (unreadOnly && (item.unread_count ?? 0) === 0) return false;
        if (!needle) return true;
        const haystack = `${item.subject ?? ""} ${item.participant?.name ?? ""} ${(item.participants ?? []).map((member) => member.name).join(" ")}`.toLowerCase();
        return haystack.includes(needle);
    });

    const typingNames = useMemo(() => {
        if (!active?.typing_user_ids?.length) return "";
        const names = conversationMembers(active)
            .filter((member) => active.typing_user_ids?.includes(member.id))
            .map((member) => member.name.split(" ")[0]);
        return names.join(", ");
    }, [active]);

    // When embedded the host page owns the page shell, so we drop our own
    // <main>, padding and header instead of nesting landmarks.
    const Shell: ElementType = embedded ? "div" : "main";

    const threadSubtitle = active
        ? active.type === "group" || active.type === "staff_room"
            ? t("messages.groupMembers", { count: active.member_count ?? active.participants?.length ?? 0 })
            : isAnnouncements
                ? t("messages.privateThread")
                : t("messages.threadWith", { name: active.participant?.name ?? t("messages.teamFallback") })
        : null;
    const presence = active && active.type === "direct"
        ? active.participant?.online === true
            ? "online"
            : active.participant?.last_read_at
                ? formatLastSeen(active.participant.last_read_at, i18n.language)
                : null
        : null;

    return <Shell className={embedded ? "" : "min-h-full bg-[#F3F3F3] dark:bg-[#101013] px-4 py-5 sm:px-7 sm:py-7"}>
        <div className={embedded ? "" : "mx-auto max-w-[1480px]"}>
            {embedded ? null : <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[.19em] text-[#F47822]">
                        <span className="h-px w-7 bg-[#F47822]" aria-hidden="true" />
                        {t("messages.eyebrow")}
                    </p>
                    <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef] sm:text-3xl">{isRoom ? t("messages.titleRoom") : isAnnouncements ? t("messages.titleAnn") : t("messages.titleMsg")}</h1>
                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">{isRoom ? t("messages.descRoom") : isAnnouncements ? t("messages.descAnn") : t("messages.descMsg")}</p>
                </div>
                {!isAnnouncements && !isRoom && <button onClick={async () => { setCompose(true); if (!contacts.length) setContacts(await messagesApi.contacts()); }} className="inline-flex items-center gap-2 rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F47822]"><MailPlus className="h-4 w-4" />{t("messages.newMessage")}</button>}
                {isAnnouncements && announceHref && <Link to={announceHref} className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#de6414]"><BellRing className="h-4 w-4" />{t("messages.newAnnouncement")}</Link>}
            </header>}

            {!embedded && <nav className="mb-5 inline-flex flex-wrap items-center gap-1 rounded-xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-1 shadow-sm">
                <Link to={`${basePath}/messages`} className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${!isAnnouncements ? "bg-[#F47822] text-white" : "text-[#3A3A3A]/55 dark:text-white/55 hover:text-[#3A3A3A] dark:hover:text-[#ececef]"}`}><MessageCircle className="h-3.5 w-3.5" />{t("messages.tabMessages")}</Link>
                <Link to={announcementsHref ?? `${basePath}/announcements`} className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${isAnnouncements ? "bg-[#F47822] text-white" : "text-[#3A3A3A]/55 dark:text-white/55 hover:text-[#3A3A3A] dark:hover:text-[#ececef]"}`}><BellRing className="h-3.5 w-3.5" />{t("messages.tabAnnouncements")}</Link>
                {(() => {
                    const totalUnread = items.reduce((sum, item) => sum + (item.unread_count ?? 0), 0);
                    return (
                        <button type="button" onClick={() => setUnreadOnly((value) => !value)} aria-pressed={unreadOnly} className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${unreadOnly ? "bg-[#3A3A3A] text-white dark:bg-white dark:text-[#3A3A3A]" : "text-[#3A3A3A]/55 dark:text-white/55 hover:text-[#3A3A3A] dark:hover:text-[#ececef]"}`}>
                            {t("messages.filterUnread")}
                            {totalUnread > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${unreadOnly ? "bg-white/20 text-white dark:bg-[#3A3A3A]/10 dark:text-[#3A3A3A]" : "bg-[#F47822] text-white"}`}>{totalUnread}</span>}
                        </button>
                    );
                })()}
            </nav>}

            {!online && <p role="status" className="mb-3 flex items-center gap-2 rounded-xl border border-[#F47822]/30 bg-[#F47822]/[.08] px-4 py-2.5 text-xs font-semibold text-[#F47822]"><WifiOff className="h-4 w-4 shrink-0" />{t("messages.offline")}</p>}
            {flash && <p role="status" className="mb-3 rounded-xl border border-[#F47822]/25 bg-[#F47822]/[.07] px-4 py-2.5 text-xs font-semibold text-[#F47822]">{flash}</p>}
            {error ? <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-5 text-sm text-red-700 dark:text-red-400">{error}</div> : <div className="grid min-h-[650px] overflow-hidden rounded-[28px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] shadow-[0_18px_48px_rgba(58,58,58,.07)] lg:grid-cols-[340px_minmax(0,1fr)]">
                <aside className="flex flex-col border-b border-[#3A3A3A]/8 dark:border-white/8 bg-[#FCFCFC] dark:bg-[#232329] lg:border-b-0 lg:border-r">
                    <div className="border-b border-[#3A3A3A]/8 dark:border-white/8 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{isAnnouncements ? t("messages.updates") : t("messages.inbox")}</p>
                                <p className="mt-0.5 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">{t("messages.items", { count: visibleItems.length })}</p>
                            </div>
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F47822]/12 text-[#F47822] ring-1 ring-[#F47822]/15"><ModeIcon className="h-4 w-4" /></span>
                        </div>
                        <div className="relative mt-3">
                            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-3.5 w-3.5 text-[#3A3A3A]/40 dark:text-white/40" />
                            <input value={inboxQuery} onChange={(event) => setInboxQuery(event.target.value)} placeholder={t("messages.searchInboxPh")} aria-label={t("messages.searchInbox")} className="messages-quiet-focus h-9 w-full rounded-xl border border-[#3A3A3A]/10 bg-white ps-9 pe-8 text-xs text-[#3A3A3A] transition placeholder:text-[#3A3A3A]/35 focus:border-[#F47822]/55 dark:border-white/10 dark:bg-[#1b1b20] dark:text-[#ececef] dark:placeholder:text-white/35" />
                            {inboxQuery && <button type="button" onClick={() => setInboxQuery("")} aria-label={t("messages.close")} className="absolute inset-y-0 end-1.5 my-auto grid h-6 w-6 place-items-center rounded-lg text-[#3A3A3A]/40 transition hover:bg-[#3A3A3A]/8 hover:text-[#3A3A3A] dark:text-white/40 dark:hover:bg-white/10"><X className="h-3.5 w-3.5" /></button>}
                        </div>
                    </div>
                    {loading ? (
                        <div role="status" aria-label={t("messages.loading")} className="overflow-hidden">
                            {Array.from({ length: 6 }).map((_, index) => <ConversationRowSkeleton key={index} />)}
                        </div>
                    ) : items.length === 0 || visibleItems.length === 0 ? (
                        <div className="p-8 text-center">
                            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#F47822]/10 text-[#F47822] ring-1 ring-[#F47822]/15"><ModeIcon className="h-5 w-5" /></span>
                            <p className="mt-4 text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{needle || unreadOnly ? t("messages.emptyFiltered") : isRoom ? t("messages.emptyRoomTitle") : isAnnouncements ? t("messages.emptyAnnTitle") : t("messages.emptyMsgTitle")}</p>
                            {needle || unreadOnly ? (
                                <button type="button" onClick={() => { setInboxQuery(""); setUnreadOnly(false); }} className="mt-3 rounded-lg bg-[#3A3A3A] px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-[#F47822]">{t("messages.clearFilter")}</button>
                            ) : (
                                <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">{isRoom ? t("messages.emptyRoomDesc") : isAnnouncements ? t("messages.emptyAnnDesc") : t("messages.emptyMsgDesc")}</p>
                            )}
                        </div>
                    ) : (
                        <div className="max-h-[590px] flex-1 overflow-y-auto">{visibleItems.map((conversation) => (
                            <ConversationRow
                                key={conversation.id}
                                conversation={conversation}
                                myUuid={myUuid}
                                isActive={active?.id === conversation.id}
                                isAnnouncements={isAnnouncements}
                                fallbackName={t("messages.fallbackConv")}
                                fallbackSubtitle={isAnnouncements ? t("messages.adminLabel") : conversation.type === "group" || conversation.type === "staff_room" ? t("messages.groupMembers", { count: conversation.member_count ?? 0 }) : conversation.participant?.role || t("messages.directLabel")}
                                onOpen={() => void openConversation(conversation.id)}
                            />
                        ))}{inboxHasMore && !needle && !unreadOnly && (
                            <div className="border-t border-[#3A3A3A]/8 p-3 text-center dark:border-white/8">
                                <button type="button" onClick={() => void loadMoreInbox()} disabled={inboxLoadingMore} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-[#F47822] transition hover:bg-[#F47822]/10 disabled:opacity-50">
                                    {inboxLoadingMore && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                                    {t("messages.loadMoreInbox")}
                                </button>
                            </div>
                        )}</div>
                    )}
                </aside>
                <section className="flex min-h-[500px] flex-col">
                    <div className="flex items-center justify-between gap-3 border-b border-[#3A3A3A]/8 px-5 py-3.5 sm:px-6 dark:border-white/8">
                        {active ? (
                            <div className="flex min-w-0 items-center gap-3">
                                <ThreadHeaderAvatar active={active} />
                                <div className="min-w-0 flex-1">
                                    {(() => {
                                        const profilePath = !active.subject && active.participant && getProfilePath ? getProfilePath(active.participant) : null;
                                        const title = active.subject || active.participant?.name || t("messages.fallbackMsg");
                                        return profilePath
                                            ? <Link to={profilePath} title={title} className="block truncate text-sm font-bold text-[#3A3A3A] transition hover:text-[#F47822] hover:underline dark:text-[#ececef]">{title}</Link>
                                            : <p className="truncate text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{title}</p>;
                                    })()}
                                    <p className="mt-0.5 truncate text-[11px] text-[#3A3A3A]/45 dark:text-white/45">{threadSubtitle}</p>
                                    {presence === "online" && (
                                        <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{t("messages.online")}</p>
                                    )}
                                    {presence && presence !== "online" && (
                                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#3A3A3A]/35 dark:text-white/35"><span className="h-1.5 w-1.5 rounded-full bg-[#3A3A3A]/30 dark:bg-white/30" />{t("messages.lastSeen", { when: presence })}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm font-semibold text-[#3A3A3A]/50 dark:text-white/50">{t("messages.selectItem")}</p>
                        )}
                        {active && (
                            <div className="flex shrink-0 items-center gap-0.5 rounded-xl bg-[#3A3A3A]/[.04] p-1 dark:bg-white/[.06]">
                                {active.status === "active" && (
                                    <button onClick={() => void toggleMute(active)} className={`rounded-lg p-2 transition ${active.muted ? "text-[#F47822]" : "text-[#3A3A3A]/45 hover:bg-[#F47822]/10 hover:text-[#F47822] dark:text-white/45"}`} aria-pressed={Boolean(active.muted)} aria-label={active.muted ? t("messages.unmuteAria") : t("messages.muteAria")} title={active.muted ? t("messages.unmuteAria") : t("messages.muteAria")}><BellOff className="h-4 w-4" /></button>
                                )}
                                {active.status === "active" && active.can_archive !== false && (
                                    <button onClick={() => void archiveActive(active.id)} className="rounded-lg p-2 text-[#3A3A3A]/45 transition hover:bg-red-50 hover:text-red-600 dark:text-white/45 dark:hover:bg-red-500/10 dark:hover:text-red-400" aria-label={t("messages.archiveAria")} title={t("messages.archiveAria")}><Archive className="h-4 w-4" /></button>
                                )}
                            </div>
                        )}
                    </div>
                    {typingNames && (
                        <p role="status" className="flex items-center gap-2 border-b border-[#F47822]/15 bg-[#F47822]/[.05] px-5 py-2 text-[11px] font-semibold text-[#F47822] dark:border-[#F47822]/20 dark:bg-[#F47822]/[.08]">
                            <span className="flex items-end gap-0.5" aria-hidden="true">
                                <span className="h-1 w-1 animate-bounce rounded-full bg-[#F47822] [animation-delay:-.2s]" />
                                <span className="h-1 w-1 animate-bounce rounded-full bg-[#F47822] [animation-delay:-.1s]" />
                                <span className="h-1 w-1 animate-bounce rounded-full bg-[#F47822]" />
                            </span>
                            {t("messages.typing", { names: typingNames })}
                        </p>
                    )}
                    {active ? <Thread active={active} conversations={items} online={online} onSent={async () => { await openConversation(active.id); await load(); }} onChanged={() => void refreshOpenThread(active.id)} /> : (
                        <div className="flex flex-1 items-center justify-center p-10 text-center">
                            <div>
                                <span className="mx-auto grid h-16 w-16 place-items-center rounded-[24px] bg-[#F47822]/10 text-[#F47822] ring-1 ring-[#F47822]/15"><MessageCircle className="h-7 w-7" /></span>
                                <p className="mt-4 text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.chooseConv")}</p>
                                <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">{isAnnouncements ? t("messages.emptyAnnDesc") : isRoom ? t("messages.emptyRoomDesc") : t("messages.emptyMsgDesc")}</p>
                            </div>
                        </div>
                    )}
                </section>
            </div>}
            {compose && <Compose contacts={contacts} initialRecipient={composeTo} onClose={() => { setCompose(false); setComposeTo(""); }} onCreated={async (conversation) => { setCompose(false); setComposeTo(""); await load(); await openConversation(conversation.id); }} />}
        </div>
    </Shell>;
}

function formatLastSeen(when: string, locale: string): string {
    const days = Math.max(0, Math.round((Date.now() - new Date(when).getTime()) / 86_400_000));
    try {
        return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-days, "day");
    } catch {
        return new Date(when).toLocaleDateString(locale);
    }
}

export function AnnouncementsPage({ basePath = "", embedded = false }: { basePath?: string; embedded?: boolean }) { return <MessagesPage mode="announcements" basePath={basePath} embedded={embedded} />; }
export function RoomPage({ basePath = "", embedded = false }: { basePath?: string; embedded?: boolean }) { return <MessagesPage mode="room" basePath={basePath} embedded={embedded} />; }

const AVATAR_TONES = [
    "bg-[#F47822]/12 text-[#F47822]",
    "bg-[#3A3A3A]/8 text-[#3A3A3A] dark:bg-white/10 dark:text-white",
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    "bg-violet-500/10 text-violet-600 dark:text-violet-400",
];

function initialsOf(name: string): string {
    return name.split(" ").filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "•";
}

function avatarTone(name: string): string {
    let hash = 0;
    for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function capitalizeFirst(value: string): string {
    return value.replace(/^\S/, (char) => char.toUpperCase());
}

function formatListTime(iso: string | null | undefined, locale: string): string {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const days = Math.round((startOfToday - startOfDate) / 86_400_000);
    if (days <= 0) return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(date);
    if (days === 1) {
        try {
            return capitalizeFirst(new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-1, "day"));
        } catch {
            return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
        }
    }
    if (days < 7) return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(date);
}

function dayKey(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? "" : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function DayDivider({ label, id }: { label: string; id?: string }) {
    return (
        <div id={id} className="flex items-center gap-3 px-2 py-1">
            <span className="h-px flex-1 bg-[#3A3A3A]/10 dark:bg-white/10" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3A3A3A]/8 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#3A3A3A]/55 shadow-sm dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/55">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F47822]" aria-hidden="true" />
                {label}
            </span>
            <span className="h-px flex-1 bg-[#3A3A3A]/10 dark:bg-white/10" />
        </div>
    );
}

function ConversationAvatar({ conversation, isAnnouncements }: { conversation: Conversation; isAnnouncements: boolean }) {
    if (isAnnouncements) {
        return (
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center ${AVATAR_SQUARE_SHAPE} bg-[#F47822]/12 text-[#F47822]`}>
                <BellRing className="h-5 w-5" />
            </span>
        );
    }
    if (conversation.type === "group" || conversation.type === "staff_room") {
        return (
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center ${AVATAR_SQUARE_SHAPE} bg-[#3A3A3A] text-white`}>
                <Users className="h-5 w-5" />
            </span>
        );
    }
    const name = conversation.subject || conversation.participant?.name || "?";
    return (
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center ${AVATAR_SQUARE_SHAPE} text-xs font-bold ${avatarTone(name)}`}>
            {initialsOf(name)}
        </span>
    );
}

function ThreadHeaderAvatar({ active }: { active: Conversation }) {
    if (active.type === "group" || active.type === "staff_room") {
        return (
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center ${AVATAR_SQUARE_SHAPE} bg-[#3A3A3A] text-white`}>
                <Users className="h-5 w-5" />
            </span>
        );
    }
    const name = active.subject || active.participant?.name || "?";
    if (active.type === "announcement") {
        return (
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center ${AVATAR_SQUARE_SHAPE} bg-[#F47822]/12 text-[#F47822]`}>
                <BellRing className="h-5 w-5" />
            </span>
        );
    }
    return (
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center ${AVATAR_SQUARE_SHAPE} text-xs font-bold ${avatarTone(name)}`}>
            {initialsOf(name)}
        </span>
    );
}

function ConversationRow({ conversation, isActive, isAnnouncements, fallbackName, fallbackSubtitle, myUuid, onOpen }: {
    conversation: Conversation;
    isActive: boolean;
    isAnnouncements: boolean;
    fallbackName: string;
    fallbackSubtitle: string;
    myUuid: string | null;
    onOpen: () => void;
}) {
    const { t, i18n } = useTranslation();
    const latest = conversation.messages?.[0];
    // "Outgoing" means *mine*. Deriving it from `participant` (the first
    // member who is not me) mislabelled other people's messages in groups and
    // the staff room, so ticks used to render on messages I never sent.
    const receipt = readReceiptFor(latest, conversationMembers(conversation), myUuid);
    const preview = !latest || latest.deleted ? null : latest.body?.trim() || latest.attachment?.name || null;
    const name = conversation.subject || conversation.participant?.name || fallbackName;
    const unread = conversation.unread_count ?? 0;
    const isGroup = conversation.type === "group" || conversation.type === "staff_room";
    const tag = isAnnouncements
        ? null
        : conversation.participant?.role
            || (isGroup ? t("messages.groupMembers", { count: conversation.member_count ?? 0 }) : null);
    return (
        <button
            type="button"
            onClick={onOpen}
            aria-current={isActive ? "true" : undefined}
            className={`group relative flex w-full items-start gap-3 border-b border-[#3A3A3A]/[.06] px-4 py-3.5 text-start transition last:border-b-0 hover:bg-[#F47822]/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F47822]/45 dark:border-white/[.06] dark:hover:bg-white/[.03] ${isActive ? "bg-[#FFF7F2] dark:bg-[#F47822]/[.08]" : ""}`}
        >
            <span aria-hidden="true" className={`absolute inset-y-0 start-0 w-[3px] rounded-e-full bg-[#F47822] transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
            <span className="relative shrink-0 pt-0.5">
                <ConversationAvatar conversation={conversation} isAnnouncements={isAnnouncements} />
                {unread > 0 && <span className="absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#FCFCFC] bg-[#F47822] dark:border-[#232329]" />}
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                    <b className={`truncate text-[13px] text-[#3A3A3A] dark:text-[#ececef] ${unread > 0 ? "font-bold" : "font-semibold"}`}>{name}</b>
                    <time className={`shrink-0 text-[10px] tabular-nums ${unread > 0 ? "font-bold text-[#F47822]" : "text-[#3A3A3A]/40 dark:text-white/40"}`}>
                        {formatListTime(conversation.last_message_at, i18n.language)}
                    </time>
                </span>
                <span className="mt-1 flex items-center gap-1.5">
                    {conversation.muted && <span title={t("messages.mutedTitle")} className="shrink-0 text-[#3A3A3A]/35 dark:text-white/35"><BellOff className="h-3 w-3" /></span>}
                    {receipt && <MessageTicks read={receipt.read >= receipt.total} />}
                    <span className={`min-w-0 flex-1 truncate text-[11px] leading-4 ${unread > 0 ? "font-medium text-[#3A3A3A] dark:text-[#ececef]" : "text-[#3A3A3A]/50 dark:text-white/50"}`}>
                        {preview ?? fallbackSubtitle}
                    </span>
                    {unread > 0 && (
                        <span className="shrink-0 rounded-full bg-[#F47822] px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums text-white">
                            {unread > 99 ? "99+" : unread}
                        </span>
                    )}
                </span>
                {preview && tag && (
                    <span className="mt-1.5 inline-block max-w-full truncate rounded-md bg-[#3A3A3A]/[.06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[.09em] text-[#3A3A3A]/50 dark:bg-white/[.07] dark:text-white/50">
                        {tag}
                    </span>
                )}
            </span>
            <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-[#3A3A3A]/20 transition group-hover:translate-x-0.5 group-hover:text-[#F47822] rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0 dark:text-white/20" />
        </button>
    );
}

/** Shimmering stand-in while the first inbox page is still loading. */
function ConversationRowSkeleton() {
    return (
        <div className="flex items-start gap-3 border-b border-[#3A3A3A]/[.06] px-4 py-3.5 last:border-b-0 dark:border-white/[.06]" aria-hidden="true">
            <Skeleton className="h-11 w-11 shrink-0 rounded-2xl bg-[#3A3A3A]/[.07] dark:bg-white/[.07]" />
            <span className="min-w-0 flex-1 space-y-2 pt-1.5">
                <Skeleton className="h-3 w-1/2 rounded-full bg-[#3A3A3A]/[.07] dark:bg-white/[.07]" />
                <Skeleton className="h-2.5 w-4/5 rounded-full bg-[#3A3A3A]/[.05] dark:bg-white/[.05]" />
            </span>
        </div>
    );
}

function AttachmentsView({ attachments, incoming }: { attachments: MessageAttachment[]; incoming: boolean }) {
    const { t } = useTranslation();
    if (!attachments.length) return null;
    return (
        <span className="mt-2 block space-y-2">
            {attachments.map((attachment, index) => {
                const label = t("messages.attachments.download", { name: attachment.name });
                if (attachment.mime.startsWith("image/")) {
                    return (
                        <span key={`${attachment.url}-${index}`} className="block">
                            <a href={attachment.url} target="_blank" rel="noreferrer" title={label} className="block overflow-hidden rounded-xl">
                                <img src={attachment.url} alt={attachment.name} loading="lazy" className="max-h-56 w-full object-cover" />
                            </a>
                            <span className="mt-1.5 block truncate text-[10px] opacity-55">{attachment.name} · {formatAttachmentSize(attachment.size)}</span>
                        </span>
                    );
                }
                return (
                    <a
                        key={`${attachment.url}-${index}`}
                        href={attachment.url}
                        download={attachment.name}
                        title={label}
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition ${incoming ? "bg-[#F47822]/8 hover:bg-[#F47822]/[.12]" : "bg-white/10 hover:bg-white/[.16]"}`}
                    >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${incoming ? "bg-[#F47822]/10 text-[#F47822]" : "bg-white/10 text-white"}`}>
                            <FileText className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-semibold">{attachment.name}</span>
                            <span className="mt-0.5 block text-[10px] opacity-55">{formatAttachmentSize(attachment.size)}</span>
                        </span>
                        <Download className="h-4 w-4 opacity-60" />
                    </a>
                );
            })}
        </span>
    );
}

function HighlightBody({ text, query }: { text: string; query: string }) {
    const q = query.trim();
    if (!q) return <p className="whitespace-pre-wrap">{text}</p>;
    const lower = text.toLowerCase();
    const needle = q.toLowerCase();
    const parts: ReactNode[] = [];
    let index = 0;
    let key = 0;
    for (;;) {
        const found = lower.indexOf(needle, index);
        if (found === -1) break;
        if (found > index) parts.push(text.slice(index, found));
        parts.push(<mark key={key++} className="rounded bg-[#F47822]/30 px-0.5">{text.slice(found, found + needle.length)}</mark>);
        index = found + needle.length;
    }
    parts.push(text.slice(index));
    return <p className="whitespace-pre-wrap">{parts}</p>;
}

/**
 * One message bubble.
 *
 * Memoised because the inbox polls every ~20 s: without it a single new
 * message re-rendered every bubble in the thread.
 */
const Bubble = memo(function Bubble({ message, incoming, mine, members, myUuid, locale, searchQuery, reacted, showSender, isEditing, editBody, editBusy, editError, onEditChange, onEditCommit, onEditCancel, onReply, onReact, onDelete, onEdit, onForward, onRetry, pickerOpen, onTogglePicker }: {
    message: MessageItem;
    incoming: boolean;
    mine: boolean;
    members: ConversationMember[];
    myUuid: string | null;
    locale: string;
    searchQuery: string;
    reacted: string[];
    showSender: boolean;
    isEditing: boolean;
    editBody: string;
    editBusy: boolean;
    editError: string | null;
    onEditChange: (value: string) => void;
    onEditCommit: () => void;
    onEditCancel: () => void;
    onReply: (message: MessageItem) => void;
    onReact: (message: MessageItem, emoji: string) => void;
    onDelete: (message: MessageItem) => void;
    onEdit: (message: MessageItem) => void;
    onForward: (message: MessageItem) => void;
    onRetry: (id: string) => void;
    pickerOpen: boolean;
    onTogglePicker: (id: string | null) => void;
}) {
    const { t } = useTranslation();
    if (message.deleted === "mine") return null;
    if (message.deleted === "all") {
        return (
            <article className={`flex ${incoming ? "justify-start" : "justify-end"}`}>
                <div className="max-w-[min(85%,34rem)] rounded-2xl border border-dashed border-[#3A3A3A]/15 px-4 py-2.5 text-xs italic text-[#3A3A3A]/50 dark:border-white/15 dark:text-white/50">
                    {t("messages.deletedMessage")}
                </div>
            </article>
        );
    }
    const interactive = !message.pendingMine && !message.sendFailed;
    const receipt = readReceiptFor(message, members, myUuid);
    const isRead = receipt
        ? receipt.read >= receipt.total
        : isMessageRead(message.created_at, members.find((member) => member.id !== myUuid)?.last_read_at ?? null);
    const entries = Object.entries(messageReactions(message)).filter(([, ids]) => ids.length > 0);
    const attachments = message.attachments ?? (message.attachment ? [message.attachment] : []);
    // The action pill sits on the bubble, so its hover tint has to match the
    // surface underneath it — white wash on charcoal, ink wash on paper.
    const actionHover = incoming ? "hover:bg-[#3A3A3A]/10 dark:hover:bg-white/10" : "hover:bg-white/15";
    const surface = incoming
        ? "rounded-bl-md border border-[#3A3A3A]/[.07] bg-white text-[#3A3A3A]/85 shadow-[0_1px_6px_rgba(58,58,58,.06)] dark:border-white/[.07] dark:bg-[#1b1b20] dark:text-white/85"
        : "rounded-br-md bg-[#3A3A3A] text-white shadow-[0_3px_14px_rgba(58,58,58,.22)]";
    // Exactly one ring at a time: brand accent normally, failure state when the
    // send bounced — two ring utilities on the same element fight in the sheet.
    const ring = message.sendFailed ? "ring-2 ring-red-400" : incoming ? "" : "ring-1 ring-[#F47822]/25";
    return (
        <article className={`flex ${incoming ? "justify-start" : "justify-end"}`}>
            <div className={`group relative max-w-[min(85%,34rem)] rounded-2xl px-4 py-2.5 text-sm leading-6 ${surface} ${ring} ${message.pendingMine ? "opacity-80" : ""}`}>
                {incoming && showSender && <p className="mb-1 text-[10px] font-bold uppercase tracking-[.11em] text-[#F47822]">{message.sender?.name || "HBT"}</p>}
                {message.forwarded_from && (
                    <div className="mb-2 border-s-2 border-[#F47822] ps-2 text-[11px] leading-5 opacity-75">
                        <p className="font-bold">{t("messages.forwardedLabel")}</p>
                        <p className="truncate">{message.forwarded_from.sender_name ?? t("messages.fallbackMsg")}{message.forwarded_from.body_excerpt ? ` · ${message.forwarded_from.body_excerpt}` : ""}</p>
                    </div>
                )}
                {message.reply_preview && (
                    <div className="mb-2 border-s-2 border-[#F47822] ps-2 text-[11px] leading-5 opacity-75">
                        <p className="font-bold">{message.reply_preview.sender_name}</p>
                        <p className="truncate">{message.reply_preview.body_excerpt || t("messages.quotedAttachment")}</p>
                    </div>
                )}
                {isEditing ? (
                    <div className="min-w-[min(100%,270px)]">
                        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#F47822]">
                            <Pencil className="h-3 w-3" aria-hidden="true" />
                            {t("messages.editingTag")}
                        </p>
                        <textarea
                            autoFocus
                            value={editBody}
                            onChange={(event) => onEditChange(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Escape") {
                                    event.preventDefault();
                                    onEditCancel();
                                } else if (event.key === "Enter" && !event.shiftKey) {
                                    event.preventDefault();
                                    onEditCommit();
                                }
                            }}
                            rows={Math.min(10, Math.max(3, editBody.split("\n").length))}
                            aria-label={t("messages.editAction")}
                            className="messages-quiet-focus w-full resize-none rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-white/40 focus:border-[#F47822]/70"
                        />
                        {editError && <p role="alert" className="mt-1.5 text-[11px] font-semibold text-red-300">{editError}</p>}
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10px] text-white/45">{t("messages.editHint")}</span>
                            <span className="flex items-center gap-2">
                                <button type="button" onClick={onEditCancel} disabled={editBusy} className="rounded-lg px-2.5 py-1 text-[11px] font-bold text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-40">{t("messages.cancelEdit")}</button>
                                <button
                                    type="button"
                                    onClick={onEditCommit}
                                    disabled={editBusy || !editBody.trim() || editBody.trim() === (message.body ?? "").trim()}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#F47822] px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-[#de6414] disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    {editBusy && <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden="true" />}
                                    {t("messages.saveEdit")}
                                </button>
                            </span>
                        </div>
                        {attachments.length > 0 && <AttachmentsView attachments={attachments} incoming={incoming} />}
                    </div>
                ) : (
                    <>
                        {message.body?.trim() ? <HighlightBody text={message.body} query={searchQuery} /> : null}
                        {attachments.length > 0 && <AttachmentsView attachments={attachments} incoming={incoming} />}
                    </>
                )}
                {entries.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {entries.map(([emoji, ids]) => (
                            <button key={emoji} type="button" onClick={() => onReact(message, emoji)} title={String(ids.length)} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] transition ${reacted.includes(emoji) ? "bg-[#F47822] text-white" : incoming ? "bg-[#3A3A3A]/[.06] hover:bg-[#3A3A3A]/[.1] dark:bg-white/10 dark:hover:bg-white/20" : "bg-white/10 hover:bg-white/20"}`}>
                                <span>{emoji}</span>
                                <span className="font-bold tabular-nums">{ids.length}</span>
                            </button>
                        ))}
                    </div>
                )}
                <span className="mt-2 flex items-center justify-end gap-1.5">
                    {interactive && (
                        <span className={`flex items-center gap-0.5 rounded-full px-1 py-0.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 max-lg:opacity-100 ${incoming ? "bg-[#3A3A3A]/[.06] dark:bg-white/10" : "bg-white/10"}`}>
                            <button type="button" onClick={() => onReply(message)} title={t("messages.replyAction")} aria-label={t("messages.replyAction")} className={`flex h-7 w-7 items-center justify-center rounded-full opacity-65 transition ${actionHover} hover:opacity-100`}><Reply className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => onTogglePicker(pickerOpen ? null : message.id)} title={t("messages.reactAction")} aria-label={t("messages.reactAction")} aria-expanded={pickerOpen} className={`flex h-7 w-7 items-center justify-center rounded-full opacity-65 transition ${actionHover} hover:opacity-100`}><SmilePlus className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => onForward(message)} title={t("messages.forwardAction")} aria-label={t("messages.forwardAction")} className={`flex h-7 w-7 items-center justify-center rounded-full opacity-65 transition ${actionHover} hover:opacity-100`}><Forward className="h-3.5 w-3.5" /></button>
                            {mine && message.body?.trim() && <button type="button" onClick={() => onEdit(message)} title={t("messages.editAction")} aria-label={t("messages.editAction")} className={`flex h-7 w-7 items-center justify-center rounded-full opacity-65 transition ${actionHover} hover:opacity-100`}><Pencil className="h-3.5 w-3.5" /></button>}
                            {mine && <button type="button" onClick={() => onDelete(message)} title={t("messages.deleteAction")} aria-label={t("messages.deleteAction")} className={`flex h-7 w-7 items-center justify-center rounded-full opacity-65 transition ${actionHover} hover:text-red-400 hover:opacity-100`}><Trash2 className="h-3.5 w-3.5" /></button>}
                        </span>
                    )}
                    <time className="text-[9px] tabular-nums opacity-45">{new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(new Date(message.created_at))}</time>
                    {message.edited && <span className="text-[9px] italic opacity-45">{t("messages.edited")}</span>}
                    {mine && !message.pendingMine && <MessageTicks read={isRead} onDark />}
                    {message.pendingMine && !message.sendFailed && <Clock className="h-3.5 w-3.5 opacity-45" />}
                    {message.sendFailed && <button type="button" onClick={() => onRetry(message.id)} className="text-[10px] font-bold text-red-400 hover:underline">{t("messages.retrySend")}</button>}
                </span>
                {pickerOpen && (
                    <>
                        <button type="button" aria-label={t("messages.close")} onClick={() => onTogglePicker(null)} className="fixed inset-0 z-30 cursor-default" />
                        <span className="absolute bottom-full end-0 z-40 mb-2 flex gap-1 rounded-xl border border-[#3A3A3A]/10 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#1b1b20]">
                            {MESSAGE_REACTIONS.map((emoji) => (
                                <button key={emoji} type="button" onClick={() => onReact(message, emoji)} aria-label={emoji} className="rounded-lg px-1.5 py-1 text-base transition hover:bg-[#F47822]/10">{emoji}</button>
                            ))}
                        </span>
                    </>
                )}
            </div>
        </article>
    );
});

function Thread({ active, conversations, online, onSent, onChanged }: { active: Conversation; conversations: Conversation[]; online: boolean; onSent: () => Promise<void>; onChanged?: () => void }) {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const myId = user?.id ?? null;
    const [body, setBody] = useState("");
    const [pendingCount, setPendingCount] = useState(0);
    const [files, setFiles] = useState<File[]>([]);
    const [fileError, setFileError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [attachOpen, setAttachOpen] = useState(false);
    const [items, setItems] = useState<MessageItem[]>(() => active.messages ?? []);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [renderLimit, setRenderLimit] = useState(RENDER_WINDOW);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [replyDraft, setReplyDraft] = useState<{ id: string; senderName: string; excerpt: string; hasAttachment: boolean } | null>(null);
    const [reactFor, setReactFor] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editBody, setEditBody] = useState("");
    const [editBusy, setEditBusy] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [confirming, setConfirming] = useState<MessageItem | null>(null);
    const [forwarding, setForwarding] = useState<MessageItem | null>(null);
    const [forwardTo, setForwardTo] = useState("");
    const [forwardComment, setForwardComment] = useState("");
    const [forwardingBusy, setForwardingBusy] = useState(false);
    const fileInput = useRef<HTMLInputElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const searchTimer = useRef<number | null>(null);
    const typingTimer = useRef<number>(0);
    const pendingPayloads = useRef<Record<string, { text: string; type: "text" | "quick_reply"; files: File[]; replyId: string | null }>>({});
    const members = useMemo(() => conversationMembers(active), [active]);
    const canAttach = active.type !== "announcement";

    useEffect(() => {
        let cancelled = false;
        pendingPayloads.current = {};
        setItems(active.messages ?? []);
        setHasMore(false);
        setRenderLimit(RENDER_WINDOW);
        setReplyDraft(null);
        setReactFor(null);
        setEditingId(null);
        setEditBody("");
        setEditBusy(false);
        setEditError(null);
        setConfirming(null);
        setForwarding(null);
        setQuery("");
        setSearchOpen(false);
        setFiles([]);
        setFileError(null);
        setAttachOpen(false);
        if (fileInput.current) fileInput.current.value = "";
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
        void messagesApi.fetchMessages(active.id, { per_page: 30 }).then((window) => {
            if (cancelled) return;
            setItems(window.data);
            setHasMore(window.meta.has_more);
        }).catch(() => undefined);
        return () => { cancelled = true; };
    }, [active.id]);

    /* Land the reader on the first unread message rather than making them
     * scroll for it. */
    const firstUnreadId = useMemo(() => {
        if (!active.first_unread_at) return null;
        const target = new Date(active.first_unread_at).getTime();
        if (!Number.isFinite(target)) return null;
        return items.find((message) => !message.pendingMine && new Date(message.created_at).getTime() >= target)?.id ?? null;
    }, [active.first_unread_at, items]);

    useEffect(() => {
        if (!firstUnreadId) return;
        const frame = requestAnimationFrame(() => {
            document.getElementById("unread-marker")?.scrollIntoView({ block: "center" });
        });
        return () => cancelAnimationFrame(frame);
    }, [firstUnreadId, active.id]);

    useEffect(() => {
        if (searchTimer.current) window.clearTimeout(searchTimer.current);
        if (!query.trim()) return;
        setSearching(true);
        searchTimer.current = window.setTimeout(() => {
            const q = query.trim();
            void messagesApi.fetchMessages(active.id, { search: q, per_page: 30 }).then((window) => {
                setItems(window.data);
                setRenderLimit(RENDER_WINDOW);
                setHasMore(false);
                setSearching(false);
            }).catch(() => setSearching(false));
        }, 400);
        return () => { if (searchTimer.current) window.clearTimeout(searchTimer.current); };
    }, [query, active.id]);

    const scrollBottom = () => {
        requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));
    };

    const isMine = (message: MessageItem): boolean => {
        if (message.pendingMine) return true;
        return myId !== null && message.sender?.id !== undefined && message.sender.id === myId;
    };

    /** Cheap, fire-and-forget ping; the composer never waits for the reply. */
    const notifyTyping = () => {
        const now = Date.now();
        if (now - typingTimer.current < TYPING_INTERVAL_MS) return;
        typingTimer.current = now;
        void messagesApi.typing(active.id).catch(() => undefined);
    };

    const send = async (value = body, type: "text" | "quick_reply" = "text") => {
        const text = value.trim();
        const attached = files;
        const replyId = replyDraft?.id ?? null;
        if (!text && attached.length === 0) return;
        if (!online) {
            setFileError(t("messages.offlineSend"));
            return;
        }
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        pendingPayloads.current[tempId] = { text, type, files: attached, replyId };
        const senderName = user ? `${user.first_name} ${user.last_name}`.trim() : "";
        const attachments = attached.map((file) => ({
            name: file.name,
            mime: file.type || "application/octet-stream",
            size: file.size,
            url: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
        }));
        const temp: MessageItem = {
            id: tempId,
            conversation_id: active.id,
            sender: myId ? { id: myId, name: senderName } : undefined,
            message_type: type,
            body: text,
            reply_to: replyId,
            reply_preview: replyDraft ? { sender_name: replyDraft.senderName, body_excerpt: replyDraft.excerpt, has_attachment: replyDraft.hasAttachment } : null,
            reactions: {},
            reacted: NO_REACTIONS,
            attachment: attachments[0] ?? null,
            attachments: attachments.length ? attachments : null,
            created_at: new Date().toISOString(),
            pendingMine: true,
        };
        setItems((prev) => [...prev, temp]);
        setBody("");
        setReplyDraft(null);
        setFiles([]);
        setFileError(null);
        if (fileInput.current) fileInput.current.value = "";
        scrollBottom();
        setPendingCount((count) => count + 1);
        try {
            const saved = await messagesApi.send(active.id, text, type, attached, replyId);
            delete pendingPayloads.current[tempId];
            for (const attachment of attachments) {
                if (attachment.url.startsWith("blob:")) URL.revokeObjectURL(attachment.url);
            }
            setItems((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
            await onSent();
        } catch (cause) {
            setItems((prev) => prev.map((m) => (m.id === tempId ? { ...m, sendFailed: true } : m)));
            setFileError(cause instanceof Error ? cause.message : t("messages.attachments.sendFail"));
        } finally {
            setPendingCount((count) => Math.max(0, count - 1));
        }
    };

    const retrySend = useCallback((tempId: string) => {
        const payload = pendingPayloads.current[tempId];
        if (!payload) return;
        setItems((prev) => prev.map((m) => (m.id === tempId ? { ...m, sendFailed: false, pendingMine: true } : m)));
        setPendingCount((count) => count + 1);
        void messagesApi.send(active.id, payload.text, payload.type, payload.files, payload.replyId).then(async (saved) => {
            delete pendingPayloads.current[tempId];
            setItems((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
            await onSent();
        }).catch((cause) => {
            setItems((prev) => prev.map((m) => (m.id === tempId ? { ...m, sendFailed: true } : m)));
            setFileError(cause instanceof Error ? cause.message : t("messages.attachments.sendFail"));
        }).finally(() => setPendingCount((count) => Math.max(0, count - 1)));
    }, [active.id, onSent, t]);

    const commitDelete = async () => {
        const message = confirming;
        setConfirming(null);
        if (!message) return;
        try {
            const eligible = isRecentEnoughForDeleteForAll(message.created_at);
            const updated = await messagesApi.removeMessage(message.id, eligible ? "for_all" : "for_me");
            setItems((prev) => prev.map((m) => (m.id === message.id ? updated : m)));
            onChanged?.();
        } catch (cause) {
            setFileError(cause instanceof Error ? cause.message : t("messages.attachments.sendFail"));
        }
    };

    const react = useCallback(async (message: MessageItem, emoji: string) => {
        setReactFor(null);
        try {
            const updated = await messagesApi.toggleReaction(message.id, emoji);
            setItems((prev) => prev.map((m) => (m.id === message.id ? updated : m)));
        } catch {
            setFileError(t("messages.attachments.sendFail"));
        }
    }, [t]);

    const startEdit = useCallback((message: MessageItem) => {
        if (message.pendingMine || message.deleted) return;
        setEditingId(message.id);
        setEditBody(message.body ?? "");
        setEditError(null);
        setEditBusy(false);
    }, []);

    const cancelEdit = useCallback(() => {
        setEditingId(null);
        setEditBody("");
        setEditError(null);
        setEditBusy(false);
    }, []);

    const commitEdit = async () => {
        if (!editingId || editBusy) return;
        const next = editBody.trim();
        if (!next) {
            setEditError(t("messages.editEmpty"));
            return;
        }
        const original = items.find((message) => message.id === editingId)?.body?.trim() ?? "";
        if (next === original) {
            cancelEdit();
            return;
        }
        setEditBusy(true);
        setEditError(null);
        try {
            const updated = await messagesApi.edit(editingId, next);
            setItems((prev) => prev.map((message) => (message.id === editingId ? updated : message)));
            cancelEdit();
            // The inbox row keeps its own copy of the latest message, so a
            // successful edit has to refresh it or the preview stays stale.
            onChanged?.();
        } catch (cause) {
            // Keep the draft — losing the reader's wording because the save
            // failed is worse than any error message.
            setEditError(cause instanceof Error ? cause.message : t("messages.editFail"));
        } finally {
            setEditBusy(false);
        }
    };

    const submitForward = async () => {
        if (!forwarding || !forwardTo) return;
        setForwardingBusy(true);
        try {
            await messagesApi.forward(forwarding.id, forwardTo, forwardComment.trim());
            setForwarding(null);
            setForwardTo("");
            setForwardComment("");
            await onSent();
        } catch (cause) {
            setFileError(cause instanceof Error ? cause.message : t("messages.forwardFail"));
        } finally {
            setForwardingBusy(false);
        }
    };

    const startReply = useCallback((message: MessageItem) => {
        if (message.pendingMine || message.deleted) return;
        setReplyDraft({
            id: message.id,
            senderName: message.sender?.name || "HBT",
            excerpt: message.body?.trim().slice(0, 120) || (message.attachment ? message.attachment.name : ""),
            hasAttachment: Boolean(message.attachment),
        });
    }, []);

    const loadEarlier = async () => {
        if (loadingMore || !hasMore || query.trim()) return;
        const oldest = items.find((m) => !m.pendingMine)?.created_at;
        if (!oldest) return;
        setLoadingMore(true);
        try {
            const window = await messagesApi.fetchMessages(active.id, { before: oldest, per_page: 30 });
            setItems((prev) => {
                const seen = new Set(prev.map((m) => m.id));
                return [...window.data.filter((m) => !seen.has(m.id)), ...prev];
            });
            // Older messages land *above* the window, so the window grows by
            // exactly what arrived — otherwise they would never be rendered.
            setRenderLimit((limit) => limit + window.data.length);
            setHasMore(window.meta.has_more);
        } catch {
            // keep silent, button stays for retry
        } finally {
            setLoadingMore(false);
        }
    };

    const clearSearch = () => {
        setQuery("");
        setSearching(false);
        void messagesApi.fetchMessages(active.id, { per_page: 30 }).then((window) => {
            setItems(window.data);
            setRenderLimit(RENDER_WINDOW);
            setHasMore(window.meta.has_more);
        }).catch(() => undefined);
    };

    const addFiles = (picked: FileList | File[] | null | undefined) => {
        if (!picked) return;
        const incoming = Array.from(picked);
        if (!incoming.length) return;
        setFileError(null);
        const accepted: File[] = [];
        for (const file of incoming) {
            if (!isAllowedAttachment(file)) {
                setFileError(t("messages.attachments.badType"));
                continue;
            }
            if (file.size > ATTACHMENT_MAX_BYTES) {
                setFileError(t("messages.attachments.tooBig"));
                continue;
            }
            accepted.push(file);
        }
        setFiles((prev) => {
            const next = [...prev, ...accepted];
            if (next.length > MAX_ATTACHMENTS) {
                setFileError(t("messages.attachments.tooMany", { count: MAX_ATTACHMENTS }));
                return next.slice(0, MAX_ATTACHMENTS);
            }
            return next;
        });
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, position) => position !== index));
    };

    const openPicker = (kind: "image" | "file") => {
        setAttachOpen(false);
        setFileError(null);
        if (fileInput.current) {
            fileInput.current.accept = kind === "image"
                ? "image/png,image/jpeg,.png,.jpg,.jpeg"
                : ATTACHMENT_ACCEPT;
            fileInput.current.click();
        }
    };

    const onScroll = () => {
        const node = listRef.current;
        if (!node) return;
        if (node.scrollTop > 160) return;
        setRenderLimit((limit) => (items.length > limit ? Math.min(items.length, limit + RENDER_WINDOW) : limit));
    };

    const rendered = items.length > renderLimit ? items.slice(items.length - renderLimit) : items;
    const renderOffset = items.length - rendered.length;
    const hasContent = Boolean(body.trim()) || files.length > 0;
    const sendDisabled = !online || !hasContent;

    return <>
        <div
            ref={listRef}
            onScroll={onScroll}
            onDragOver={(event) => { if (!canAttach) return; event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
                if (!canAttach) return;
                event.preventDefault();
                setDragging(false);
                addFiles(event.dataTransfer.files);
            }}
            className={`relative flex-1 space-y-4 overflow-y-auto bg-[#FCFCFC] p-4 sm:p-6 dark:bg-[#232329] ${dragging ? "outline-2 outline-dashed outline-[#F47822]" : ""}`}
        >
        {dragging && <div className="pointer-events-none sticky top-1/2 z-20 -my-6 rounded-2xl border-2 border-dashed border-[#F47822] bg-white/90 px-6 py-8 text-center text-xs font-bold text-[#F47822] dark:bg-[#1b1b20]/90">{t("messages.attachments.dropHere")}</div>}
        <div className="sticky top-0 z-10 -mx-1 flex items-center gap-2 bg-[#FCFCFC]/95 px-1 py-1.5 backdrop-blur dark:bg-[#232329]/95">
            {searchOpen ? (
                <div className="flex w-full items-center gap-2 rounded-xl border border-[#F47822]/45 bg-white px-3 py-1.5 shadow-sm dark:border-[#F47822]/40 dark:bg-[#1b1b20]">
                    <Search className="h-4 w-4 shrink-0 text-[#F47822]" />
                    <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("messages.searchThreadPh")} aria-label={t("messages.searchInThread")} className="messages-quiet-focus h-8 min-w-0 flex-1 bg-transparent text-sm text-[#3A3A3A] outline-none placeholder:text-[#3A3A3A]/35 dark:text-[#ececef] dark:placeholder:text-white/35" />
                    {searching && <LoaderCircle className="h-4 w-4 animate-spin text-[#F47822]" />}
                    <button type="button" onClick={() => { setSearchOpen(false); clearSearch(); }} aria-label={t("messages.close")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#3A3A3A]/40 hover:bg-[#3A3A3A]/8 dark:text-white/40 dark:hover:bg-white/10"><X className="h-3.5 w-3.5" /></button>
                </div>
            ) : (
                <>
                    {hasMore && !query.trim() ? (
                        <button type="button" onClick={() => void loadEarlier()} disabled={loadingMore} className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-[#F47822]/20 bg-white px-3.5 py-1.5 text-[11px] font-bold text-[#F47822] shadow-sm transition hover:bg-[#F47822] hover:text-white disabled:opacity-50 dark:bg-[#1b1b20]">
                            {loadingMore ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
                            {t("messages.loadEarlier")}
                        </button>
                    ) : <span className="flex-1" />}
                    <button type="button" onClick={() => setSearchOpen(true)} title={t("messages.searchInThread")} aria-label={t("messages.searchInThread")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#3A3A3A]/40 transition hover:bg-[#F47822]/10 hover:text-[#F47822] dark:text-white/40 dark:hover:bg-[#F47822]/15 dark:hover:text-[#F47822]"><Search className="h-4 w-4" /></button>
                </>
            )}
        </div>
        {rendered.map((message, index) => {
            const mine = isMine(message);
            const day = dayKey(message.created_at);
            const absoluteIndex = renderOffset + index;
            const previousDay = absoluteIndex > 0 ? dayKey(items[absoluteIndex - 1].created_at) : null;
            const showDivider = day !== "" && day !== previousDay;
            const showUnread = Boolean(firstUnreadId) && message.id === firstUnreadId;
            // Only name the sender once per run — repeating it on every bubble
            // turns a group thread into a wall of uppercase labels.
            const previousMessage = absoluteIndex > 0 ? items[absoluteIndex - 1] : null;
            const senderId = message.sender?.id;
            const showSender = !mine && (!senderId || !previousMessage || previousMessage.sender?.id !== senderId);
            return (
                <Fragment key={message.id}>
                    {(showDivider || showUnread) && (
                        <DayDivider
                            id={showUnread ? "unread-marker" : undefined}
                            label={showUnread
                                ? t("messages.unreadMarker")
                                : (() => {
                                    const now = new Date();
                                    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                                    const date = new Date(message.created_at);
                                    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
                                    const days = Math.round((startOfToday - startOfDate) / 86_400_000);
                                    if (days <= 0) return t("messages.dayToday");
                                    if (days === 1) return t("messages.dayYesterday");
                                    return new Intl.DateTimeFormat(i18n.language, { weekday: "short", day: "numeric", month: "short" }).format(date);
                                })()}
                        />
                    )}
                    <Bubble
                    message={message}
                    incoming={!mine}
                    mine={mine}
                    members={members}
                    myUuid={myId}
                    locale={i18n.language}
                    searchQuery={query.trim()}
                    reacted={message.reacted ?? NO_REACTIONS}
                    showSender={showSender}
                    isEditing={editingId === message.id}
                    editBody={editBody}
                    editBusy={editBusy}
                    editError={editingId === message.id ? editError : null}
                    onEditChange={setEditBody}
                    onEditCommit={() => void commitEdit()}
                    onEditCancel={cancelEdit}
                    onReply={startReply}
                    onReact={(m, emoji) => void react(m, emoji)}
                    onDelete={setConfirming}
                    onEdit={startEdit}
                    onForward={(m) => { setForwarding(m); setForwardTo(conversations.find((c) => c.id !== active.id)?.id ?? ""); }}
                    onRetry={retrySend}
                    pickerOpen={reactFor === message.id}
                    onTogglePicker={setReactFor}
                    />
                </Fragment>
            );
        })}
        {query.trim() && !searching && items.length === 0 && (
            <p className="py-12 text-center text-xs text-[#3A3A3A]/45 dark:text-white/45">{t("messages.searchEmpty")}</p>
        )}
        {!query.trim() && !searching && items.length === 0 && (
            <div className="flex flex-col items-center px-6 py-16 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-[24px] bg-[#F47822]/10 text-[#F47822] ring-1 ring-[#F47822]/15">
                    <MessageCircle className="h-7 w-7" />
                </span>
                <p className="mt-4 text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.emptyThreadTitle")}</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">{t("messages.emptyThreadDesc")}</p>
            </div>
        )}
    </div>
        {active.replies_enabled && active.status === "active" ? (
            <footer className="border-t border-[#3A3A3A]/8 bg-white p-4 sm:p-5 dark:border-white/8 dark:bg-[#1b1b20]">
                {active.quick_replies.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {active.quick_replies.map((reply) => (
                            <button key={reply} onClick={() => void send(reply, "quick_reply")} className="rounded-full border border-[#F47822]/25 bg-[#F47822]/[.05] px-3 py-1.5 text-[11px] font-semibold text-[#F47822] transition hover:-translate-y-0.5 hover:bg-[#F47822] hover:text-white dark:border-[#F47822]/30 dark:bg-[#F47822]/10">{reply}</button>
                        ))}
                    </div>
                )}
                {replyDraft && (
                    <div className="mb-3 flex items-center gap-2 rounded-xl border-s-2 border-[#F47822] bg-[#FCFCFC] px-3 py-2 dark:bg-[#232329]">
                        <span className="min-w-0 flex-1">
                            <span className="block text-[10px] font-bold uppercase tracking-[.1em] text-[#F47822]">{t("messages.replyingTo", { name: replyDraft.senderName })}</span>
                            <span className="block truncate text-xs text-[#3A3A3A]/60 dark:text-white/60">{replyDraft.excerpt || t("messages.quotedAttachment")}</span>
                        </span>
                        <button type="button" onClick={() => setReplyDraft(null)} aria-label={t("messages.close")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#3A3A3A]/40 transition hover:bg-[#3A3A3A]/8 dark:text-white/40 dark:hover:bg-white/10"><X className="h-3.5 w-3.5" /></button>
                    </div>
                )}
                {canAttach && files.length > 0 && (
                    <div className="mb-3 space-y-2">
                        {files.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-xl border border-[#F47822]/20 bg-[#F47822]/[.05] px-3 py-2">
                                <FileText className="h-4 w-4 shrink-0 text-[#F47822]" />
                                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{file.name}</span>
                                <span className="shrink-0 text-[10px] text-[#3A3A3A]/45 dark:text-white/45">{formatAttachmentSize(file.size)}</span>
                                <button type="button" onClick={() => removeFile(index)} title={t("messages.attachments.remove")} aria-label={t("messages.attachments.remove")} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[#3A3A3A]/40 transition hover:bg-red-50 hover:text-red-500 dark:text-white/40 dark:hover:bg-red-500/10"><X className="h-3.5 w-3.5" /></button>
                            </div>
                        ))}
                    </div>
                )}
                {fileError && <p role="alert" className="mb-3 text-xs font-semibold text-red-600 dark:text-red-400">{fileError}</p>}
                <div className="flex items-end gap-2 rounded-2xl border border-[#3A3A3A]/10 bg-[#FAFAFA] p-2 transition focus-within:border-[#F47822]/55 focus-within:bg-white dark:border-white/10 dark:bg-[#232329] dark:focus-within:bg-[#1b1b20]">
                    {canAttach && (
                        <div className="relative shrink-0">
                            <input ref={fileInput} type="file" multiple accept={ATTACHMENT_ACCEPT} className="hidden" onChange={(event) => { addFiles(event.target.files); setAttachOpen(false); if (fileInput.current) fileInput.current.value = ""; }} />
                            <button type="button" onClick={() => setAttachOpen((value) => !value)} aria-expanded={attachOpen} aria-haspopup="menu" title={t("messages.attachments.attach")} aria-label={t("messages.attachments.attach")} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#3A3A3A]/45 transition hover:bg-[#F47822]/10 hover:text-[#F47822] dark:text-white/45"><Paperclip className="h-4 w-4" /></button>
                            {attachOpen && (
                                <>
                                    <button type="button" aria-label={t("messages.close")} onClick={() => setAttachOpen(false)} className="fixed inset-0 z-40 cursor-default" />
                                    <div role="menu" className="absolute bottom-12 start-0 z-50 w-48 overflow-hidden rounded-xl border border-[#3A3A3A]/10 bg-white p-1.5 shadow-[0_15px_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#1b1b20]">
                                        <button type="button" role="menuitem" onClick={() => openPicker("image")} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-[#3A3A3A] transition hover:bg-[#F47822]/[.06] hover:text-[#F47822] dark:text-[#ececef]"><ImageIcon className="h-4 w-4 shrink-0" />{t("messages.attachments.attachImage")}</button>
                                        <button type="button" role="menuitem" onClick={() => openPicker("file")} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-[#3A3A3A] transition hover:bg-[#F47822]/[.06] hover:text-[#F47822] dark:text-[#ececef]"><FileText className="h-4 w-4 shrink-0" />{t("messages.attachments.attachFile")}</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <textarea
                        value={body}
                        onChange={(event) => { setBody(event.target.value); notifyTyping(); }}
                        onPaste={(event) => { if (!canAttach) return; const dropped = Array.from(event.clipboardData.files ?? []); if (dropped.length) { event.preventDefault(); addFiles(dropped); } }}
                        onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }}
                        rows={1}
                        placeholder={online ? t("messages.replyPh") : t("messages.offlineSend")}
                        aria-label={t("messages.replyPh")}
                        className="messages-quiet-focus max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-[#3A3A3A] outline-none placeholder:text-[#3A3A3A]/40 dark:text-[#ececef] dark:placeholder:text-white/40"
                    />
                    <button
                        disabled={sendDisabled}
                        onClick={() => void send()}
                        aria-label={t("messages.sendAria")}
                        title={t("messages.sendAria")}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F47822] text-white shadow-[0_6px_16px_rgba(244,120,34,.35)] transition hover:bg-[#df6817] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                    >
                        {pendingCount > 0 ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rtl:-scale-x-100" />}
                    </button>
                </div>
            </footer>
        ) : (
            <div className="border-t border-[#3A3A3A]/8 bg-[#FAFAFA] px-5 py-4 text-xs text-[#3A3A3A]/45 dark:border-white/8 dark:bg-[#232329] dark:text-white/45">{t("messages.repliesDisabled")}</div>
        )}
        {confirming && (
            <ConfirmDialog
                title={t("messages.deleteTitle")}
                description={isRecentEnoughForDeleteForAll(confirming.created_at) ? t("messages.deleteConfirmEveryone") : t("messages.deleteConfirmMe")}
                confirmLabel={t("messages.deleteAction")}
                cancelLabel={t("messages.cancel")}
                danger
                onConfirm={() => void commitDelete()}
                onCancel={() => setConfirming(null)}
            />
        )}
        {forwarding && (
            <div className="fixed inset-0 z-[60] grid place-items-center bg-[#17202b]/40 p-4 backdrop-blur-sm" role="presentation" onClick={() => setForwarding(null)}>
                <div role="dialog" aria-modal="true" aria-label={t("messages.forwardTitle")} onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-[24px] border border-[#3A3A3A]/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#1b1b20]">
                    <h2 className="text-base font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.forwardTitle")}</h2>
                    <p className="mt-1 truncate text-xs text-[#3A3A3A]/55 dark:text-white/55">{forwarding.body || forwarding.attachment?.name}</p>
                    <label className="mt-4 block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.forwardTo")}
                        <select value={forwardTo} onChange={(event) => setForwardTo(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 bg-[#FAFAFA] px-3 text-sm font-normal dark:border-white/12 dark:bg-[#232329]">
                            <option value="">{t("messages.chooseRecipient")}</option>
                            {conversations.filter((conversation) => conversation.id !== active.id).map((conversation) => <option key={conversation.id} value={conversation.id}>{conversation.subject || conversation.participant?.name || t("messages.fallbackConv")}</option>)}
                        </select>
                    </label>
                    <label className="mt-3 block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.forwardComment")}
                        <textarea value={forwardComment} onChange={(event) => setForwardComment(event.target.value)} rows={2} placeholder={t("messages.forwardCommentPh")} className="messages-quiet-focus mt-1.5 w-full resize-none rounded-xl border border-[#3A3A3A]/12 bg-[#FAFAFA] px-3 py-2 text-sm font-normal outline-none dark:border-white/12 dark:bg-[#232329]" />
                    </label>
                    <div className="mt-5 flex justify-end gap-2">
                        <button type="button" onClick={() => setForwarding(null)} className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#3A3A3A]/60 transition hover:bg-[#3A3A3A]/5 dark:text-white/60 dark:hover:bg-white/5">{t("messages.cancel")}</button>
                        <button type="button" disabled={!forwardTo || forwardingBusy} onClick={() => void submitForward()} className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#de6414] disabled:opacity-40">{forwardingBusy && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{t("messages.forwardSend")}</button>
                    </div>
                </div>
            </div>
        )}
    </>;
}

function Compose({ contacts, initialRecipient, onClose, onCreated }: { contacts: Contact[]; initialRecipient?: string; onClose: () => void; onCreated: (conversation: Conversation) => Promise<void> }) {
    const { t } = useTranslation();
    const [mode, setMode] = useState<"direct" | "group">("direct");
    const [recipient, setRecipient] = useState(initialRecipient ?? contacts[0]?.id ?? ""); const [subject, setSubject] = useState(""); const [message, setMessage] = useState(""); const [sending, setSending] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [memberQuery, setMemberQuery] = useState("");
    const [groupError, setGroupError] = useState<string | null>(null);
    const visibleContacts = memberQuery.trim()
        ? contacts.filter((contact) => `${contact.name} ${contact.email} ${contact.role ?? ""}`.toLowerCase().includes(memberQuery.trim().toLowerCase()))
        : contacts;
    const toggleMember = (id: string) => {
        setGroupError(null);
        setSelected((prev) => (prev.includes(id) ? prev.filter((member) => member !== id) : [...prev, id]));
    };
    const submitDirect = async (event: FormEvent) => { event.preventDefault(); setSending(true); try { await onCreated(await messagesApi.create({ recipient_id: recipient, subject, message })); } finally { setSending(false); } };
    const submitGroup = async (event: FormEvent) => {
        event.preventDefault();
        if (selected.length < 2) {
            setGroupError(t("messages.groupMin"));
            return;
        }
        setSending(true);
        setGroupError(null);
        try {
            await onCreated(await messagesApi.createGroup({ recipient_ids: selected, subject }));
        } catch (cause) {
            setGroupError(cause instanceof Error ? cause.message : t("messages.attachments.sendFail"));
        } finally {
            setSending(false);
        }
    };
    return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#17202b]/35 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[28px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">{t("messages.composeTag")}</p><h2 className="mt-1 text-lg font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.composeTitle")}</h2></div><button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xs font-bold text-[#3A3A3A]/45 dark:text-white/45">{t("messages.close")}</button></div><div className="mt-4 inline-flex rounded-xl bg-[#FCFCFC] p-1 dark:bg-[#1b1b20]"><button type="button" onClick={() => setMode("direct")} aria-pressed={mode === "direct"} className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${mode === "direct" ? "bg-white text-[#F47822] shadow-sm dark:bg-[#1b1b20]" : "text-[#3A3A3A]/55 dark:text-white/55"}`}>{t("messages.tabDirect")}</button><button type="button" onClick={() => setMode("group")} aria-pressed={mode === "group"} className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${mode === "group" ? "bg-white text-[#F47822] shadow-sm dark:bg-[#1b1b20]" : "text-[#3A3A3A]/55 dark:text-white/55"}`}>{t("messages.tabGroup")}</button></div>{mode === "direct" ? (<form onSubmit={submitDirect}><label className="mt-5 block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.recipient")}<select value={recipient} onChange={(event) => setRecipient(event.target.value)} required className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 bg-[#FAFAFA] dark:bg-[#232329] px-3 text-sm font-normal"><option value="">{t("messages.chooseRecipient")}</option>{contacts.length === 0 ? <option value="">{t("messages.noRecipients")}</option> : contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} · {contact.role}</option>)}</select></label><label className="mt-3 block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.subjectOptional")}<input value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 bg-[#FAFAFA] dark:bg-[#232329] px-3 text-sm font-normal" /></label><label className="mt-3 block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.firstMessage")}<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} className="mt-1.5 w-full resize-none rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 bg-[#FAFAFA] dark:bg-[#232329] px-3 py-2 text-sm font-normal" /></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#3A3A3A]/55 dark:text-white/55">{t("messages.cancelEdit")}</button><button type="submit" disabled={sending || !recipient} className="rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#de6414] disabled:opacity-40">{sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : t("messages.startConversation")}</button></div></form>) : (<form onSubmit={submitGroup}><label className="mt-5 block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.subject")}<input value={subject} onChange={(event) => setSubject(event.target.value)} required className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 bg-[#FAFAFA] dark:bg-[#232329] px-3 text-sm font-normal" /></label><label className="mt-3 block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.members")}<input value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} placeholder={t("messages.searchMembers")} className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 bg-[#FAFAFA] dark:bg-[#232329] px-3 text-sm font-normal" /></label><div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-[#3A3A3A]/10 dark:border-white/10">{visibleContacts.length === 0 ? <p className="px-3 py-5 text-center text-xs leading-5 text-[#3A3A3A]/55 dark:text-white/55">{contacts.length === 0 ? <><b className="block text-[#3A3A3A] dark:text-[#ececef]">{t("messages.noContacts")}</b>{t("messages.noContactsDesc")}</> : t("messages.emptyFiltered")}</p> : visibleContacts.map((contact) => (<label key={contact.id} className="flex cursor-pointer items-center gap-2.5 border-b border-[#3A3A3A]/6 px-3 py-2.5 text-xs last:border-b-0 dark:border-white/6"><input type="checkbox" checked={selected.includes(contact.id)} onChange={() => toggleMember(contact.id)} className="h-4 w-4 accent-[#F47822]" /><span className="min-w-0 flex-1 truncate text-[#3A3A3A] dark:text-[#ececef]">{contact.name} · {contact.role}</span></label>))}</div>{groupError && <p className="mt-2 text-xs font-semibold text-red-600">{groupError}</p>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#3A3A3A]/55 dark:text-white/55">{t("messages.cancelEdit")}</button><button type="submit" disabled={sending} className="rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#de6414] disabled:opacity-40">{sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : t("messages.createGroup")}</button></div></form>)}</div></div>;
}
