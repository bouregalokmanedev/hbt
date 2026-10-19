import { ArrowRight, Check, CheckCircle2, ClipboardCheck, Info, TriangleAlert, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { errorMessage } from "@/lib/api/safe-error";
import { coursesApi } from "@/features/courses/api/courses.api";
import { settingsApi } from "@/features/settings/api/settings.api";
import { AttemptTimer } from "../components/AttemptTimer";

type Option = { id: string; option: string; is_correct?: boolean | null };

type Question = {
    id: string;
    question: string;
    type: string;
    points: number;
    required: boolean;
    explanation?: string | null;
    options: Option[];
};

type AnswerRow = {
    question_id: string;
    is_correct?: boolean | null;
    points_earned?: number | null;
    selected_options: { id: string; option_id: string }[];
};

type Attempt = {
    id: string;
    quiz_id: string;
    attempt_number: number;
    status: string;
    percentage: number | null;
    passed: boolean | null;
    expires_at?: string | null;
    tab_switch_count?: number;
    answers?: AnswerRow[];
    quiz: { title: string; pass_percentage: number; questions: Question[] };
};

type LearningPrefs = { showExplanations: boolean; confirmSubmit: boolean };

/** How long a changed answer waits before it is written to the server. */
const AUTOSAVE_DELAY_MS = 450;

/** Merge the attempt's persisted selections back into local answer state. */
const hydrateAnswers = (attempt: Attempt): Record<string, string[]> =>
    Object.fromEntries(
        (attempt.answers ?? []).map((row) => [
            row.question_id,
            row.selected_options.map((option) => option.option_id),
        ]),
    );

export function QuizPlayerPage() {
    const { t } = useTranslation();
    const { courseId, quizId } = useParams();
    const navigate = useNavigate();
    const [attempt, setAttempt] = useState<Attempt | null>(null);
    const [answers, setAnswers] = useState<Record<string, string[]>>({});
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [tabWarning, setTabWarning] = useState(false);
    const [timedOut, setTimedOut] = useState(false);
    const [round, setRound] = useState(0);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
    // Server defaults both flags to true, so a failed settings read keeps them on.
    const [prefs, setPrefs] = useState<LearningPrefs>({ showExplanations: true, confirmSubmit: true });
    const saveTimers = useRef<Record<string, number>>({});

    useEffect(() => {
        let cancelled = false;
        settingsApi.get()
            .then((settings) => {
                if (cancelled) return;
                const learning = (settings.learning ?? {}) as Record<string, unknown>;
                setPrefs({
                    showExplanations: learning.show_quiz_explanations !== false,
                    confirmSubmit: learning.confirm_before_quiz_submit !== false,
                });
            })
            .catch(() => undefined);
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!quizId) return;
        setAttempt(null);
        setAnswers({});
        setError(null);
        setTimedOut(false);
        setSaveStatus("idle");
        api<Attempt>(`/v1/quizzes/${quizId}/attempts`, { method: "POST", body: {} })
            .then((started) => {
                setAttempt(started);
                setAnswers(hydrateAnswers(started));
            })
            .catch((reason) => setError(errorMessage(reason, t("assessments.checkpoint.startFail"))));
    }, [quizId, round, t]);

    // Flush nothing on unmount: a pending write simply lands on the next answer.
    useEffect(() => () => {
        Object.values(saveTimers.current).forEach((timer) => window.clearTimeout(timer));
    }, []);

    const expire = useCallback(async () => {
        if (!attempt || timedOut) return;
        setTimedOut(true);
        try {
            await api(`/v1/quizzes/${attempt.quiz_id}/attempts/${attempt.id}/expire`, { method: "POST", body: {} });
        } catch { /* the timer already expired the UI */ }
    }, [attempt, timedOut]);

    const warnTabSwitch = useCallback(async () => {
        if (!attempt) return;
        try {
            const payload = await api<{ blocked?: boolean }>(`/v1/quizzes/${attempt.quiz_id}/attempts/${attempt.id}/tab-switch`, { method: "POST", body: {} });
            if (payload?.blocked) setTimedOut(true); else setTabWarning(true);
        } catch {
            setTabWarning(true);
        }
    }, [attempt]);

    const persistAnswer = useCallback(async (target: Attempt, questionId: string, optionIds: string[]) => {
        setSaveStatus("saving");
        try {
            await api(`/v1/quizzes/${target.quiz_id}/attempts/${target.id}/answers/${questionId}`, {
                method: "PUT",
                body: { option_ids: optionIds },
            });
            setSaveStatus("saved");
        } catch (reason) {
            // 422 means the attempt is closed or expired — stop accepting edits.
            if (reason instanceof ApiError && reason.isValidationError) {
                setTimedOut(true);
                return;
            }
            setSaveStatus("failed");
        }
    }, []);

    const selectAnswer = (questionId: string, optionId: string, multiple: boolean) => {
        if (!attempt || attempt.status !== "in_progress" || timedOut) return;
        const current = answers[questionId] ?? [];
        const next = multiple
            ? (current.includes(optionId)
                ? current.filter((id) => id !== optionId)
                : [...current, optionId])
            : [optionId];

        setAnswers((value) => ({ ...value, [questionId]: next }));

        window.clearTimeout(saveTimers.current[questionId]);
        saveTimers.current[questionId] = window.setTimeout(() => {
            void persistAnswer(attempt, questionId, next);
        }, AUTOSAVE_DELAY_MS);
    };

    const submit = async () => {
        if (!attempt) return;
        setBusy(true);
        setError(null);
        try {
            const submitted = await api<Attempt>(`/v1/quizzes/${attempt.quiz_id}/attempts/${attempt.id}/submit`, {
                method: "POST",
                body: { answers },
            });
            setAttempt(submitted);
            setAnswers(hydrateAnswers(submitted));
        } catch (reason) {
            setError(errorMessage(reason, t("assessments.checkpoint.submitFail")));
        } finally {
            setBusy(false);
        }
    };

    const nextLesson = async () => {
        if (!courseId) return;
        try {
            const curriculum = await coursesApi.curriculum(courseId);
            const lesson = curriculum.sections.flatMap((section) => section.lessons).find((item) => item.status === "published" && item.progress?.completed_at == null);
            navigate(lesson ? `/courses/${courseId}/lessons/${lesson.id}` : `/courses/${courseId}`);
        } catch { navigate(`/courses/${courseId}`); }
    };

    const retry = () => {
        setAnswers({});
        setError(null);
        setTimedOut(false);
        setConfirmOpen(false);
        setSaveStatus("idle");
        setRound((value) => value + 1);
    };

    const questions = attempt?.quiz.questions ?? [];
    const answeredCount = questions.filter((question) => (answers[question.id]?.length ?? 0) > 0).length;
    const unansweredRequired = questions.filter((question) => question.required && (answers[question.id]?.length ?? 0) === 0).length;
    const canSubmit = !busy && questions.length > 0 && unansweredRequired === 0;

    const onSubmitClick = () => {
        if (prefs.confirmSubmit) {
            setConfirmOpen(true);
            return;
        }
        void submit();
    };

    return (
        <main className="min-h-screen bg-[#F7F7F7] dark:bg-[#101013] px-5 py-7 sm:px-8">
            <div className="mx-auto max-w-3xl" data-testid="quiz-player">
                <button onClick={() => void nextLesson()} className="inline-flex items-center gap-2 text-sm font-semibold text-[#F47822]"><ArrowRight className="h-4 w-4" />{t("assessments.checkpoint.nextLesson")}</button>
                <section className="mt-5 overflow-hidden rounded-3xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] shadow-[0_12px_35px_rgba(58,58,58,0.08)]">
                    <header className="bg-[#3A3A3A] p-6 text-white sm:p-8">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("assessments.checkpoint.kicker")}</p>
                        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold">{attempt?.quiz.title ?? t("assessments.checkpoint.title")}</h1>
                                <p className="mt-2 text-sm text-white/60">{t("assessments.checkpoint.intro")}</p>
                            </div>
                            {attempt && attempt.status === "in_progress" && <AttemptTimer expiresAt={attempt.expires_at} onExpire={() => void expire()} onVisibilityWarning={() => void warnTabSwitch()} />}
                        </div>
                    </header>
                    <div className="p-6 sm:p-8">
                        {error ? (
                            <p className="rounded-xl bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">{error}</p>
                        ) : !attempt ? (
                            <p className="text-sm text-muted-foreground">{t("assessments.checkpoint.preparing")}</p>
                        ) : timedOut || attempt.status === "expired" ? (
                            <TimeoutNotice kind="quiz" to={`/courses/${courseId}`} />
                        ) : attempt.status === "submitted" ? (
                            <>
                                <div className="py-8 text-center" data-testid="quiz-result">
                                    <CheckCircle2 className={attempt.passed ? "mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400" : "mx-auto h-12 w-12 text-red-500"} />
                                    <h2 className="mt-4 text-xl font-bold">{attempt.passed ? t("assessments.checkpoint.passed") : t("assessments.checkpoint.notPassed")}</h2>
                                    <p className="mt-2 text-sm text-muted-foreground">{t("assessments.checkpoint.score", { score: attempt.percentage, required: attempt.quiz.pass_percentage })}</p>
                                    <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                                        {!attempt.passed && <button onClick={retry} className="rounded-xl border border-[#F47822]/30 px-5 py-3 text-sm font-semibold text-[#F47822] transition hover:bg-[#F47822]/5">{t("assessments.checkpoint.retry")}</button>}
                                        <button onClick={() => void nextLesson()} className="rounded-xl bg-[#F47822] px-5 py-3 text-sm font-semibold text-white">{attempt.passed ? t("assessments.checkpoint.nextLesson") : t("assessments.checkpoint.skipLesson")}</button>
                                        <Link to={`/courses/${courseId}`} className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted">{t("assessments.checkpoint.backToCourse")}</Link>
                                    </div>
                                </div>
                                <h3 className="mt-6 border-t border-border pt-6 text-sm font-bold uppercase tracking-[0.14em] text-[#F47822]">{t("assessments.checkpoint.review")}</h3>
                                <div className="mt-4 space-y-5">
                                    {questions.map((question, index) => (
                                        <ReviewQuestion
                                            key={question.id}
                                            question={question}
                                            index={index}
                                            chosen={answers[question.id] ?? []}
                                            answer={(attempt.answers ?? []).find((row) => row.question_id === question.id)}
                                            showExplanation={prefs.showExplanations}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-[#F7F7F7] dark:bg-[#101013] px-4 py-3 text-xs" data-testid="quiz-progress">
                                    <span className="flex items-center gap-2 font-medium text-[#3A3A3A]/65 dark:text-white/65">
                                        <ClipboardCheck className="h-4 w-4" />
                                        {t("assessments.answered", { done: answeredCount, total: questions.length })}
                                    </span>
                                    <span className="flex items-center gap-3">
                                        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                                            <span className="block h-full rounded-full bg-[#F47822] transition-all" style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }} />
                                        </span>
                                        <span className="font-semibold text-[#F47822]">{t("assessments.attempt", { n: attempt.attempt_number })}</span>
                                    </span>
                                </div>
                                <div className="space-y-6">
                                    {questions.map((question, index) => {
                                        const selected = answers[question.id] ?? [];
                                        const multiple = question.type === "multiple_choice";
                                        return (
                                            <div key={question.id} data-testid={`quiz-question-${index}`}>
                                                <p className="text-sm font-semibold text-foreground">
                                                    <span className="me-2 text-[#F47822]">{index + 1}.</span>
                                                    {question.question}
                                                    {!question.required && <span className="ms-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{t("assessments.checkpoint.optional")}</span>}
                                                </p>
                                                <div className="mt-3 grid gap-2">
                                                    {question.options.map((option) => (
                                                        <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${selected.includes(option.id) ? "border-[#F47822] bg-[#F47822]/5" : "border-border hover:border-[#F47822]/40"}`}>
                                                            <input
                                                                className="accent-[#F47822]"
                                                                type={multiple ? "checkbox" : "radio"}
                                                                name={question.id}
                                                                checked={selected.includes(option.id)}
                                                                onChange={() => selectAnswer(question.id, option.id, multiple)}
                                                            />
                                                            {option.option}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="mt-4 text-xs text-muted-foreground" data-testid="quiz-save-status" aria-live="polite">
                                    {saveStatus === "saving" ? t("assessments.checkpoint.saveSaving") : saveStatus === "saved" ? t("assessments.checkpoint.saveSaved") : saveStatus === "failed" ? t("assessments.checkpoint.saveFailed") : "\u00A0"}
                                </p>
                                <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Info className="h-4 w-4 text-[#F47822]" />
                                        {unansweredRequired > 0 ? t("assessments.checkpoint.mustAnswerRequired") : t("assessments.checkpoint.readyToSubmit")}
                                    </p>
                                    <button data-testid="quiz-submit" disabled={!canSubmit} onClick={onSubmitClick} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                                        <ClipboardCheck className="h-4 w-4" />
                                        {busy ? t("assessments.checkpoint.submitting") : t("assessments.checkpoint.submitBtn")}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </div>
            {tabWarning && <TabWarning onClose={() => setTabWarning(false)} />}
            {confirmOpen && attempt && (
                <SubmitConfirmDialog
                    done={answeredCount}
                    total={questions.length}
                    onCancel={() => setConfirmOpen(false)}
                    onConfirm={() => { setConfirmOpen(false); void submit(); }}
                />
            )}
        </main>
    );
}

function ReviewQuestion({ question, index, chosen, answer, showExplanation }: { question: Question; index: number; chosen: string[]; answer?: AnswerRow; showExplanation: boolean }) {
    const { t } = useTranslation();
    const correct = answer?.is_correct === true;

    return (
        <section className="rounded-2xl border border-border p-4" data-testid={`quiz-review-${index}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                    <span className="me-2 text-[#F47822]">{index + 1}.</span>
                    {question.question}
                </p>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${correct ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                    {correct ? t("assessments.checkpoint.correct") : t("assessments.checkpoint.incorrect")}
                </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("assessments.checkpoint.points", { earned: answer?.points_earned ?? 0, total: question.points })}</p>
            <div className="mt-3 grid gap-2">
                {question.options.map((option) => {
                    const isCorrect = option.is_correct === true;
                    const isChosen = chosen.includes(option.id);
                    return (
                        <div key={option.id} className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${isCorrect ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : isChosen ? "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400" : "border-border text-muted-foreground"}`}>
                            {isCorrect ? <Check className="h-4 w-4 shrink-0" /> : isChosen ? <XCircle className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0" />}
                            <span>{option.option}</span>
                            {isChosen && !isCorrect && <span className="ms-auto text-[10px] font-bold uppercase tracking-wide">{t("assessments.checkpoint.yourAnswer")}</span>}
                        </div>
                    );
                })}
            </div>
            {showExplanation && question.explanation ? (
                <div className="mt-3 flex gap-2 rounded-xl bg-[#F47822]/5 p-3 text-sm" data-testid={`quiz-explanation-${index}`}>
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#F47822]" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F47822]">{t("assessments.checkpoint.explanation")}</p>
                        <p className="mt-1 leading-6 text-foreground">{question.explanation}</p>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

function SubmitConfirmDialog({ done, total, onCancel, onConfirm }: { done: number; total: number; onCancel: () => void; onConfirm: () => void }) {
    const { t } = useTranslation();
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]/55 dark:bg-white/55 p-5" role="dialog" aria-modal="true" data-testid="quiz-confirm-submit">
            <div className="max-w-md rounded-3xl bg-white dark:bg-[#1b1b20] p-6 text-center shadow-2xl">
                <ClipboardCheck className="mx-auto h-10 w-10 text-[#F47822]" />
                <h2 className="mt-4 text-xl font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("assessments.checkpoint.confirmTitle")}</h2>
                <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">{t("assessments.checkpoint.confirmBody", { done, total })}</p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <button onClick={onCancel} className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted">{t("assessments.checkpoint.confirmNo")}</button>
                    <button data-testid="quiz-confirm-accept" onClick={onConfirm} className="rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white">{t("assessments.checkpoint.confirmYes")}</button>
                </div>
            </div>
        </div>
    );
}

export function TabWarning({ onClose }: { onClose: () => void }) { const { t } = useTranslation(); return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]/55 dark:bg-white/55 p-5"><div className="max-w-md rounded-3xl bg-white dark:bg-[#1b1b20] p-6 text-center shadow-2xl"><TriangleAlert className="mx-auto h-10 w-10 text-[#F47822]"/><h2 className="mt-4 text-xl font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("assessments.tabTitle")}</h2><p className="mt-2 text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">{t("assessments.tabDesc")}</p><button onClick={onClose} className="mt-6 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white">{t("assessments.tabOk")}</button></div></div>; }
export function TimeoutNotice({ kind, to }: { kind: "quiz" | "assessment"; to: string }) { const { t } = useTranslation(); return <div className="py-8 text-center"><TriangleAlert className="mx-auto h-14 w-14 text-red-500"/><h2 className="mt-5 text-2xl font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("assessments.timeoutTitle")}</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">{kind === "quiz" ? t("assessments.timeoutQuiz") : t("assessments.timeoutAssessment")}</p><Link to={to} className="mt-7 inline-flex rounded-xl bg-[#F47822] px-5 py-3 text-sm font-semibold text-white">{t("assessments.returnLearning")}</Link></div>; }
