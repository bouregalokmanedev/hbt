import {
    Archive,
    ArchiveRestore,
    ChevronLeft,
    ChevronRight,
    Mail,
    MailOpen,
    PenLine,
    RefreshCw,
    Search,
    Send,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import {
    supportDeskApi,
    type MailFilters,
    type MailFolder,
    type MailListResponse,
    type MailRecipient,
    type MailThreadDetails,
} from "../api/supportDesk.api";

const FOLDERS: MailFolder[] = ["inbox", "sent", "archive"];
const MIN_BODY = 10;

function formatWhen(iso: string | null | undefined, locale: string): string {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const days = Math.round((startOfToday - startOfDate) / 86_400_000);
    if (days <= 0) return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(date);
    if (days < 7) return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(date);
}

function formatFull(iso: string | null | undefined, locale: string): string {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function initialsOf(name: string): string {
    return (
        name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0])
            .join("")
            .toUpperCase() || "•"
    );
}

function withRead(list: MailListResponse | null, id: string): MailListResponse | null {
    if (!list) return list;
    const target = list.data.find((item) => item.id === id);
    if (!target || target.read) return list;
    return {
        ...list,
        data: list.data.map((item) => (item.id === id ? { ...item, read: true } : item)),
        summary: { ...list.summary, inbox_unread: Math.max(0, list.summary.inbox_unread - 1) },
    };
}

function folderLabelKey(folder: MailFolder): string {
    return `supportDesk.mail.folders.${folder}`;
}

