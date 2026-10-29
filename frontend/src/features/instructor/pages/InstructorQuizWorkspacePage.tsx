import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ClipboardCheck,
    Clock3,
    LoaderCircle,
    Plus,
    Save,
    Settings2,
    Trash2,
} from "lucide-react";
import {
    FormEvent,
    useCallback,
    useEffect,
    useState,
} from "react";
import {
    Link,
    useBlocker,
    useParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import type {
    InstructorQuiz,
    InstructorQuizQuestion,
} from "../types/instructor";
import {
    createInstructorQuiz,
    createInstructorQuizOption,
    createInstructorQuizQuestion,
    deleteInstructorQuiz,
    deleteInstructorQuizOption,
    deleteInstructorQuizQuestion,
    getInstructorCurriculum,
    getInstructorQuizzes,
    runInstructorQuizAction,
    updateInstructorQuiz,
    updateInstructorQuizOption,
    updateInstructorQuizQuestion,
} from "../api/instructorApi";

function slugify(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function quizSnapshot(
    title: string,
    description: string,
    passPercentage: string,
    timeLimit: string,
    maxAttempts: string,
): string {
    return [title, description, passPercentage, timeLimit, maxAttempts].join("\u0000");
}

function questionSnapshot(
    text: string,
    type: string,
    points: string,
    explanation: string,
): string {
    return [text, type, points, explanation].join("\u0000");
}

export function InstructorQuizWorkspacePage() {
    const { t } = useTranslation();
    const { courseId } = useParams();
    const queryClient = useQueryClient();
    const [sectionId, setSectionId] = useState("");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [dirtyEditors, setDirtyEditors] = useState<Set<string>>(() => new Set());

    const reportDirty = useCallback((id: string, dirty: boolean) => {
        setDirtyEditors((current) => {
            const has = current.has(id);
            if (dirty === has) return current;
            const next = new Set(current);
            if (dirty) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    const hasUnsavedChanges = dirtyEditors.size > 0;
    const blocker = useBlocker(hasUnsavedChanges);

    useEffect(() => {
        if (!hasUnsavedChanges) return;
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const curriculum = useQuery({ queryKey: ["instructor", "curriculum", courseId], queryFn: () => getInstructorCurriculum(courseId!), enabled: Boolean(courseId) });
    const quizzes = useQuery({ queryKey: ["instructor", "quizzes", courseId], queryFn: () => getInstructorQuizzes(courseId!), enabled: Boolean(courseId) });

    const refresh = async () => {
        await queryClient.invalidateQueries({ queryKey: ["instructor", "quizzes", courseId] });
        await queryClient.invalidateQueries({ queryKey: ["instructor", "curriculum", courseId] });
    };

    const create = useMutation({
        mutationFn: () => createInstructorQuiz(courseId!, { section_id: sectionId, title, slug: slugify(title) }),
        onSuccess: async () => { setTitle(""); setMessage(t("instructor.quiz.created")); await refresh(); },
        onError: () => setMessage(t("instructor.quiz.needSection")),
    });

    if (curriculum.isLoading || quizzes.isLoading) return <WorkspaceSkeleton />;
    if (curriculum.isError || quizzes.isError || !curriculum.data || !quizzes.data) return <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-6 text-red-900">{t("instructor.quiz.loadError")}</div>;

    return <div className="mx-auto max-w-5xl space-y-6">
        {blocker.state === "blocked" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]/45 p-4 backdrop-blur-sm dark:bg-black/60" role="alertdialog" aria-modal="true" aria-labelledby="quiz-leave-title" data-testid="quiz-leave-dialog">
                <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1b1b20]">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                        <AlertCircle className="h-5 w-5" />
                    </span>
                    <h2 id="quiz-leave-title" className="mt-4 text-base font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("instructor.quiz.leaveTitle")}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">{t("instructor.quiz.leaveDesc")}</p>
                    <div className="mt-5 flex justify-end gap-2">
                        <button type="button" onClick={() => blocker.reset()} data-testid="quiz-leave-stay" className="rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#F47822]">{t("instructor.quiz.leaveStay")}</button>
                        <button type="button" onClick={() => blocker.proceed()} data-testid="quiz-leave-discard" className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10">{t("instructor.quiz.leaveDiscard")}</button>
                    </div>
                </div>
            </div>
        )}
        <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
                <Link to={`/instructor/courses/${courseId}/curriculum`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3A3A3A]/50 dark:text-white/50 hover:text-[#F47822]"><ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" /> {t("instructor.quiz.back")}</Link>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">{t("instructor.quiz.eyebrow")}</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">{t("instructor.quiz.title")}</h1>
                <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/50 dark:text-white/50">{t("instructor.quiz.description")}</p>
            </div>
            {hasUnsavedChanges && (
                <span data-testid="quiz-unsaved-indicator" className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500 motion-reduce:animate-none" />
                    {t("instructor.quiz.unsaved")}
                </span>
            )}
        </header>
        {message && <div className="rounded-xl border border-[#F47822]/20 bg-[#F47822]/8 px-4 py-3 text-sm text-[#9c4209] dark:text-amber-200">{message}</div>}

        <form onSubmit={(event) => { event.preventDefault(); if (sectionId && title.trim()) create.mutate(); }} className="grid gap-3 rounded-2xl border border-[#F47822]/20 bg-[#F47822]/5 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-end"><label><span className="text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("instructor.quiz.attach")}</span><select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-3 text-sm outline-none focus:border-[#F47822]"><option value="">{t("instructor.quiz.chooseSection")}</option>{curriculum.data.sections.map((section) => <option key={section.id} value={section.id}>{section.position}. {section.title}</option>)}</select></label><label><span className="text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("instructor.quiz.quizTitle")}</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("instructor.quiz.quizTitlePh")} className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-3 text-sm outline-none focus:border-[#F47822]" /></label><button disabled={create.isPending || !sectionId || !title.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white hover:bg-[#de6414] disabled:opacity-50">{create.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t("instructor.quiz.create")}</button></form>

        {quizzes.data.length === 0 ? <EmptyQuizzes /> : <div className="space-y-4">{quizzes.data.map((quiz) => <QuizEditor key={quiz.id} quiz={quiz} sectionName={curriculum.data.sections.find((section) => section.id === quiz.section_id)?.title ?? t("instructor.quiz.sectionFallback")} onChanged={refresh} onMessage={setMessage} onDirtyChange={reportDirty} />)}</div>}
    </div>;
}

function QuizEditor({ quiz, sectionName, onChanged, onMessage, onDirtyChange }: { quiz: InstructorQuiz; sectionName: string; onChanged: () => Promise<void>; onMessage: (message: string) => void; onDirtyChange: (id: string, dirty: boolean) => void }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(true);
    const [title, setTitle] = useState(quiz.title);
    const [description, setDescription] = useState(quiz.description ?? "");
    const [passPercentage, setPassPercentage] = useState(String(quiz.pass_percentage));
    const [timeLimit, setTimeLimit] = useState(quiz.time_limit === null ? "" : String(quiz.time_limit));
    const [maxAttempts, setMaxAttempts] = useState(quiz.max_attempts === null ? "" : String(quiz.max_attempts));
    const [newQuestion, setNewQuestion] = useState("");
    const [working, setWorking] = useState(false);
    const [questionDirty, setQuestionDirty] = useState<Set<string>>(() => new Set());
    const [savedSnapshot, setSavedSnapshot] = useState(() => quizSnapshot(quiz.title, quiz.description ?? "", String(quiz.pass_percentage), quiz.time_limit === null ? "" : String(quiz.time_limit), quiz.max_attempts === null ? "" : String(quiz.max_attempts)));

    const currentSnapshot = quizSnapshot(title, description, passPercentage, timeLimit, maxAttempts);
    const dirty = currentSnapshot !== savedSnapshot;
    const hasUnsavedQuestionEdits = questionDirty.size > 0;
    const hasUnsavedChanges = dirty || hasUnsavedQuestionEdits;
    const questionsReady = quiz.questions.length > 0 && quiz.questions.every((question) => question.options.length > 0 && question.options.some((option) => option.is_correct));
    const publishBlocked = quiz.status === "published"
        ? null
        : !title.trim()
            ? t("instructor.quiz.publishNeedTitle")
            : hasUnsavedChanges
                ? t("instructor.quiz.saveBeforePublish")
                : quiz.questions.length === 0
                    ? t("instructor.quiz.publishNeedQuestions")
                    : !questionsReady
                        ? t("instructor.quiz.publishNeedOptions")
                        : null;

    const reportQuestionDirty = useCallback((questionId: string, isDirty: boolean) => {
        setQuestionDirty((current) => {
            const has = current.has(questionId);
            if (isDirty === has) return current;
            const next = new Set(current);
            if (isDirty) next.add(questionId);
            else next.delete(questionId);
            return next;
        });
        onDirtyChange(`${quiz.id}:question:${questionId}`, isDirty);
    }, [onDirtyChange, quiz.id]);

    useEffect(() => {
        onDirtyChange(quiz.id, dirty);
    }, [dirty, quiz.id, onDirtyChange]);

    useEffect(() => () => onDirtyChange(quiz.id, false), [quiz.id, onDirtyChange]);

    const run = async (action: () => Promise<void>, success?: string) => { try { setWorking(true); await action(); if (success) onMessage(success); await onChanged(); } catch { onMessage(t("instructor.quiz.actionFail")); } finally { setWorking(false); } };

    const saveSettings = () => {
        const snapshot = currentSnapshot;
        return run(async () => {
            await updateInstructorQuiz(quiz.id, { title, slug: slugify(title), description: description || null, pass_percentage: Number(passPercentage), time_limit: timeLimit === "" ? null : Number(timeLimit), max_attempts: maxAttempts === "" ? null : Number(maxAttempts) });
            setSavedSnapshot(snapshot);
        }, t("instructor.quiz.saved"));
    };

    return <section data-testid={`quiz-editor-${quiz.id}`} className="overflow-hidden rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] shadow-[0_8px_30px_rgba(58,58,58,.04)]"><div className="flex items-center gap-3 px-5 py-4"><ClipboardCheck className="h-5 w-5 shrink-0 text-[#F47822]" /><button type="button" onClick={() => setOpen((value) => !value)} className="min-w-0 flex-1 text-left rtl:text-right"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#F47822]">{sectionName}</p><h2 className="mt-1 truncate font-semibold text-[#3A3A3A] dark:text-[#ececef]">{title || quiz.title}</h2></button>{hasUnsavedChanges && <span className="hidden shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 sm:inline-flex">{t("instructor.quiz.unsaved")}</span>}<span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${quiz.status === "published" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-white/65"}`}>{quiz.status === "published" ? t("instructor.dashboard.status.published") : t("instructor.dashboard.status.draft")}</span><button type="button" onClick={() => setOpen((value) => !value)} aria-label={sectionName} className="p-1 text-[#3A3A3A]/45 dark:text-white/45">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button></div>
        {open && <div className="border-t border-[#3A3A3A]/7 dark:border-white/7 p-5"><div className="grid gap-4 sm:grid-cols-2"><Text label={t("instructor.quiz.titleLabel")} value={title} onChange={setTitle} /><Text label={t("instructor.quiz.descLabel")} value={description} onChange={setDescription} /><Text label={t("instructor.quiz.passLabel")} value={passPercentage} type="number" onChange={setPassPercentage} /><Text label={t("instructor.quiz.timeLabel")} value={timeLimit} type="number" placeholder={t("instructor.quiz.noLimit")} onChange={setTimeLimit} /><Text label={t("instructor.quiz.attemptsLabel")} value={maxAttempts} type="number" placeholder={t("instructor.quiz.unlimited")} onChange={setMaxAttempts} /></div><div className="mt-4 flex flex-wrap gap-2">
                <button type="button" data-testid={`quiz-save-${quiz.id}`} disabled={working || !dirty || !title.trim()} onClick={() => void saveSettings()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#3A3A3A] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#F47822] disabled:cursor-not-allowed disabled:opacity-40"><Save className="h-3.5 w-3.5" /> {t("instructor.quiz.save")}</button>
                <button type="button" data-testid={`quiz-publish-${quiz.id}`} disabled={working || Boolean(publishBlocked)} title={publishBlocked ?? undefined} onClick={() => void run(() => runInstructorQuizAction(quiz.id, quiz.status === "published" ? "unpublish" : "publish"), quiz.status === "published" ? t("instructor.quiz.unpublished") : t("instructor.quiz.published"))} className="ms-auto inline-flex items-center gap-1.5 rounded-lg border border-[#F47822]/25 px-3 py-2 text-[11px] font-bold text-[#F47822] disabled:cursor-not-allowed disabled:opacity-40">{quiz.status === "published" ? <Settings2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}{quiz.status === "published" ? t("instructor.quiz.unpublish") : t("instructor.quiz.publish")}</button>
                <button type="button" aria-label={t("instructor.quiz.delete")} disabled={working} onClick={() => { if (window.confirm(t("instructor.quiz.deleteConfirm", { title: quiz.title }))) void run(() => deleteInstructorQuiz(quiz.id)); }} className="rounded-lg p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            {publishBlocked && <p data-testid={`quiz-publish-blocked-${quiz.id}`} className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">{publishBlocked}</p>}
            <div className="mt-6 border-t border-[#3A3A3A]/7 dark:border-white/7 pt-5"><div className="flex items-center justify-between gap-3"><h3 className="text-xs font-bold uppercase tracking-[.13em] text-[#3A3A3A]/50 dark:text-white/50">{t("instructor.quiz.questions", { count: quiz.questions.length })}</h3><span className="inline-flex items-center gap-1 text-[11px] text-[#3A3A3A]/45 dark:text-white/45"><Clock3 className="h-3.5 w-3.5" /> {quiz.time_limit ? t("instructor.quiz.minCount", { count: quiz.time_limit }) : t("instructor.quiz.noTimeLimit")}</span></div><div className="mt-3 space-y-3">{quiz.questions.map((question) => <QuestionEditor key={question.id} question={question} onChanged={onChanged} onMessage={onMessage} onDirtyChange={reportQuestionDirty} />)}</div><form onSubmit={(event) => { event.preventDefault(); if (newQuestion.trim()) void run(async () => { await createInstructorQuizQuestion(quiz.id, { question: newQuestion, type: "single_choice" }); setNewQuestion(""); }); }} className="mt-4 flex gap-2"><input value={newQuestion} onChange={(event) => setNewQuestion(event.target.value)} placeholder={t("instructor.quiz.addQuestionPh")} className="h-10 min-w-0 flex-1 rounded-lg border border-dashed border-[#3A3A3A]/18 dark:border-white/18 px-3 text-sm outline-none focus:border-[#F47822]" /><button disabled={working || !newQuestion.trim()} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-[#F47822]/10 px-3 text-xs font-bold text-[#F47822] hover:bg-[#F47822] hover:text-white"><Plus className="h-3.5 w-3.5" /> {t("instructor.quiz.add")}</button></form></div>
        </div>}
    </section>;
}

function QuestionEditor({ question, onChanged, onMessage, onDirtyChange }: { question: InstructorQuizQuestion; onChanged: () => Promise<void>; onMessage: (message: string) => void; onDirtyChange: (id: string, dirty: boolean) => void }) {
    const { t } = useTranslation();
    const [text, setText] = useState(question.question);
    const [type, setType] = useState(question.type);
    const [points, setPoints] = useState(String(question.points));
    const [explanation, setExplanation] = useState(question.explanation ?? "");
    const [option, setOption] = useState("");
    const [working, setWorking] = useState(false);
    const [savedSnapshot, setSavedSnapshot] = useState(() => questionSnapshot(question.question, question.type, String(question.points), question.explanation ?? ""));

    const currentSnapshot = questionSnapshot(text, type, points, explanation);
    const dirty = currentSnapshot !== savedSnapshot;

    useEffect(() => {
        onDirtyChange(question.id, dirty);
    }, [dirty, onDirtyChange, question.id]);

    useEffect(() => () => onDirtyChange(question.id, false), [onDirtyChange, question.id]);

    const run = async (action: () => Promise<void>) => { try { setWorking(true); await action(); await onChanged(); } catch { onMessage(t("instructor.quiz.questionFail")); } finally { setWorking(false); } };

    const saveQuestion = () => {
        const snapshot = currentSnapshot;
        return run(async () => {
            await updateInstructorQuizQuestion(question.id, { question: text, type, points: Number(points), explanation });
            setSavedSnapshot(snapshot);
        });
    };
    return <article className="rounded-xl border border-[#3A3A3A]/8 dark:border-white/8 bg-[#FCFCFC] dark:bg-[#1b1b20] p-3.5"><div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px_75px]"><input value={text} onChange={(event) => setText(event.target.value)} aria-label={t("instructor.quiz.addQuestionPh")} className="h-10 rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-3 text-sm outline-none focus:border-[#F47822]" /><select value={type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-3 text-sm outline-none focus:border-[#F47822]"><option value="single_choice">{t("instructor.quiz.types.single")}</option><option value="multiple_choice">{t("instructor.quiz.types.multiple")}</option><option value="true_false">{t("instructor.quiz.types.trueFalse")}</option></select><input value={points} type="number" min="1" onChange={(event) => setPoints(event.target.value)} aria-label={t("instructor.quiz.attemptsLabel")} className="h-10 rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-3 text-sm outline-none focus:border-[#F47822]" /></div><label className="mt-2 block"><span className="text-[11px] font-semibold text-[#3A3A3A]/65 dark:text-white/65">{t("instructor.quiz.explanationLabel")}</span><textarea value={explanation} onChange={(event) => setExplanation(event.target.value)} rows={2} aria-label={t("instructor.quiz.explanationLabel")} className="mt-1.5 w-full rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-3 py-2 text-sm outline-none focus:border-[#F47822]" /></label><div className="mt-2 flex gap-2"><button type="button" data-testid={`quiz-question-save-${question.id}`} disabled={working || !dirty || !text.trim()} onClick={() => void saveQuestion()} className="rounded-lg px-2 py-1.5 text-[11px] font-bold text-[#F47822] hover:bg-[#F47822]/10 disabled:cursor-not-allowed disabled:opacity-40">{t("instructor.quiz.saveQuestion")}</button><button type="button" disabled={working} onClick={() => { if (window.confirm(t("instructor.quiz.deleteQuestion"))) void run(() => deleteInstructorQuizQuestion(question.id)); }} className="rounded-lg px-2 py-1.5 text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-500/10">{t("instructor.quiz.delete")}</button></div><div className="mt-3 space-y-1.5">{question.options.map((choice) => <label key={choice.id} className="flex items-center gap-2 rounded-lg border border-[#3A3A3A]/7 dark:border-white/7 bg-white dark:bg-[#1b1b20] px-2.5 py-2"><input type="checkbox" checked={choice.is_correct} onChange={(event) => void run(() => updateInstructorQuizOption(choice.id, { is_correct: event.target.checked }))} className="h-3.5 w-3.5 shrink-0 accent-[#F47822]" /><span className="min-w-0 flex-1 truncate text-xs text-[#3A3A3A] dark:text-[#ececef]">{choice.option}</span><button type="button" aria-label={t("instructor.quiz.delete")} onClick={() => void run(() => deleteInstructorQuizOption(choice.id))} className="shrink-0 text-[#3A3A3A]/35 dark:text-white/35 hover:text-red-600 dark:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button></label>)}</div><form onSubmit={(event) => { event.preventDefault(); if (option.trim()) void run(async () => { await createInstructorQuizOption(question.id, { option }); setOption(""); }); }} className="mt-2 flex gap-2"><input value={option} onChange={(event) => setOption(event.target.value)} placeholder={t("instructor.quiz.addOptionPh")} className="h-9 min-w-0 flex-1 rounded-lg border border-dashed border-[#3A3A3A]/18 dark:border-white/18 bg-white dark:bg-[#1b1b20] px-2.5 text-xs outline-none focus:border-[#F47822]" /><button disabled={working || !option.trim()} className="h-9 shrink-0 rounded-lg px-2.5 text-xs font-bold text-[#F47822] hover:bg-[#F47822]/10">{t("instructor.quiz.addOption")}</button></form></article>;
}

function Text({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) { return <label><span className="text-[11px] font-semibold text-[#3A3A3A]/65 dark:text-white/65">{label}</span><input value={value} type={type} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 px-3 text-sm outline-none focus:border-[#F47822]" /></label>; }
function EmptyQuizzes() {
    const { t } = useTranslation();
    return <div className="rounded-2xl border border-dashed border-[#3A3A3A]/15 dark:border-white/15 bg-white dark:bg-[#1b1b20] px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]"><ClipboardCheck className="h-5 w-5" /></div><h2 className="mt-4 text-lg font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("instructor.quiz.emptyTitle")}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#3A3A3A]/50 dark:text-white/50">{t("instructor.quiz.emptyDesc")}</p></div>;
}
function WorkspaceSkeleton() { return <div className="mx-auto max-w-5xl space-y-5"><div className="h-28 animate-pulse rounded-2xl bg-black/5" />{Array.from({ length: 2 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-2xl bg-black/5" />)}</div>; }
