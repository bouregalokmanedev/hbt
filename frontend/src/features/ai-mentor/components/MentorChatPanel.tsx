import { Bot, Check, Clock3, MessageCircle, Send, ShieldCheck, Sparkles, ThumbsDown, ThumbsUp, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { mentorApi } from "../api/mentor-api";
import { useMentorChat } from "../hooks/use-mentor-chat";
import type { MentorConversation, MentorMessage } from "../types/mentor";

interface Props {
    title?: string;
    subtitle?: string;
    context: {
        title: string;
        courseId?: string;
        lessonId?: string;
        conversationId?: string | null;
        forceNew?: boolean;
    };
    compact?: boolean;
    /** Drop outer chrome (border/radius/shadow) so the parent card owns it. */
    flush?: boolean;
    className?: string;
    hideHeader?: boolean;
    input?: string;
    onInputChange?: (value: string) => void;
    onPrompt?: (text: string) => void;
    onConversationReady?: (conversation: MentorConversation) => void;
}

export function MentorChatPanel({
    title,
    subtitle,
    context,
    compact = false,
    flush = false,
    className = "",
    hideHeader = false,
    input: controlledInput,
    onInputChange,
    onPrompt,
    onConversationReady,
}: Props) {
    const { t } = useTranslation();
    const resolvedTitle = title ?? t("mentor.panelTitle");
    const resolvedSubtitle = subtitle ?? t("mentor.panelDesc");
    const { messages, loading, sending, error, conversation, send, retry } = useMentorChat(context);
    const [internalInput, setInternalInput] = useState("");
    const [rated, setRated] = useState<Record<string, "positive" | "negative">>({});
    const input = controlledInput ?? internalInput;
    const setInput = onInputChange ?? setInternalInput;
    const onConversationReadyRef = useRef(onConversationReady);
    onConversationReadyRef.current = onConversationReady;
    const notifiedConversationIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!conversation) return;
        if (notifiedConversationIdRef.current === conversation.id) return;
        notifiedConversationIdRef.current = conversation.id;
        onConversationReadyRef.current?.(conversation);
    }, [conversation]);

    const submit = async () => {
        if (!input.trim()) return;
        const value = input;
        setInput("");
        await send(value);
    };

    const shell = flush
        ? "h-full w-full min-h-0 bg-white dark:bg-[#1b1b20]"
        : `bg-white dark:bg-[#1b1b20] shadow-[0_18px_50px_rgba(58,58,58,.08)] rounded-[28px] border border-[#3A3A3A]/10 dark:border-white/10 ${compact ? "h-full" : "min-h-[680px]"}`;

    const starterPrompts = [
        t("mentor.prompts.explain"),
        t("mentor.prompts.quiz"),
        t("mentor.prompts.next"),
    ];

    return (
        <section className={`flex min-h-0 flex-col overflow-hidden ${shell} ${className}`}>
            {!hideHeader && (
                <header className="relative shrink-0 overflow-hidden bg-[#3A3A3A] px-5 py-5 text-white sm:px-7">
                    <div className="absolute -right-12 -top-20 h-48 w-48 rounded-full bg-[#F47822]/20 blur-3xl" />
                    <div className="relative flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F47822] shadow-lg shadow-[#F47822]/20">
                                <Bot className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">
                                    <Sparkles className="h-3 w-3" /> {t("mentor.guided")}
                                </p>
                                <h1 className="mt-1 text-lg font-bold sm:text-xl">{resolvedTitle}</h1>
                            </div>
                        </div>
                        <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.07] px-3 py-1.5 text-[10px] font-semibold text-white/70 sm:inline-flex">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {t("mentor.online")}
                        </span>
                    </div>
                    <p className="relative mt-3 max-w-2xl text-xs leading-5 text-white/60">{resolvedSubtitle}</p>
                </header>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#FCFCFC] dark:bg-[#232329] px-4 py-5 sm:px-7">
                {loading && (
                    <div className="flex h-full min-h-[350px] items-center justify-center gap-2 text-xs text-[#3A3A3A]/50 dark:text-white/50">
                        <Clock3 className="h-4 w-4 animate-pulse text-[#F47822]" /> {t("mentor.preparing")}
                    </div>
                )}

                {!loading && messages.length === 0 && (
                    <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center" data-testid="mentor-empty">
                        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F47822]/10 text-[#F47822] ring-8 ring-[#F47822]/[.04]">
                            <MessageCircle className="h-7 w-7" />
                        </span>
                        <h2 className="mt-5 text-lg font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("mentor.emptyTitle")}</h2>
                        <p className="mt-2 max-w-md text-sm leading-6 text-[#3A3A3A]/50 dark:text-white/50">
                            {context.lessonId ? t("mentor.emptyDescLesson") : t("mentor.emptyDescCourse")}
                        </p>
                        {onPrompt && (
                            <div className="mt-6 flex w-full max-w-lg flex-wrap justify-center gap-2">
                                {starterPrompts.map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        data-testid="mentor-empty-prompt"
                                        onClick={() => onPrompt(prompt)}
                                        className="group inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-3.5 py-2 text-xs font-semibold text-[#3A3A3A]/70 dark:text-white/70 shadow-sm transition hover:border-[#F47822]/40 hover:bg-[#F47822]/5 hover:text-[#F47822]"
                                    >
                                        <Zap className="h-3.5 w-3.5 shrink-0 text-[#F47822] transition group-hover:scale-110" />
                                        <span className="truncate">{prompt}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-4">
                    {messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            sending={sending && message.content === ""}
                            rated={rated[message.id]}
                            onRate={async (rating) => {
                                if (!message.id.startsWith("local-")) {
                                    await mentorApi.feedback(message.id, rating);
                                    setRated((current) => ({ ...current, [message.id]: rating }));
                                }
                            }}
                        />
                    ))}
                </div>

                {error && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-xs text-red-700 dark:text-red-400">
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => void retry()}
                            className="rounded-lg bg-white dark:bg-[#1b1b20] px-3 py-1.5 font-bold text-red-700 dark:text-red-400 shadow-sm"
                        >
                            {t("mentor.retry")}
                        </button>
                    </div>
                )}
            </div>

            <footer className="shrink-0 border-t border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-4 sm:p-5">
                <div className="flex items-end gap-2 rounded-2xl border border-[#3A3A3A]/10 dark:border-white/10 bg-[#FAFAFA] dark:bg-[#232329] p-2 transition focus-within:border-[#F47822]/50 focus-within:bg-white dark:focus-within:bg-[#1b1b20]">
                    <textarea
                        data-testid="mentor-composer"
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                void submit();
                            }
                        }}
                        rows={1}
                        disabled={loading || sending}
                        placeholder={context.lessonId ? t("mentor.inputPhLesson") : t("mentor.inputPhCourse")}
                        className="min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[#3A3A3A] dark:text-[#ececef] outline-none placeholder:text-[#3A3A3A]/35 dark:placeholder:text-white/35 disabled:opacity-50"
                    />
                    <button
                        type="button"
                        onClick={() => void submit()}
                        disabled={!input.trim() || loading || sending}
                        aria-label={t("mentor.sendAria")}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F47822] text-white transition hover:bg-[#df6817] disabled:opacity-40"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[10px] text-[#3A3A3A]/40 dark:text-white/40">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#F47822]" /> {t("mentor.disclaimer")}
                </p>
            </footer>
        </section>
    );
}

