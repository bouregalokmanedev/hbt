import { CheckCircle2, Clock3, ClipboardCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { env } from "@/config/env";
import { authStorage } from "@/lib/storage/auth-storage";

interface Quiz { id: string; title: string; description: string | null; pass_percentage: number; time_limit: number | null; questions_count: number; }

export function CourseQuizzes({ courseId, enrolled }: { courseId: string; enrolled: boolean }) {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    useEffect(() => { if (!enrolled) return; void fetch(`${env.apiUrl}/v1/courses/${courseId}/quizzes`, { headers: { Accept: "application/json", Authorization: `Bearer ${authStorage.getToken() ?? ""}` } }).then(async response => response.ok ? response.json() as Promise<{ data: Quiz[] }> : null).then(payload => setQuizzes(payload?.data ?? [])).catch(() => setQuizzes([])); }, [courseId, enrolled]);
    if (!enrolled || quizzes.length === 0) return null;
    return <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">Knowledge checkpoints</p><h2 className="mt-2 text-xl font-bold text-foreground">Course quizzes</h2><p className="mt-1 text-sm text-muted-foreground">Pass these checkpoints to unlock your final assessment.</p></div><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F47822]/10"><ClipboardCheck className="h-5 w-5 text-[#F47822]" /></div></div><div className="mt-6 space-y-3">{quizzes.map((quiz, index) => <div key={quiz.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#3A3A3A]/8 bg-[#F7F7F7] p-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xs font-bold text-[#F47822] shadow-sm">{index + 1}</div><div className="min-w-[180px] flex-1"><h3 className="text-sm font-semibold text-[#3A3A3A]">{quiz.title}</h3><p className="mt-1 text-xs text-[#3A3A3A]/50">{quiz.description}</p></div><div className="flex items-center gap-3 text-xs text-[#3A3A3A]/55"><span>{quiz.questions_count} questions</span>{quiz.time_limit ? <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{quiz.time_limit} min</span> : null}<span className="flex items-center gap-1 font-semibold text-[#F47822]"><CheckCircle2 className="h-3.5 w-3.5" />{quiz.pass_percentage}% to pass</span></div></div>)}</div></section>;
}
