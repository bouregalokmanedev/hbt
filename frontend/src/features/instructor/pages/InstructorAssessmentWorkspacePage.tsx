import {
    AlertTriangle,
    ArrowLeft,
    Award,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ClipboardCheck,
    Flag,
    LoaderCircle,
    Plus,
    Save,
    Trash2,
} from "lucide-react";
import {
    FormEvent,
    useState,
} from "react";
import {
    Link,
    useParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import type {
    AssessmentMode,
    AvailableAssessmentQuestion,
    AvailableCompetency,
    FlaggedAttempt,
    InstructorAssessment,
    InstructorCurriculum,
    PendingReview,
} from "../types/instructor";
import {
    createInstructorAssessment,
    deleteInstructorAssessment,
    getAvailableAssessmentQuestions,
    getAvailableCompetencies,
    getFlaggedAssessmentAttempts,
    getInstructorAssessments,
    getInstructorCurriculum,
    getPendingAssessmentReviews,
    regradeAssessmentAttempt,
    runInstructorAssessmentAction,
    syncInstructorAssessmentCompetencies,
    syncInstructorAssessmentQuestions,
    updateInstructorAssessment,
} from "../api/instructorApi";

const MODES: AssessmentMode[] = [
    "diagnostic",
    "formative",
    "practice",
    "summative",
    "final",
];

export function InstructorAssessmentWorkspacePage() {
    const { t } = useTranslation();
    const { courseId } = useParams();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState("");
    const [mode, setMode] = useState<AssessmentMode>("summative");
    const [scopeSectionId, setScopeSectionId] = useState("");
    const [scopeLessonId, setScopeLessonId] = useState("");
    const [message, setMessage] = useState<string | null>(null);

    const curriculum = useQuery({ queryKey: ["instructor", "curriculum", courseId], queryFn: () => getInstructorCurriculum(courseId!), enabled: Boolean(courseId) });
    const assessments = useQuery({ queryKey: ["instructor", "assessments", courseId], queryFn: () => getInstructorAssessments(courseId!), enabled: Boolean(courseId) });

    const refresh = async () => {
        await queryClient.invalidateQueries({ queryKey: ["instructor", "assessments", courseId] });
    };

    const create = useMutation({
        mutationFn: () => createInstructorAssessment(courseId!, {
            title,
            assessment_mode: mode,
            section_id: scopeSectionId || null,
            lesson_id: scopeLessonId || null,
        }),
        onSuccess: async () => { setTitle(""); setScopeSectionId(""); setScopeLessonId(""); setMessage(t("instructor.assessments.created")); await refresh(); },
        onError: () => setMessage(t("instructor.assessments.needTitle")),
    });

    if (curriculum.isLoading || assessments.isLoading) return <WorkspaceSkeleton />;
    if (curriculum.isError || assessments.isError || !curriculum.data || !assessments.data) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">{t("instructor.assessments.loadError")}</div>;

    const sections = curriculum.data.sections;
    const scopeLessons = sections.find((section) => section.id === scopeSectionId)?.lessons ?? [];

    return <div className="mx-auto max-w-5xl space-y-6">
        <header><Link to={`/instructor/courses/${courseId}/curriculum`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3A3A3A]/50 hover:text-[#F47822]"><ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" /> {t("instructor.assessments.back")}</Link><p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">{t("instructor.assessments.eyebrow")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#3A3A3A]">{t("instructor.assessments.title")}</h1><p className="mt-2 text-sm leading-6 text-[#3A3A3A]/50">{t("instructor.assessments.description")}</p></header>
        {message && <div className="rounded-xl border border-[#F47822]/20 bg-[#F47822]/8 px-4 py-3 text-sm text-[#9c4209]">{message}</div>}

        <form onSubmit={(event: FormEvent) => { event.preventDefault(); if (title.trim()) create.mutate(); }} className="grid gap-3 rounded-2xl border border-[#F47822]/20 bg-[#F47822]/5 p-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <label><span className="text-xs font-bold text-[#3A3A3A]">{t("instructor.assessments.formTitle")}</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("instructor.assessments.formTitlePh")} className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm outline-none focus:border-[#F47822]" /></label>
            <label><span className="text-xs font-bold text-[#3A3A3A]">{t("instructor.assessments.mode")}</span><select value={mode} onChange={(event) => setMode(event.target.value as AssessmentMode)} className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm outline-none focus:border-[#F47822]">{MODES.map((option) => <option key={option} value={option} title={t(`instructor.assessments.modeHints.${option}`)}>{t(`instructor.assessments.modes.${option}`)}</option>)}</select></label>
            <label><span className="text-xs font-bold text-[#3A3A3A]">{t("instructor.assessments.sectionScope")}</span><select value={scopeSectionId} onChange={(event) => { setScopeSectionId(event.target.value); setScopeLessonId(""); }} className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm outline-none focus:border-[#F47822]"><option value="">{t("instructor.assessments.courseWide")}</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.position}. {section.title}</option>)}</select></label>
            <label><span className="text-xs font-bold text-[#3A3A3A]">{t("instructor.assessments.lessonScope")}</span><select value={scopeLessonId} onChange={(event) => setScopeLessonId(event.target.value)} disabled={!scopeSectionId} className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm outline-none focus:border-[#F47822] disabled:opacity-50"><option value="">{t("instructor.assessments.noneSection")}</option>{scopeLessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></label>
            <button disabled={create.isPending || !title.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white hover:bg-[#de6414] disabled:opacity-50">{create.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t("instructor.assessments.create")}</button>
        </form>

        {assessments.data.length === 0
            ? <EmptyAssessments />
            : <div className="space-y-4">{assessments.data.map((assessment) => <AssessmentEditor key={assessment.id} courseId={courseId!} assessment={assessment} curriculum={curriculum.data} onChanged={refresh} onMessage={setMessage} />)}</div>}

        <ReviewQueue courseId={courseId!} onChanged={refresh} onMessage={setMessage} />
        <FlaggedAttempts courseId={courseId!} />
    </div>;
}

function AssessmentEditor({ courseId, assessment, curriculum, onChanged, onMessage }: { courseId: string; assessment: InstructorAssessment; curriculum: InstructorCurriculum; onChanged: () => Promise<void>; onMessage: (message: string) => void }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState(assessment.title);
    const [description, setDescription] = useState(assessment.description ?? "");
    const [minimumScore, setMinimumScore] = useState(String(assessment.minimum_score));
    const [maxAttempts, setMaxAttempts] = useState(assessment.max_attempts === null ? "" : String(assessment.max_attempts));
    const [mode, setMode] = useState(assessment.assessment_mode);
    const [isRequired, setIsRequired] = useState(assessment.is_required);
    const [working, setWorking] = useState(false);

    const run = async (action: () => Promise<void>, success?: string) => { try { setWorking(true); await action(); if (success) onMessage(success); await onChanged(); } catch (error) { onMessage(error instanceof Error ? error.message : t("instructor.assessments.actionFail")); } finally { setWorking(false); } };

    const scopeLabel = assessment.scope === "lesson" ? t("instructor.assessments.scopeLesson", { title: assessment.lesson?.title ?? "" }) : assessment.scope === "section" ? t("instructor.assessments.scopeSection", { title: assessment.section?.title ?? "" }) : t("instructor.assessments.scopeCourse");

    return <section className="overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_8px_30px_rgba(58,58,58,.04)]">
        <div className="flex items-center gap-3 px-5 py-4">
            <ClipboardCheck className="h-5 w-5 shrink-0 text-[#F47822]" />
            <button type="button" onClick={() => setOpen((value) => !value)} className="min-w-0 flex-1 text-left rtl:text-right">
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#F47822]">{t(`instructor.assessments.modes.${assessment.assessment_mode as AssessmentMode}`)} · {scopeLabel}</p>
                <h2 className="mt-1 truncate font-semibold text-[#3A3A3A]">{assessment.title}</h2>
            </button>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${assessment.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{assessment.status === "published" ? t("instructor.dashboard.status.published") : t("instructor.dashboard.status.draft")}</span>
            <button type="button" onClick={() => setOpen((value) => !value)} className="p-1 text-[#3A3A3A]/45">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
        </div>
        {open && <div className="space-y-6 border-t border-[#3A3A3A]/7 p-5">
            <div>
                <h3 className="text-xs font-bold uppercase tracking-[.13em] text-[#3A3A3A]/50">{t("instructor.assessments.settings")}</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <Text label={t("instructor.assessments.titleLabel")} value={title} onChange={setTitle} />
                    <Text label={t("instructor.assessments.descLabel")} value={description} onChange={setDescription} />
                    <Text label={t("instructor.assessments.minScore")} value={minimumScore} type="number" onChange={setMinimumScore} />
                    <Text label={t("instructor.assessments.attempts")} value={maxAttempts} type="number" placeholder={t("instructor.assessments.attemptsPh")} onChange={setMaxAttempts} />
                    <label><span className="text-[11px] font-semibold text-[#3A3A3A]/65">{t("instructor.assessments.mode")}</span><select value={mode} onChange={(event) => setMode(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#3A3A3A]/10 px-3 text-sm outline-none focus:border-[#F47822]">{MODES.map((option) => <option key={option} value={option}>{t(`instructor.assessments.modes.${option}`)}</option>)}</select></label>
                    <label className="flex items-center gap-2 pt-6 text-xs font-semibold text-[#3A3A3A]/70"><input type="checkbox" checked={isRequired} onChange={(event) => setIsRequired(event.target.checked)} className="h-4 w-4 accent-[#F47822]" /> {t("instructor.assessments.required")}</label>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" disabled={working} onClick={() => void run(() => updateInstructorAssessment(courseId, assessment.id, { title, description: description || null, minimum_score: Number(minimumScore), max_attempts: maxAttempts === "" ? null : Number(maxAttempts), assessment_mode: mode, is_required: isRequired }).then(() => undefined), t("instructor.assessments.savedSettings"))} className="inline-flex items-center gap-1.5 rounded-lg bg-[#3A3A3A] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#F47822]"><Save className="h-3.5 w-3.5" /> {t("instructor.assessments.saveSettings")}</button>
                    <button type="button" disabled={working} onClick={() => void run(() => runInstructorAssessmentAction(courseId, assessment.id, assessment.status === "published" ? "unpublish" : "publish").then(() => undefined), assessment.status === "published" ? t("instructor.assessments.unpublishedMsg") : t("instructor.assessments.publishedMsg"))} className="ms-auto inline-flex items-center gap-1.5 rounded-lg border border-[#F47822]/25 px-3 py-2 text-[11px] font-bold text-[#F47822]"><CheckCircle2 className="h-3.5 w-3.5" />{assessment.status === "published" ? t("instructor.assessments.unpublish") : t("instructor.assessments.publish")}</button>
                    <button type="button" disabled={working} onClick={() => { if (window.confirm(t("instructor.assessments.deleteConfirm", { title: assessment.title }))) void run(() => deleteInstructorAssessment(courseId, assessment.id)); }} aria-label={t("instructor.assessments.delete")} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
            </div>
            <QuestionManager courseId={courseId} assessment={assessment} onChanged={onChanged} onMessage={onMessage} />
            <CompetencyManager courseId={courseId} assessment={assessment} onChanged={onChanged} onMessage={onMessage} />
        </div>}
    </section>;
}

function QuestionManager({ courseId, assessment, onChanged, onMessage }: { courseId: string; assessment: InstructorAssessment; onChanged: () => Promise<void>; onMessage: (message: string) => void }) {
    const { t } = useTranslation();
    const [bank, setBank] = useState<AvailableAssessmentQuestion[] | null>(null);
    const [competencies, setCompetencies] = useState<AvailableCompetency[] | null>(null);
    const [rows, setRows] = useState(() => (assessment.questions ?? []).map((question, index) => ({ quiz_question_id: question.question_id, position: index + 1, points: question.points, competency_id: question.competency_id ?? "" })));
    const [pick, setPick] = useState("");
    const [working, setWorking] = useState(false);

    const load = async () => {
        try {
            const [questions, comps] = await Promise.all([getAvailableAssessmentQuestions(courseId), getAvailableCompetencies(courseId)]);
            setBank(questions);
            setCompetencies(comps);
        } catch { onMessage(t("instructor.assessments.bankFail")); }
    };

    const attachedIds = new Set(rows.map((row) => row.quiz_question_id));
    const options = (bank ?? []).filter((question) => !attachedIds.has(question.id));

    const save = async () => {
        try {
            setWorking(true);
            await syncInstructorAssessmentQuestions(courseId, assessment.id, rows.map((row, index) => ({
                quiz_question_id: row.quiz_question_id,
                position: index + 1,
                points: Number(row.points) || 1,
                competency_id: row.competency_id || null,
            })));
            onMessage(t("instructor.assessments.questionsSaved"));
            await onChanged();
        } catch { onMessage(t("instructor.assessments.questionsFail")); } finally { setWorking(false); }
    };

    return <div className="border-t border-[#3A3A3A]/7 pt-5">
        <div className="flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-[.13em] text-[#3A3A3A]/50">{t("instructor.assessments.questions", { count: rows.length })}</h3><button type="button" onClick={() => void load()} className="text-[11px] font-bold text-[#F47822] hover:underline">{bank ? t("instructor.assessments.reloadBank") : t("instructor.assessments.loadBank")}</button></div>
        <div className="mt-3 space-y-2">{rows.map((row, index) => {
            const meta = (bank ?? []).find((question) => question.id === row.quiz_question_id);
            return <div key={row.quiz_question_id} className="grid gap-2 rounded-xl border border-[#3A3A3A]/8 bg-[#FCFCFC] p-3 sm:grid-cols-[minmax(0,1fr)_80px_minmax(0,1fr)_auto]">
                <p className="truncate text-xs font-semibold text-[#3A3A3A]" title={meta?.question ?? row.quiz_question_id}>{index + 1}. {meta?.question ?? row.quiz_question_id}</p>
                <label className="text-[10px] text-[#3A3A3A]/55">{t("instructor.assessments.points")}<input value={row.points} type="number" min="1" onChange={(event) => setRows((current) => current.map((item, position) => position === index ? { ...item, points: Number(event.target.value) } : item))} className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2 text-xs outline-none focus:border-[#F47822]" /></label>
                <label className="text-[10px] text-[#3A3A3A]/55">{t("instructor.assessments.competency")}<select value={row.competency_id} onChange={(event) => setRows((current) => current.map((item, position) => position === index ? { ...item, competency_id: event.target.value } : item))} className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-2 text-xs outline-none focus:border-[#F47822]"><option value="">{t("instructor.assessments.noneOpt")}</option>{(competencies ?? []).map((competency) => <option key={competency.id} value={competency.id}>{competency.code} · {competency.name}</option>)}</select></label>
                <button type="button" onClick={() => setRows((current) => current.filter((_, position) => position !== index))} aria-label={t("instructor.assessments.delete")} className="self-end rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>;
        })}</div>
        {bank && <div className="mt-3 flex gap-2"><select value={pick} onChange={(event) => setPick(event.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-dashed border-[#3A3A3A]/18 bg-white px-3 text-sm outline-none focus:border-[#F47822]"><option value="">{t("instructor.assessments.addFromBank")}</option>{options.map((question) => <option key={question.id} value={question.id}>{question.question.slice(0, 80)}</option>)}</select><button type="button" disabled={!pick} onClick={() => { const found = (bank ?? []).find((question) => question.id === pick); if (found) setRows((current) => [...current, { quiz_question_id: found.id, position: current.length + 1, points: found.points || 10, competency_id: "" }]); setPick(""); }} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#F47822]/10 px-3 text-xs font-bold text-[#F47822] hover:bg-[#F47822] hover:text-white"><Plus className="h-3.5 w-3.5" /> {t("instructor.assessments.add")}</button></div>}
        <button type="button" disabled={working} onClick={() => void save()} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#3A3A3A] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#F47822]"><Save className="h-3.5 w-3.5" /> {t("instructor.assessments.saveQuestions")}</button>
    </div>;
}

function CompetencyManager({ courseId, assessment, onChanged, onMessage }: { courseId: string; assessment: InstructorAssessment; onChanged: () => Promise<void>; onMessage: (message: string) => void }) {
    const { t } = useTranslation();
    const [bank, setBank] = useState<AvailableCompetency[] | null>(null);
    const [rows, setRows] = useState(() => (assessment.competencies ?? []).map((competency) => ({ competency_id: competency.id, code: competency.code, name: competency.name, weight: competency.pivot.weight })));
    const [pick, setPick] = useState("");
    const [working, setWorking] = useState(false);

    const load = async () => {
        try { setBank(await getAvailableCompetencies(courseId)); } catch { onMessage(t("instructor.assessments.compFail")); }
    };

    const save = async () => {
        try {
            setWorking(true);
            await syncInstructorAssessmentCompetencies(courseId, assessment.id, rows.map((row, index) => ({ competency_id: row.competency_id, position: index + 1, weight: Number(row.weight) || 1 })));
            onMessage(t("instructor.assessments.compSaved"));
            await onChanged();
        } catch { onMessage(t("instructor.assessments.compSaveFail")); } finally { setWorking(false); }
    };

    const attached = new Set(rows.map((row) => row.competency_id));

    return <div className="border-t border-[#3A3A3A]/7 pt-5">
        <div className="flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-[.13em] text-[#3A3A3A]/50">{t("instructor.assessments.competencies", { count: rows.length })}</h3><button type="button" onClick={() => void load()} className="text-[11px] font-bold text-[#F47822] hover:underline">{bank ? t("instructor.assessments.reloadComp") : t("instructor.assessments.loadComp")}</button></div>
        <div className="mt-3 space-y-2">{rows.map((row, index) => <div key={row.competency_id} className="flex items-center gap-2 rounded-xl border border-[#3A3A3A]/8 bg-[#FCFCFC] px-3 py-2"><Award className="h-4 w-4 shrink-0 text-[#F47822]" /><p className="min-w-0 flex-1 truncate text-xs font-semibold text-[#3A3A3A]">{row.code} · {row.name}</p><label className="text-[10px] text-[#3A3A3A]/55">{t("instructor.assessments.weight")}<input value={row.weight} type="number" min="0.1" step="0.1" onChange={(event) => setRows((current) => current.map((item, position) => position === index ? { ...item, weight: Number(event.target.value) } : item))} className="ml-1.5 h-8 w-20 rounded-lg border border-[#3A3A3A]/10 bg-white px-2 text-xs outline-none focus:border-[#F47822]" /></label><button type="button" onClick={() => setRows((current) => current.filter((_, position) => position !== index))} aria-label={t("instructor.assessments.delete")} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>
        {bank && <div className="mt-3 flex gap-2"><select value={pick} onChange={(event) => setPick(event.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-dashed border-[#3A3A3A]/18 bg-white px-3 text-sm outline-none focus:border-[#F47822]"><option value="">{t("instructor.assessments.attachComp")}</option>{bank.filter((competency) => !attached.has(competency.id)).map((competency) => <option key={competency.id} value={competency.id}>{competency.code} · {competency.name}</option>)}</select><button type="button" disabled={!pick} onClick={() => { const found = (bank ?? []).find((competency) => competency.id === pick); if (found) setRows((current) => [...current, { competency_id: found.id, code: found.code, name: found.name, weight: 1 }]); setPick(""); }} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#F47822]/10 px-3 text-xs font-bold text-[#F47822] hover:bg-[#F47822] hover:text-white"><Plus className="h-3.5 w-3.5" /> {t("instructor.assessments.add")}</button></div>}
        <button type="button" disabled={working} onClick={() => void save()} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#3A3A3A] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#F47822]"><Save className="h-3.5 w-3.5" /> {t("instructor.assessments.saveComp")}</button>
    </div>;
}

function ReviewQueue({ courseId, onChanged, onMessage }: { courseId: string; onChanged: () => Promise<void>; onMessage: (message: string) => void }) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const reviews = useQuery({ queryKey: ["instructor", "reviews", courseId], queryFn: () => getPendingAssessmentReviews(courseId) });
    const [grades, setGrades] = useState<Record<string, { points: string; feedback: string }>>({});
    const [working, setWorking] = useState(false);

    if (reviews.isLoading) return <div className="h-24 animate-pulse rounded-2xl bg-black/5" />;
    if (reviews.isError) return null;
    const items: PendingReview[] = reviews.data ?? [];
    if (items.length === 0) return null;

    const submit = async (attemptId: string, questionId: string) => {
        const entry = grades[`${attemptId}:${questionId}`];
        if (!entry) return;
        try {
            setWorking(true);
            await regradeAssessmentAttempt(courseId, attemptId, { [questionId]: { points_earned: Number(entry.points), feedback: entry.feedback || null } });
            onMessage(t("instructor.assessments.graded"));
            await queryClient.invalidateQueries({ queryKey: ["instructor", "reviews", courseId] });
            await onChanged();
        } catch { onMessage(t("instructor.assessments.gradeFail")); } finally { setWorking(false); }
    };

    return <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[#3A3A3A]"><Flag className="h-4 w-4 text-[#F47822]" /> {t("instructor.assessments.reviewTitle", { count: items.length })}</h2>
        <p className="mt-1 text-xs text-[#3A3A3A]/55">{t("instructor.assessments.reviewDesc")}</p>
        <div className="mt-4 space-y-3">{items.map((item) => {
            const key = `${item.attempt_id}:${item.question_id}`;
            const entry = grades[key] ?? { points: "", feedback: "" };
            return <article key={item.answer_id} className="rounded-xl border border-[#3A3A3A]/8 bg-white p-4">
                <p className="text-xs font-bold text-[#3A3A3A]">{item.question ?? t("instructor.assessments.questionFallback")}</p>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs leading-5 text-[#3A3A3A]/80">{typeof item.answer === "string" ? item.answer : JSON.stringify(item.answer, null, 2)}</pre>
                <div className="mt-3 grid gap-2 sm:grid-cols-[110px_minmax(0,1fr)_auto]">
                    <label className="text-[10px] text-[#3A3A3A]/55">{t("instructor.assessments.pointsLabel")}<input value={entry.points} type="number" min="0" onChange={(event) => setGrades((current) => ({ ...current, [key]: { ...entry, points: event.target.value } }))} className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 px-2 text-xs outline-none focus:border-[#F47822]" /></label>
                    <label className="text-[10px] text-[#3A3A3A]/55">{t("instructor.assessments.feedbackLabel")}<input value={entry.feedback} onChange={(event) => setGrades((current) => ({ ...current, [key]: { ...entry, feedback: event.target.value } }))} placeholder={t("instructor.assessments.feedbackPh")} className="mt-1 h-9 w-full rounded-lg border border-[#3A3A3A]/10 px-2 text-xs outline-none focus:border-[#F47822]" /></label>
                    <button type="button" disabled={working || entry.points === ""} onClick={() => void submit(item.attempt_id, item.question_id)} className="self-end inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#3A3A3A] px-3 text-[11px] font-bold text-white hover:bg-[#F47822]"><Save className="h-3.5 w-3.5" /> {t("instructor.assessments.grade")}</button>
                </div>
            </article>;
        })}</div>
    </section>;
}

function FlaggedAttempts({ courseId }: { courseId: string }) {
    const { t } = useTranslation();
    const flagged = useQuery({ queryKey: ["instructor", "flagged", courseId], queryFn: () => getFlaggedAssessmentAttempts(courseId) });

    if (flagged.isLoading) return <div className="h-24 animate-pulse rounded-2xl bg-black/5" />;
    if (flagged.isError) return null;
    const items: FlaggedAttempt[] = flagged.data ?? [];
    if (items.length === 0) return null;

    return <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[#3A3A3A]"><AlertTriangle className="h-4 w-4 text-red-600" /> {t("instructor.assessments.flaggedTitle", { count: items.length })}</h2>
        <p className="mt-1 text-xs text-[#3A3A3A]/55">{t("instructor.assessments.flaggedDesc")}</p>
        <div className="mt-4 space-y-2">{items.map((item) => <article key={item.attempt_id} className="rounded-xl border border-[#3A3A3A]/8 bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-xs font-bold text-[#3A3A3A]">{item.student?.name ?? t("instructor.assessments.studentFallback")} · {item.assessment?.title ?? t("instructor.assessments.assessmentFallback")}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.risk_level === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{t("instructor.assessments.risk", { score: item.risk_score, level: item.risk_level })}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{item.status}</span>
            </div>
            {item.issues.length > 0 && <ul className="mt-2 list-disc space-y-0.5 ps-5 text-[11px] text-[#3A3A3A]/60">{item.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>}
        </article>)}</div>
    </section>;
}

function Text({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) { return <label><span className="text-[11px] font-semibold text-[#3A3A3A]/65">{label}</span><input value={value} type={type} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#3A3A3A]/10 px-3 text-sm outline-none focus:border-[#F47822]" /></label>; }
function EmptyAssessments() {
    const { t } = useTranslation();
    return <div className="rounded-2xl border border-dashed border-[#3A3A3A]/15 bg-white px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]"><ClipboardCheck className="h-5 w-5" /></div><h2 className="mt-4 text-lg font-semibold text-[#3A3A3A]">{t("instructor.assessments.emptyTitle")}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#3A3A3A]/50">{t("instructor.assessments.emptyDesc")}</p></div>;
}
function WorkspaceSkeleton() { return <div className="mx-auto max-w-5xl space-y-5"><div className="h-28 animate-pulse rounded-2xl bg-black/5" />{Array.from({ length: 2 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-2xl bg-black/5" />)}</div>; }
