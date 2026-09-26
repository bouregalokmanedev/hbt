import { ArrowLeft, CheckCircle2, ClipboardCheck, Clock3, Loader2, ShieldCheck, Target } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AttemptTimer } from "@/features/lessons/components/AttemptTimer";
import { TabWarning, TimeoutNotice } from "@/features/lessons/pages/QuizPlayerPage";
import { assessmentAttemptsApi } from "../api/assessments.api";

type Question = { id: string; question: string; options: { id: string; option: string }[] };
type Attempt = { id: string; assessment_id: string; attempt_number: number; status: string; expires_at?: string | null; assessment?: { title: string; minimum_score: number; questions: Question[] } };
type Result = { score: number; passed: boolean; attempt_number: number; completed_at: string | null };

export function AssessmentExamPage() {
    const { t } = useTranslation();
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
        void assessmentAttemptsApi
            .start(assessmentId)
            .then(setAttempt).catch(reason => setError(reason instanceof Error ? reason.message : t("assessments.startFail")));
    }, [assessmentId]);

    const expire = useCallback(async () => {
        if (!attempt || !assessmentId || timedOut) return;
        setTimedOut(true);
        await assessmentAttemptsApi.expire(assessmentId, attempt.id).catch(() => undefined);
    }, [assessmentId, attempt, timedOut]);
    const warnTabSwitch = useCallback(async () => {
        if (!attempt || !assessmentId) return;
        try {
            const payload = await assessmentAttemptsApi.tabSwitch(assessmentId, attempt.id);
            if (payload?.blocked) setTimedOut(true); else setTabWarning(true);
        } catch {
            setTabWarning(true);
        }
    }, [assessmentId, attempt]);

    const submit = async () => {
        if (!attempt || !assessmentId) return;
        setSubmitting(true); setError(null);
        try {
            const payload = Object.entries(answers).map(([question_id, option_ids]) => ({ question_id, option_ids }));
            const data = await assessmentAttemptsApi.submit(assessmentId, attempt.id, payload);
            setResult(data as Result);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : t("assessments.submitFail"));
        } finally { setSubmitting(false); }
    };

    const questions = attempt?.assessment?.questions ?? [];
    const answeredCount = Object.keys(answers).length;

    return <main className="min-h-screen bg-background px-5 py-6 sm:px-8 sm:py-8"><div className="mx-auto max-w-4xl"><Link to="/assessments" className="inline-flex items-center gap-2 text-sm font-semibold text-[#F47822] transition hover:text-[#df6817]"><ArrowLeft className="h-4 w-4 rtl:-scale-x-100"/>{t("assessments.backBtn")}</Link><section className="mt-5 overflow-hidden rounded-3xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] shadow-[0_12px_35px_rgba(58,58,58,0.08)]"><header className="relative overflow-hidden bg-[#3A3A3A] p-6 text-white sm:p-8"><div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#F47822]/15 blur-3xl"/><div className="relative"><div className="flex items-start justify-between gap-5"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]"><ShieldCheck className="h-3.5 w-3.5"/> {t("assessments.secureTag")}</p><h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{attempt?.assessment?.title ?? t("assessments.preparing")}</h1><p className="mt-2 text-sm text-white/60">{t("assessments.examDesc")}</p></div>{attempt?.assessment ? <div className="hidden rounded-2xl border border-white/10 bg-white/[.07] p-3 text-right backdrop-blur-sm sm:block"><p className="text-[9px] font-bold uppercase tracking-[.12em] text-white/45">{t("assessments.passScore")}</p><p className="mt-1 text-xl font-bold">{attempt.assessment.minimum_score}%</p></div> : null}</div><div className="mt-6 flex flex-wrap items-center gap-3">{attempt?.assessment && <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.06] px-3 py-2 text-xs text-white/70"><Clock3 className="h-4 w-4 text-[#F47822]"/>{t("assessments.minuteLimit")}</div>}{attempt?.assessment && <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.06] px-3 py-2 text-xs text-white/70"><ClipboardCheck className="h-4 w-4 text-[#F47822]"/>{t("assessments.questionsCount", { count: questions.length })}</div>}{attempt?.assessment && attempt.status === "in_progress" && <AttemptTimer expiresAt={attempt.expires_at} onExpire={() => void expire()} onVisibilityWarning={() => setTabWarning(true)} />}</div></div></header><div className="p-6 sm:p-8">{error ? <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">{error}</div> : result ? <div className="py-8 text-center"><CheckCircle2 className={result.passed ? "mx-auto h-14 w-14 text-emerald-600 dark:text-emerald-400" : "mx-auto h-14 w-14 text-red-500"}/><h2 className="mt-5 text-2xl font-bold text-foreground">{result.passed ? t("assessments.passedTitle") : t("assessments.notPassedTitle")}</h2><p className="mt-2 text-sm text-muted-foreground">{result.passed ? t("assessments.scorePass", { score: result.score }) : t("assessments.scoreFail", { score: result.score })}</p><Link to={result.passed ? "/certificates" : "/assessments"} className="mt-7 inline-flex rounded-xl bg-[#F47822] px-5 py-3 text-sm font-semibold text-white">{result.passed ? t("assessments.viewCert") : t("assessments.backBtn")}</Link></div> : !attempt ? <div className="flex flex-col items-center py-14"><Loader2 className="h-7 w-7 animate-spin text-[#F47822]"/><p className="mt-4 text-sm text-muted-foreground">{t("assessments.loadingExam")}</p></div> : timedOut || attempt.status === "expired" ? <TimeoutNotice kind="assessment" to="/assessments" /> : <><div className="mb-6 flex items-center justify-between rounded-2xl bg-[#F7F7F7] dark:bg-[#101013] px-4 py-3 text-xs"><span className="flex items-center gap-2 font-medium text-[#3A3A3A]/65 dark:text-white/65"><ClipboardCheck className="h-4 w-4 text-[#F47822]"/>{t("assessments.attempt", { n: attempt.attempt_number })}</span><span className="font-semibold text-[#F47822]">{t("assessments.answered", { done: answeredCount, total: questions.length })}</span></div><div className="space-y-7">{questions.map((question, index) => <section key={question.id}><p className="text-base font-semibold text-foreground"><span className="mr-2 text-[#F47822]">{index + 1}.</span>{question.question}</p><div className="mt-3 grid gap-2">{question.options.map(option => <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${answers[question.id]?.[0] === option.id ? "border-[#F47822] bg-[#F47822]/5 text-foreground" : "border-border text-muted-foreground hover:border-[#F47822]/35"}`}><input className="accent-[#F47822]" type="radio" name={question.id} checked={answers[question.id]?.[0] === option.id} onChange={() => setAnswers(current => ({ ...current, [question.id]: [option.id] }))}/>{option.option}</label>)}</div></section>)}</div><div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-xs text-muted-foreground"><Target className="h-4 w-4 text-[#F47822]"/>{t("assessments.mustAnswer")}</p><button disabled={submitting || answeredCount !== questions.length || questions.length === 0} onClick={() => void submit()} className="inline-flex items-center justify-center rounded-xl bg-[#F47822] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(244,120,34,0.18)] transition hover:bg-[#df6817] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? t("assessments.submitting") : t("assessments.submitBtn")}</button></div></>}</div></section></div>{tabWarning && <TabWarning onClose={() => setTabWarning(false)} />}</main>;
}
