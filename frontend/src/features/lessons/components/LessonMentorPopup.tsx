import { Bot, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { MentorChatPanel } from "@/features/ai-mentor/components/MentorChatPanel";

interface Props {
    lessonTitle: string;
    lessonId?: string;
    courseId?: string;
}

export function LessonMentorPopup({ lessonTitle, lessonId, courseId }: Props) {
    const [open, setOpen] = useState(false);

    return <>
        <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 end-5 z-30 flex items-center gap-2 rounded-full bg-[#F47822] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(244,120,34,.3)] transition hover:-translate-y-0.5 hover:bg-[#df6817]"><MessageCircle className="h-4 w-4" /> Ask AI Mentor</button>
        {open && <div className="fixed inset-0 z-50 flex items-end justify-end bg-[#17202b]/30 p-3 backdrop-blur-sm sm:p-6"><div className="flex h-[min(720px,calc(100vh-1.5rem))] w-full max-w-xl flex-col"><div className="mb-2 flex items-center justify-between px-2 text-white"><div className="flex items-center gap-2 text-xs font-semibold"><Bot className="h-4 w-4 text-[#F47822]" /> Lesson mentor · {lessonTitle}</div><button type="button" onClick={() => setOpen(false)} aria-label="Close mentor" className="rounded-lg p-1.5 transition hover:bg-white/10"><X className="h-5 w-5" /></button></div><MentorChatPanel compact context={{ title: `Lesson help: ${lessonTitle}`, lessonId, courseId }} subtitle="Ask for an explanation, a diagnostic hint, or a safe next step." /></div></div>}
    </>;
}
