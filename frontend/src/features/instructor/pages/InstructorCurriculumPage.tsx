import {
    ArrowLeft,
    BookOpen,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Eye,
    FileText,
    GripVertical,
    LoaderCircle,
    Plus,
    Save,
    Send,
    Trash2,
    Upload,
    Video,
    Image as ImageIcon,
    Paperclip,
    X,
} from "lucide-react";
import {
    FormEvent,
    useRef,
    useState,
} from "react";
import {
    Link,
    useParams,
} from "react-router-dom";
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

function slugify(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function InstructorCurriculumPage() {
    const { courseId } = useParams();
    const queryClient = useQueryClient();
    const [newSectionTitle, setNewSectionTitle] = useState("");
    const [error, setError] = useState<string | null>(null);

    const curriculumQuery = useQuery({
        queryKey: ["instructor", "curriculum", courseId],
        queryFn: () => getInstructorCurriculum(courseId!),
        enabled: Boolean(courseId),
    });

    const invalidate = async () => {
        await queryClient.invalidateQueries({
            queryKey: ["instructor", "curriculum", courseId],
        });
        await queryClient.invalidateQueries({ queryKey: ["instructor", "course", courseId] });
    };

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
        onError: () => setError("We couldn't add that section. Give it a title and try again."),
    });

    if (curriculumQuery.isLoading) {
        return <CurriculumSkeleton />;
    }

    if (curriculumQuery.isError || !curriculumQuery.data) {
        return <div className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 className="font-semibold text-red-900">Curriculum unavailable</h1><p className="mt-2 text-sm text-red-700">You can only manage the curriculum of courses you own.</p></div>;
    }

    const curriculum = curriculumQuery.data;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <Link to={`/instructor/courses/${courseId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3A3A3A]/50 transition hover:text-[#F47822]"><ArrowLeft className="h-3.5 w-3.5" /> Course editor</Link>
                    <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">Curriculum builder</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#3A3A3A]">{curriculum.course.title}</h1>
                    <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/50">Arrange sections and lessons as learners will experience them. Drafts stay private until published.</p>
                </div>
                <div className="flex items-center gap-2"><Link to={`/instructor/courses/${courseId}/quizzes`} className="inline-flex rounded-xl bg-[#F47822] px-4 py-3 text-xs font-bold text-white hover:bg-[#de6414]">Manage quizzes</Link><div className="rounded-xl bg-[#3A3A3A] px-4 py-3 text-xs font-semibold text-white">{curriculum.sections.length} {curriculum.sections.length === 1 ? "section" : "sections"}</div></div>
            </header>

            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

            <form onSubmit={(event) => { event.preventDefault(); if (newSectionTitle.trim()) sectionMutation.mutate(); }} className="flex flex-col gap-3 rounded-2xl border border-[#F47822]/20 bg-[#F47822]/5 p-4 sm:flex-row sm:items-end">
                <label className="min-w-0 flex-1"><span className="text-xs font-bold text-[#3A3A3A]">Start a new section</span><input value={newSectionTitle} onChange={(event) => setNewSectionTitle(event.target.value)} placeholder="e.g. Electrical fundamentals" className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 text-sm outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/10" /></label>
                <button type="submit" disabled={sectionMutation.isPending || !newSectionTitle.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white transition hover:bg-[#de6414] disabled:opacity-50">{sectionMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add section</button>
            </form>

            {curriculum.sections.length === 0 ? <EmptyCurriculum /> : <div className="space-y-4">{curriculum.sections.map((section, index) => <SectionCard key={section.id} courseId={courseId!} section={section} isFirst={index === 0} isLast={index === curriculum.sections.length - 1} onChanged={invalidate} />)}</div>}
        </div>
    );
}

function SectionCard({ courseId, section, isFirst, isLast, onChanged }: { courseId: string; section: InstructorSection; isFirst: boolean; isLast: boolean; onChanged: () => Promise<void> }) {
    const [open, setOpen] = useState(true);
    const [title, setTitle] = useState(section.title);
    const [description, setDescription] = useState(section.description ?? "");
    const [newLessonTitle, setNewLessonTitle] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const run = async (action: () => Promise<void>, success?: string) => {
        try {
            setSaving(true); setMessage(null);
            await action();
            if (success) setMessage(success);
            await onChanged();
        } catch {
            setMessage("That curriculum change couldn't be completed.");
        } finally { setSaving(false); }
    };

    return <section className="overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_8px_30px_rgba(58,58,58,.04)]">
        <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
            <GripVertical className="h-4 w-4 shrink-0 text-[#3A3A3A]/25" />
            <button type="button" onClick={() => setOpen((value) => !value)} className="min-w-0 flex-1 text-left"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#F47822]">Section {section.position}</p><h2 className="mt-1 truncate text-base font-semibold text-[#3A3A3A]">{section.title}</h2></button>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${section.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{section.status}</span>
            <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#3A3A3A]/45 hover:bg-[#3A3A3A]/5">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
        </div>

        {open && <div className="border-t border-[#3A3A3A]/7 p-4 sm:p-5">
            {message && <p className="mb-4 rounded-lg bg-[#F47822]/8 px-3 py-2 text-xs text-[#9c4209]">{message}</p>}
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                <label><span className="text-[11px] font-semibold text-[#3A3A3A]/65">Section title</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#3A3A3A]/10 px-3 text-sm outline-none focus:border-[#F47822]" /></label>
                <label><span className="text-[11px] font-semibold text-[#3A3A3A]/65">Description</span><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional learner guidance" className="mt-1.5 h-10 w-full rounded-lg border border-[#3A3A3A]/10 px-3 text-sm outline-none focus:border-[#F47822]" /></label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" disabled={saving} onClick={() => run(() => updateInstructorSection(section.id, { title, slug: slugify(title), description: description || null }), "Section saved.")} className="inline-flex items-center gap-1.5 rounded-lg bg-[#3A3A3A] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#F47822]"><Save className="h-3.5 w-3.5" /> Save</button>
                <button type="button" disabled={saving || isFirst} onClick={() => run(() => runInstructorSectionAction(section.id, "reorder", { position: section.position - 1 }))} className="rounded-lg border border-[#3A3A3A]/10 px-3 py-2 text-[11px] font-semibold text-[#3A3A3A]/65 disabled:opacity-35">Move up</button>
                <button type="button" disabled={saving || isLast} onClick={() => run(() => runInstructorSectionAction(section.id, "reorder", { position: section.position + 1 }))} className="rounded-lg border border-[#3A3A3A]/10 px-3 py-2 text-[11px] font-semibold text-[#3A3A3A]/65 disabled:opacity-35">Move down</button>
                <button type="button" disabled={saving} onClick={() => run(() => runInstructorSectionAction(section.id, section.status === "published" ? "unpublish" : "publish"))} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[#F47822]/25 px-3 py-2 text-[11px] font-bold text-[#F47822]">{section.status === "published" ? <Eye className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}{section.status === "published" ? "Unpublish" : "Publish"}</button>
                <button type="button" disabled={saving} onClick={() => { if (window.confirm(`Delete “${section.title}” and its lessons?`)) void run(() => deleteInstructorSection(section.id)); }} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-bold text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>

            <div className="mt-6 border-t border-[#3A3A3A]/7 pt-5"><div className="flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-[0.13em] text-[#3A3A3A]/50">Lessons · {section.lessons.length}</h3>{section.quizzes.length > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-[#3A3A3A]/45"><ClipboardList className="h-3.5 w-3.5" /> {section.quizzes.length} quiz checkpoint{section.quizzes.length > 1 ? "s" : ""}</span>}</div>
                <div className="mt-3 space-y-2">{section.lessons.map((lesson, index) => <LessonCard key={lesson.id} lesson={lesson} isFirst={index === 0} isLast={index === section.lessons.length - 1} onChanged={onChanged} />)}</div>
                <form onSubmit={(event) => { event.preventDefault(); if (newLessonTitle.trim()) void run(async () => { await createInstructorLesson(section.id, { title: newLessonTitle, slug: slugify(newLessonTitle), content: "" }); setNewLessonTitle(""); }); }} className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={newLessonTitle} onChange={(event) => setNewLessonTitle(event.target.value)} placeholder="Add a lesson title" className="h-10 min-w-0 flex-1 rounded-lg border border-dashed border-[#3A3A3A]/18 px-3 text-sm outline-none focus:border-[#F47822]" /><button type="submit" disabled={saving || !newLessonTitle.trim()} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#F47822]/10 px-3 text-xs font-bold text-[#F47822] hover:bg-[#F47822] hover:text-white disabled:opacity-45"><Plus className="h-3.5 w-3.5" /> Add lesson</button></form>
            </div>
        </div>}
    </section>;
}

function LessonCard({ lesson, isFirst, isLast, onChanged }: { lesson: InstructorLesson; isFirst: boolean; isLast: boolean; onChanged: () => Promise<void> }) {
    const [expanded, setExpanded] = useState(false);
    const [title, setTitle] = useState(lesson.title);
    const [content, setContent] = useState(lesson.content ?? "");
    const [duration, setDuration] = useState(String(lesson.duration_minutes ?? 0));
    const [working, setWorking] = useState(false);

    const run = async (action: () => Promise<void>) => { try { setWorking(true); await action(); await onChanged(); } finally { setWorking(false); } };

    return <article className="rounded-xl border border-[#3A3A3A]/8 bg-[#FCFCFC] p-3"><div className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-[#F47822]" /><button type="button" onClick={() => setExpanded((value) => !value)} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-semibold text-[#3A3A3A]">{lesson.title}</p><p className="mt-0.5 text-[11px] text-[#3A3A3A]/45">{lesson.duration_minutes ?? 0} min · {lesson.status}</p></button><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${lesson.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{lesson.status}</span><button type="button" onClick={() => setExpanded((value) => !value)} className="p-1 text-[#3A3A3A]/45">{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button></div>
        {expanded && <div className="mt-4 border-t border-[#3A3A3A]/7 pt-4"><div className="grid gap-3 sm:grid-cols-[1fr_100px]"><input value={title} onChange={(event) => setTitle(event.target.value)} className="h-10 rounded-lg border border-[#3A3A3A]/10 px-3 text-sm outline-none focus:border-[#F47822]" /><input value={duration} min="0" type="number" onChange={(event) => setDuration(event.target.value)} className="h-10 rounded-lg border border-[#3A3A3A]/10 px-3 text-sm outline-none focus:border-[#F47822]" /></div><textarea value={content} onChange={(event) => setContent(event.target.value)} rows={5} placeholder="Lesson content, teaching notes, or embedded material…" className="mt-3 w-full rounded-lg border border-[#3A3A3A]/10 px-3 py-2 text-sm leading-6 outline-none focus:border-[#F47822]" /><LessonMediaManager lesson={lesson} disabled={working} onChanged={onChanged} /><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={working} onClick={() => void run(() => updateInstructorLesson(lesson.id, { title, slug: slugify(title), content, duration_minutes: Number(duration) }))} className="inline-flex items-center gap-1 rounded-lg bg-[#3A3A3A] px-2.5 py-2 text-[11px] font-bold text-white"><Save className="h-3.5 w-3.5" /> Save</button><button type="button" disabled={working || isFirst} onClick={() => void run(() => runInstructorLessonAction(lesson.id, "reorder", { position: lesson.position - 1 }))} className="rounded-lg border border-[#3A3A3A]/10 px-2.5 py-2 text-[11px] font-semibold text-[#3A3A3A]/60 disabled:opacity-35">Up</button><button type="button" disabled={working || isLast} onClick={() => void run(() => runInstructorLessonAction(lesson.id, "reorder", { position: lesson.position + 1 }))} className="rounded-lg border border-[#3A3A3A]/10 px-2.5 py-2 text-[11px] font-semibold text-[#3A3A3A]/60 disabled:opacity-35">Down</button><button type="button" disabled={working} onClick={() => void run(() => runInstructorLessonAction(lesson.id, lesson.status === "published" ? "unpublish" : "publish"))} className="ml-auto rounded-lg border border-[#F47822]/25 px-2.5 py-2 text-[11px] font-bold text-[#F47822]">{lesson.status === "published" ? "Unpublish" : "Publish"}</button><button type="button" disabled={working} onClick={() => { if (window.confirm(`Delete “${lesson.title}”?`)) void run(() => deleteInstructorLesson(lesson.id)); }} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button></div></div>}
    </article>;
}

function LessonMediaManager({ lesson, disabled, onChanged }: { lesson: InstructorLesson; disabled: boolean; onChanged: () => Promise<void> }) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const media = lesson.media ?? [];
    const video = media.find((item) => item.type === "video" || item.mime_type.startsWith("video/"));

    const selectFile = async (file?: File) => {
        if (!file || uploading) return;
        if (file.size > 50 * 1024 * 1024) { setMessage("Files must be 50 MB or smaller."); return; }
        if (file.type.startsWith("video/") && video) { setMessage("Remove the current lesson video before adding a replacement."); return; }
        try { setUploading(true); setMessage(null); await uploadInstructorLessonMedia(lesson.id, file); await onChanged(); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to upload this resource."); } finally { setUploading(false); if (fileInput.current) fileInput.current.value = ""; }
    };

    const remove = async (id: string) => { try { setUploading(true); setMessage(null); await deleteInstructorLessonMedia(id); await onChanged(); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to remove this resource."); } finally { setUploading(false); } };

    return <section className="mt-4 rounded-xl border border-[#F47822]/15 bg-[#FFF8F4] p-3.5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#F47822]">Lesson media</p><p className="mt-1 text-[11px] leading-5 text-[#3A3A3A]/55">Add one lesson video, then supporting images or documents.</p></div><input ref={fileInput} type="file" className="hidden" accept="video/mp4,video/webm,image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={(event) => void selectFile(event.target.files?.[0])} /><button type="button" disabled={disabled || uploading} onClick={() => fileInput.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#3A3A3A] px-3 text-[11px] font-bold text-white transition hover:bg-[#F47822] disabled:cursor-not-allowed disabled:opacity-55"><Upload className="h-3.5 w-3.5" />{uploading ? "Uploading…" : "Add media"}</button></div>{message && <p className="mt-3 rounded-lg bg-white px-3 py-2 text-[11px] text-red-700">{message}</p>}<div className="mt-3 grid gap-2">{media.length ? media.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#F47822]/10 text-[#F47822]">{item.type === "video" ? <Video className="h-3.5 w-3.5" /> : item.type === "image" ? <ImageIcon className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-[#3A3A3A]">{item.original_name}</span><span className="mt-0.5 block text-[10px] capitalize text-[#3A3A3A]/42">{item.type} · {formatFileSize(item.size)}</span></span><button type="button" disabled={disabled || uploading} onClick={() => void remove(item.id)} className="grid h-7 w-7 place-items-center rounded-lg text-[#3A3A3A]/38 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50" aria-label={`Remove ${item.original_name}`}><X className="h-3.5 w-3.5" /></button></div>) : <p className="rounded-lg border border-dashed border-[#3A3A3A]/15 bg-white/60 px-3 py-3 text-[11px] text-[#3A3A3A]/42">No media attached. Upload a video, a supporting image, or a document.</p>}</div></section>;
}

function formatFileSize(bytes: number): string { return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`; }

function EmptyCurriculum() { return <div className="rounded-2xl border border-dashed border-[#3A3A3A]/15 bg-white px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]"><BookOpen className="h-5 w-5" /></div><h2 className="mt-4 text-lg font-semibold text-[#3A3A3A]">Build your learning path</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#3A3A3A]/50">Add your first section, then fill it with lessons and publish them when learners are ready.</p></div>; }
function CurriculumSkeleton() { return <div className="mx-auto max-w-5xl space-y-5"><div className="h-28 animate-pulse rounded-2xl bg-black/5" />{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl bg-black/5" />)}</div>; }
