import { ArrowLeft, CheckCircle2, ClipboardCheck, Clock3, Loader2, ShieldCheck, Target } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { env } from "@/config/env";
import { authStorage } from "@/lib/storage/auth-storage";
import { AttemptTimer } from "@/features/lessons/components/AttemptTimer";
import { TabWarning, TimeoutNotice } from "@/features/lessons/pages/QuizPlayerPage";

type Question = { id: string; question: string; options: { id: string; option: string }[] };
type Attempt = { id: string; assessment_id: string; attempt_number: number; status: string; expires_at?: string | null; assessment?: { title: string; minimum_score: number; questions: Question[] } };
type Result = { score: number; passed: boolean; attempt_number: number; completed_at: string | null };

const api = (path: string, options: RequestInit = {}) => fetch(`${env.apiUrl}${path}`, { ...options, headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${authStorage.getToken() ?? ""}` } });

export function AssessmentExamPage() {
    const { assessmentId } = useParams();
    const [attempt, setAttempt] = useState<Attempt | null>(null);
    const [answers, setAnswers] = useState<Record<string, string[]>>({});
    const [result, setResult] = useState<Result | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [timedOut, setTimedOut] = useState(false);
    const [tabWarning, setTabWarning] = useState(false);

    useEffect(() => {
        if (!assessmentId) return;
        void api(`/v1/assessments/${assessmentId}/attempts`, { method: "POST", body: "{}" })
            .then(async response => {
                const payload = await response.json();
                if (!response.ok) throw new Error(payload.message ?? "Unable to start the final assessment.");
                return payload.data as Attempt;
            }).then(setAttempt).catch(reason => setError(reason instanceof Error ? reason.message : "Unable to start the final assessment."));
    }, [assessmentId]);

    const expire = useCallback(async () => {
        if (!attempt || !assessmentId || timedOut) return;
        setTimedOut(true);
        await api(`/v1/assessments/${assessmentId}/attempts/${attempt.id}/expire`, { method: "POST", body: "{}" });
    }, [assessmentId, attempt, timedOut]);
    const warnTabSwitch = useCallback(async () => {
        if (!attempt || !assessmentId) return;
        const response = await api(`/v1/assessments/${assessmentId}/attempts/${attempt.id}/tab-switch`, { method: "POST", body: "{}" });
        const payload = await response.json();
        if (payload.data?.blocked) setTimedOut(true); else setTabWarning(true);
    }, [assessmentId, attempt]);

    const submit = async () => {
        if (!attempt || !assessmentId) return;
        setSubmitting(true); setError(null);
        try {
            const payload = { answers: Object.entries(answers).map(([question_id, option_ids]) => ({ question_id, option_ids })) };
            const response = await api(`/v1/assessments/${assessmentId}/attempts/${attempt.id}/submit`, { method: "POST", body: JSON.stringify(payload) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message ?? "Unable to submit the final assessment.");
            setResult(data.data as Result);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to submit the final assessment.");
        } finally { setSubmitting(false); }
    };

    const questions = attempt?.assessment?.questions ?? [];
    const answeredCount = Object.keys(answers).length;

    return <main className="min-h-screen bg-background px-5 py-6 sm:px-8 sm:py-8"><div className="mx-auto max-w-4xl"><Link to="/assessments" className="inline-flex items-center gap-2 text-sm font-semibold text-[#F47822] transition hover:text-[#df6817]"><ArrowLeft className="h-4 w-4"/>Back to assessments</Link><section className="mt-5 overflow-hidden rounded-3xl border border-[#3A3A3A]/10 bg-white shadow-[0_12px_35px_rgba(58,58,58,0.08)]"><header className="relative overflow-hidden bg-[#3A3A3A] p-6 text-white sm:p-8"><div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#F47822]/15 blur-3xl"/><div className="relative"><div className="flex items-start justify-between gap-5"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]"><ShieldCheck className="h-3.5 w-3.5"/> Secure final assessment</p><h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{attempt?.assessment?.title ?? "Preparing your exam…"}</h1><p className="mt-2 text-sm text-white/60">Stay focused and submit your answers before the timer runs out.</p></div>{attempt?.assessment ? <div className="hidden rounded-2xl border border-white/10 bg-white/[.07] p-3 text-right backdrop-blur-sm sm:block"><p className="text-[9px] font-bold uppercase tracking-[.12em] text-white/45">Pass score</p><p className="mt-1 text-xl font-bold">{attempt.assessment.minimum_score}%</p></div> : null}</div><div className="mt-6 flex flex-wrap items-center gap-3">{attempt?.assessment && <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.06] px-3 py-2 text-xs text-white/70"><Clock3 className="h-4 w-4 text-[#F47822]"/>30 minute limit</div>}{attempt?.assessment && <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.06] px-3 py-2 text-xs text-white/70"><ClipboardCheck className="h-4 w-4 text-[#F47822]"/>{questions.length} questions</div>}{attempt?.assessment && attempt.status === "in_progress" && <AttemptTimer expiresAt={attempt.expires_at} onExpire={() => void expire()} onVisibilityWarning={() => setTabWarning(true)} />}</div></div></header><div className="p-6 sm:p-8">{error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : result ? <div className="py-8 text-center"><CheckCircle2 className={result.passed ? "mx-auto h-14 w-14 text-emerald-600" : "mx-auto h-14 w-14 text-red-500"}/><h2 className="mt-5 text-2xl font-bold text-foreground">{result.passed ? "Assessment passed" : "Assessment not passed"}</h2><p className="mt-2 text-sm text-muted-foreground">Your score is {result.score}%. {result.passed ? "Your certificate is being issued." : "Review your course checkpoints, then try again."}</p><Link to={result.passed ? "/certificates" : "/assessments"} className="mt-7 inline-flex rounded-xl bg-[#F47822] px-5 py-3 text-sm font-semibold text-white">{result.passed ? "View certificate" : "Back to assessments"}</Link></div> : !attempt ? <div className="flex flex-col items-center py-14"><Loader2 className="h-7 w-7 animate-spin text-[#F47822]"/><p className="mt-4 text-sm text-muted-foreground">Preparing a secure assessment attempt…</p></div> : timedOut || attempt.status === "expired" ? <TimeoutNotice kind="assessment" to="/assessments" /> : <><div className="mb-6 flex items-center justify-between rounded-2xl bg-[#F7F7F7] px-4 py-3 text-xs"><span className="flex items-center gap-2 font-medium text-[#3A3A3A]/65"><ClipboardCheck className="h-4 w-4 text-[#F47822]"/>Attempt {attempt.attempt_number}</span><span className="font-semibold text-[#F47822]">{answeredCount}/{questions.length} answered</span></div><div className="space-y-7">{questions.map((question, index) => <section key={question.id}><p className="text-base font-semibold text-foreground"><span className="mr-2 text-[#F47822]">{index + 1}.</span>{question.question}</p><div className="mt-3 grid gap-2">{question.options.map(option => <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${answers[question.id]?.[0] === option.id ? "border-[#F47822] bg-[#F47822]/5 text-foreground" : "border-border text-muted-foreground hover:border-[#F47822]/35"}`}><input className="accent-[#F47822]" type="radio" name={question.id} checked={answers[question.id]?.[0] === option.id} onChange={() => setAnswers(current => ({ ...current, [question.id]: [option.id] }))}/>{option.option}</label>)}</div></section>)}</div><div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-xs text-muted-foreground"><Target className="h-4 w-4 text-[#F47822]"/>All questions must be answered before submitting.</p><button disabled={submitting || answeredCount !== questions.length || questions.length === 0} onClick={() => void submit()} className="inline-flex items-center justify-center rounded-xl bg-[#F47822] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(244,120,34,0.18)] transition hover:bg-[#df6817] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Submitting assessment…" : "Submit final assessment"}</button></div></>}</div></section></div>{tabWarning && <TabWarning onClose={() => setTabWarning(false)} />}</main>;
}
