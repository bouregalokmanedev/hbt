import { Archive, BellRing, Check, CheckCheck, ChevronRight, Clock, Download, FileText, Image as ImageIcon, LoaderCircle, MailPlus, MessageCircle, Paperclip, Reply, Search, Send, SmilePlus, Trash2, UserRound, Users, X } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AVATAR_SQUARE_SHAPE } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { messagesApi, ATTACHMENT_MAX_BYTES, formatAttachmentSize, isAllowedAttachment, isRecentEnoughForDeleteForAll, MESSAGE_REACTIONS, messageReactions, type Contact, type Conversation, type MessageAttachment, type MessageItem } from "../api/messages.api";
import { settingsApi } from "@/features/settings/api/settings.api";

export type MessagesMode = "messages" | "announcements";

/*
|--------------------------------------------------------------------------
| Read / delivered ticks (Messenger / WhatsApp style)
|--------------------------------------------------------------------------
| A message I sent is "delivered" once stored server-side. It becomes
| "read" once the other participant's last_read_at passes its created_at.
| Ticks only ever render on my own (outgoing) messages.
*/
export function isMessageRead(createdAt: string, lastReadAt?: string | null): boolean {
    if (!lastReadAt) return false;
    const read = new Date(lastReadAt).getTime();
    const sent = new Date(createdAt).getTime();
    return Number.isFinite(read) && Number.isFinite(sent) && read >= sent;
}