function MessageBubble({ message, sending, rated, onRate }: { message: MentorMessage; sending: boolean; rated?: "positive" | "negative"; onRate: (rating: "positive" | "negative") => Promise<void> }) {
    const { t } = useTranslation();
    const isUser = message.role === "user";
    return (
        <article className={`flex gap-3 ${isUser ? "justify-end" : "items-start"}`}>
            {!isUser && (
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                    <Bot className="h-4 w-4" />
                </span>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${isUser
                ? "rounded-br-md bg-[#F47822] text-white shadow-sm"
                : "rounded-bl-md border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] text-[#3A3A3A]/80 dark:text-white/80 shadow-sm"}`}
            >
                {sending ? (
                    <span className="flex gap-1 py-1">
                        <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F47822]" />
                        <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F47822] [animation-delay:120ms]" />
                        <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F47822] [animation-delay:240ms]" />
                    </span>
                ) : (
                    <>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {!isUser && !message.id.startsWith("local-") && (
                            <div className="mt-3 flex items-center gap-1 border-t border-[#3A3A3A]/8 dark:border-white/8 pt-2">
                                <span className="me-1 text-[10px] text-[#3A3A3A]/40 dark:text-white/40">{t("mentor.helpfulQ")}</span>
                                <button
                                    type="button"
                                    aria-label={t("mentor.helpfulAria")}
                                    onClick={() => void onRate("positive")}
                                    className={`rounded-md p-1 transition hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 ${rated === "positive"
                                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "text-[#3A3A3A]/35 dark:text-white/35"}`}
                                >
                                    <ThumbsUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    aria-label={t("mentor.notHelpfulAria")}
                                    onClick={() => void onRate("negative")}
                                    className={`rounded-md p-1 transition hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 ${rated === "negative"
                                        ? "bg-red-50 dark:bg-red-500/10 text-red-500"
                                        : "text-[#3A3A3A]/35 dark:text-white/35"}`}
                                >
                                    <ThumbsDown className="h-3.5 w-3.5" />
                                </button>
                                {rated && <Check className="ms-1 h-3.5 w-3.5 text-emerald-500" />}
                            </div>
                        )}
                    </>
                )}
            </div>
        </article>
    );
}
