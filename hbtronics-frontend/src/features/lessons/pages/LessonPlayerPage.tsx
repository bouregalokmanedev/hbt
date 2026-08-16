
import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    PlayCircle,
    BookOpen,
    Sparkles,
} from "lucide-react";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useLessonProgress,
} from "../hooks/useLessonProgress";

import {
    useLesson,
} from "../hooks/useLesson";

import {
    completeLesson,
    updateLessonProgress,
} from "../api/lessons.api";


function formatDuration(
    minutes: number,
): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours =
        Math.floor(minutes / 60);

    const remaining =
        minutes % 60;

    if (remaining === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remaining}m`;
}


export function LessonPlayerPage() {
    const { lessonId, courseId } =
        useParams<{
            lessonId: string;
            courseId?: string;
        }>();

    const navigate =
        useNavigate();


    /*
    |--------------------------------------------------------------------------
    | Lesson
    |--------------------------------------------------------------------------
    */

    const {
        lesson,
        isLoading,
        error,
    } = useLesson(lessonId);


    /*
    |--------------------------------------------------------------------------
    | Saved progress
    |--------------------------------------------------------------------------
    */

    const {
        progress: savedProgress,
        isLoading: isProgressLoading,
    } = useLessonProgress(
        lessonId,
    );


    /*
    |--------------------------------------------------------------------------
    | Local progress state
    |--------------------------------------------------------------------------
    */

    const [progress, setProgress] =
        useState(0);

    const [isCompleting, setIsCompleting] =
        useState(false);

    const [isSaving, setIsSaving] =
        useState(false);


    /*
    |--------------------------------------------------------------------------
    | Refs
    |--------------------------------------------------------------------------
    */

    const lessonContentRef =
        useRef<HTMLElement | null>(
            null,
        );

    const progressRef =
        useRef(progress);

    const saveTimeoutRef =
        useRef<ReturnType<
            typeof setTimeout
        > | null>(null);

    const completedRef =
        useRef(false);


    /*
    |--------------------------------------------------------------------------
    | Keep progressRef synchronized
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        progressRef.current =
            progress;
    }, [progress]);


    /*
    |--------------------------------------------------------------------------
    | Initialize from saved backend progress
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!savedProgress) {
            return;
        }

        const saved =
            Math.min(
                Math.max(
                    savedProgress.progress_percentage ??
                        0,
                    0,
                ),
                100,
            );

        setProgress(saved);

        progressRef.current =
            saved;

        if (saved >= 100) {
            completedRef.current =
                true;
        }
    }, [savedProgress]);


    /*
    |--------------------------------------------------------------------------
    | Calculate reading progress
    |--------------------------------------------------------------------------
    |
    | Progress is based on how far the student has read through the lesson.
    |
    | Reaching the bottom = 100%.
    |
    */

    function calculateReadingProgress(): number {
        const element =
            lessonContentRef.current;

        if (!element) {
            return 0;
        }

        const rect =
            element.getBoundingClientRect();

        const contentTop =
            window.scrollY +
            rect.top;

        const contentHeight =
            element.scrollHeight;

        const contentBottom =
            contentTop +
            contentHeight;

        const viewportBottom =
            window.scrollY +
            window.innerHeight;


        if (
            viewportBottom <=
            contentTop
        ) {
            return 0;
        }


        if (
            viewportBottom >=
            contentBottom
        ) {
            return 100;
        }


        const readableDistance =
            viewportBottom -
            contentTop;

        const percentage =
            (
                readableDistance /
                contentHeight
            ) * 100;


        return Math.min(
            Math.max(
                Math.round(
                    percentage,
                ),
                0,
            ),
            100,
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Complete lesson
    |--------------------------------------------------------------------------
    */

    async function handleComplete() {
        if (
            !lessonId ||
            completedRef.current
        ) {
            return;
        }

        try {
            setIsCompleting(true);

            const result =
                await completeLesson(
                    lessonId,
                );


            const completedProgress =
                result.progress_percentage ??
                100;


            completedRef.current =
                true;

            setProgress(
                Math.max(
                    completedProgress,
                    100,
                ),
            );

            progressRef.current =
                100;

        } finally {
            setIsCompleting(false);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | Save progress to API
    |--------------------------------------------------------------------------
    |
    | Debounced so rapid scrolling doesn't produce an API request
    | for every scroll event.
    |
    */

    function scheduleProgressSave(
        value: number,
    ) {
        if (!lessonId) {
            return;
        }


        const currentProgress =
            progressRef.current;


        /*
        |--------------------------------------------------------------------------
        | Never decrease progress
        |--------------------------------------------------------------------------
        */

        if (
            value <=
            currentProgress
        ) {
            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Update UI immediately
        |--------------------------------------------------------------------------
        */

        setProgress(value);

        progressRef.current =
            value;


        /*
        |--------------------------------------------------------------------------
        | Clear previous pending save
        |--------------------------------------------------------------------------
        */

        if (
            saveTimeoutRef.current
        ) {
            clearTimeout(
                saveTimeoutRef.current,
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Debounced API request
        |--------------------------------------------------------------------------
        */

        saveTimeoutRef.current =
            setTimeout(
                async () => {
                    try {
                        setIsSaving(
                            true,
                        );


                        const result =
                            await updateLessonProgress(
                                lessonId,
                                {
                                    progress_percentage:
                                        value,
                                },
                            );


                        const saved =
                            Math.min(
                                Math.max(
                                    result.progress_percentage ??
                                        value,
                                    0,
                                ),
                                100,
                            );


                        /*
                        |--------------------------------------------------------------------------
                        | Keep highest progress
                        |--------------------------------------------------------------------------
                        */

                        const highest =
                            Math.max(
                                progressRef.current,
                                saved,
                            );


                        setProgress(
                            highest,
                        );

                        progressRef.current =
                            highest;


                        /*
                        |--------------------------------------------------------------------------
                        | Automatically complete at 100%
                        |--------------------------------------------------------------------------
                        */

                        if (
                            highest >=
                                100 &&
                            !completedRef.current
                        ) {
                            await handleComplete();
                        }

                    } finally {
                        setIsSaving(
                            false,
                        );
                    }
                },
                700,
            );
    }


    /*
    |--------------------------------------------------------------------------
    | Scroll listener
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!lesson) {
            return;
        }


        function handleScroll() {
            const readingProgress =
                calculateReadingProgress();


            scheduleProgressSave(
                readingProgress,
            );
        }


        window.addEventListener(
            "scroll",
            handleScroll,
            {
                passive: true,
            },
        );


        handleScroll();


        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll,
            );


            if (
                saveTimeoutRef.current
            ) {
                clearTimeout(
                    saveTimeoutRef.current,
                );
            }
        };

    }, [
        lesson,
        lessonId,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Loading state
    |--------------------------------------------------------------------------
    */

    if (
        isLoading ||
        isProgressLoading
    ) {
        return (
            <main className="min-h-screen bg-background">
                <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-8">

                        <div className="h-10 w-40 rounded-full bg-muted" />

                        <div className="space-y-4">
                            <div className="h-5 w-28 rounded-full bg-muted" />

                            <div className="h-12 w-3/4 rounded-xl bg-muted" />

                            <div className="h-6 w-1/2 rounded-lg bg-muted" />
                        </div>

                        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">

                            <div className="h-[600px] rounded-3xl bg-muted" />

                            <div className="h-[360px] rounded-3xl bg-muted" />

                        </div>

                    </div>
                </div>
            </main>
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Error state
    |--------------------------------------------------------------------------
    */

    if (
        error ||
        !lesson
    ) {
        return (
            <main className="min-h-screen bg-background">

                <div className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">

                    <div className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-12">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F47822]/10">

                            <BookOpen className="h-8 w-8 text-[#F47822]" />

                        </div>


                        <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
                            Lesson unavailable
                        </h1>


                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                            {error ??
                                "We couldn't find this lesson."}
                        </p>


                        <Link
                            to="/courses"
                            className="mt-7 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-[#F47822]/40 hover:bg-[#F47822]/5 hover:text-[#F47822]"
                        >
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-[#F47822]/10">
                                <ArrowLeft className="h-4 w-4" />
                            </span>

                            Back to courses
                        </Link>

                    </div>

                </div>

            </main>
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Page
    |--------------------------------------------------------------------------
    */

    return (
        <main className="min-h-screen bg-background">

            {/* ============================================================= */}
            {/* Global progress indicator */}
            {/* ============================================================= */}

            <div className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">

                <div className="h-1 bg-muted">

                    <div
                        className="h-full bg-[#F47822] transition-all duration-300"
                        style={{
                            width: `${progress}%`,
                        }}
                    />

                </div>

            </div>


            {/* ============================================================= */}
            {/* Main content */}
            {/* ============================================================= */}

            <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">


                {/* ========================================================= */}
                {/* Back navigation */}
                {/* ========================================================= */}

                <div className="mb-9">

                    <Link
                         to={`/courses/${courseId}`}
                        className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-[#F47822]/40 hover:bg-[#F47822]/5 hover:text-[#F47822]"
                    >

                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-[#F47822]/10">

                            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />

                        </span>

                        <span>
                            Back to course
                        </span>

                    </Link>

                </div>


                {/* ========================================================= */}
                {/* Lesson header */}
                {/* ========================================================= */}

                <header className="mb-10 max-w-4xl">

                    <div className="mb-5 flex flex-wrap items-center gap-2">

                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F47822]/20 bg-[#F47822]/10 px-3 py-1.5 text-xs font-semibold text-[#F47822]">

                            <PlayCircle className="h-3.5 w-3.5" />

                            Lesson

                        </span>


                        {lesson.is_preview && (
                            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">

                                Preview

                            </span>
                        )}


                        {progress === 100 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600">

                                <CheckCircle2 className="h-3.5 w-3.5" />

                                Completed

                            </span>
                        )}

                    </div>


                    <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl lg:leading-[1.08]">

                        {lesson.title}

                    </h1>


                    {lesson.description && (
                        <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">

                            {lesson.description}

                        </p>
                    )}


                    <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">

                        <span className="inline-flex items-center gap-2">

                            <Clock3 className="h-4 w-4" />

                            {formatDuration(
                                lesson.duration_minutes,
                            )}

                        </span>


                        <span className="h-4 w-px bg-border" />


                        <span className="font-medium text-foreground">

                            {progress}% complete

                        </span>

                    </div>

                </header>


                {/* ========================================================= */}
                {/* Content + progress sidebar */}
                {/* ========================================================= */}

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">


                    {/* ===================================================== */}
                    {/* Lesson content */}
                    {/* ===================================================== */}

                    <section className="min-w-0">

                        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">


                            {/* Content header */}

                            <div className="flex items-center gap-3 border-b border-border bg-muted/20 px-5 py-4 sm:px-7">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822]/10">

                                    <BookOpen className="h-5 w-5 text-[#F47822]" />

                                </div>


                                <div>

                                    <p className="text-sm font-semibold text-foreground">
                                        Lesson content
                                    </p>

                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Read through the lesson to complete it.
                                    </p>

                                </div>

                            </div>


                            {/* ================================================= */}
                            {/* Actual readable content */}
                            {/* ================================================= */}

                            <article
                                ref={lessonContentRef}
                                className="px-5 py-9 sm:px-8 sm:py-11 lg:px-10"
                            >

                                {lesson.content ? (
                                    <div className="max-w-3xl whitespace-pre-line text-[16px] leading-8 text-foreground/90 sm:text-[17px] sm:leading-9">

                                        {lesson.content}

                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-border p-8 text-center">

                                        <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />

                                        <p className="mt-4 text-sm text-muted-foreground">

                                            No lesson content available yet.

                                        </p>

                                    </div>
                                )}

                            </article>


                            {/* ================================================= */}
                            {/* End of lesson */}
                            {/* ================================================= */}

                            <div className="border-t border-border bg-muted/20 px-5 py-9 text-center sm:px-8">

                                <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-[#F47822]/10">

                                    <CheckCircle2 className="h-6 w-6 text-[#F47822]" />

                                </div>


                                <h3 className="mt-4 text-lg font-semibold text-foreground">

                                    End of lesson

                                </h3>


                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">

                                    You've reached the end of this lesson.
                                    Your progress will be saved automatically.

                                </p>

                            </div>

                        </div>

                    </section>


                    {/* ===================================================== */}
                    {/* Progress sidebar */}
                    {/* ===================================================== */}

                    <aside className="lg:sticky lg:top-24 lg:self-start">

                        <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_12px_40px_rgba(15,23,42,0.07)]">

                            {/* Accent */}

                            <div className="h-1.5 bg-[#F47822]" />


                            <div className="p-6">


                                {/* ================================================= */}
                                {/* Heading */}
                                {/* ================================================= */}

                                <div className="flex items-start justify-between gap-4">

                                    <div>

                                        <div className="flex items-center gap-2">

                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F47822]/10">

                                                <Sparkles className="h-4 w-4 text-[#F47822]" />

                                            </div>

                                            <div>

                                                <p className="text-sm font-bold text-foreground">
                                                    Your progress
                                                </p>

                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    Keep going
                                                </p>

                                            </div>

                                        </div>

                                    </div>


                                    {/* Circular percentage */}

                                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">

                                        <svg
                                            className="absolute inset-0 h-full w-full -rotate-90"
                                            viewBox="0 0 64 64"
                                        >

                                            <circle
                                                cx="32"
                                                cy="32"
                                                r="27"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="5"
                                                className="text-muted"
                                            />

                                            <circle
                                                cx="32"
                                                cy="32"
                                                r="27"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="5"
                                                strokeLinecap="round"
                                                className="text-[#F47822] transition-all duration-500"
                                                strokeDasharray={
                                                    2 *
                                                    Math.PI *
                                                    27
                                                }
                                                strokeDashoffset={
                                                    2 *
                                                    Math.PI *
                                                    27 *
                                                    (1 -
                                                        progress /
                                                            100)
                                                }
                                            />

                                        </svg>


                                        <span className="relative text-sm font-black text-foreground">

                                            {progress}%

                                        </span>

                                    </div>

                                </div>


                                {/* ================================================= */}
                                {/* Progress text */}
                                {/* ================================================= */}

                                <div className="mt-7">

                                    <div className="flex items-end justify-between gap-3">

                                        <div>

                                            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">

                                                Lesson progress

                                            </p>

                                            <p className="mt-1 text-lg font-bold tracking-tight text-foreground">

                                                {progress === 100
                                                    ? "Completed"
                                                    : progress ===
                                                        0
                                                      ? "Not started"
                                                      : "In progress"}

                                            </p>

                                        </div>

                                        <span className="text-xs font-semibold text-[#F47822]">

                                            {progress} / 100

                                        </span>

                                    </div>


                                    {/* Progress bar */}

                                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">

                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#F47822] to-[#ff9a52] transition-all duration-500"
                                            style={{
                                                width: `${progress}%`,
                                            }}
                                        />

                                    </div>

                                </div>


                                {/* ================================================= */}
                                {/* Auto save */}
                                {/* ================================================= */}

                                <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/60 px-3.5 py-3">

                                    <div className="flex items-center gap-2">

                                        <span
                                            className={`h-2 w-2 rounded-full ${
                                                isSaving
                                                    ? "animate-pulse bg-[#F47822]"
                                                    : "bg-emerald-500"
                                            }`}
                                        />

                                        <span className="text-xs font-medium text-muted-foreground">

                                            {isSaving
                                                ? "Saving progress..."
                                                : "Progress saved"}

                                        </span>

                                    </div>

                                    {!isSaving && (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    )}

                                </div>


                                {/* ================================================= */}
                                {/* Completion state */}
                                {/* ================================================= */}

                                <div className="mt-5">

                                    {progress >= 100 ? (
                                        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-5">

                                            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-500/10" />

                                            <div className="relative flex items-start gap-3">

                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">

                                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />

                                                </div>

                                                <div>

                                                    <p className="text-sm font-bold text-emerald-700">

                                                        Lesson completed

                                                    </p>

                                                    <p className="mt-1 text-xs leading-5 text-emerald-700/75">

                                                        Excellent work. You've completed this lesson.

                                                    </p>

                                                </div>

                                            </div>

                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={
                                                isCompleting
                                            }
                                            onClick={() =>
                                                void handleComplete()
                                            }
                                            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F47822] px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.20)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e96b17] hover:shadow-[0_12px_28px_rgba(244,120,34,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
                                        >

                                            <CheckCircle2 className="h-4 w-4 transition-transform duration-200 group-hover:scale-105" />

                                            {isCompleting
                                                ? "Completing..."
                                                : "Complete lesson"}

                                        </button>
                                    )}

                                </div>


                                {/* ================================================= */}
                                {/* Learning tip */}
                                {/* ================================================= */}

                                {progress < 100 && (
                                    <div className="mt-5 border-t border-border pt-5">

                                        <div className="flex items-start gap-3">

                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F47822]/10">

                                                <BookOpen className="h-4 w-4 text-[#F47822]" />

                                            </div>

                                            <div>

                                                <p className="text-xs font-bold text-foreground">
                                                    Keep learning
                                                </p>

                                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                    Your progress is saved automatically as you read.
                                                </p>

                                            </div>

                                        </div>

                                    </div>
                                )}

                            </div>

                        </div>

                    </aside>

                </div>

            </div>

        </main>
    );
}
