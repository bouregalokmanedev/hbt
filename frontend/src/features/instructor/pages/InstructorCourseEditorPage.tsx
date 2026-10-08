import {
    Activity,
    Archive,
    ArrowLeft,
    Award,
    CheckCircle2,
    ClipboardCheck,
    ExternalLink,
    Eye,
    FileCheck2,
    ImagePlus,
    Link2,
    LoaderCircle,
    RotateCcw,
    Save,
    Send,
    Trash2,
    Upload,
} from "lucide-react";
import {
    FormEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Link,
    useBlocker,
    useNavigate,
    useParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
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
    getInstructorAssessments,
    getInstructorCourse,
    getInstructorCurriculum,
    getInstructorQuizzes,
    runInstructorCourseAction,
    updateInstructorCourse,
    uploadInstructorCourseMedia,
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
    const { t } = useTranslation();
    const { courseId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isNew = courseId === "new";
    const [form, setForm] = useState<CourseForm>(emptyForm);
    const [savedForm, setSavedForm] = useState<CourseForm>(emptyForm);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

    const courseQuery = useQuery({
        queryKey: ["instructor", "course", courseId],
        queryFn: () => getInstructorCourse(courseId!),
        enabled: !isNew && Boolean(courseId),
    });

    const course = courseQuery.data;

    useEffect(() => {
        if (course) {
            const next = toForm(course);
            setForm(next);
            setSavedForm(next);
        }
    }, [course]);

    const statusText = (status: string): string => {
        switch (status) {
            case "published":
                return t("instructor.dashboard.status.published");
            case "review":
                return t("instructor.dashboard.status.review");
            case "archived":
                return t("instructor.dashboard.status.archived");
            default:
                return t("instructor.dashboard.status.draft");
        }
    };

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
            setNotice(isNew ? t("instructor.editor.created") : t("instructor.editor.saved"));
            setSavedForm(form);
            setLastSavedAt(new Date().toISOString());
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
            setError(readError(requestError, t("instructor.editor.actionFail")));
        },
    });

    const lifecycleMutation = useMutation({
        mutationFn: (action: InstructorCourseLifecycleAction) =>
            runInstructorCourseAction(courseId!, action),
        onSuccess: async (updatedCourse, action) => {
            setError(null);
            setNotice(t(lifecycleKey(action)));
            queryClient.setQueryData(
                ["instructor", "course", courseId],
                updatedCourse,
            );
            await refreshInstructorData();
        },
        onError: (requestError) => {
            setNotice(null);
            setError(readError(requestError, t("instructor.editor.actionFail")));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteInstructorCourse(courseId!),
        onSuccess: async () => {
            await refreshInstructorData();
            navigate("/instructor/courses", { replace: true });
        },
        onError: (requestError) => setError(readError(requestError, t("instructor.editor.actionFail"))),
    });

    const dirty = useMemo(
        () => JSON.stringify(form) !== JSON.stringify(savedForm),
        [form, savedForm],
    );

    // Draft autosave for saved courses: quiet 4s debounce after the last
    // keystroke. New courses stay manual until the first draft exists.
    useEffect(() => {
        if (isNew || !dirty || saveMutation.isPending) return;
        const timer = window.setTimeout(() => saveMutation.mutate(), 4000);
        return () => window.clearTimeout(timer);
    });

    // Guard against losing unsaved edits through sidebar/back navigation.
    const blocker = useBlocker(dirty && !saveMutation.isPending);

    const lifecycleActions = useMemo(() => {
        if (!course) {
            return [];
        }

        if (course.status === "draft") {
            return [{ action: "submit-review" as const, label: t("instructor.editor.lifecycle.submitReview"), icon: Send }];
        }

        if (course.status === "review") {
            return [{ action: "publish" as const, label: t("instructor.editor.lifecycle.publish"), icon: CheckCircle2 }];
        }

        if (course.status === "published") {
            return [
                { action: "unpublish" as const, label: t("instructor.editor.lifecycle.unpublish"), icon: Eye },
                { action: "archive" as const, label: t("instructor.editor.lifecycle.archive"), icon: Archive },
            ];
        }

        return [{ action: "restore" as const, label: t("instructor.editor.lifecycle.restore"), icon: RotateCcw }];
    }, [course, t]);

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
                <h1 className="text-lg font-semibold text-red-900">{t("instructor.editor.errorTitle")}</h1>
                <p className="mt-2 text-sm text-red-700">{t("instructor.editor.errorDesc")}</p>
                <Link to="/instructor/courses" className="mt-5 inline-flex rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-semibold text-white">{t("instructor.editor.back")}</Link>
            </div>
        );
    }

    const isWorking = saveMutation.isPending || lifecycleMutation.isPending || deleteMutation.isPending;

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <Link to="/instructor/courses" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3A3A3A]/50 transition hover:text-[#F47822]">
                        <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
                        {t("instructor.editor.back")}
                    </Link>
                    <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">
                        {isNew ? t("instructor.editor.eyebrowNew") : t("instructor.editor.eyebrowEdit")}
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#3A3A3A]">
                        {isNew ? t("instructor.editor.titleNew") : course?.title ?? t("instructor.editor.titleFallback")}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3A3A3A]/50">
                        {isNew
                            ? t("instructor.editor.descNew")
                            : t("instructor.editor.descEdit")}
                    </p>
                </div>

                {!isNew && course && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#F47822]/10 px-3 py-1.5 text-[10px] font-bold capitalize tracking-[0.08em] text-[#F47822]">
                            {statusText(course.status)}
                        </span>
                        {course.status === "published" && (
                            <Link to={`/courses/${course.id}`} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 text-xs font-bold text-[#3A3A3A]/65 shadow-sm transition hover:border-[#F47822]/35 hover:bg-[#FFF8F4] hover:text-[#F47822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/35">
                                <ExternalLink className="h-3.5 w-3.5" /> {t("instructor.editor.preview")}
                            </Link>
                        )}
                        <Link to={`/instructor/courses/${course.id}/curriculum`} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#F47822] px-3.5 text-xs font-bold text-white shadow-[0_7px_16px_rgba(244,120,34,.2)] transition hover:bg-[#de6414] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/40">
                            <FileCheck2 className="h-3.5 w-3.5" /> {t("instructor.editor.curriculum")}
                        </Link>
                        <Link to={`/instructor/courses/${course.id}/assessments`} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#F47822]/25 bg-[#FFF8F4] px-3.5 text-xs font-bold text-[#F47822] shadow-sm transition hover:bg-[#F47822] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/35">
                            <ClipboardCheck className="h-3.5 w-3.5" /> {t("instructor.editor.assessments")}
                        </Link>
                        <Link to={`/instructor/courses/${course.id}/analytics`} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 text-xs font-bold text-[#3A3A3A]/65 shadow-sm transition hover:border-[#F47822]/35 hover:bg-[#FFF8F4] hover:text-[#F47822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/35">
                            <Activity className="h-3.5 w-3.5" /> {t("instructor.editor.analytics")}
                        </Link>
                        <Link to={`/instructor/courses/${course.id}/outcomes`} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 text-xs font-bold text-[#3A3A3A]/65 shadow-sm transition hover:border-[#F47822]/35 hover:bg-[#FFF8F4] hover:text-[#F47822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/35">
                            <Award className="h-3.5 w-3.5" /> {t("instructor.editor.outcomes")}
                        </Link>
                    </div>
                )}
            </header>

            {notice && <Notice variant="success">{notice}</Notice>}
            {error && <Notice variant="error">{error}</Notice>}

            {blocker.state === "blocked" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]/45 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-label={t("instructor.editor.leaveTitle")}>
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                        <h2 className="text-base font-bold text-[#3A3A3A]">{t("instructor.editor.leaveTitle")}</h2>
                        <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/55">{t("instructor.editor.leaveDesc")}</p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={() => blocker.reset()} className="rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#F47822]">
                                {t("instructor.editor.leaveStay")}
                            </button>
                            <button type="button" onClick={() => blocker.proceed()} className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50">
                                {t("instructor.editor.leaveDiscard")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.04)] sm:p-6">
                        <SectionTitle title={t("instructor.editor.basicsTitle")} description={t("instructor.editor.basicsDesc")} />
                        <div className="mt-6 grid gap-5 md:grid-cols-2">
                            <TextField label={t("instructor.editor.title")} value={form.title} required className="md:col-span-2" onChange={(value) => {
                                updateField("title", value);
                                if (isNew && !form.slug) updateField("slug", slugify(value));
                            }} />
                            <TextField label={t("instructor.editor.slug")} value={form.slug} required hint={t("instructor.editor.slugHint")} onChange={(value) => updateField("slug", slugify(value))} />
                            <SelectField label={t("instructor.editor.difficulty")} value={form.difficulty} onChange={(value) => updateField("difficulty", value)} options={[["beginner", t("instructor.editor.difficulties.beginner")], ["intermediate", t("instructor.editor.difficulties.intermediate")], ["advanced", t("instructor.editor.difficulties.advanced")], ["all levels", t("instructor.editor.difficulties.all")]]} />
                            <TextField label={t("instructor.editor.shortDesc")} value={form.short_description} required className="md:col-span-2" onChange={(value) => updateField("short_description", value)} />
                            <TextAreaField label={t("instructor.editor.fullDesc")} value={form.description} required className="md:col-span-2" onChange={(value) => updateField("description", value)} />
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_8px_30px_rgba(58,58,58,0.04)]">
                        <div className="border-b border-[#3A3A3A]/6 bg-[#FCFCFC] px-5 py-4 sm:px-6">
                            <SectionTitle title={t("instructor.editor.accessTitle")} description={t("instructor.editor.accessDesc")} />
                            <AccessSummary form={form} />
                        </div>
                        <div className="grid gap-0 md:grid-cols-2 md:divide-x md:divide-[#3A3A3A]/6 rtl:md:divide-x-reverse">
                            <div className="p-5 sm:p-6">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("instructor.editor.accessLearning")}</p>
                                <div className="mt-4 grid gap-5">
                                    <TextField label={t("instructor.editor.language")} value={form.language} required onChange={(value) => updateField("language", value)} />
                                    <div>
                                        <TextField label={t("instructor.editor.duration")} value={form.duration_minutes} required type="number" min="0" onChange={(value) => updateField("duration_minutes", value)} />
                                        {Number(form.duration_minutes) > 0 && (
                                            <p className="mt-1.5 text-[11px] text-[#3A3A3A]/45">
                                                ≈ {Math.floor(Number(form.duration_minutes) / 60)}h {Number(form.duration_minutes) % 60}m of content
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-[#3A3A3A]/6 p-5 sm:p-6 md:border-t-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("instructor.editor.accessPricing")}</p>
                                <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-[#F7F7F7] p-1">
                                    {(["public", "private", "unlisted"] as const).map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => updateField("visibility", option)}
                                            aria-pressed={form.visibility === option}
                                            className={`rounded-lg px-2 py-2 text-[11px] font-bold capitalize transition ${form.visibility === option ? "bg-white text-[#F47822] shadow-sm" : "text-[#3A3A3A]/50 hover:text-[#3A3A3A]"}`}
                                        >
                                            {t(`instructor.editor.visibilities.${option}`)}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => updateField("is_free", !form.is_free)}
                                    aria-pressed={form.is_free}
                                    className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-[#3A3A3A]/10 px-3.5 py-3 text-sm transition hover:border-[#F47822]/30"
                                >
                                    <span className="font-semibold text-[#3A3A3A]">{t("instructor.editor.free")}</span>
                                    <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${form.is_free ? "bg-[#F47822]" : "bg-[#3A3A3A]/15"}`}>
                                        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${form.is_free ? "left-6 rtl:left-1 rtl:right-6" : "left-1 rtl:left-auto rtl:right-1"}`} />
                                    </span>
                                </button>
                                {!form.is_free && (
                                    <div className="mt-4 grid gap-4">
                                        <TextField label={t("instructor.editor.price")} value={form.price} required type="number" min="0" onChange={(value) => updateField("price", value)} />
                                        <div className="grid grid-cols-2 gap-3">
                                            <TextField label={t("instructor.editor.discount")} value={form.discount_price} type="number" min="0" onChange={(value) => updateField("discount_price", value)} />
                                            <TextField label={t("instructor.editor.currency")} value={form.currency} required maxLength={3} onChange={(value) => updateField("currency", value.toUpperCase())} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.04)] sm:p-6">
                        <SectionTitle title={t("instructor.editor.mediaTitle")} description={t("instructor.editor.mediaDesc")} />
                        <div className="mt-6 grid gap-5">
                            <MediaField label={t("instructor.editor.thumbnail")} value={form.thumbnail} kind="image" courseId={isNew ? undefined : courseId} onChange={(value) => updateField("thumbnail", value)} />
                            <MediaField label={t("instructor.editor.cover")} value={form.cover_image} kind="image" courseId={isNew ? undefined : courseId} onChange={(value) => updateField("cover_image", value)} />
                            <MediaField label={t("instructor.editor.previewVideo")} value={form.preview_video} kind="video" courseId={isNew ? undefined : courseId} onChange={(value) => updateField("preview_video", value)} />
                        </div>
                    </section>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        {dirty ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                {t("instructor.editor.unsavedBadge")}
                            </span>
                        ) : lastSavedAt ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {t("instructor.editor.autosaved")}
                            </span>
                        ) : null}
                        <Link to="/instructor/courses" className="rounded-xl px-4 py-3 text-xs font-semibold text-[#3A3A3A]/55 transition hover:bg-white hover:text-[#3A3A3A]">{t("instructor.editor.cancel")}</Link>
                        <button type="submit" disabled={isWorking} className="inline-flex items-center gap-2 rounded-xl bg-[#3A3A3A] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#F47822] disabled:cursor-not-allowed disabled:opacity-60">
                            {saveMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saveMutation.isPending ? t("instructor.editor.autosaving") : isNew ? t("instructor.editor.createDraft") : t("instructor.editor.save")}
                        </button>
                    </div>
                </form>

                {!isNew && course && <aside className="h-fit space-y-4 xl:sticky xl:top-24">
                    <SetupChecklist courseId={courseId!} form={form} />
                    <section className="rounded-2xl border border-[#3A3A3A]/8 bg-[#3A3A3A] p-5 text-white shadow-[0_10px_30px_rgba(58,58,58,.12)]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F9A16C]">{t("instructor.editor.publishEyebrow")}</p>
                        <h2 className="mt-3 text-lg font-semibold capitalize">{statusText(course.status)}</h2>
                        <p className="mt-2 text-xs leading-5 text-white/60">{t("instructor.editor.publishHint")}</p>
                        <div className="mt-5 space-y-2">
                            {lifecycleActions.map(({ action, label, icon: Icon }) => <button key={action} type="button" disabled={isWorking} onClick={() => lifecycleMutation.mutate(action)} className="flex w-full items-center justify-between rounded-xl bg-white px-3.5 py-3 text-start text-xs font-bold text-[#3A3A3A] transition hover:bg-[#F47822] hover:text-white disabled:opacity-60"><span>{label}</span><Icon className={`h-4 w-4 ${action === "submit-review" ? "rtl:-scale-x-100" : ""}`} /></button>)}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-red-100 bg-red-50 p-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">{t("instructor.editor.dangerTitle")}</p>
                        <p className="mt-2 text-xs leading-5 text-red-900/65">{t("instructor.editor.dangerDesc")}</p>
                        <button type="button" disabled={isWorking} onClick={() => {
                            if (window.confirm(t("instructor.editor.deleteConfirm", { title: course.title }))) deleteMutation.mutate();
                        }} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-red-700 transition hover:text-red-900 disabled:opacity-60"><Trash2 className="h-4 w-4" /> {t("instructor.editor.delete")}</button>
                    </section>
                </aside>}
            </div>
        </div>
    );
}