export function MessageTicks({ read, onDark = false }: { read: boolean; onDark?: boolean }) {
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

export function MessagesPage({ mode = "messages", basePath = "", getProfilePath, announceHref }: { mode?: MessagesMode; basePath?: string; getProfilePath?: (participant: Contact) => string | null; announceHref?: string }) {
    const { t, i18n } = useTranslation();
    const [params, setParams] = useSearchParams();
    const [items, setItems] = useState<Conversation[]>([]);
    const [active, setActive] = useState<Conversation | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [compose, setCompose] = useState(false);
    const [composeTo, setComposeTo] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const receiptsLoaded = useRef(false);
    const receiptsOn = useRef(true);
    const isAnnouncements = mode === "announcements";
    const ModeIcon = isAnnouncements ? BellRing : MessageCircle;

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

    const openConversation = async (id: string) => {
        const conversation = await messagesApi.get(id);
        setActive(conversation);
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

    const load = async () => {
        setLoading(true);
        try {
            const all = await messagesApi.list();
            const filtered = all.filter((item) => isAnnouncements ? item.type === "announcement" : item.type !== "announcement");
            setItems(filtered);
            const requested = params.get("conversation");
            if (requested && filtered.some((item) => item.id === requested)) await openConversation(requested);
            else if (filtered[0]) await openConversation(filtered[0].id);
            else setActive(null);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("messages.loadFail"));
        } finally { setLoading(false); }
    };

    useEffect(() => { void load(); }, [mode]);

    const visibleItems = unreadOnly ? items.filter((item) => (item.unread_count ?? 0) > 0) : items;

    return <main className="min-h-full bg-[#F3F3F3] dark:bg-[#101013] px-4 py-5 sm:px-7 sm:py-7">
        <div className="mx-auto max-w-[1480px]">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.19em] text-[#F47822]">{t("messages.eyebrow")}</p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef] sm:text-3xl">{isAnnouncements ? t("messages.titleAnn") : t("messages.titleMsg")}</h1>
                    <p className="mt-1 max-w-2xl text-sm text-[#3A3A3A]/55 dark:text-white/55">{isAnnouncements ? t("messages.descAnn") : t("messages.descMsg")}</p>
                </div>
                {!isAnnouncements && <button onClick={async () => { setCompose(true); if (!contacts.length) setContacts(await messagesApi.contacts()); }} className="inline-flex items-center gap-2 rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F47822]"><MailPlus className="h-4 w-4" />{t("messages.newMessage")}</button>}
                {isAnnouncements && announceHref && <Link to={announceHref} className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#de6414]"><BellRing className="h-4 w-4" />{t("messages.newAnnouncement")}</Link>}
            </header>

            <nav className="mb-5 inline-flex flex-wrap items-center gap-1 rounded-xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-1 shadow-sm">
                <Link to={`${basePath}/messages`} className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${!isAnnouncements ? "bg-[#F47822] text-white" : "text-[#3A3A3A]/55 dark:text-white/55 hover:text-[#3A3A3A] dark:hover:text-[#ececef]"}`}><MessageCircle className="h-3.5 w-3.5" />{t("messages.tabMessages")}</Link>
                <Link to={`${basePath}/announcements`} className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${isAnnouncements ? "bg-[#F47822] text-white" : "text-[#3A3A3A]/55 dark:text-white/55 hover:text-[#3A3A3A] dark:hover:text-[#ececef]"}`}><BellRing className="h-3.5 w-3.5" />{t("messages.tabAnnouncements")}</Link>
                {(() => {
                    const totalUnread = items.reduce((sum, item) => sum + (item.unread_count ?? 0), 0);
                    return (
                        <button type="button" onClick={() => setUnreadOnly((value) => !value)} aria-pressed={unreadOnly} className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${unreadOnly ? "bg-[#3A3A3A] text-white dark:bg-white dark:text-[#3A3A3A]" : "text-[#3A3A3A]/55 dark:text-white/55 hover:text-[#3A3A3A] dark:hover:text-[#ececef]"}`}>
                            {t("messages.filterUnread")}
                            {totalUnread > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${unreadOnly ? "bg-white/20 text-white dark:bg-[#3A3A3A]/10 dark:text-[#3A3A3A]" : "bg-[#F47822] text-white"}`}>{totalUnread}</span>}
                        </button>
                    );
                })()}
            </nav>

            {error ? <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-5 text-sm text-red-700 dark:text-red-400">{error}</div> : <div className="grid min-h-[650px] overflow-hidden rounded-[28px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] shadow-[0_18px_48px_rgba(58,58,58,.07)] lg:grid-cols-[340px_minmax(0,1fr)]">
                <aside className="border-b border-[#3A3A3A]/8 dark:border-white/8 bg-[#FCFCFC] dark:bg-[#232329] lg:border-b-0 lg:border-r">
                    <div className="flex items-center justify-between border-b border-[#3A3A3A]/8 dark:border-white/8 px-5 py-5"><div><p className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{isAnnouncements ? t("messages.updates") : t("messages.inbox")}</p><p className="mt-1 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">{t("messages.items", { count: items.length })}</p></div><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#F47822]/10 text-[#F47822]"><ModeIcon className="h-4 w-4" /></span></div>
                    {loading ? <p className="p-6 text-xs text-[#3A3A3A]/45 dark:text-white/45">{t("messages.loading")}</p> : items.length === 0 || visibleItems.length === 0 ? <div className="p-8 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#F47822]/10 text-[#F47822]"><ModeIcon className="h-5 w-5" /></span><p className="mt-4 text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{unreadOnly && items.length > 0 ? t("messages.emptyUnread") : isAnnouncements ? t("messages.emptyAnnTitle") : t("messages.emptyMsgTitle")}</p>{unreadOnly && items.length > 0 ? null : <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">{isAnnouncements ? t("messages.emptyAnnDesc") : t("messages.emptyMsgDesc")}</p>}</div> : <div className="max-h-[590px] overflow-y-auto">{visibleItems.map((conversation) => (
                        <ConversationRow
                            key={conversation.id}
                            conversation={conversation}
                            isActive={active?.id === conversation.id}
                            isAnnouncements={isAnnouncements}
                            fallbackName={t("messages.fallbackConv")}
                            fallbackSubtitle={isAnnouncements ? t("messages.adminLabel") : conversation.type === "group" ? t("messages.groupMembers", { count: conversation.member_count ?? 0 }) : conversation.participant?.role || t("messages.directLabel")}
                            onOpen={() => void openConversation(conversation.id)}
                        />
                    ))}</div>}
                </aside>
                <section className="flex min-h-[500px] flex-col">
                    <div className="flex items-center justify-between border-b border-[#3A3A3A]/8 dark:border-white/8 px-5 py-4 sm:px-6">{active ? <div className="flex min-w-0 items-center gap-3"><ThreadHeaderAvatar active={active} /><div className="min-w-0 flex-1">{(() => {
                        const profilePath = !active.subject && active.participant && getProfilePath ? getProfilePath(active.participant) : null;
                        const title = active.subject || active.participant?.name || t("messages.fallbackMsg");
                        return profilePath
                            ? <Link to={profilePath} title={title} className="block truncate text-sm font-bold text-[#3A3A3A] dark:text-[#ececef] transition hover:text-[#F47822] hover:underline">{title}</Link>
                            : <p className="truncate text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{title}</p>;
                    })()}<p className="mt-1 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">{active.type === "group" ? t("messages.groupMembers", { count: active.member_count ?? active.participants?.length ?? 0 }) : isAnnouncements ? t("messages.privateThread") : t("messages.threadWith", { name: active.participant?.name ?? t("messages.teamFallback") })}</p>{active.type === "direct" && active.participant?.last_read_at && <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#3A3A3A]/35 dark:text-white/35"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{t("messages.lastSeen", { when: formatLastSeen(active.participant.last_read_at, i18n.language) })}</p>}</div></div> : <p className="text-sm font-semibold text-[#3A3A3A]/50 dark:text-white/50">{t("messages.selectItem")}</p>}{active?.status === "active" && <button onClick={async () => { await messagesApi.archive(active.id); await load(); }} className="rounded-lg p-2 text-[#3A3A3A]/40 dark:text-white/40 transition hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400" aria-label={t("messages.archiveAria")}><Archive className="h-4 w-4" /></button>}</div>
                    {active ? <Thread active={active} onSent={async () => { await openConversation(active.id); await load(); }} /> : <div className="flex flex-1 items-center justify-center p-8 text-center"><div><UserRound className="mx-auto h-8 w-8 text-[#F47822]/40" /><p className="mt-3 text-sm font-semibold text-[#3A3A3A]/60 dark:text-white/60">{t("messages.chooseConv")}</p></div></div>}
                </section>
            </div>}
            {compose && <Compose contacts={contacts} initialRecipient={composeTo} onClose={() => { setCompose(false); setComposeTo(""); }} onCreated={async (conversation) => { setCompose(false); setComposeTo(""); await load(); await openConversation(conversation.id); }} />}
        </div>
    </main>;
}

