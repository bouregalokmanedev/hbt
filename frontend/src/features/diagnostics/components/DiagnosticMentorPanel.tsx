import { Bot, Send, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { mentorApi, streamMentorMessage } from "@/features/ai-mentor/api/mentor-api";
import { useDiagnosticMentorStore } from "../state/diagnosticMentorStore";

type Props = {
    courseId?: string | null;
    stepTitle?: string | null;
    tool?: string | null;
};

export function DiagnosticMentorPanel({ courseId, stepTitle, tool }: Props) {
    const { t } = useTranslation();
    const { isOpen, messages, input, isSending, setOpen, setInput, pushMessage, setSending } = useDiagnosticMentorStore();
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [streamed, setStreamed] = useState("");

    useEffect(() => {
        if (!isOpen || conversationId) return;
        let cancelled = false;
        void mentorApi
            .create({ title: stepTitle ? `Diagnostics · ${stepTitle}` : "Diagnostics", course_id: courseId ?? undefined })
            .then((c: { id: string }) => {
                if (!cancelled) setConversationId(c.id);
            })
            .catch(() => setError(t("diagnostics.mentor.unavailable")));
        return () => {
            cancelled = true;
        };
    }, [isOpen, conversationId, courseId, stepTitle]);

    const send = async () => {
        const text = input.trim();
        if (!text || !conversationId || isSending) return;
        setInput("");
        pushMessage({ role: "user", content: text });
        setSending(true);
        setStreamed("");
        setError(null);
        try {
            const enriched = tool ? `[${tool} · ${stepTitle ?? "diagnostic"}] ${text}` : text;
            await streamMentorMessage(conversationId, enriched, (chunk: string) => setStreamed((s) => s + chunk));
            // Reload final assistant message from conversation to keep source of truth.
            const conv = await mentorApi.get(conversationId);
            const last = [...(conv.messages ?? [])].reverse().find((m) => m.role === "assistant");
            if (last) pushMessage({ role: "assistant", content: last.content });
            setStreamed("");
        } catch (e) {
            setError(e instanceof Error ? e.message : t("diagnostics.mentor.noResponse"));
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={t("diagnostics.mentor.button")}
                className="fixed bottom-6 end-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#3A3A3A] px-5 py-3 text-sm font-bold text-white shadow-xl hover:bg-black"
            >
                <Bot className="h-4 w-4" /> {t("diagnostics.mentor.button")}
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 end-6 z-40 flex h-[420px] w-[360px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] shadow-2xl">
            <header className="flex items-center justify-between bg-[#3A3A3A] px-4 py-3 text-white">
                <span className="flex items-center gap-2 text-sm font-bold">
                    <Sparkles className="h-4 w-4 text-[#F47822]" /> {t("diagnostics.mentor.title")}
                </span>
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/10">
                    <X className="h-4 w-4" />
                </button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
                <p className="rounded-xl bg-[#F47822]/10 p-3 text-xs leading-5 text-[#3A3A3A]/70 dark:text-white/70">
                    {t("diagnostics.mentor.tagline")}
                </p>
                {messages.map((m, i) => (
                    <div key={i} className={`rounded-xl px-3 py-2 ${m.role === "user" ? "ml-8 bg-[#3A3A3A] text-white" : "mr-8 bg-[#F7F7F7] dark:bg-[#101013] text-[#3A3A3A] dark:text-[#ececef]"}`}>
                        {m.content}
                    </div>
                ))}
                {streamed && <div className="mr-8 rounded-xl bg-[#F7F7F7] dark:bg-[#101013] px-3 py-2 text-[#3A3A3A] dark:text-[#ececef]">{streamed}</div>}
                {error && <p className="rounded-xl bg-red-50 dark:bg-red-500/10 p-2 text-xs text-red-700 dark:text-red-400">{error}</p>}
            </div>
            <div className="flex gap-2 border-t border-[#3A3A3A]/10 dark:border-white/10 p-3">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void send();
                        }
                    }}
                    placeholder={t("diagnostics.mentor.askPh")}
                    className="h-10 flex-1 rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 px-3 text-sm outline-none focus:border-[#F47822]"
                />
                <button
                    type="button"
                    onClick={() => void send()}
                    disabled={isSending || !input.trim() || !conversationId}
                    className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822] text-white disabled:opacity-50"
                >
                    <Send className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