function lifecycleKey(action: InstructorCourseLifecycleAction): string {
    return ({ publish: "instructor.editor.lifecycleDone.publish", unpublish: "instructor.editor.lifecycleDone.unpublish", "submit-review": "instructor.editor.lifecycleDone.submitReview", archive: "instructor.editor.lifecycleDone.archive", restore: "instructor.editor.lifecycleDone.restore" })[action];
}

function readError(error: unknown, fallback: string): string {
    return error instanceof ApiError ? error.message : fallback;
}

function AccessSummary({ form }: { form: CourseForm }) {
    const { t } = useTranslation();
    const price = form.is_free
        ? t("instructor.editor.accessSummaryFree")
        : `${form.price || "0"} ${form.currency}`;
    return (
        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#F47822]/8 px-3 py-1.5 text-[11px] font-bold text-[#F47822]">
            <Eye className="h-3.5 w-3.5" />
            {price} · {t(`instructor.editor.visibilities.${form.visibility}` as "instructor.editor.visibilities.public")} · {form.duration_minutes || "0"} min
        </p>
    );
}

function SetupChecklist({ courseId, form }: { courseId: string; form: CourseForm }) {
    const { t } = useTranslation();
    const curriculum = useQuery({
        queryKey: ["instructor", "curriculum", courseId, "checklist"],
        queryFn: () => getInstructorCurriculum(courseId),
    });
    const quizzes = useQuery({
        queryKey: ["instructor", "quizzes", courseId, "checklist"],
        queryFn: () => getInstructorQuizzes(courseId),
    });
    const assessments = useQuery({
        queryKey: ["instructor", "assessments", courseId, "checklist"],
        queryFn: () => getInstructorAssessments(courseId),
    });

    const sections = curriculum.data?.sections ?? [];
    const publishedLessons = sections.flatMap((section) => section.lessons).filter((lesson) => lesson.status === "published").length;

    const required = [
        {
            done: form.title.trim() !== "" && form.description.trim() !== "" && Number(form.duration_minutes) > 0,
            label: t("instructor.editor.checklistBasics"),
            hint: t("instructor.editor.checklistBasicsHint"),
            to: undefined,
        },
        {
            done: form.thumbnail.trim() !== "",
            label: t("instructor.editor.checklistMedia"),
            hint: t("instructor.editor.checklistMediaHint"),
            to: undefined,
        },
        {
            done: sections.length > 0,
            label: t("instructor.editor.checklistCurriculum"),
            hint: t("instructor.editor.checklistCurriculumHint"),
            to: `/instructor/courses/${courseId}/curriculum`,
        },
        {
            done: publishedLessons > 0,
            label: t("instructor.editor.checklistLessons"),
            hint: t("instructor.editor.checklistLessonsHint"),
            to: `/instructor/courses/${courseId}/curriculum`,
        },
    ];
    const bonus = [
        {
            done: (quizzes.data?.length ?? 0) > 0,
            label: t("instructor.editor.checklistQuiz"),
            hint: t("instructor.editor.checklistQuizHint"),
            to: `/instructor/courses/${courseId}/quizzes`,
        },
        {
            done: (assessments.data?.length ?? 0) > 0,
            label: t("instructor.editor.checklistAssessment"),
            hint: t("instructor.editor.checklistAssessmentHint"),
            to: `/instructor/courses/${courseId}/assessments`,
        },
    ];

    const doneCount = required.filter((step) => step.done).length;
    const percent = Math.round((doneCount / required.length) * 100);

    return (
        <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("instructor.editor.checklistEyebrow")}</p>
            <h2 className="mt-2 text-base font-bold text-[#3A3A3A]">{t("instructor.editor.checklistTitle")}</h2>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#3A3A3A]/8">
                <div className="h-full rounded-full bg-[#F47822] transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 text-[11px] font-bold text-[#3A3A3A]/55">
                {percent === 100 ? t("instructor.editor.checklistReady") : t("instructor.editor.checklistAlmost", { done: doneCount, total: required.length })}
            </p>
            <ul className="mt-4 space-y-2">
                {[...required, ...bonus].map((step) => (
                    <li key={step.label}>
                        {step.to ? (
                            <Link to={step.to} className="flex items-start gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-[#F7F7F7]">
                                <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${step.done ? "text-emerald-500" : "text-[#3A3A3A]/20"}`} />
                                <span>
                                    <span className="block text-xs font-bold text-[#3A3A3A]">{step.label}</span>
                                    <span className="mt-0.5 block text-[10px] text-[#3A3A3A]/45">{step.hint}</span>
                                </span>
                            </Link>
                        ) : (
                            <div className="flex items-start gap-2.5 px-2 py-1.5">
                                <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${step.done ? "text-emerald-500" : "text-[#3A3A3A]/20"}`} />
                                <span>
                                    <span className="block text-xs font-bold text-[#3A3A3A]">{step.label}</span>
                                    <span className="mt-0.5 block text-[10px] text-[#3A3A3A]/45">{step.hint}</span>
                                </span>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}

function MediaField({ label, value, kind, courseId, onChange }: { label: string; value: string; kind: "image" | "video"; courseId?: string; onChange: (value: string) => void }) {
    const { t } = useTranslation();
    const [mode, setMode] = useState<"url" | "upload">("url");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const accept = kind === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp";
    const localhostWarning =
        /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)([:/]|$)/i.test(value.trim()) &&
        !/^(https?:\/\/)?(localhost|127\.0\.0\.1)([:/]|$)/i.test(import.meta.env.VITE_API_URL ?? "");
    const recentKey = courseId ? `hbt:course-media:${courseId}` : null;
    const [recent, setRecent] = useState<Array<{ url: string; name: string }>>(() => {
        if (!recentKey) return [];
        try {
            const raw = localStorage.getItem(recentKey);
            const parsed: unknown = JSON.parse(raw ?? "[]");
            return Array.isArray(parsed) ? parsed.filter((entry): entry is { url: string; name: string } => typeof entry?.url === "string") : [];
        } catch {
            return [];
        }
    });

    const rememberUpload = (url: string, name: string) => {
        if (!recentKey) return;
        setRecent((current) => {
            const next = [{ url, name }, ...current.filter((entry) => entry.url !== url)].slice(0, 6);
            try {
                localStorage.setItem(recentKey, JSON.stringify(next));
            } catch {
                // Storage unavailable — reuse list simply stays empty.
            }
            return next;
        });
    };

    const pick = async (file?: File | null) => {
        if (!file || uploading || !courseId) return;
        setError(null);
        if (file.size > 50 * 1024 * 1024) {
            setError(t("instructor.editor.mediaTooBig"));
            return;
        }
        const ok = kind === "video" ? file.type.startsWith("video/") : file.type.startsWith("image/");
        if (!ok) {
            setError(t("instructor.editor.mediaBadType"));
            return;
        }
        try {
            setUploading(true);
            const media = await uploadInstructorCourseMedia(courseId, file);
            rememberUpload(media.url, file.name);
            onChange(media.url);
            setMode("url");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : t("instructor.editor.mediaUploadFail"));
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    return (
        <div className="rounded-xl border border-[#3A3A3A]/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#3A3A3A]/75">{label}</span>
                <div className="flex rounded-lg bg-[#F7F7F7] p-0.5 text-[11px] font-bold">
                    <button type="button" onClick={() => setMode("url")} aria-pressed={mode === "url"} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 transition ${mode === "url" ? "bg-white text-[#F47822] shadow-sm" : "text-[#3A3A3A]/50"}`}>
                        <Link2 className="h-3 w-3" /> {t("instructor.editor.mediaUrlTab")}
                    </button>
                    <button type="button" onClick={() => setMode("upload")} aria-pressed={mode === "upload"} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 transition ${mode === "upload" ? "bg-white text-[#F47822] shadow-sm" : "text-[#3A3A3A]/50"}`}>
                        <Upload className="h-3 w-3" /> {t("instructor.editor.mediaUploadTab")}
                    </button>
                </div>
            </div>

            {value && kind === "image" && (
                <div className="relative mt-3 overflow-hidden rounded-lg border border-[#3A3A3A]/8 bg-[#222]">
                    <img src={value} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} className="aspect-[16/9] w-full object-cover" />
                    <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-1 text-[10px] font-bold text-white">{t("instructor.editor.mediaPreview")}</span>
                </div>
            )}

            {mode === "url" ? (
                <>
                <input value={value} type="url" dir="ltr" placeholder="https://" onChange={(event) => onChange(event.target.value)} className="mt-3 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3.5 text-left text-sm text-[#3A3A3A] outline-none transition placeholder:text-[#3A3A3A]/30 focus:border-[#F47822] focus:bg-white focus:ring-4 focus:ring-[#F47822]/8" />
                {localhostWarning && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-5 text-amber-700">
                        This URL points to localhost — it loads here but will break in production. Upload the file instead.
                    </p>
                )}
                </>
            ) : !courseId ? (
                <p className="mt-3 rounded-lg bg-[#FFF8F4] px-3 py-2.5 text-[11px] leading-5 text-[#9c4209]">{t("instructor.editor.mediaUploadNew")}</p>
            ) : (
                <div className="mt-3">
                    <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={(event) => void pick(event.target.files?.[0])} />
                    <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#3A3A3A] px-4 text-xs font-bold text-white transition hover:bg-[#F47822] disabled:opacity-60">
                        {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                        {uploading ? t("instructor.curriculum.uploading") : accept}
                    </button>
                    <p className="mt-2 text-[10px] leading-4 text-[#3A3A3A]/40">{t("instructor.editor.mediaMaxHint")}</p>
                    {error && <p className="mt-2 text-[11px] font-semibold text-red-600">{error}</p>}
                    {recent.length > 0 && (
                        <div className="mt-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/40">{t("instructor.editor.mediaRecent")}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {recent.map((entry) => (
                                    <button key={entry.url} type="button" onClick={() => { onChange(entry.url); setMode("url"); }} title={entry.url} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[#3A3A3A]/10 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#3A3A3A]/65 transition hover:border-[#F47822]/40 hover:text-[#F47822]">
                                        <span className="max-w-[140px] truncate">{entry.name}</span>
                                        <span className="font-bold text-[#F47822]">{t("instructor.editor.mediaUse")}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {mode === "url" && error && <p className="mt-2 text-[11px] font-semibold text-red-600">{error}</p>}
        </div>
    );
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
