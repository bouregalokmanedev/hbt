import {
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Eye,
    FileText,
    LoaderCircle,
    Plus,
    Save,
    Send,
    Trash2,
    Upload,
    Video,
    Image as ImageIcon,
    Paperclip,
    AlertCircle,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useRef,
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
    InstructorLesson,
    InstructorSection,
} from "../types/instructor";
import {
    createInstructorLesson,
    createInstructorSection,
    deleteInstructorLesson,
    deleteInstructorSection,
    getInstructorCurriculum,
    runInstructorLessonAction,
    runInstructorSectionAction,
    updateInstructorLesson,
    updateInstructorSection,
    uploadInstructorLessonMedia,
    deleteInstructorLessonMedia,
} from "../api/instructorApi";
import { LessonContentEditor } from "../components/LessonContentEditor";

function slugify(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

type Notice = { tone: "success" | "error"; text: string };

function lessonSnapshot(
    title: string,
    content: string,
    duration: string,
    description: string,
    isPreview: boolean,
): string {
    return `${title}\u0000${content}\u0000${duration}\u0000${description}\u0000${isPreview ? "1" : "0"}`;
}

function sectionSnapshot(title: string, description: string): string {
    return `${title}\u0000${description}`;
}

function errorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim()) return error.message;
    return fallback;
}

