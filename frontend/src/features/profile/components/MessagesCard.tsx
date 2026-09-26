import {
    ArrowRight,
    Loader2,
    MessageCircle,
} from "lucide-react";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    messagesApi,
    type Conversation,
} from "@/features/messages/api/messages.api";

export function MessagesCard() {
    const { t } = useTranslation();
    const [conversations, setConversations] = useState<Conversation[] | null>(null);

    useEffect(() => {
        let cancelled = false;

        messagesApi
            .list()
            .then((items) => {
                if (!cancelled) setConversations(items);
            })
            .catch(() => {
                if (!cancelled) setConversations([]);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const loaded = conversations !== null;
    const unreadCount = (conversations ?? []).reduce(
        (sum, item) => sum + (item.unread_count ?? 0),
        0,
    );
    const recent = (conversations ?? [])
        .slice()
        .sort((a, b) => (b.last_message_at ?? "").localeCompare(a.last_message_at ?? ""))
        .slice(0, 3);

    const previewFor = (conversation: Conversation) => {
        if (conversation.subject) return conversation.subject;
        return conversation.participant?.name ?? t("profilePage.messages.community");
    };

    return (
        <section
            data-testid="profile-messages-card"
            className="rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-5 shadow-[0_8px_30px_rgba(58,58,58,0.05)]"
        >

            <div className="flex items-start justify-between">

                <div className="flex items-center gap-3">

                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822]/10">
                        <MessageCircle className="h-4 w-4 text-[#F47822]" />

                        {unreadCount > 0 && (
                            <span
                                data-testid="profile-messages-unread"
                                className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F47822] px-1 text-[9px] font-bold text-white"
                                dir="ltr"
                            >
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                            {t("profilePage.messages.title")}
                        </p>

                        <p className="mt-0.5 text-[10px] text-[#3A3A3A]/40 dark:text-white/40">
                            {unreadCount > 0
                                ? t("profilePage.messages.unreadDesc", { count: unreadCount })
                                : t("profilePage.messages.description")}
                        </p>
                    </div>

                </div>

                {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F47822] px-1.5 text-[9px] font-bold text-white">
                        {unreadCount}
                    </span>
                )}

            </div>

            {!loaded ? (
                <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#F7F7F7] dark:bg-[#101013] px-4 py-5 text-[#3A3A3A]/45 dark:text-white/45">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">{t("profilePage.messages.loading")}</span>
                </div>
            ) : recent.length === 0 ? (
                <div className="mt-5 rounded-xl bg-[#F7F7F7] dark:bg-[#101013] px-4 py-5 text-center">

                    <MessageCircle className="mx-auto h-5 w-5 text-[#3A3A3A]/20 dark:text-white/20" />

                    <p className="mt-2 text-xs font-semibold text-[#3A3A3A]/65 dark:text-white/65">
                        {t("profilePage.messages.emptyTitle")}
                    </p>

                    <p className="mt-1 text-[10px] text-[#3A3A3A]/35 dark:text-white/35">
                        {t("profilePage.messages.emptyDesc")}
                    </p>

                </div>
            ) : (
                <ul className="mt-4 space-y-2">
                    {recent.map((conversation) => (
                        <li key={conversation.id}>
                            <Link
                                to={`/messages?conversation=${conversation.id}`}
                                className={[
                                    "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[#F47822]/5",
                                    (conversation.unread_count ?? 0) > 0
                                        ? "bg-[#FFF8F4] dark:bg-[#F47822]/[0.08] border border-[#F47822]/25"
                                        : "bg-[#F7F7F7] dark:bg-[#101013] border border-transparent",
                                ].join(" ")}
                            >
                                <div className="min-w-0">
                                    <p className={[
                                        "truncate text-xs",
                                        (conversation.unread_count ?? 0) > 0
                                            ? "font-bold text-[#3A3A3A] dark:text-[#ececef]"
                                            : "font-medium text-[#3A3A3A]/75 dark:text-white/75",
                                    ].join(" ")}>
                                        {previewFor(conversation)}
                                    </p>

                                    {(conversation.unread_count ?? 0) > 0 && (
                                        <p className="mt-0.5 text-[10px] font-semibold text-[#F47822]">
                                            {t("profilePage.messages.newBadge", {
                                                count: conversation.unread_count,
                                            })}
                                        </p>
                                    )}
                                </div>

                                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#3A3A3A]/35 dark:text-white/35 rtl:-scale-x-100" />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <Link
                to="/messages"
                data-testid="profile-messages-view-all"
                className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#F7F7F7] dark:bg-[#101013] px-4 py-3 text-start transition hover:bg-[#F47822]/5"
            >
                <span className="text-xs font-medium text-[#3A3A3A] dark:text-[#ececef]">
                    {t("profilePage.messages.viewAll")}
                </span>

                <ArrowRight className="h-3.5 w-3.5 text-[#3A3A3A]/35 dark:text-white/35 rtl:-scale-x-100" />
            </Link>

        </section>
    );
}