export function SupportMailboxPage() {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === "ar" ? "ar" : "en";
    const [params, setParams] = useSearchParams();

    const folderParam = params.get("folder");
    const folder: MailFolder = FOLDERS.includes(folderParam as MailFolder)
        ? (folderParam as MailFolder)
        : "inbox";
    const search = params.get("q") ?? "";
    const page = Number(params.get("page") ?? 1) || 1;
    const openId = params.get("id");

    const [searchInput, setSearchInput] = useState(search);
    const [list, setList] = useState<MailListResponse | null>(null);
    const [listError, setListError] = useState<string | null>(null);
    const [listTick, setListTick] = useState(0);

    const [thread, setThread] = useState<MailThreadDetails | null>(null);
    const [threadError, setThreadError] = useState<string | null>(null);
    const [threadLoading, setThreadLoading] = useState(false);
    const [threadTick, setThreadTick] = useState(0);

    const [replyBody, setReplyBody] = useState("");
    const [replyBusy, setReplyBusy] = useState(false);
    const [replyError, setReplyError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [composeOpen, setComposeOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setListError(null);
        const filters: MailFilters = { folder, page, per_page: 15 };
        if (search) filters.search = search;
        void supportDeskApi
            .mail(filters)
            .then((response) => {
                if (!cancelled) setList(response);
            })
            .catch((cause: unknown) => {
                if (!cancelled) {
                    setListError(cause instanceof Error ? cause.message : t("supportDesk.mail.loadFail"));
                }
            });
        return () => {
            cancelled = true;
        };
    }, [folder, search, page, listTick, t]);

    useEffect(() => {
        let cancelled = false;
        setReplyError(null);
        setReplyBody("");
        if (!openId) {
            setThread(null);
            setThreadError(null);
            setThreadLoading(false);
            return;
        }
        setThreadLoading(true);
        setThreadError(null);
        void supportDeskApi
            .mailThread(openId)
            .then((details) => {
                if (cancelled) return;
                setThread(details);
                setList((previous) => withRead(previous, openId));
            })
            .catch((cause: unknown) => {
                if (!cancelled) {
                    setThreadError(cause instanceof Error ? cause.message : t("supportDesk.mail.loadFail"));
                }
            })
            .finally(() => {
                if (!cancelled) setThreadLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [openId, threadTick, t]);

    const patch = (values: Record<string, string | undefined>, resetPage = true) => {
        const next = new URLSearchParams(params);
        Object.entries(values).forEach(([key, value]) => {
            if (value) next.set(key, value);
            else next.delete(key);
        });
        if (resetPage) next.delete("page");
        setParams(next, { replace: true });
    };

    const reloadList = () => setListTick((tick) => tick + 1);
    const closeThread = () => patch({ id: undefined }, false);

    const run = async (action: () => Promise<void>, fallback: string) => {
        setThreadError(null);
        try {
            await action();
        } catch (cause: unknown) {
            setThreadError(cause instanceof Error ? cause.message : fallback);
        }
    };

    const sendReply = () => {
        if (!thread || replyBusy) return;
        const body = replyBody.trim();
        if (body.length < MIN_BODY) return;
        setReplyBusy(true);
        void run(async () => {
            const updated = await supportDeskApi.mailReply(thread.id, { body });
            setThread(updated);
            setReplyBody("");
            setNotice(t("supportDesk.mail.replySent"));
            reloadList();
        }, t("supportDesk.mail.replyFail")).finally(() => setReplyBusy(false));
    };

    const markUnread = () => {
        if (!thread) return;
        void run(async () => {
            await supportDeskApi.mailRead(thread.id, false);
            setThread({ ...thread, read: false });
            setList((previous) =>
                previous
                    ? {
                          ...previous,
                          data: previous.data.map((item) =>
                              item.id === thread.id ? { ...item, read: false } : item,
                          ),
                          summary: {
                              ...previous.summary,
                              inbox_unread: previous.summary.inbox_unread + (thread.read ? 1 : 0),
                          },
                      }
                    : previous,
            );
            setNotice(t("supportDesk.mail.unreadSet"));
            closeThread();
        }, t("supportDesk.mail.loadFail"));
    };

    const toggleArchive = () => {
        if (!thread) return;
        const restoring = thread.archived;
        void run(async () => {
            await supportDeskApi.mailArchive(thread.id, !restoring);
            setNotice(restoring ? t("supportDesk.mail.restored") : t("supportDesk.mail.archived"));
            closeThread();
            reloadList();
        }, t("supportDesk.mail.loadFail"));
    };

    const summary = list?.summary;
    const activeThread = thread && openId ? thread : null;

    const folderCount = (entry: MailFolder): number | null => {
        if (!summary) return null;
        if (entry === "inbox") return summary.inbox_unread;
        if (entry === "sent") return summary.sent;
        return summary.archive;
    };

    return (
        <main className="mx-auto max-w-[1280px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">
                        {t("supportDesk.mail.eyebrow")}
                    </p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A]">
                        {t("supportDesk.mail.title")}
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-[#3A3A3A]/55">
                        {t("supportDesk.mail.description")}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            reloadList();
                            if (openId) setThreadTick((tick) => tick + 1);
                        }}
                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-4 text-xs font-bold text-[#3A3A3A]/60 transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                    >
                        <RefreshCw className="h-4 w-4" />
                        {t("supportDesk.mail.refresh")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setComposeOpen(true)}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#F47822] px-5 text-xs font-bold text-white shadow-[0_10px_24px_rgba(244,120,34,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(244,120,34,0.36)]"
                    >
                        <PenLine className="h-4 w-4" />
                        {t("supportDesk.mail.compose")}
                    </button>
                </div>
            </header>

            {notice && (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    {notice}
                </p>
            )}

            <div className="grid gap-4 lg:grid-cols-[190px_330px_minmax(0,1fr)]">
                {/* Folders */}
                <nav
                    aria-label={t("supportDesk.mail.foldersNav")}
                    className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
                >
                    {FOLDERS.map((entry) => {
                        const count = folderCount(entry);
                        const active = folder === entry;
                        return (
                            <button
                                key={entry}
                                type="button"
                                onClick={() => patch({ folder: entry === "inbox" ? undefined : entry, id: undefined })}
                                className={`inline-flex shrink-0 items-center justify-between gap-2 rounded-full px-4 py-2 text-xs font-bold transition lg:w-full lg:rounded-xl ${
                                    active
                                        ? "bg-[#F47822] text-white shadow-[0_8px_20px_rgba(244,120,34,0.25)]"
                                        : "bg-white text-[#3A3A3A]/60 hover:text-[#3A3A3A]"
                                }`}
                            >
                                <span className="inline-flex items-center gap-2">
                                    {entry === "inbox" ? (
                                        active ? <MailOpen className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />
                                    ) : null}
                                    {t(folderLabelKey(entry))}
                                </span>
                                {count !== null && count > 0 && (
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                                            active ? "bg-white/25 text-white" : "bg-[#F47822]/12 text-[#F47822]"
                                        }`}
                                    >
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* List */}
                <section
                    aria-label={t("supportDesk.mail.listAria")}
                    className={`min-w-0 rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-sm ${
                        openId ? "hidden lg:block" : "block"
                    }`}
                >
                    <div className="border-b border-[#3A3A3A]/8 p-3">
                        <label className="relative block">
                            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/30" />
                            <input
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") patch({ q: searchInput.trim() || undefined });
                                    if (event.key === "Escape") {
                                        setSearchInput("");
                                        patch({ q: undefined });
                                    }
                                }}
                                placeholder={t("supportDesk.mail.searchPh")}
                                aria-label={t("supportDesk.mail.searchAria")}
                                className="h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] ps-9 pe-3 text-sm outline-none transition focus:border-[#F47822] focus:bg-white"
                            />
                        </label>
                    </div>

                    {listError && (
                        <p role="alert" className="m-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                            {listError}
                        </p>
                    )}

                    {!list ? (
                        <div className="space-y-2 p-3">
                            {[0, 1, 2, 3].map((row) => (
                                <div key={row} className="h-16 animate-pulse rounded-xl bg-[#F7F7F7]" />
                            ))}
                        </div>
                    ) : list.data.length === 0 ? (
                        <div className="p-8 text-center">
                            <Mail className="mx-auto h-7 w-7 text-[#F47822]/40" />
                            <p className="mt-3 text-sm font-bold text-[#3A3A3A]">
                                {search ? t("supportDesk.mail.emptySearch") : t("supportDesk.mail.emptyTitle")}
                            </p>
                            <p className="mt-1 text-xs text-[#3A3A3A]/45">
                                {search ? "" : t("supportDesk.mail.emptyDesc")}
                            </p>
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchInput("");
                                        patch({ q: undefined });
                                    }}
                                    className="mt-3 text-xs font-bold text-[#F47822] underline-offset-4 hover:underline"
                                >
                                    {t("supportDesk.mail.clearSearch")}
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <ul className="max-h-[560px] divide-y divide-[#3A3A3A]/6 overflow-y-auto">
                                {list.data.map((item) => {
                                    const active = item.id === openId;
                                    const sender = folder === "sent" ? `→ ${item.to_email}` : item.from_email;
                                    return (
                                        <li key={item.id}>
                                            <button
                                                type="button"
                                                onClick={() => patch({ id: item.id }, false)}
                                                className={`w-full border-s-2 px-4 py-3 text-start transition hover:bg-[#FAFAFA] ${
                                                    active
                                                        ? "border-[#F47822] bg-[#F47822]/6"
                                                        : item.read
                                                          ? "border-transparent"
                                                          : "border-[#F47822]/60 bg-[#F47822]/4"
                                                }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    {!item.read && (
                                                        <span
                                                            aria-label={t("supportDesk.mail.unread")}
                                                            className="h-2 w-2 shrink-0 rounded-full bg-[#F47822]"
                                                        />
                                                    )}
                                                    <span
                                                        className={`min-w-0 flex-1 truncate text-sm ${
                                                            item.read ? "text-[#3A3A3A]/75" : "font-bold text-[#3A3A3A]"
                                                        }`}
                                                    >
                                                        {item.subject}
                                                    </span>
                                                    <span className="shrink-0 text-[11px] text-[#3A3A3A]/40">
                                                        {formatWhen(item.created_at, locale)}
                                                    </span>
                                                </span>
                                                <span className="mt-1 block truncate text-xs text-[#3A3A3A]/45">
                                                    {sender}
                                                </span>
                                                <span className="mt-0.5 block truncate text-xs text-[#3A3A3A]/40">
                                                    {item.preview}
                                                </span>
                                                {item.message_count > 0 && (
                                                    <span className="mt-1 inline-block rounded-full bg-[#3A3A3A]/6 px-2 py-0.5 text-[10px] font-bold text-[#3A3A3A]/55">
                                                        {t("supportDesk.mail.messageCount", {
                                                            count: item.message_count + 1,
                                                        })}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className="flex items-center justify-between border-t border-[#3A3A3A]/8 px-4 py-3 text-xs text-[#3A3A3A]/50">
                                <span>
                                    {t("supportDesk.mail.pageOf", {
                                        current: list.meta.current_page,
                                        last: list.meta.last_page,
                                        total: list.meta.total,
                                    })}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={list.meta.current_page <= 1}
                                        onClick={() => patch({ page: String(list.meta.current_page - 1) }, false)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-[#3A3A3A]/10 bg-white px-3 py-1.5 font-bold text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822] disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
                                        {t("supportDesk.mail.previous")}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={list.meta.current_page >= list.meta.last_page}
                                        onClick={() => patch({ page: String(list.meta.current_page + 1) }, false)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-[#3A3A3A]/10 bg-white px-3 py-1.5 font-bold text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822] disabled:opacity-40"
                                    >
                                        {t("supportDesk.mail.next")}
                                        <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </section>

                {/* Reading pane */}
                <section
                    aria-label={t("supportDesk.mail.readingAria")}
                    className={`min-w-0 rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-sm ${
                        openId ? "block" : "hidden lg:block"
                    }`}
                >
                    {!openId ? (
                        <div className="flex h-full min-h-[320px] items-center justify-center p-8 text-center">
                            <div>
                                <Mail className="mx-auto h-9 w-9 text-[#F47822]/35" />
                                <p className="mt-3 text-sm font-bold text-[#3A3A3A]/60">
                                    {t("supportDesk.mail.selectPrompt")}
                                </p>
                                <p className="mt-1 text-xs text-[#3A3A3A]/45">{t("supportDesk.mail.selectHint")}</p>
                            </div>
                        </div>
                    ) : threadError ? (
                        <p role="alert" className="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                            {threadError}
                        </p>
                    ) : threadLoading || !activeThread ? (
                        <div className="space-y-3 p-5">
                            <div className="h-5 w-2/3 animate-pulse rounded bg-[#F7F7F7]" />
                            <div className="h-24 animate-pulse rounded-xl bg-[#F7F7F7]" />
                            <div className="h-24 animate-pulse rounded-xl bg-[#F7F7F7]" />
                        </div>
                    ) : (
                        <>
                            <header className="border-b border-[#3A3A3A]/8 p-4 sm:p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className="truncate text-lg font-bold text-[#3A3A3A]">
                                            {activeThread.subject}
                                        </h2>
                                        <p className="mt-1 truncate text-xs text-[#3A3A3A]/50">
                                            {activeThread.direction === "inbound"
                                                ? t("supportDesk.mail.fromLabel", {
                                                      name: activeThread.from_name || activeThread.from_email,
                                                      email: activeThread.from_email,
                                                  })
                                                : t("supportDesk.mail.toLabel", {
                                                      name: activeThread.to_name || "—",
                                                      email: activeThread.to_email,
                                                  })}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 gap-1.5">
                                        <button
                                            type="button"
                                            onClick={closeThread}
                                            className="inline-flex items-center gap-1 rounded-lg border border-[#3A3A3A]/10 px-2.5 py-1.5 text-[11px] font-bold text-[#3A3A3A]/60 transition hover:border-[#F47822]/40 hover:text-[#F47822] lg:hidden"
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
                                            {t("supportDesk.mail.back")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={markUnread}
                                            aria-label={t("supportDesk.mail.markUnread")}
                                            className="rounded-lg border border-[#3A3A3A]/10 p-2 text-[#3A3A3A]/50 transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                                        >
                                            <Mail className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={toggleArchive}
                                            aria-label={
                                                activeThread.archived
                                                    ? t("supportDesk.mail.restore")
                                                    : t("supportDesk.mail.archive")
                                            }
                                            className="rounded-lg border border-[#3A3A3A]/10 p-2 text-[#3A3A3A]/50 transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                                        >
                                            {activeThread.archived ? (
                                                <ArchiveRestore className="h-4 w-4" />
                                            ) : (
                                                <Archive className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </header>

                            <div className="space-y-3 p-4 sm:p-5">
                                {activeThread.messages.map((message) => {
                                    const outbound = message.direction === "outbound";
                                    return (
                                        <article
                                            key={message.id}
                                            className={`rounded-2xl border p-4 ${
                                                outbound
                                                    ? "border-[#F47822]/20 bg-[#F47822]/6"
                                                    : "border-[#3A3A3A]/8 bg-[#FAFAFA]"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                                        outbound
                                                            ? "bg-[#F47822] text-white"
                                                            : "bg-[#3A3A3A]/8 text-[#3A3A3A]/70"
                                                    }`}
                                                >
                                                    {initialsOf(message.from_name || message.from_email)}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-bold text-[#3A3A3A]">
                                                        {message.from_name || message.from_email}
                                                    </span>
                                                    <span className="block truncate text-[11px] text-[#3A3A3A]/45">
                                                        {message.from_email}
                                                        {" → "}
                                                        {message.to_email}
                                                    </span>
                                                </span>
                                                <span className="shrink-0 text-[11px] text-[#3A3A3A]/45">
                                                    {formatFull(message.created_at, locale)}
                                                </span>
                                            </div>
                                            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#3A3A3A]/80">
                                                {message.body}
                                            </p>
                                        </article>
                                    );
                                })}
                            </div>

                            <div className="border-t border-[#3A3A3A]/8 p-4 sm:p-5">
                                {replyError && (
                                    <p
                                        role="alert"
                                        className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
                                    >
                                        {replyError}
                                    </p>
                                )}
                                <label className="block">
                                    <span className="sr-only">{t("supportDesk.mail.replyPh")}</span>
                                    <textarea
                                        value={replyBody}
                                        onChange={(event) => setReplyBody(event.target.value)}
                                        rows={3}
                                        placeholder={t("supportDesk.mail.replyPh")}
                                        className="w-full resize-y rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 py-2.5 text-sm outline-none transition focus:border-[#F47822] focus:bg-white"
                                    />
                                </label>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <p className="text-[11px] text-[#3A3A3A]/40">
                                        {t("supportDesk.mail.replyNote")}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={sendReply}
                                        disabled={replyBusy || replyBody.trim().length < MIN_BODY}
                                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                                    >
                                        <Send className="h-4 w-4" />
                                        {replyBusy ? t("supportDesk.mail.sending") : t("supportDesk.mail.send")}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>

            {composeOpen && (
                <ComposeDialog
                    onClose={() => setComposeOpen(false)}
                    onSent={(sent) => {
                        setComposeOpen(false);
                        setNotice(t("supportDesk.mail.composeModal.sent"));
                        patch({ folder: "sent", id: sent.id });
                        reloadList();
                    }}
                />
            )}
        </main>
    );
}

function ComposeDialog({
    onClose,
    onSent,
}: {
    onClose: () => void;
    onSent: (thread: MailThreadDetails) => void;
}) {
    const { t } = useTranslation();
    const [toEmail, setToEmail] = useState("");
    const [toName, setToName] = useState("");
    const [recipient, setRecipient] = useState<MailRecipient | null>(null);
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [recipients, setRecipients] = useState<MailRecipient[]>([]);

    useEffect(() => {
        let cancelled = false;
        const timer = window.setTimeout(() => {
            void supportDeskApi
                .mailRecipients(query.trim())
                .then((results) => {
                    if (!cancelled) setRecipients(results);
                })
                .catch(() => {
                    if (!cancelled) setRecipients([]);
                });
        }, 250);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [query]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    const canSend =
        toEmail.trim().length > 0 && subject.trim().length > 0 && body.trim().length >= MIN_BODY && !busy;

    const send = () => {
        if (!canSend) return;
        setBusy(true);
        setError(null);
        void supportDeskApi
            .mailCompose({
                to_email: toEmail.trim(),
                to_name: toName.trim() || undefined,
                subject: subject.trim(),
                body: body.trim(),
                recipient_user_id: recipient?.id,
            })
            .then((thread) => onSent(thread))
            .catch((cause: unknown) => {
                setError(cause instanceof Error ? cause.message : t("supportDesk.mail.composeModal.fail"));
            })
            .finally(() => setBusy(false));
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-[#3A3A3A]/35 p-4 backdrop-blur-sm sm:items-center"
            onClick={onClose}
            role="presentation"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={t("supportDesk.mail.composeModal.title")}
                onClick={(event) => event.stopPropagation()}
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-2xl"
            >
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-bold text-[#3A3A3A]">
                        {t("supportDesk.mail.composeModal.title")}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("supportDesk.mail.composeModal.close")}
                        className="rounded-lg p-1.5 text-[#3A3A3A]/45 transition hover:bg-[#F7F7F7] hover:text-[#3A3A3A]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {error && (
                    <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                        {error}
                    </p>
                )}

                <div className="mt-4 space-y-3">
                    <label className="block">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/50">
                            {t("supportDesk.mail.composeModal.to")}
                        </span>
                        <input
                            autoFocus
                            value={toEmail}
                            onChange={(event) => {
                                setToEmail(event.target.value);
                                setRecipient(null);
                            }}
                            type="email"
                            placeholder={t("supportDesk.mail.composeModal.toPh")}
                            className="mt-1 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm outline-none transition focus:border-[#F47822] focus:bg-white"
                        />
                    </label>

                    <div className="rounded-xl border border-[#3A3A3A]/8 bg-[#FAFAFA] p-3">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/50">
                            {t("supportDesk.mail.composeModal.pickStudent")}
                        </span>
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={t("supportDesk.mail.composeModal.pickPh")}
                            aria-label={t("supportDesk.mail.composeModal.pickPh")}
                            className="mt-2 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-3 text-xs outline-none transition focus:border-[#F47822]"
                        />
                        <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
                            {recipients.length === 0 ? (
                                <li className="text-xs text-[#3A3A3A]/45">
                                    {t("supportDesk.mail.composeModal.noStudents")}
                                </li>
                            ) : (
                                recipients.map((candidate) => (
                                    <li key={candidate.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRecipient(candidate);
                                                setToEmail(candidate.email);
                                                setToName(candidate.name);
                                            }}
                                            className={`w-full rounded-lg px-2 py-1.5 text-start text-xs transition hover:bg-white ${
                                                recipient?.id === candidate.id
                                                    ? "bg-[#F47822]/10 text-[#F47822]"
                                                    : "text-[#3A3A3A]/70"
                                            }`}
                                        >
                                            <span className="block truncate font-bold">{candidate.name}</span>
                                            <span className="block truncate text-[11px] opacity-70">
                                                {candidate.email}
                                            </span>
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>

                    <label className="block">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/50">
                            {t("supportDesk.mail.composeModal.subject")}
                        </span>
                        <input
                            value={subject}
                            onChange={(event) => setSubject(event.target.value)}
                            placeholder={t("supportDesk.mail.composeModal.subjectPh")}
                            className="mt-1 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm outline-none transition focus:border-[#F47822] focus:bg-white"
                        />
                    </label>

                    <label className="block">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/50">
                            {t("supportDesk.mail.composeModal.body")}
                        </span>
                        <textarea
                            value={body}
                            onChange={(event) => setBody(event.target.value)}
                            rows={5}
                            placeholder={t("supportDesk.mail.composeModal.bodyPh")}
                            className="mt-1 w-full resize-y rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 py-2.5 text-sm outline-none transition focus:border-[#F47822] focus:bg-white"
                        />
                    </label>

                    <p className="text-[11px] text-[#3A3A3A]/40">
                        {t("supportDesk.mail.composeModal.fromNote")}
                    </p>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 rounded-xl border border-[#3A3A3A]/10 px-4 text-xs font-bold text-[#3A3A3A]/60 transition hover:bg-[#F7F7F7]"
                    >
                        {t("supportDesk.mail.composeModal.cancel")}
                    </button>
                    <button
                        type="button"
                        onClick={send}
                        disabled={!canSend}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#F47822] px-5 text-xs font-bold text-white shadow-[0_10px_24px_rgba(244,120,34,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                    >
                        <Send className="h-4 w-4" />
                        {busy ? t("supportDesk.mail.composeModal.sending") : t("supportDesk.mail.composeModal.send")}
                    </button>
                </div>
            </div>
        </div>
    );
}