export function InstructorCurriculumPage() {
    const { t } = useTranslation();
    const { courseId } = useParams();
    const queryClient = useQueryClient();
    const [newSectionTitle, setNewSectionTitle] = useState("");
    const [error, setError] = useState<string | null>(null);
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

    const curriculumQuery = useQuery({
        queryKey: ["instructor", "curriculum", courseId],
        queryFn: () => getInstructorCurriculum(courseId!),
        enabled: Boolean(courseId),
    });

    const invalidate = useCallback(async () => {
        await queryClient.invalidateQueries({
            queryKey: ["instructor", "curriculum", courseId],
        });
        await queryClient.invalidateQueries({ queryKey: ["instructor", "course", courseId] });
    }, [courseId, queryClient]);

    const sectionMutation = useMutation({
        mutationFn: () => createInstructorSection(courseId!, {
            title: newSectionTitle,
            slug: slugify(newSectionTitle),
        }),
        onSuccess: async () => {
            setNewSectionTitle("");
            setError(null);
            await invalidate();
        },
        onError: (mutationError) =>
            setError(errorMessage(mutationError, t("instructor.curriculum.addFail"))),
    });

    if (curriculumQuery.isLoading) {
        return <CurriculumSkeleton />;
    }

    if (curriculumQuery.isError || !curriculumQuery.data) {
        return <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-6"><h1 className="font-semibold text-red-900">{t("instructor.curriculum.errorTitle")}</h1><p className="mt-2 text-sm text-red-700 dark:text-red-400">{t("instructor.curriculum.errorDesc")}</p></div>;
    }

    const curriculum = curriculumQuery.data;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {blocker.state === "blocked" && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]/45 p-4 backdrop-blur-sm dark:bg-black/60"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="curriculum-leave-title"
                    data-testid="curriculum-leave-dialog"
                >
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1b1b20]">
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                            <AlertCircle className="h-5 w-5" />
                        </span>
                        <h2 id="curriculum-leave-title" className="mt-4 text-base font-bold text-[#3A3A3A] dark:text-[#ececef]">
                            {t("instructor.curriculum.leaveTitle")}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">
                            {t("instructor.curriculum.leaveDesc")}
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => blocker.reset()}
                                data-testid="curriculum-leave-stay"
                                className="rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#F47822]"
                            >
                                {t("instructor.curriculum.leaveStay")}
                            </button>
                            <button
                                type="button"
                                onClick={() => blocker.proceed()}
                                data-testid="curriculum-leave-discard"
                                className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                            >
                                {t("instructor.curriculum.leaveDiscard")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <Link to={`/instructor/courses/${courseId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3A3A3A]/50 dark:text-white/50 transition hover:text-[#F47822]"><ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" /> {t("instructor.curriculum.back")}</Link>
                    <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">{t("instructor.curriculum.eyebrow")}</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">{curriculum.course.title}</h1>
                    <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/50 dark:text-white/50">{t("instructor.curriculum.description")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {hasUnsavedChanges && (
                        <span
                            data-testid="curriculum-unsaved-indicator"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-[11px] font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                        >
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500 motion-reduce:animate-none" />
                            {t("instructor.curriculum.unsaved")}
                        </span>
                    )}
                    <Link to={`/instructor/courses/${courseId}/quizzes`} className="inline-flex rounded-xl bg-[#F47822] px-4 py-3 text-xs font-bold text-white hover:bg-[#de6414]">{t("instructor.curriculum.manageQuizzes")}</Link>
                    <Link to={`/instructor/courses/${courseId}/assignments`} className="inline-flex rounded-xl border border-[#F47822]/25 bg-[#FFF8F4] dark:bg-[#F47822]/10 px-4 py-3 text-xs font-bold text-[#F47822] hover:bg-[#F47822] hover:text-white">{t("instructor.curriculum.manageAssignments")}</Link>
                    <Link to={`/instructor/courses/${courseId}/assessments`} className="inline-flex rounded-xl border border-[#F47822]/25 bg-[#FFF8F4] dark:bg-[#F47822]/10 px-4 py-3 text-xs font-bold text-[#F47822] hover:bg-[#F47822] hover:text-white">{t("instructor.curriculum.manageAssessments")}</Link>
                    <div className="rounded-xl bg-[#3A3A3A] px-4 py-3 text-xs font-semibold text-white">{curriculum.sections.length === 1 ? t("instructor.curriculum.sectionOne", { count: curriculum.sections.length }) : t("instructor.curriculum.sectionMany", { count: curriculum.sections.length })}</div>
                </div>
            </header>

            {error && <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-800">{error}</div>}

            <form onSubmit={(event) => { event.preventDefault(); if (newSectionTitle.trim()) sectionMutation.mutate(); }} className="flex flex-col gap-3 rounded-2xl border border-[#F47822]/20 bg-[#F47822]/5 p-4 sm:flex-row sm:items-end">
                <label className="min-w-0 flex-1"><span className="text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("instructor.curriculum.newSection")}</span><input value={newSectionTitle} onChange={(event) => setNewSectionTitle(event.target.value)} placeholder={t("instructor.curriculum.newSectionPh")} className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-3.5 text-sm outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/10" /></label>
                <button type="submit" disabled={sectionMutation.isPending || !newSectionTitle.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white transition hover:bg-[#de6414] disabled:opacity-50">{sectionMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t("instructor.curriculum.addSection")}</button>
            </form>

            {curriculum.sections.length === 0 ? <EmptyCurriculum /> : <div className="space-y-4">{curriculum.sections.map((section, index) => <SectionCard key={section.id} section={section} isFirst={index === 0} isLast={index === curriculum.sections.length - 1} onChanged={invalidate} onDirtyChange={reportDirty} />)}</div>}
        </div>
    );
}

function SectionCard({ section, isFirst, isLast, onChanged, onDirtyChange }: { section: InstructorSection; isFirst: boolean; isLast: boolean; onChanged: () => Promise<void>; onDirtyChange: (id: string, dirty: boolean) => void }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(true);
    const [title, setTitle] = useState(section.title);
    const [description, setDescription] = useState(section.description ?? "");
    const [newLessonTitle, setNewLessonTitle] = useState("");
    const [notice, setNotice] = useState<Notice | null>(null);
    const [saving, setSaving] = useState(false);
    const [savedSnapshot, setSavedSnapshot] = useState(() => sectionSnapshot(section.title, section.description ?? ""));

    const currentSnapshot = sectionSnapshot(title, description);
    const dirty = currentSnapshot !== savedSnapshot;

    useEffect(() => {
        onDirtyChange(section.id, dirty);
    }, [dirty, onDirtyChange, section.id]);

    useEffect(() => () => onDirtyChange(section.id, false), [onDirtyChange, section.id]);

    const run = async (action: () => Promise<void>, success?: string) => {
        try {
            setSaving(true);
            setNotice(null);
            await action();
            if (success) setNotice({ tone: "success", text: success });
            await onChanged();
        } catch (error) {
            setNotice({ tone: "error", text: errorMessage(error, t("instructor.curriculum.changeFail")) });
        } finally {
            setSaving(false);
        }
    };

    const saveSection = async () => {
        const snapshot = currentSnapshot;
        try {
            setSaving(true);
            setNotice(null);
            await updateInstructorSection(section.id, { title, slug: slugify(title), description: description || null });
            setSavedSnapshot(snapshot);
            setNotice({ tone: "success", text: t("instructor.curriculum.saved") });
            await onChanged();
        } catch (error) {
            setNotice({ tone: "error", text: errorMessage(error, t("instructor.curriculum.changeFail")) });
        } finally {
            setSaving(false);
        }
    };

    return <section data-testid={`section-card-${section.id}`} className="overflow-hidden rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] shadow-[0_8px_30px_rgba(58,58,58,.04)]">
        <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F47822]/10 font-mono text-[11px] font-black text-[#F47822]">
                {String(section.position).padStart(2, "0")}
            </span>
            <button type="button" onClick={() => setOpen((value) => !value)} className="min-w-0 flex-1 text-left rtl:text-right"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#F47822]">{t("instructor.curriculum.sectionOf", { position: section.position })}</p><h2 className="mt-1 truncate text-base font-semibold text-[#3A3A3A] dark:text-[#ececef]">{title || t("instructor.curriculum.untitled")}</h2></button>
            {dirty && <span className="hidden shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 sm:inline-flex">{t("instructor.curriculum.unsaved")}</span>}
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${section.status === "published" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-white/65"}`}>{section.status === "published" ? t("instructor.dashboard.status.published") : t("instructor.dashboard.status.draft")}</span>
            <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#3A3A3A]/45 dark:text-white/45 hover:bg-[#3A3A3A]/5 dark:hover:bg-white/5">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
        </div>

        <div className={open ? "border-t border-[#3A3A3A]/7 dark:border-white/7 p-4 sm:p-5" : "hidden"}>
            {notice && <div className={`mb-4 flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${notice.tone === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"}`}>{notice.tone === "success" ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}<span>{notice.text}</span></div>}
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                <label><span className="text-[11px] font-semibold text-[#3A3A3A]/65 dark:text-white/65">{t("instructor.curriculum.sectionTitle")}</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#151519] px-3 text-sm outline-none focus:border-[#F47822]" /></label>
                <label><span className="text-[11px] font-semibold text-[#3A3A3A]/65 dark:text-white/65">{t("instructor.curriculum.sectionDesc")}</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} placeholder={t("instructor.curriculum.descPh")} className="mt-1.5 min-h-10 w-full resize-y rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#151519] px-3 py-2 text-sm outline-none focus:border-[#F47822]" /></label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" disabled={saving || !dirty} onClick={() => void saveSection()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#3A3A3A] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#F47822] disabled:cursor-not-allowed disabled:opacity-40">{saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {t("instructor.curriculum.save")}</button>
                <button type="button" disabled={saving || isFirst} onClick={() => run(() => runInstructorSectionAction(section.id, "reorder", { position: section.position - 1 }))} className="rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 px-3 py-2 text-[11px] font-semibold text-[#3A3A3A]/65 dark:text-white/65 disabled:opacity-35">{t("instructor.curriculum.moveUp")}</button>
                <button type="button" disabled={saving || isLast} onClick={() => run(() => runInstructorSectionAction(section.id, "reorder", { position: section.position + 1 }))} className="rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 px-3 py-2 text-[11px] font-semibold text-[#3A3A3A]/65 dark:text-white/65 disabled:opacity-35">{t("instructor.curriculum.moveDown")}</button>
                <button type="button" disabled={saving || dirty} title={dirty ? t("instructor.curriculum.saveBeforePublish") : undefined} onClick={() => run(() => runInstructorSectionAction(section.id, section.status === "published" ? "unpublish" : "publish"))} className="ms-auto inline-flex items-center gap-1.5 rounded-lg border border-[#F47822]/25 px-3 py-2 text-[11px] font-bold text-[#F47822] disabled:cursor-not-allowed disabled:opacity-40">{section.status === "published" ? <Eye className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5 rtl:-scale-x-100" />}{section.status === "published" ? t("instructor.curriculum.unpublish") : t("instructor.curriculum.publish")}</button>
                <button type="button" disabled={saving} onClick={() => { if (window.confirm(t("instructor.curriculum.deleteConfirm", { title: section.title }))) void run(() => deleteInstructorSection(section.id)); }} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /> {t("instructor.curriculum.delete")}</button>
            </div>

            <div className="mt-6 border-t border-[#3A3A3A]/7 dark:border-white/7 pt-5"><div className="flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-[0.13em] text-[#3A3A3A]/50 dark:text-white/50">{t("instructor.curriculum.lessons", { count: section.lessons.length })}</h3>{section.quizzes.length > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-[#3A3A3A]/45 dark:text-white/45"><ClipboardList className="h-3.5 w-3.5" /> {section.quizzes.length === 1 ? t("instructor.curriculum.quizOne", { count: section.quizzes.length }) : t("instructor.curriculum.quizMany", { count: section.quizzes.length })}</span>}</div>
                <div className="mt-3 space-y-2">{section.lessons.map((lesson, index) => <LessonCard key={lesson.id} lesson={lesson} isFirst={index === 0} isLast={index === section.lessons.length - 1} onChanged={onChanged} onDirtyChange={onDirtyChange} />)}</div>
                <form onSubmit={(event) => { event.preventDefault(); if (newLessonTitle.trim()) void run(async () => { await createInstructorLesson(section.id, { title: newLessonTitle, slug: slugify(newLessonTitle), content: "" }); setNewLessonTitle(""); }); }} className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={newLessonTitle} onChange={(event) => setNewLessonTitle(event.target.value)} placeholder={t("instructor.curriculum.addLessonPh")} className="h-10 min-w-0 flex-1 rounded-lg border border-dashed border-[#3A3A3A]/18 dark:border-white/18 bg-white dark:bg-[#151519] px-3 text-sm outline-none focus:border-[#F47822]" /><button type="submit" disabled={saving || !newLessonTitle.trim()} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#F47822]/10 px-3 text-xs font-bold text-[#F47822] hover:bg-[#F47822] hover:text-white disabled:opacity-45"><Plus className="h-3.5 w-3.5" /> {t("instructor.curriculum.addLesson")}</button></form>
            </div>
        </div>
    </section>;
}

function LessonCard({ lesson, isFirst, isLast, onChanged, onDirtyChange }: { lesson: InstructorLesson; isFirst: boolean; isLast: boolean; onChanged: () => Promise<void>; onDirtyChange: (id: string, dirty: boolean) => void }) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const [title, setTitle] = useState(lesson.title);
    const [content, setContent] = useState(lesson.content ?? "");
    const [description, setDescription] = useState(lesson.description ?? "");
    const [isPreview, setIsPreview] = useState(lesson.is_preview);
    const [duration, setDuration] = useState(String(lesson.duration_minutes ?? 0));
    const [working, setWorking] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [savedSnapshot, setSavedSnapshot] = useState(() => lessonSnapshot(lesson.title, lesson.content ?? "", String(lesson.duration_minutes ?? 0), lesson.description ?? "", lesson.is_preview));

    const currentSnapshot = lessonSnapshot(title, content, duration, description, isPreview);
    const dirty = currentSnapshot !== savedSnapshot;
    const canPublish = title.trim().length > 0 && content.trim().length > 0;
    const statusBlocked = dirty
        ? t("instructor.curriculum.saveBeforePublish")
        : lesson.status !== "published" && !canPublish
            ? !title.trim()
                ? t("instructor.curriculum.publishNeedTitle")
                : t("instructor.curriculum.publishNeedContent")
            : null;

    useEffect(() => {
        onDirtyChange(lesson.id, dirty);
    }, [dirty, lesson.id, onDirtyChange]);

    useEffect(() => () => onDirtyChange(lesson.id, false), [lesson.id, onDirtyChange]);

    const run = async (action: () => Promise<void>, success?: string) => {
        try {
            setWorking(true);
            setNotice(null);
            await action();
            if (success) setNotice({ tone: "success", text: success });
            await onChanged();
        } catch (error) {
            setNotice({ tone: "error", text: errorMessage(error, t("instructor.curriculum.changeFail")) });
        } finally {
            setWorking(false);
        }
    };

    const saveLesson = async () => {
        const snapshot = currentSnapshot;
        try {
            setWorking(true);
            setNotice(null);
            await updateInstructorLesson(lesson.id, {
                title,
                slug: slugify(title),
                description: description.trim() ? description.trim() : null,
                content,
                duration_minutes: Number(duration) || 0,
                is_preview: isPreview,
            });
            setSavedSnapshot(snapshot);
            setNotice({ tone: "success", text: t("instructor.curriculum.savedLesson") });
            await onChanged();
        } catch (error) {
            setNotice({ tone: "error", text: errorMessage(error, t("instructor.curriculum.saveFail")) });
        } finally {
            setWorking(false);
        }
    };

    return <article data-testid={`lesson-card-${lesson.id}`} className={`rounded-xl border bg-[#FCFCFC] p-3 transition-colors dark:bg-[#1b1b20] ${dirty ? "border-amber-300/70 dark:border-amber-400/25" : "border-[#3A3A3A]/8 dark:border-white/8"}`}>
        <div className="flex items-center gap-2">
            <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F47822]/10 text-[#F47822] sm:grid"><FileText className="h-4 w-4" /></span>
            <button type="button" onClick={() => setExpanded((value) => !value)} className="min-w-0 flex-1 text-left rtl:text-right"><p className="truncate text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{title || t("instructor.curriculum.untitled")}</p><p className="mt-0.5 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">{t("instructor.curriculum.minCount", { count: Number(duration) || 0 })} · {lesson.status === "published" ? t("instructor.dashboard.status.published") : t("instructor.dashboard.status.draft")}{isPreview && <> · <span className="font-semibold text-[#F47822]">{t("instructor.curriculum.previewBadge")}</span></>}</p></button>
            {dirty && <span className="hidden shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 sm:inline-flex">{t("instructor.curriculum.unsaved")}</span>}
            <span className={`hidden shrink-0 rounded-full px-2 py-1 text-[9px] font-bold sm:inline-flex ${lesson.status === "published" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-white/65"}`}>{lesson.status === "published" ? t("instructor.dashboard.status.published") : t("instructor.dashboard.status.draft")}</span>
            <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-label={expanded ? t("instructor.curriculum.collapseLesson") : t("instructor.curriculum.expandLesson")} className="p-1 text-[#3A3A3A]/45 dark:text-white/45">{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
        </div>

        <div className={expanded ? "mt-4 border-t border-[#3A3A3A]/7 pt-4 dark:border-white/7" : "hidden"}>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
                <label><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/50 dark:text-white/50">{t("instructor.curriculum.lessonTitleLabel")}</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#151519] px-3 text-sm outline-none focus:border-[#F47822]" /></label>
                <label><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/50 dark:text-white/50">{t("instructor.curriculum.durationLabel")}</span><input value={duration} min="0" type="number" onChange={(event) => setDuration(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#151519] px-3 text-sm outline-none focus:border-[#F47822]" /></label>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,260px)]">
                <label>
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/50 dark:text-white/50">{t("instructor.curriculum.lessonDescriptionLabel")}</span>
                    <textarea data-testid={`lesson-description-${lesson.id}`} value={description} onChange={(event) => setDescription(event.target.value)} rows={2} placeholder={t("instructor.curriculum.lessonDescriptionPh")} className="mt-1 min-h-10 w-full resize-y rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#151519] px-3 py-2 text-sm leading-6 outline-none transition focus:border-[#F47822]" />
                </label>
                <div className="flex items-start justify-between gap-3 rounded-xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#151519] p-3 md:mt-[18px]">
                    <div>
                        <p className="text-[11px] font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("instructor.curriculum.previewToggle")}</p>
                        <p className="mt-0.5 text-[10px] leading-4 text-[#3A3A3A]/45 dark:text-white/45">{t("instructor.curriculum.previewToggleHint")}</p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={isPreview}
                        aria-label={t("instructor.curriculum.previewToggle")}
                        data-testid={`lesson-preview-toggle-${lesson.id}`}
                        onClick={() => setIsPreview((value) => !value)}
                        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/40 ${isPreview ? "bg-[#F47822]" : "bg-[#3A3A3A]/15 dark:bg-white/20"}`}
                    >
                        <span aria-hidden="true" className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${isPreview ? "start-[18px]" : "start-0.5"}`} />
                    </button>
                </div>
            </div>

            <div className="mt-4">
                <LessonContentEditor value={content} onChange={setContent} media={lesson.media ?? []} disabled={working} />
            </div>

            <LessonMediaManager lesson={lesson} disabled={working} onChanged={onChanged} />

            {notice && <div className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-[11px] ${notice.tone === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"}`}>{notice.tone === "success" ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}<span>{notice.text}</span></div>}
            {statusBlocked && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">{statusBlocked}</p>}

            <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" data-testid={`lesson-save-${lesson.id}`} disabled={working || !dirty} onClick={() => void saveLesson()} className="inline-flex items-center gap-1 rounded-lg bg-[#3A3A3A] px-2.5 py-2 text-[11px] font-bold text-white transition hover:bg-[#F47822] disabled:cursor-not-allowed disabled:opacity-40">{working ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {t("instructor.curriculum.save")}</button>
                <button type="button" disabled={working || isFirst} onClick={() => void run(() => runInstructorLessonAction(lesson.id, "reorder", { position: lesson.position - 1 }))} className="rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 px-2.5 py-2 text-[11px] font-semibold text-[#3A3A3A]/60 dark:text-white/60 disabled:opacity-35">{t("instructor.curriculum.up")}</button>
                <button type="button" disabled={working || isLast} onClick={() => void run(() => runInstructorLessonAction(lesson.id, "reorder", { position: lesson.position + 1 }))} className="rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 px-2.5 py-2 text-[11px] font-semibold text-[#3A3A3A]/60 dark:text-white/60 disabled:opacity-35">{t("instructor.curriculum.down")}</button>
                <button type="button" data-testid={`lesson-publish-${lesson.id}`} disabled={working || Boolean(statusBlocked)} title={statusBlocked ?? undefined} onClick={() => void run(() => runInstructorLessonAction(lesson.id, lesson.status === "published" ? "unpublish" : "publish"))} className="ms-auto rounded-lg border border-[#F47822]/25 px-2.5 py-2 text-[11px] font-bold text-[#F47822] disabled:cursor-not-allowed disabled:opacity-40">{lesson.status === "published" ? t("instructor.curriculum.unpublish") : t("instructor.curriculum.publish")}</button>
                <button type="button" disabled={working} onClick={() => { if (window.confirm(t("instructor.curriculum.deleteLessonConfirm", { title: lesson.title }))) void run(() => deleteInstructorLesson(lesson.id)); }} aria-label={t("instructor.curriculum.delete")} className="rounded-lg p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
        </div>
    </article>;
}

function LessonMediaManager({ lesson, disabled, onChanged }: { lesson: InstructorLesson; disabled: boolean; onChanged: () => Promise<void> }) {
    const { t } = useTranslation();
    const fileInput = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const media = lesson.media ?? [];
    const video = media.find((item) => item.type === "video" || item.mime_type.startsWith("video/"));

    const selectFile = async (file?: File) => {
        if (!file || uploading) return;
        if (file.size > 50 * 1024 * 1024) { setMessage(t("instructor.curriculum.tooBig")); return; }
        if (file.type.startsWith("video/") && video) { setMessage(t("instructor.curriculum.replaceVideo")); return; }
        try { setUploading(true); setMessage(null); await uploadInstructorLessonMedia(lesson.id, file); await onChanged(); } catch (error) { setMessage(error instanceof Error ? error.message : t("instructor.curriculum.uploadFail")); } finally { setUploading(false); if (fileInput.current) fileInput.current.value = ""; }
    };

    const remove = async (id: string) => { try { setUploading(true); setMessage(null); await deleteInstructorLessonMedia(id); await onChanged(); } catch (error) { setMessage(error instanceof Error ? error.message : t("instructor.curriculum.removeFail")); } finally { setUploading(false); } };

    return <section className="mt-4 rounded-xl border border-[#F47822]/15 bg-[#FFF8F4] dark:bg-[#F47822]/10 p-3.5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#F47822]">{t("instructor.curriculum.mediaTitle")}</p><p className="mt-1 text-[11px] leading-5 text-[#3A3A3A]/55 dark:text-white/55">{t("instructor.curriculum.mediaDesc")}</p></div><input ref={fileInput} type="file" className="hidden" accept="video/mp4,video/webm,image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={(event) => void selectFile(event.target.files?.[0])} /><button type="button" disabled={disabled || uploading} onClick={() => fileInput.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#3A3A3A] px-3 text-[11px] font-bold text-white transition hover:bg-[#F47822] disabled:cursor-not-allowed disabled:opacity-55"><Upload className="h-3.5 w-3.5" />{uploading ? t("instructor.curriculum.uploading") : t("instructor.curriculum.addMedia")}</button></div>{message && <p className="mt-3 rounded-lg bg-white dark:bg-[#1b1b20] px-3 py-2 text-[11px] text-red-700 dark:text-red-400">{message}</p>}<div className="mt-3 grid gap-2">{media.length ? media.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-lg bg-white dark:bg-[#1b1b20] px-3 py-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#F47822]/10 text-[#F47822]">{item.type === "video" ? <Video className="h-3.5 w-3.5" /> : item.type === "image" ? <ImageIcon className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-[#3A3A3A] dark:text-[#ececef]">{item.original_name}</span><span className="mt-0.5 block text-[10px] capitalize text-[#3A3A3A]/42 dark:text-white/42">{item.type} · {formatFileSize(item.size)}</span></span><button type="button" disabled={uploading} onClick={() => void remove(item.id)} aria-label={t("instructor.curriculum.removeMedia", { name: item.original_name })} className="rounded-lg p-1.5 text-[#3A3A3A]/35 hover:bg-red-50 hover:text-red-600 dark:text-white/35 dark:hover:bg-red-500/10 dark:hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button></div>) : <p className="text-[11px] text-[#3A3A3A]/45 dark:text-white/45">{t("instructor.curriculum.mediaEmpty")}</p>}</div></section>;
}

function formatFileSize(bytes: number): string { return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`; }

function EmptyCurriculum() {
    const { t } = useTranslation();
    return <div className="rounded-2xl border border-dashed border-[#3A3A3A]/15 dark:border-white/15 bg-white dark:bg-[#1b1b20] px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]"><BookOpen className="h-5 w-5" /></div><h2 className="mt-4 text-lg font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("instructor.curriculum.emptyTitle")}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#3A3A3A]/50 dark:text-white/50">{t("instructor.curriculum.emptyDesc")}</p></div>;
}
function CurriculumSkeleton() { return <div className="mx-auto max-w-5xl space-y-5"><div className="h-28 animate-pulse rounded-2xl bg-black/5" />{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl bg-black/5" />)}</div>; }
