import { Bot, Check, Clock3, MessageCircle, Send, ShieldCheck, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { mentorApi } from "../api/mentor-api";
import { useMentorChat } from "../hooks/use-mentor-chat";
import type { MentorMessage } from "../types/mentor";

interface Props {
    title?: string;
    subtitle?: string;
    context: { title: string; courseId?: string; lessonId?: string };
    compact?: boolean;
}

export function MentorChatPanel({ title = "Your AI Mentor", subtitle = "Course-aware guidance for your learning journey.", context, compact = false }: Props) {
    const { messages, loading, sending, error, send, retry } = useMentorChat(context);
    const [input, setInput] = useState("");
    const [rated, setRated] = useState<Record<string, "positive" | "negative">>({});

    const submit = async () => {
        if (!input.trim()) return;
        const value = input;
        setInput("");
        await send(value);
    };

    return <section className={`flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-[#3A3A3A]/10 bg-white shadow-[0_18px_50px_rgba(58,58,58,.08)] ${compact ? "h-full" : "min-h-[680px]"}`}>
        <header className="relative overflow-hidden bg-[#3A3A3A] px-5 py-5 text-white sm:px-7">
            <div className="absolute -right-12 -top-20 h-48 w-48 rounded-full bg-[#F47822]/20 blur-3xl" />
            <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F47822] shadow-lg shadow-[#F47822]/20"><Bot className="h-5 w-5" /></span><div><p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]"><Sparkles className="h-3 w-3" /> AI-guided learning</p><h1 className="mt-1 text-lg font-bold sm:text-xl">{title}</h1></div></div>
                <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.07] px-3 py-1.5 text-[10px] font-semibold text-white/70 sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</span>
            </div>
            <p className="relative mt-3 max-w-2xl text-xs leading-5 text-white/60">{subtitle}</p>
        </header>
        <div className="flex-1 overflow-y-auto bg-[#FCFCFC] px-4 py-5 sm:px-7">
            {loading && <div className="flex h-full min-h-[350px] items-center justify-center gap-2 text-xs text-[#3A3A3A]/50"><Clock3 className="h-4 w-4 animate-pulse text-[#F47822]" /> Preparing your learning context…</div>}
            {!loading && messages.length === 0 && <div className="flex min-h-[350px] flex-col items-center justify-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F47822]/10 text-[#F47822]"><MessageCircle className="h-6 w-6" /></span><h2 className="mt-4 text-base font-bold text-[#3A3A3A]">Ask, practise, and understand</h2><p className="mt-2 max-w-sm text-xs leading-5 text-[#3A3A3A]/50">Your mentor uses this {context.lessonId ? "lesson" : "course"} context and your progress to guide the next step.</p></div>}
            <div className="space-y-4">{messages.map((message) => <MessageBubble key={message.id} message={message} sending={sending && message.content === ""} rated={rated[message.id]} onRate={async (rating) => { if (!message.id.startsWith("local-")) { await mentorApi.feedback(message.id, rating); setRated((current) => ({ ...current, [message.id]: rating })); } }} />)}</div>
            {error && <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"><span>{error}</span><button onClick={() => void retry()} className="rounded-lg bg-white px-3 py-1.5 font-bold text-red-700 shadow-sm">Retry</button></div>}
        </div>
        <footer className="border-t border-[#3A3A3A]/8 bg-white p-4 sm:p-5"><div className="flex items-end gap-2 rounded-2xl border border-[#3A3A3A]/10 bg-[#FAFAFA] p-2 transition focus-within:border-[#F47822]/50 focus-within:bg-white"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }} rows={1} disabled={loading || sending} placeholder={context.lessonId ? "Ask about this lesson…" : "Ask about a lesson, quiz, or diagnostic step…"} className="min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[#3A3A3A] outline-none placeholder:text-[#3A3A3A]/35 disabled:opacity-50" /><button type="button" onClick={() => void submit()} disabled={!input.trim() || loading || sending} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F47822] text-white transition hover:bg-[#df6817] disabled:opacity-40"><Send className="h-4 w-4" /></button></div><p className="mt-2 flex items-center gap-1.5 text-[10px] text-[#3A3A3A]/40"><ShieldCheck className="h-3.5 w-3.5 text-[#F47822]" /> Educational guidance—verify work with manufacturer procedures.</p></footer>
    </section>;
}

function MessageBubble({ message, sending, rated, onRate }: { message: MentorMessage; sending: boolean; rated?: "positive" | "negative"; onRate: (rating: "positive" | "negative") => Promise<void> }) {
    const isUser = message.role === "user";
    return <article className={`flex gap-3 ${isUser ? "justify-end" : "items-start"}`}>{!isUser && <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]"><Bot className="h-4 w-4" /></span>}<div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${isUser ? "rounded-br-md bg-[#F47822] text-white shadow-sm" : "rounded-bl-md border border-[#3A3A3A]/8 bg-white text-[#3A3A3A]/80 shadow-sm"}`}>{sending ? <span className="flex gap-1 py-1"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F47822]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F47822] [animation-delay:120ms]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F47822] [animation-delay:240ms]" /></span> : <><p className="whitespace-pre-wrap">{message.content}</p>{!isUser && !message.id.startsWith("local-") && <div className="mt-3 flex items-center gap-1 border-t border-[#3A3A3A]/8 pt-2"><span className="mr-1 text-[10px] text-[#3A3A3A]/40">Was this helpful?</span><button aria-label="Helpful" onClick={() => void onRate("positive")} className={`rounded-md p-1 transition hover:bg-emerald-50 hover:text-emerald-600 ${rated === "positive" ? "bg-emerald-50 text-emerald-600" : "text-[#3A3A3A]/35"}`}><ThumbsUp className="h-3.5 w-3.5" /></button><button aria-label="Not helpful" onClick={() => void onRate("negative")} className={`rounded-md p-1 transition hover:bg-red-50 hover:text-red-500 ${rated === "negative" ? "bg-red-50 text-red-500" : "text-[#3A3A3A]/35"}`}><ThumbsDown className="h-3.5 w-3.5" /></button>{rated && <Check className="ml-1 h-3.5 w-3.5 text-emerald-500" />}</div>}</>}</div></article>;
}
