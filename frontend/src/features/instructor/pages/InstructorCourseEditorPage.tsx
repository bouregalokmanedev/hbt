import {
    Activity,
    Archive,
    ArrowLeft,
    Award,
    CheckCircle2,
    ExternalLink,
    Eye,
    FileCheck2,
    LoaderCircle,
    RotateCcw,
    Save,
    Send,
    Trash2,
} from "lucide-react";
import {
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import type {
    Course,
} from "@/features/courses/types/course.types";
import {
    ApiError,
} from "@/lib/api/errors";

import {
    createInstructorCourse,
    deleteInstructorCourse,
    getInstructorCourse,
    runInstructorCourseAction,
    updateInstructorCourse,
    type InstructorCourseLifecycleAction,
    type InstructorCoursePayload,
} from "../api/instructorApi";

type CourseForm = {
    title: string;
    slug: string;
    short_description: string;
    description: string;
    language: string;
    difficulty: string;
    duration_minutes: string;
    price: string;
    discount_price: string;
    currency: string;
    is_free: boolean;
    visibility: string;
    thumbnail: string;
    cover_image: string;
    preview_video: string;
};

const emptyForm: CourseForm = {
    title: "",
    slug: "",
    short_description: "",
    description: "",
    language: "en",
    difficulty: "beginner",
    duration_minutes: "60",
    price: "0",
    discount_price: "",
    currency: "USD",
    is_free: true,
    visibility: "public",
    thumbnail: "",
    cover_image: "",
    preview_video: "",
};

function toForm(course: Course): CourseForm {
    return {
        title: course.title,
        slug: course.slug,
        short_description: course.short_description,
        description: course.description,
        language: course.language,
        difficulty: course.difficulty,
        duration_minutes: String(course.duration_minutes),
        price: String(course.price),
        discount_price: course.discount_price === null
            ? ""
            : String(course.discount_price),
        currency: course.currency,
        is_free: course.is_free,
        visibility: course.visibility,
        thumbnail: course.thumbnail ?? "",
        cover_image: course.cover_image ?? "",
        preview_video: course.preview_video ?? "",
    };
}

function toPayload(form: CourseForm): InstructorCoursePayload {
    return {
        ...form,
        duration_minutes: Number(form.duration_minutes),
        price: form.is_free ? 0 : Number(form.price),
        discount_price: form.discount_price === ""
            ? null
            : Number(form.discount_price),
        thumbnail: form.thumbnail || null,
        cover_image: form.cover_image || null,
        preview_video: form.preview_video || null,
        meta_title: null,
        meta_description: null,
        metadata: {},
    };
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export function InstructorCourseEditorPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isNew = courseId === "new";
    const [form, setForm] = useState<CourseForm>(emptyForm);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const courseQuery = useQuery({
        queryKey: ["instructor", "course", courseId],
        queryFn: () => getInstructorCourse(courseId!),
        enabled: !isNew && Boolean(courseId),
    });

    const course = courseQuery.data;

    useEffect(() => {
        if (course) {
            setForm(toForm(course));
        }
    }, [course]);

    const refreshInstructorData = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["instructor", "courses"] }),
            queryClient.invalidateQueries({ queryKey: ["instructor", "dashboard"] }),
        ]);
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            const payload = toPayload(form);
            return isNew
                ? createInstructorCourse(payload)
                : updateInstructorCourse(courseId!, payload);
        },
        onSuccess: async (savedCourse) => {
            setError(null);
            setNotice(isNew ? "Draft course created." : "Course changes saved.");
            await refreshInstructorData();
            if (isNew) {
                navigate(`/instructor/courses/${savedCourse.id}`, {
                    replace: true,
                });
                return;
            }
            queryClient.setQueryData(
                ["instructor", "course", courseId],
                savedCourse,
            );
        },
        onError: (requestError) => {
            setNotice(null);
            setError(readError(requestError));
        },
    });

    const lifecycleMutation = useMutation({
        mutationFn: (action: InstructorCourseLifecycleAction) =>
            runInstructorCourseAction(courseId!, action),
        onSuccess: async (updatedCourse, action) => {
            setError(null);
            setNotice(lifecycleLabel(action));
            queryClient.setQueryData(
                ["instructor", "course", courseId],
                updatedCourse,
            );
            await refreshInstructorData();
        },
        onError: (requestError) => {
            setNotice(null);
            setError(readError(requestError));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteInstructorCourse(courseId!),
        onSuccess: async () => {
            await refreshInstructorData();
            navigate("/instructor/courses", { replace: true });
        },
        onError: (requestError) => setError(readError(requestError)),
    });

    const lifecycleActions = useMemo(() => {
        if (!course) {
            return [];
        }

        if (course.status === "draft") {
            return [{ action: "submit-review" as const, label: "Submit for review", icon: Send }];
        }

        if (course.status === "review") {
            return [{ action: "publish" as const, label: "Publish course", icon: CheckCircle2 }];
        }

        if (course.status === "published") {
            return [
                { action: "unpublish" as const, label: "Unpublish", icon: Eye },
                { action: "archive" as const, label: "Archive", icon: Archive },
            ];
        }

        return [{ action: "restore" as const, label: "Restore to draft", icon: RotateCcw }];
    }, [course]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setNotice(null);
        setError(null);
        saveMutation.mutate();
    };

    const updateField = <Key extends keyof CourseForm>(
        key: Key,
        value: CourseForm[Key],
    ) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };

    if (!isNew && courseQuery.isLoading) {
        return <EditorSkeleton />;
    }

    if (!isNew && (courseQuery.isError || !course)) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <h1 className="text-lg font-semibold text-red-900">Course unavailable</h1>
                <p className="mt-2 text-sm text-red-700">You can only manage courses you own.</p>
                <Link to="/instructor/courses" className="mt-5 inline-flex rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-semibold text-white">Back to courses</Link>
            </div>
        );
    }

    const isWorking = saveMutation.isPending || lifecycleMutation.isPending || deleteMutation.isPending;

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <Link to="/instructor/courses" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3A3A3A]/50 transition hover:text-[#F47822]">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to courses
                    </Link>
                    <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">
                        {isNew ? "New learning experience" : "Course editor"}
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#3A3A3A]">
                        {isNew ? "Create a course" : course?.title ?? "Course editor"}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3A3A3A]/50">
                        {isNew
                            ? "Start with the essentials. Your course is saved as a draft until you are ready to submit it."
                            : "Keep your course details accurate, then manage its publishing lifecycle from this workspace."}
                    </p>
                </div>

                {!isNew && course && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#F47822]/10 px-3 py-1.5 text-[10px] font-bold capitalize tracking-[0.08em] text-[#F47822]">
                            {course.status.replace("_", " ")}
                        </span>
                        {course.status === "published" && (
                            <Link to={`/courses/${course.id}`} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 text-xs font-bold text-[#3A3A3A]/65 shadow-sm transition hover:border-[#F47822]/35 hover:bg-[#FFF8F4] hover:text-[#F47822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/35">
                                <ExternalLink className="h-3.5 w-3.5" /> Preview
                            </Link>
                        )}
                        <Link to={`/instructor/courses/${course.id}/curriculum`} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#F47822] px-3.5 text-xs font-bold text-white shadow-[0_7px_16px_rgba(244,120,34,.2)] transition hover:bg-[#de6414] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/40">
                            <FileCheck2 className="h-3.5 w-3.5" /> Curriculum
                        </Link>
                        <Link to={`/instructor/courses/${course.id}/analytics`} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 text-xs font-bold text-[#3A3A3A]/65 shadow-sm transition hover:border-[#F47822]/35 hover:bg-[#FFF8F4] hover:text-[#F47822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/35">
                            <Activity className="h-3.5 w-3.5" /> Analytics
                        </Link>
                        <Link to={`/instructor/courses/${course.id}/outcomes`} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 text-xs font-bold text-[#3A3A3A]/65 shadow-sm transition hover:border-[#F47822]/35 hover:bg-[#FFF8F4] hover:text-[#F47822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/35">
                            <Award className="h-3.5 w-3.5" /> Outcomes
                        </Link>
                    </div>
                )}
            </header>

            {notice && <Notice variant="success">{notice}</Notice>}
            {error && <Notice variant="error">{error}</Notice>}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.04)] sm:p-6">
                        <SectionTitle title="Course basics" description="The information learners see before they enroll." />
                        <div className="mt-6 grid gap-5 md:grid-cols-2">
                            <TextField label="Course title" value={form.title} required className="md:col-span-2" onChange={(value) => {
                                updateField("title", value);
                                if (isNew && !form.slug) updateField("slug", slugify(value));
                            }} />
                            <TextField label="Course URL slug" value={form.slug} required hint="Use lowercase words separated by hyphens." onChange={(value) => updateField("slug", slugify(value))} />
                            <SelectField label="Difficulty" value={form.difficulty} onChange={(value) => updateField("difficulty", value)} options={[["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"], ["all levels", "All levels"]]} />
                            <TextField label="Short description" value={form.short_description} required className="md:col-span-2" onChange={(value) => updateField("short_description", value)} />
                            <TextAreaField label="Full description" value={form.description} required className="md:col-span-2" onChange={(value) => updateField("description", value)} />
                        </div>
                    </section>

                    <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.04)] sm:p-6">
                        <SectionTitle title="Learning and access" description="Set learner-facing duration, language, price, and visibility." />
                        <div className="mt-6 grid gap-5 md:grid-cols-2">
                            <TextField label="Language" value={form.language} required onChange={(value) => updateField("language", value)} />
                            <TextField label="Estimated duration (minutes)" value={form.duration_minutes} required type="number" min="0" onChange={(value) => updateField("duration_minutes", value)} />
                            <SelectField label="Visibility" value={form.visibility} onChange={(value) => updateField("visibility", value)} options={[["public", "Public"], ["private", "Private"], ["unlisted", "Unlisted"]]} />
                            <label className="flex min-h-[46px] items-center gap-3 rounded-xl border border-[#3A3A3A]/10 px-3.5 text-sm text-[#3A3A3A]">
                                <input type="checkbox" checked={form.is_free} onChange={(event) => updateField("is_free", event.target.checked)} className="h-4 w-4 accent-[#F47822]" />
                                This is a free course
                            </label>
                            {!form.is_free && <>
                                <TextField label="Price" value={form.price} required type="number" min="0" onChange={(value) => updateField("price", value)} />
                                <div className="grid grid-cols-2 gap-3">
                                    <TextField label="Discount price" value={form.discount_price} type="number" min="0" onChange={(value) => updateField("discount_price", value)} />
                                    <TextField label="Currency" value={form.currency} required maxLength={3} onChange={(value) => updateField("currency", value.toUpperCase())} />
                                </div>
                            </>}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.04)] sm:p-6">
                        <SectionTitle title="Course media" description="Add URLs for your course artwork and optional preview video." />
                        <div className="mt-6 grid gap-5">
                            <TextField label="Thumbnail URL" value={form.thumbnail} type="url" onChange={(value) => updateField("thumbnail", value)} />
                            <TextField label="Cover image URL" value={form.cover_image} type="url" onChange={(value) => updateField("cover_image", value)} />
                            <TextField label="Preview video URL" value={form.preview_video} type="url" onChange={(value) => updateField("preview_video", value)} />
                        </div>
                    </section>

                    <div className="flex flex-wrap justify-end gap-3">
                        <Link to="/instructor/courses" className="rounded-xl px-4 py-3 text-xs font-semibold text-[#3A3A3A]/55 transition hover:bg-white hover:text-[#3A3A3A]">Cancel</Link>
                        <button type="submit" disabled={isWorking} className="inline-flex items-center gap-2 rounded-xl bg-[#3A3A3A] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#F47822] disabled:cursor-not-allowed disabled:opacity-60">
                            {saveMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {isNew ? "Create draft" : "Save changes"}
                        </button>
                    </div>
                </form>

                {!isNew && course && <aside className="h-fit space-y-4 xl:sticky xl:top-24">
                    <section className="rounded-2xl border border-[#3A3A3A]/8 bg-[#3A3A3A] p-5 text-white shadow-[0_10px_30px_rgba(58,58,58,.12)]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F9A16C]">Publishing status</p>
                        <h2 className="mt-3 text-lg font-semibold capitalize">{course.status.replace("_", " ")}</h2>
                        <p className="mt-2 text-xs leading-5 text-white/60">Save your course details before changing its publishing state. Publishing also checks for a thumbnail, curriculum, and a published lesson.</p>
                        <div className="mt-5 space-y-2">
                            {lifecycleActions.map(({ action, label, icon: Icon }) => <button key={action} type="button" disabled={isWorking} onClick={() => lifecycleMutation.mutate(action)} className="flex w-full items-center justify-between rounded-xl bg-white px-3.5 py-3 text-left text-xs font-bold text-[#3A3A3A] transition hover:bg-[#F47822] hover:text-white disabled:opacity-60"><span>{label}</span><Icon className="h-4 w-4" /></button>)}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-red-100 bg-red-50 p-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">Danger zone</p>
                        <p className="mt-2 text-xs leading-5 text-red-900/65">Deleting permanently removes this course from your teaching library. This action cannot be undone.</p>
                        <button type="button" disabled={isWorking} onClick={() => {
                            if (window.confirm(`Delete “${course.title}”? This cannot be undone.`)) deleteMutation.mutate();
                        }} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-red-700 transition hover:text-red-900 disabled:opacity-60"><Trash2 className="h-4 w-4" /> Delete course</button>
                    </section>
                </aside>}
            </div>
        </div>
    );
}