export function formatLastSeen(when: string, locale: string): string {
    const days = Math.max(0, Math.round((Date.now() - new Date(when).getTime()) / 86_400_000));
    try {
        return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-days, "day");
    } catch {
        return new Date(when).toLocaleDateString(locale);
    }
}

export function AnnouncementsPage({ basePath = "" }: { basePath?: string }) { return <MessagesPage mode="announcements" basePath={basePath} />; }

const AVATAR_TONES = [
    "bg-[#F47822]/12 text-[#F47822]",
    "bg-[#3A3A3A]/8 text-[#3A3A3A] dark:bg-white/10 dark:text-white",
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    "bg-violet-500/10 text-violet-600 dark:text-violet-400",
];

export function initialsOf(name: string): string {
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

export function formatListTime(iso: string | null | undefined, locale: string): string {
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

export function dayKey(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? "" : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function DayDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 px-2">
            <span className="h-px flex-1 bg-[#3A3A3A]/8 dark:bg-white/10" />
            <span className="rounded-full bg-[#3A3A3A]/[.05] px-3 py-1 text-[10px] font-bold text-[#3A3A3A]/50 dark:bg-white/10 dark:text-white/60">{label}</span>
            <span className="h-px flex-1 bg-[#3A3A3A]/8 dark:bg-white/10" />
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
    if (conversation.type === "group") {
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
    if (active.type === "group") {
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

function ConversationRow({ conversation, isActive, isAnnouncements, fallbackName, fallbackSubtitle, onOpen }: {
    conversation: Conversation;
    isActive: boolean;
    isAnnouncements: boolean;
    fallbackName: string;
    fallbackSubtitle: string;
    onOpen: () => void;
}) {
    const { t, i18n } = useTranslation();
    const latest = conversation.messages?.[0];
    const outgoing = Boolean(latest?.sender?.id && latest.sender.id !== conversation.participant?.id);
    const preview = !latest || latest.deleted ? null : latest.body?.trim() || latest.attachment?.name || null;
    const name = conversation.subject || conversation.participant?.name || fallbackName;
    const unread = conversation.unread_count ?? 0;
    return (
        <button
            type="button"
            onClick={onOpen}
            className={`group flex w-full items-center gap-3 border-b border-[#3A3A3A]/6 px-5 py-3.5 text-start transition last:border-b-0 hover:bg-[#F47822]/[.035] dark:border-white/6 ${isActive ? "bg-[#FFF8F4] shadow-[inset_0_0_0_1px_rgba(244,120,34,.12)] dark:bg-[#F47822]/[.07] dark:shadow-none" : ""}`}
        >
            <span className="relative shrink-0">
                <ConversationAvatar conversation={conversation} isAnnouncements={isAnnouncements} />
                {unread > 0 && <span className="absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#FCFCFC] bg-[#F47822] dark:border-[#232329]" />}
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                    <b className="truncate text-[13px] font-semibold text-[#3A3A3A] dark:text-[#ececef]">{name}</b>
                    {conversation.last_message_at && (
                        <time className={`shrink-0 text-[10px] tabular-nums ${unread > 0 ? "font-bold text-[#F47822]" : "text-[#3A3A3A]/40 dark:text-white/40"}`}>
                            {formatListTime(conversation.last_message_at, i18n.language)}
                        </time>
                    )}
                </span>
                <span className="mt-1 flex items-center gap-1.5">
                    <span className={`shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide ${isAnnouncements ? "bg-[#F47822]/12 text-[#F47822]" : "bg-[#3A3A3A]/7 text-[#3A3A3A]/50 dark:bg-white/10 dark:text-white/55"}`}>
                        {isAnnouncements ? t("messages.typeAnnouncement") : t("messages.typeMessage")}
                    </span>
                    {outgoing && latest && <RowTicks conversation={conversation} />}
                    <span className={`min-w-0 flex-1 truncate text-[11px] ${unread > 0 ? "font-semibold text-[#3A3A3A] dark:text-[#ececef]" : "text-[#3A3A3A]/45 dark:text-white/45"}`}>
                        {preview ?? fallbackSubtitle}
                    </span>
                    {unread > 0 && (
                        <span className="shrink-0 rounded-full bg-[#F47822] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
                            {unread > 99 ? "99+" : unread}
                        </span>
                    )}
                </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#3A3A3A]/20 transition group-hover:translate-x-0.5 group-hover:text-[#F47822] rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0 dark:text-white/20" />
        </button>
    );
}

function RowTicks({ conversation }: { conversation: Conversation }) {
    const latest = conversation.messages?.[0];
    if (!latest?.sender?.id || latest.sender.id === conversation.participant?.id) return null;
    return <MessageTicks read={isMessageRead(latest.created_at, conversation.participant?.last_read_at)} />;
}

function AttachmentView({ attachment, incoming }: { attachment: MessageAttachment; incoming: boolean }) {
    const { t } = useTranslation();
    const label = t("messages.attachments.download", { name: attachment.name });
    if (attachment.mime.startsWith("image/")) {
        return (
            <span className="mt-2 block">
                <a href={attachment.url} target="_blank" rel="noreferrer" title={label} className="block overflow-hidden rounded-xl">
                    <img src={attachment.url} alt={attachment.name} loading="lazy" className="max-h-56 w-full object-cover" />
                </a>
                <span className="mt-1.5 block truncate text-[10px] opacity-55">{attachment.name} · {formatAttachmentSize(attachment.size)}</span>
            </span>
        );
    }
    return (
        <a
            href={attachment.url}
            download={attachment.name}
            title={label}
            className={`mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition ${incoming ? "bg-[#F47822]/8 hover:bg-[#F47822]/[.12]" : "bg-white/10 hover:bg-white/[.16]"}`}
        >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${incoming ? "bg-[#F47822]/10 text-[#F47822]" : "bg-white/10 text-white"}`}>
                <FileText className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{attachment.name}</span>
                <span className="mt-0.5 block text-[10px] opacity-55">{formatAttachmentSize(attachment.size)}</span>
            </span>
            <Download className="h-4 w-4 shrink-0 opacity-60" />
        </a>
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

function Bubble({ message, incoming, mine, participantLastRead, locale, searchQuery, reacted, onReply, onReact, onDelete, onRetry, pickerOpen, onTogglePicker }: {
    message: MessageItem;
    incoming: boolean;
    mine: boolean;
    participantLastRead?: string | null;
    locale: string;
    searchQuery: string;
    reacted: string[];
    onReply: (message: MessageItem) => void;
    onReact: (message: MessageItem, emoji: string) => void;
    onDelete: (message: MessageItem) => void;
    onRetry: (id: string) => void;
    pickerOpen: boolean;
    onTogglePicker: (id: string | null) => void;
}) {
    const { t } = useTranslation();
    if (message.deleted === "mine") return null;
    if (message.deleted === "all") {
        return (
            <article className={`flex ${incoming ? "justify-start" : "justify-end"}`}>
                <div className="max-w-[85%] rounded-[20px] border border-dashed border-[#3A3A3A]/12 px-4 py-3 text-xs italic text-[#3A3A3A]/45 dark:border-white/12 dark:text-white/45">
                    {t("messages.deletedMessage")}
                </div>
            </article>
        );
    }
    const interactive = !message.pendingMine && !message.sendFailed;
    const entries = Object.entries(messageReactions(message)).filter(([, ids]) => ids.length > 0);
    return (
        <article className={`flex ${incoming ? "justify-start" : "justify-end"}`}>
            <div className={`group relative max-w-[85%] rounded-[20px] px-4 py-3 text-sm leading-6 shadow-sm ${incoming ? "rounded-bl-md border border-[#3A3A3A]/8 bg-white text-[#3A3A3A]/80 dark:border-white/8 dark:bg-[#1b1b20] dark:text-white/80" : "rounded-br-md bg-[#3A3A3A] text-white"} ${message.pendingMine ? "opacity-80" : ""} ${message.sendFailed ? "ring-1 ring-red-400" : ""}`}>
                {incoming && <p className="mb-1 text-[10px] font-bold uppercase tracking-[.11em] opacity-55">{message.sender?.name || "HBT"}</p>}
                {message.reply_preview && (
                    <div className="mb-2 border-s-2 border-[#F47822] ps-2 text-[11px] leading-5 opacity-75">
                        <p className="font-bold">{message.reply_preview.sender_name}</p>
                        <p className="truncate">{message.reply_preview.body_excerpt || t("messages.quotedAttachment")}</p>
                    </div>
                )}
                {message.body?.trim() ? <HighlightBody text={message.body} query={searchQuery} /> : null}
                {message.attachment && <AttachmentView attachment={message.attachment} incoming={incoming} />}
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
                <span className="mt-2 flex items-center justify-end gap-1">
                    {interactive && (
                        <span className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 max-lg:opacity-100">
                            <button type="button" onClick={() => onReply(message)} title={t("messages.replyAction")} aria-label={t("messages.replyAction")} className="flex h-6 w-6 items-center justify-center rounded-md opacity-60 transition hover:opacity-100"><Reply className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => onTogglePicker(pickerOpen ? null : message.id)} title={t("messages.reactAction")} aria-label={t("messages.reactAction")} aria-expanded={pickerOpen} className="flex h-6 w-6 items-center justify-center rounded-md opacity-60 transition hover:opacity-100"><SmilePlus className="h-3.5 w-3.5" /></button>
                            {mine && <button type="button" onClick={() => onDelete(message)} title={t("messages.deleteAction")} aria-label={t("messages.deleteAction")} className="flex h-6 w-6 items-center justify-center rounded-md opacity-60 transition hover:text-red-500 hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>}
                        </span>
                    )}
                    <time className="text-[9px] opacity-45">{new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(new Date(message.created_at))}</time>
                    {mine && !message.pendingMine && <MessageTicks read={isMessageRead(message.created_at, participantLastRead)} onDark />}
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
}

function Thread({ active, onSent }: { active: Conversation; onSent: () => Promise<void> }) {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const myId = user?.id ?? null;
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [attachOpen, setAttachOpen] = useState(false);
    const [items, setItems] = useState<MessageItem[]>(() => active.messages ?? []);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [replyDraft, setReplyDraft] = useState<{ id: string; senderName: string; excerpt: string; hasAttachment: boolean } | null>(null);
    const [reactFor, setReactFor] = useState<string | null>(null);
    const fileInput = useRef<HTMLInputElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const searchTimer = useRef<number | null>(null);
    const pendingPayloads = useRef<Record<string, { text: string; type: "text" | "quick_reply"; file: File | null; replyId: string | null }>>({});
    const canAttach = active.type !== "announcement";

    useEffect(() => {
        let cancelled = false;
        pendingPayloads.current = {};
        setItems(active.messages ?? []);
        setHasMore(false);
        setReplyDraft(null);
        setReactFor(null);
        setQuery("");
        setSearchOpen(false);
        setFile(null);
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

    useEffect(() => {
        if (searchTimer.current) window.clearTimeout(searchTimer.current);
        if (!query.trim()) return;
        setSearching(true);
        searchTimer.current = window.setTimeout(() => {
            const q = query.trim();
            void messagesApi.fetchMessages(active.id, { search: q, per_page: 30 }).then((window) => {
                setItems(window.data);
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

    const send = async (value = body, type: "text" | "quick_reply" = "text") => {
        const text = value.trim();
        const attached = file;
        const replyId = replyDraft?.id ?? null;
        if ((!text && !attached) || sending) return;
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        pendingPayloads.current[tempId] = { text, type, file: attached, replyId };
        const senderName = user ? `${user.first_name} ${user.last_name}`.trim() : "";
        const temp: MessageItem = {
            id: tempId,
            conversation_id: active.id,
            sender: myId ? { id: myId, name: senderName } : undefined,
            message_type: type,
            body: text,
            reply_to: replyId,
            reply_preview: replyDraft ? { sender_name: replyDraft.senderName, body_excerpt: replyDraft.excerpt, has_attachment: replyDraft.hasAttachment } : null,
            reactions: {},
            attachment: attached ? { name: attached.name, mime: attached.type || "application/octet-stream", size: attached.size, url: attached.type.startsWith("image/") ? URL.createObjectURL(attached) : "" } : null,
            created_at: new Date().toISOString(),
            pendingMine: true,
        };
        setItems((prev) => [...prev, temp]);
        setBody("");
        setReplyDraft(null);
        setFile(null);
        setFileError(null);
        if (fileInput.current) fileInput.current.value = "";
        scrollBottom();
        setSending(true);
        try {
            const saved = await messagesApi.send(active.id, text, type, attached, replyId);
            delete pendingPayloads.current[tempId];
            if (temp.attachment?.url.startsWith("blob:")) URL.revokeObjectURL(temp.attachment.url);
            setItems((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
            await onSent();
        } catch (cause) {
            setItems((prev) => prev.map((m) => (m.id === tempId ? { ...m, sendFailed: true } : m)));
            setFileError(cause instanceof Error ? cause.message : t("messages.attachments.sendFail"));
        } finally {
            setSending(false);
        }
    };

    const retrySend = (tempId: string) => {
        const payload = pendingPayloads.current[tempId];
        if (!payload || sending) return;
        setItems((prev) => prev.map((m) => (m.id === tempId ? { ...m, sendFailed: false, pendingMine: true } : m)));
        setSending(true);
        void messagesApi.send(active.id, payload.text, payload.type, payload.file, payload.replyId).then(async (saved) => {
            delete pendingPayloads.current[tempId];
            setItems((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
            await onSent();
        }).catch((cause) => {
            setItems((prev) => prev.map((m) => (m.id === tempId ? { ...m, sendFailed: true } : m)));
            setFileError(cause instanceof Error ? cause.message : t("messages.attachments.sendFail"));
        }).finally(() => setSending(false));
    };

    const remove = async (message: MessageItem) => {
        const eligible = isRecentEnoughForDeleteForAll(message.created_at);
        const scope = eligible
            ? (window.confirm(t("messages.deleteConfirmEveryone")) ? ("for_all" as const) : null)
            : (window.confirm(t("messages.deleteConfirmMe")) ? ("for_me" as const) : null);
        if (!scope) return;
        try {
            const updated = await messagesApi.removeMessage(message.id, scope);
            setItems((prev) => prev.map((m) => (m.id === message.id ? updated : m)));
        } catch (cause) {
            setFileError(cause instanceof Error ? cause.message : t("messages.attachments.sendFail"));
        }
    };

    const react = async (message: MessageItem, emoji: string) => {
        setReactFor(null);
        try {
            const updated = await messagesApi.toggleReaction(message.id, emoji);
            setItems((prev) => prev.map((m) => (m.id === message.id ? updated : m)));
        } catch {
            setFileError(t("messages.attachments.sendFail"));
        }
    };

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
            setHasMore(window.meta.has_more);
        }).catch(() => undefined);
    };

    const startReply = (message: MessageItem) => {
        if (message.pendingMine || message.deleted) return;
        setReplyDraft({
            id: message.id,
            senderName: message.sender?.name || "HBT",
            excerpt: message.body?.trim().slice(0, 120) || (message.attachment ? message.attachment.name : ""),
            hasAttachment: Boolean(message.attachment),
        });
    };

    const pickFile = (picked: File | undefined) => {
        setFileError(null);
        if (!picked) return;
        if (!isAllowedAttachment(picked)) {
            setFileError(t("messages.attachments.badType"));
            return;
        }
        if (picked.size > ATTACHMENT_MAX_BYTES) {
            setFileError(t("messages.attachments.tooBig"));
            return;
        }
        setFile(picked);
    };
    const clearFile = () => {
        setFile(null);
        setFileError(null);
        if (fileInput.current) fileInput.current.value = "";
    };
    const openPicker = (kind: "image" | "file") => {
        setAttachOpen(false);
        setFileError(null);
        if (fileInput.current) {
            fileInput.current.accept = kind === "image"
                ? "image/png,image/jpeg,.png,.jpg,.jpeg"
                : ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            fileInput.current.click();
        }
    };
    return <><div ref={listRef} className="flex-1 space-y-5 overflow-y-auto bg-[#FCFCFC] dark:bg-[#232329] p-5 sm:p-7">
        <div className="sticky top-0 z-10 -mx-1 flex items-center gap-2 bg-[#FCFCFC]/95 py-1 backdrop-blur dark:bg-[#232329]/95">
            {searchOpen ? (
                <div className="flex w-full items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-1.5 dark:border-white/10 dark:bg-[#1b1b20]">
                    <Search className="h-4 w-4 shrink-0 text-[#3A3A3A]/40 dark:text-white/40" />
                    <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("messages.searchThreadPh")} aria-label={t("messages.searchInThread")} className="messages-quiet-focus h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#3A3A3A]/35 dark:placeholder:text-white/35" />
                    {searching && <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-[#F47822]" />}
                    <button type="button" onClick={() => { setSearchOpen(false); clearSearch(); }} aria-label={t("messages.close")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#3A3A3A]/40 hover:bg-[#3A3A3A]/5 dark:text-white/40"><X className="h-3.5 w-3.5" /></button>
                </div>
            ) : (
                <>
                    {hasMore && !query.trim() ? (
                        <button type="button" onClick={() => void loadEarlier()} disabled={loadingMore} className="mx-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-[#F47822] transition hover:bg-[#F47822]/10 disabled:opacity-50">
                            {loadingMore ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
                            {t("messages.loadEarlier")}
                        </button>
                    ) : <span className="flex-1" />}
                    <button type="button" onClick={() => setSearchOpen(true)} title={t("messages.searchInThread")} aria-label={t("messages.searchInThread")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#3A3A3A]/40 transition hover:bg-[#3A3A3A]/5 hover:text-[#3A3A3A] dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white"><Search className="h-4 w-4" /></button>
                </>
            )}
        </div>
        {items.map((message, index) => {
            const mine = Boolean(message.pendingMine) || (myId !== null && message.sender?.id !== undefined && message.sender.id === myId);
            const day = dayKey(message.created_at);
            const previousDay = index > 0 ? dayKey(items[index - 1].created_at) : null;
            const showDivider = day !== "" && day !== previousDay;
            return (
                <Fragment key={message.id}>
                    {showDivider && (
                        <DayDivider
                            label={(() => {
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
                    participantLastRead={active.participant?.last_read_at}
                    locale={i18n.language}
                    searchQuery={query.trim()}
                    reacted={message.reacted ?? []}
                    onReply={startReply}
                    onReact={(m, emoji) => void react(m, emoji)}
                    onDelete={(m) => void remove(m)}
                    onRetry={retrySend}
                    pickerOpen={reactFor === message.id}
                    onTogglePicker={(id) => setReactFor(id)}
                    />
                </Fragment>
            );
        })}
        {query.trim() && !searching && items.length === 0 && (
            <p className="py-10 text-center text-xs text-[#3A3A3A]/45 dark:text-white/45">{t("messages.searchEmpty")}</p>
        )}
        {!query.trim() && !searching && items.length === 0 && (
            <div className="flex flex-col items-center px-6 py-14 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
                    <MessageCircle className="h-6 w-6" />
                </span>
                <p className="mt-4 text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.emptyThreadTitle")}</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">{t("messages.emptyThreadDesc")}</p>
            </div>
        )}
    </div>{active.replies_enabled && active.status === "active" ? <footer className="border-t border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-4 sm:p-5">{active.quick_replies.length > 0 && <div className="mb-3 flex flex-wrap gap-2">{active.quick_replies.map((reply) => <button key={reply} onClick={() => void send(reply, "quick_reply")} className="rounded-full border border-[#F47822]/20 bg-[#F47822]/[.04] px-3 py-1.5 text-[11px] font-semibold text-[#F47822] transition hover:-translate-y-0.5 hover:bg-[#F47822] hover:text-white">{reply}</button>)}</div>}{replyDraft && (
    <div className="mb-3 flex items-center gap-2 rounded-xl border-s-2 border-[#F47822] bg-[#FCFCFC] px-3 py-2 dark:bg-[#232329]">
        <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold text-[#F47822]">{t("messages.replyingTo", { name: replyDraft.senderName })}</span>
            <span className="block truncate text-xs text-[#3A3A3A]/60 dark:text-white/60">{replyDraft.excerpt || t("messages.quotedAttachment")}</span>
        </span>
        <button type="button" onClick={() => setReplyDraft(null)} aria-label={t("messages.close")} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[#3A3A3A]/40 hover:bg-[#3A3A3A]/5 dark:text-white/40"><X className="h-3.5 w-3.5" /></button>
    </div>
)}
{canAttach && file && (
    <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#F47822]/20 bg-[#F47822]/[.05] px-3 py-2">
        <FileText className="h-4 w-4 shrink-0 text-[#F47822]" />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{file.name}</span>
        <span className="shrink-0 text-[10px] text-[#3A3A3A]/45 dark:text-white/45">{formatAttachmentSize(file.size)}</span>
        <button type="button" onClick={clearFile} title={t("messages.attachments.remove")} aria-label={t("messages.attachments.remove")} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[#3A3A3A]/40 dark:text-white/40 transition hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
    </div>
)}
{fileError && <p className="mb-3 text-xs font-semibold text-red-600">{fileError}</p>}
<div className="flex items-end gap-2 rounded-2xl border border-[#3A3A3A]/10 dark:border-white/10 bg-[#FAFAFA] dark:bg-[#232329] p-2 transition focus-within:border-[#F47822]/45 focus-within:bg-white dark:focus-within:bg-[#1b1b20]">{canAttach && (<div className="relative shrink-0"><input ref={fileInput} type="file" className="hidden" onChange={(event) => { pickFile(event.target.files?.[0]); setAttachOpen(false); }} /><button type="button" onClick={() => setAttachOpen((value) => !value)} aria-expanded={attachOpen} aria-haspopup="menu" title={t("messages.attachments.attach")} aria-label={t("messages.attachments.attach")} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#3A3A3A]/45 dark:text-white/45 transition hover:bg-[#F47822]/10 hover:text-[#F47822]"><Paperclip className="h-4 w-4" /></button>{attachOpen && (<><button type="button" aria-label={t("messages.close")} onClick={() => setAttachOpen(false)} className="fixed inset-0 z-40 cursor-default" /><div role="menu" className="absolute bottom-12 start-0 z-50 w-48 overflow-hidden rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-1.5 shadow-[0_15px_40px_rgba(15,23,42,0.12)]"><button type="button" role="menuitem" onClick={() => openPicker("image")} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef] transition hover:bg-[#F47822]/[.06] hover:text-[#F47822]"><ImageIcon className="h-4 w-4 shrink-0" />{t("messages.attachments.attachImage")}</button><button type="button" role="menuitem" onClick={() => openPicker("file")} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef] transition hover:bg-[#F47822]/[.06] hover:text-[#F47822]"><FileText className="h-4 w-4 shrink-0" />{t("messages.attachments.attachFile")}</button></div></>)}</div>)}<textarea value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={1} placeholder={t("messages.replyPh")} className="messages-quiet-focus min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[#3A3A3A]/35 dark:placeholder:text-white/35" /><button disabled={(!body.trim() && !file) || sending} onClick={() => void send()} aria-label={t("messages.sendAria")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F47822] text-white shadow-[0_6px_16px_rgba(244,120,34,.35)] transition hover:bg-[#df6817] disabled:opacity-40 disabled:shadow-none"><Send className="h-4 w-4 rtl:-scale-x-100" /></button></div></footer> : <div className="border-t border-[#3A3A3A]/8 dark:border-white/8 bg-[#FAFAFA] dark:bg-[#232329] px-5 py-4 text-xs text-[#3A3A3A]/45 dark:text-white/45">{t("messages.repliesDisabled")}</div>}</>;
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
    return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#17202b]/35 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[28px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">{t("messages.composeTag")}</p><h2 className="mt-1 text-lg font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.composeTitle")}</h2></div><button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xs font-bold text-[#3A3A3A]/45 dark:text-white/45">{t("messages.close")}</button></div><div className="mt-4 inline-flex rounded-xl bg-[#FCFCFC] p-1 dark:bg-[#232329]"><button type="button" onClick={() => setMode("direct")} aria-pressed={mode === "direct"} className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${mode === "direct" ? "bg-white text-[#F47822] shadow-sm dark:bg-[#1b1b20]" : "text-[#3A3A3A]/55 dark:text-white/55"}`}>{t("messages.tabDirect")}</button><button type="button" onClick={() => setMode("group")} aria-pressed={mode === "group"} className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${mode === "group" ? "bg-white text-[#F47822] shadow-sm dark:bg-[#1b1b20]" : "text-[#3A3A3A]/55 dark:text-white/55"}`}>{t("messages.tabGroup")}</button></div>{mode === "direct" ? (<form onSubmit={submitDirect}><label className="mt-5 block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.recipient")}<select value={recipient} onChange={(event) => setRecipient(event.target.value)} required className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 bg-[#FAFAFA] dark:bg-[#232329] px-3 text-sm font-normal"><option value="">{t("messages.chooseRecipient")}</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} · {contact.role}</option>)}</select></label><label className="mt-4 block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.subject")}<input value={subject} onChange={(event) => setSubject(event.target.value)} className="messages-quiet-focus mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 bg-[#FAFAFA] dark:bg-[#232329] px-3 text-sm font-normal focus:border-[#F47822]" placeholder={t("messages.subjectPh")} /></label><label className="mt-4 block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.message")}<textarea required value={message} onChange={(event) => setMessage(event.target.value)} rows={4} className="messages-quiet-focus mt-1.5 w-full resize-none rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 bg-[#FAFAFA] dark:bg-[#232329] p-3 text-sm font-normal focus:border-[#F47822]" placeholder={t("messages.messagePh")} /></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">{t("messages.cancel")}</button><button disabled={!recipient || !message.trim() || sending} className="rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{sending ? t("messages.sending") : t("messages.send")}</button></div></form>) : (<form onSubmit={submitGroup}><label className="mt-5 block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.pickMembers")}<input value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} placeholder={t("messages.searchThreadPh")} className="messages-quiet-focus mt-1.5 h-10 w-full rounded-xl border border-[#3A3A3A]/12 bg-[#FAFAFA] px-3 text-sm font-normal outline-none focus:border-[#F47822] dark:border-white/12 dark:bg-[#232329]" /></label><div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-xl border border-[#3A3A3A]/10 p-1.5 dark:border-white/10">{visibleContacts.length ? visibleContacts.map((contact) => (<button key={contact.id} type="button" onClick={() => toggleMember(contact.id)} aria-pressed={selected.includes(contact.id)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start transition hover:bg-[#F47822]/[.05]"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${selected.includes(contact.id) ? "border-[#F47822] bg-[#F47822] text-white" : "border-[#3A3A3A]/20 text-transparent dark:border-white/20"}`}><Check className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{contact.name}</span><span className="block truncate text-[10px] text-[#3A3A3A]/45 dark:text-white/45">{contact.role}</span></span></button>)) : <p className="px-3 py-4 text-center text-xs text-[#3A3A3A]/45 dark:text-white/45">{t("messages.searchEmpty")}</p>}</div><label className="mt-4 block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("messages.subject")}<input required value={subject} onChange={(event) => setSubject(event.target.value)} className="messages-quiet-focus mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 bg-[#FAFAFA] dark:bg-[#232329] px-3 text-sm font-normal focus:border-[#F47822]" placeholder={t("messages.subjectPh")} /></label>{groupError && <p className="mt-3 text-xs font-semibold text-red-600">{groupError}</p>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">{t("messages.cancel")}</button><button disabled={!subject.trim() || selected.length < 2 || sending} className="rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{sending ? t("messages.sending") : t("messages.createGroup")} ({selected.length})</button></div></form>)}</div></div>;
}
