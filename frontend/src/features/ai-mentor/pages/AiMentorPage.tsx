import {
    AlertTriangle,
    Archive,
    BookOpen,
    ClipboardCheck,
    Clock3,
    Compass,
    History,
    MessageSquarePlus,
    Plus,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { mentorApi } from "../api/mentor-api";
import { MentorChatPanel } from "../components/MentorChatPanel";
import type { MentorConversation } from "../types/mentor";

const MAX_TABS = 3;

interface ChatTab {
    key: string;
    conversationId: string | null;
    title: string;
    forceNew: boolean;
}

function createTab(seq: number, t: (key: string) => string, forceNew: boolean): ChatTab {
    return {
        key: `tab-${seq}`,
        conversationId: null,
        title: t("mentor.tabs.newChat"),
        forceNew,
    };
}

export function AiMentorPage() {
    const { t } = useTranslation();
    const [history, setHistory] = useState<MentorConversation[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [archivingId, setArchivingId] = useState<string | null>(null);
    const [tabs, setTabs] = useState<ChatTab[]>(() => [{
        key: "tab-1",
        conversationId: null,
        title: t("mentor.tabs.newChat"),
        forceNew: false,
    }]);
    const [activeKey, setActiveKey] = useState("tab-1");
    const [limitNotice, setLimitNotice] = useState(false);
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const tabSeqRef = useRef(2);
    const knownIdsRef = useRef(new Set<string>());

    const refreshHistory = useCallback(async () => {
        try {
            const items = await mentorApi.list();
            const visible = items.filter((item) => item.status !== "archived");
            setHistory(visible);
            visible.forEach((item) => knownIdsRef.current.add(item.id));
            setHistoryError(null);
        } catch (cause) {
            setHistoryError(cause instanceof Error ? cause.message : t("mentor.history.fail"));
        } finally {
            setHistoryLoading(false);
        }
    }, [t]);

    useEffect(() => {
        void refreshHistory();
    }, [refreshHistory]);

    const openNewTab = () => {
        if (tabs.length >= MAX_TABS) {
            setLimitNotice(true);
            return;
        }
        const next = createTab(tabSeqRef.current, t, true);
        tabSeqRef.current += 1;
        setTabs((current) => [...current, next]);
        setActiveKey(next.key);
        setLimitNotice(false);
    };

    const closeTab = (key: string) => {
        const index = tabs.findIndex((tab) => tab.key === key);
        if (index < 0) return;
        const next = tabs.filter((tab) => tab.key !== key);
        if (next.length === 0) {
            const fresh = createTab(tabSeqRef.current, t, false);
            tabSeqRef.current += 1;
            setTabs([fresh]);
            setActiveKey(fresh.key);
            return;
        }
        setTabs(next);
        if (activeKey === key) {
            setActiveKey(next[Math.max(0, index - 1)].key);
        }
    };

    const openFromHistory = (conversation: MentorConversation) => {
        const existing = tabs.find((tab) => tab.conversationId === conversation.id);
        if (existing) {
            setActiveKey(existing.key);
            setLimitNotice(false);
            return;
        }
        if (tabs.length >= MAX_TABS) {
            setLimitNotice(true);
            return;
        }
        const next: ChatTab = {
            key: `tab-${tabSeqRef.current}`,
            conversationId: conversation.id,
            title: conversation.title || t("mentor.history.untitled"),
            forceNew: false,
        };
        tabSeqRef.current += 1;
        setTabs((current) => [...current, next]);
        setActiveKey(next.key);
        setLimitNotice(false);
    };

    const handleConversationReady = useCallback((tabKey: string, conversation: MentorConversation) => {
        setTabs((current) => {
            let changed = false;
            const next = current.map((tab) => {
                if (tab.key !== tabKey) return tab;
                const title = tab.conversationId === conversation.id
                    ? tab.title
                    : (conversation.title || tab.title);
                if (tab.conversationId === conversation.id && tab.title === title) return tab;
                changed = true;
                return { ...tab, conversationId: conversation.id, title };
            });
            return changed ? next : current;
        });
        if (!knownIdsRef.current.has(conversation.id)) {
            knownIdsRef.current.add(conversation.id);
            void refreshHistory();
        }
    }, [refreshHistory]);

    const archiveConversation = async (conversationId: string) => {
        setArchivingId(conversationId);
        try {
            await mentorApi.archive(conversationId);
            knownIdsRef.current.delete(conversationId);
            setHistory((current) => current.filter((item) => item.id !== conversationId));
            const openTab = tabs.find((tab) => tab.conversationId === conversationId);
            if (openTab) closeTab(openTab.key);
        } catch {
            setHistoryError(t("mentor.history.fail"));
        } finally {
            setArchivingId(null);
        }
    };

    const applyPrompt = (text: string) => {
        setDrafts((current) => ({ ...current, [activeKey]: text }));
    };

    const skillItems: Array<{ id: string; Icon: typeof BookOpen }> = [
        { id: "explain", Icon: BookOpen },
        { id: "quiz", Icon: ClipboardCheck },
        { id: "plan", Icon: Compass },
        { id: "diagnose", Icon: Stethoscope },
    ];

    const formatWhen = (iso?: string | null) => {
        if (!iso) return "";
        const stamp = new Date(iso).getTime();
        if (Number.isNaN(stamp)) return "";
        const diff = Date.now() - stamp;
        if (diff < 60_000) return t("mentor.history.justNow");
        return new Date(stamp).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const showLimit = limitNotice || tabs.length >= MAX_TABS;

    return (
        <main className="min-h-full bg-[#F3F3F3] dark:bg-[#101013]" data-testid="ai-mentor-page">
            <div className="mx-auto max-w-[1480px] space-y-5 px-4 py-5 sm:px-7 sm:py-7">
                <header className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#2E2E2E] via-[#3A3A3A] to-[#2A2A2A] px-6 py-6 text-white shadow-[0_18px_50px_rgba(58,58,58,.18)] sm:px-8 sm:py-7">
                    <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-[#F47822]/25 blur-3xl" />
                    <div className="absolute -bottom-20 start-10 h-40 w-40 rounded-full bg-[#F47822]/10 blur-3xl" />
                    <div className="relative flex flex-wrap items-end justify-between gap-4">
                        <div className="min-w-0">
                            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">
                                <Sparkles className="h-3.5 w-3.5" />
                                {t("mentor.guided")}
                            </p>
                            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{t("mentor.sessionTitle")}</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{t("mentor.sessionDesc")}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.07] px-3 py-1.5 text-[11px] font-semibold text-white/75">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                {t("mentor.online")}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.07] px-3 py-1.5 text-[11px] font-semibold text-white/75">
                                <MessageSquarePlus className="h-3.5 w-3.5 text-[#F47822]" />
                                {t("mentor.tabs.activeCount", { count: tabs.length, max: MAX_TABS })}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
                    <aside className="order-2 space-y-5 lg:order-1">
                        <section className="rounded-[28px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-5 shadow-[0_14px_35px_rgba(58,58,58,.06)]">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">{t("mentor.history.eyebrow")}</p>
                                    <h2 className="mt-1.5 text-lg font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("mentor.history.title")}</h2>
                                </div>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                                    <History className="h-4.5 w-4.5" />
                                </span>
                            </div>

                            {historyLoading && (
                                <p className="mt-4 flex items-center gap-2 text-xs text-[#3A3A3A]/50 dark:text-white/50" data-testid="mentor-history-loading">
                                    <Clock3 className="h-3.5 w-3.5 animate-pulse text-[#F47822]" />
                                    {t("mentor.history.loading")}
                                </p>
                            )}

                            {!historyLoading && historyError && (
                                <div className="mt-4 space-y-2" data-testid="mentor-history-error">
                                    <p className="text-xs text-red-600 dark:text-red-400">{historyError}</p>
                                    <button
                                        type="button"
                                        onClick={() => { setHistoryLoading(true); void refreshHistory(); }}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 px-3 py-1.5 text-xs font-bold text-[#3A3A3A] dark:text-[#ececef] transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        {t("mentor.retry")}
                                    </button>
                                </div>
                            )}

                            {!historyLoading && !historyError && history.length === 0 && (
                                <div className="mt-4 rounded-2xl border border-dashed border-[#3A3A3A]/10 dark:border-white/10 px-3 py-5 text-center" data-testid="mentor-history-empty">
                                    <p className="text-xs font-semibold text-[#3A3A3A]/70 dark:text-white/70">{t("mentor.history.empty")}</p>
                                    <p className="mt-1 text-[11px] leading-5 text-[#3A3A3A]/45 dark:text-white/45">{t("mentor.history.emptyHint")}</p>
                                </div>
                            )}

                            {!historyLoading && !historyError && history.length > 0 && (
                                <ul className="mt-4 max-h-[340px] space-y-2 overflow-y-auto pe-1" data-testid="mentor-history-list">
                                    {history.map((item) => {
                                        const openTab = tabs.find((tab) => tab.conversationId === item.id);
                                        const isOpen = Boolean(openTab);
                                        const isActive = Boolean(openTab && openTab.key === activeKey);
                                        return (
                                            <li key={item.id}>
                                                <div className={`group flex items-center gap-1 rounded-2xl border px-3 py-2.5 transition ${isActive
                                                    ? "border-[#F47822]/45 bg-[#F47822]/8 shadow-[0_0_0_1px_rgba(244,120,34,.08)]"
                                                    : isOpen
                                                        ? "border-[#F47822]/25 bg-[#F47822]/[.04]"
                                                        : "border-[#3A3A3A]/8 dark:border-white/8 hover:border-[#F47822]/30 hover:bg-[#F47822]/[.04]"}`}
                                                >
                                                    <button
                                                        type="button"
                                                        data-testid="mentor-history-item"
                                                        onClick={() => openFromHistory(item)}
                                                        className="min-w-0 flex-1 text-start"
                                                        aria-label={t("mentor.history.open")}
                                                    >
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="min-w-0 truncate text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">
                                                                {item.title || t("mentor.history.untitled")}
                                                            </span>
                                                            {isOpen && (
                                                                <span className="shrink-0 rounded-full bg-[#F47822]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#F47822]">
                                                                    {t("mentor.history.openBadge")}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="mt-0.5 flex items-center gap-1 text-[10px] text-[#3A3A3A]/45 dark:text-white/45">
                                                            <Clock3 className="h-3 w-3" />
                                                            {formatWhen(item.last_message_at || item.updated_at)}
                                                        </span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        data-testid="mentor-history-archive"
                                                        aria-label={t("mentor.history.archive")}
                                                        disabled={archivingId === item.id}
                                                        onClick={() => void archiveConversation(item.id)}
                                                        className="rounded-lg p-1.5 text-[#3A3A3A]/40 dark:text-white/40 opacity-0 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-40"
                                                    >
                                                        <Archive className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </section>

                        <section className="rounded-[28px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-5 shadow-[0_14px_35px_rgba(58,58,58,.06)]">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">{t("mentor.skills.eyebrow")}</p>
                                    <h2 className="mt-1.5 text-lg font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("mentor.skills.title")}</h2>
                                    <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">{t("mentor.skills.description")}</p>
                                </div>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                                    <Sparkles className="h-4.5 w-4.5" />
                                </span>
                            </div>
                            <ul className="mt-4 grid gap-2.5">
                                {skillItems.map(({ id, Icon }) => (
                                    <li key={id} className="flex items-start gap-2.5 rounded-xl border border-[#3A3A3A]/8 dark:border-white/8 px-3 py-2.5" data-testid="mentor-skill">
                                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F47822]/10 text-[#F47822]">
                                            <Icon className="h-3.5 w-3.5" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">{t(`mentor.skills.${id}.title`)}</p>
                                            <p className="mt-0.5 text-[11px] leading-4 text-[#3A3A3A]/50 dark:text-white/50">{t(`mentor.skills.${id}.desc`)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="rounded-[28px] bg-[#3A3A3A] p-5 text-white shadow-lg">
                            <div className="flex items-center gap-2 text-[#F47822]">
                                <ShieldCheck className="h-4 w-4" />
                                <p className="text-[10px] font-bold uppercase tracking-[.18em]">{t("mentor.promise.eyebrow")}</p>
                            </div>
                            <p className="mt-3 text-sm font-bold leading-6">{t("mentor.promise.title")}</p>
                            <p className="mt-2 text-xs leading-5 text-white/55">{t("mentor.promise.desc")}</p>
                        </section>
                    </aside>

                    <section
                        className="order-1 flex min-h-[720px] min-w-0 flex-col overflow-hidden rounded-[28px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white shadow-[0_18px_50px_rgba(58,58,58,.08)] lg:order-2"
                    >
                        <div className="shrink-0 border-b border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] px-3 pt-3 sm:px-4">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {tabs.map((tab) => {
                                    const isActive = tab.key === activeKey;
                                    return (
                                        <div
                                            key={tab.key}
                                            data-testid="mentor-tab"
                                            className={`flex shrink-0 items-center gap-0.5 rounded-t-2xl border border-b-0 px-2 transition ${isActive
                                                ? "border-[#3A3A3A]/10 dark:border-white/10 bg-[#FCFCFC] dark:bg-[#232329] text-[#F47822] shadow-[inset_0_-2px_0_0_#F47822]"
                                                : "border-transparent text-[#3A3A3A]/55 dark:text-white/55 hover:bg-black/[.03] dark:hover:bg-white/[.04] hover:text-[#3A3A3A] dark:hover:text-white/80"}`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => { setActiveKey(tab.key); setLimitNotice(false); }}
                                                className="max-w-[160px] truncate px-1.5 py-2 text-xs font-bold"
                                                aria-current={isActive ? "true" : undefined}
                                            >
                                                {tab.title}
                                            </button>
                                            <button
                                                type="button"
                                                data-testid="mentor-tab-close"
                                                aria-label={t("mentor.tabs.closeAria")}
                                                onClick={() => closeTab(tab.key)}
                                                className="rounded-md p-1 transition hover:bg-black/5 dark:hover:bg-white/10"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                                <button
                                    type="button"
                                    data-testid="mentor-new-chat"
                                    onClick={openNewTab}
                                    disabled={tabs.length >= MAX_TABS}
                                    aria-label={t("mentor.tabs.newChatAria")}
                                    className="ms-auto mb-1 inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-[#F47822] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#df6817] disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    {t("mentor.tabs.newChat")}
                                </button>
                            </div>
                            <div aria-live="polite">
                                {showLimit && (
                                    <div data-testid="mentor-tab-limit" className="mb-2 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-[11px] leading-4 text-amber-800 dark:text-amber-300">
                                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span>
                                            <b className="font-bold">{t("mentor.tabs.limitTitle")}</b>{" "}
                                            {t("mentor.tabs.limitDesc")}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="min-h-0 w-full flex-1">
                            {tabs.map((tab) => (
                                <div
                                    key={tab.key}
                                    className={tab.key === activeKey ? "h-full min-h-[620px] w-full" : "hidden"}
                                    aria-hidden={tab.key !== activeKey}
                                >
                                    <MentorChatPanel
                                        hideHeader
                                        flush
                                        compact
                                        className="h-full w-full min-h-[620px]"
                                        context={{
                                            title: t("mentor.sessionTitle"),
                                            conversationId: tab.conversationId,
                                            forceNew: tab.forceNew,
                                        }}
                                        subtitle={t("mentor.sessionDesc")}
                                        input={drafts[tab.key] ?? ""}
                                        onInputChange={(value) => setDrafts((current) => ({ ...current, [tab.key]: value }))}
                                        onPrompt={applyPrompt}
                                        onConversationReady={(conversation) => handleConversationReady(tab.key, conversation)}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