function lifecycleLabel(action: InstructorCourseLifecycleAction): string {
    return ({ publish: "Course published.", unpublish: "Course returned to draft.", "submit-review": "Course submitted for review.", archive: "Course archived.", restore: "Course restored to draft." })[action];
}

function readError(error: unknown): string {
    return error instanceof ApiError ? error.message : "We couldn't complete that course action. Please try again.";
}

function SectionTitle({ title, description }: { title: string; description: string }) {
    return <div><h2 className="text-base font-semibold text-[#3A3A3A]">{title}</h2><p className="mt-1 text-xs leading-5 text-[#3A3A3A]/45">{description}</p></div>;
}

function TextField({ label, value, onChange, className = "", hint, ...props }: { label: string; value: string; onChange: (value: string) => void; className?: string; hint?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
    return <label className={`block ${className}`}><span className="text-xs font-semibold text-[#3A3A3A]/75">{label}</span><input {...props} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3.5 text-sm text-[#3A3A3A] outline-none transition placeholder:text-[#3A3A3A]/30 focus:border-[#F47822] focus:bg-white focus:ring-4 focus:ring-[#F47822]/8" />{hint && <span className="mt-1.5 block text-[11px] text-[#3A3A3A]/40">{hint}</span>}</label>;
}

function TextAreaField({ label, value, onChange, className = "", ...props }: { label: string; value: string; onChange: (value: string) => void; className?: string } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
    return <label className={`block ${className}`}><span className="text-xs font-semibold text-[#3A3A3A]/75">{label}</span><textarea {...props} value={value} onChange={(event) => onChange(event.target.value)} rows={6} className="mt-2 w-full resize-y rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3.5 py-3 text-sm leading-6 text-[#3A3A3A] outline-none transition focus:border-[#F47822] focus:bg-white focus:ring-4 focus:ring-[#F47822]/8" /></label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
    return <label className="block"><span className="text-xs font-semibold text-[#3A3A3A]/75">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3.5 text-sm text-[#3A3A3A] outline-none transition focus:border-[#F47822] focus:bg-white focus:ring-4 focus:ring-[#F47822]/8">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function Notice({ variant, children }: { variant: "success" | "error"; children: string }) {
    const classes = variant === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800";
    return <div className={`rounded-xl border px-4 py-3 text-sm ${classes}`}>{children}</div>;
}

function EditorSkeleton() {
    return <div className="mx-auto max-w-6xl space-y-6"><div className="h-24 animate-pulse rounded-2xl bg-black/5" /><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]"><div className="h-[620px] animate-pulse rounded-2xl bg-black/5" /><div className="h-64 animate-pulse rounded-2xl bg-black/5" /></div></div>;
}
