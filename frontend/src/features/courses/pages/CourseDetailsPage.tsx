import {
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    Clock3,
    Globe2,
    GraduationCap,
    PlayCircle,
    Sparkles,
    Users,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { env } from "@/config/env";
import { useAuth } from "@/features/auth/hooks/useAuth";

import {
    ContinueLearningCard,
} from "../components/ContinueLearningCard";
import { CourseCurriculum } from "../components/CourseCurriculum";
import { CourseQuizzes } from "../components/CourseQuizzes";
import { CourseThumbnail } from "../components/CourseThumbnail";
import { useCourse } from "../hooks/useCourse";
import { useCourseCurriculum } from "../hooks/useCourseCurriculum";
import {
    useCourseEnrollment,
} from "../hooks/useCourseEnrollment";

function formatDuration(
    minutes: number,
): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    if (remaining === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remaining}m`;
}

function formatPrice(
    price: number | null | undefined,
    discountPrice: number | null | undefined,
    isFree: boolean,
    currency: string,
): string {
    if (isFree) {
        return "Free";
    }

    if (
        discountPrice !== null &&
        discountPrice !== undefined
    ) {
        return `${discountPrice} ${currency}`;
    }

    if (
        price !== null &&
        price !== undefined
    ) {
        return `${price} ${currency}`;
    }

    return "View course";
}

function getDifficultyLabel(
    difficulty: string,
): string {
    return (
        difficulty.charAt(0).toUpperCase() +
        difficulty.slice(1)
    );
}

export function CourseDetailsPage() {
    const { id } = useParams<{
        id: string;
    }>();


    const navigate = useNavigate();
    const location = useLocation();
    const { user, isInitialized } = useAuth();
    const {
        course,
        isLoading,
        error,
        reload,
    } = useCourse(id);

    const {
        enrollment,
        isEnrolling,
        error: enrollmentError,
        enroll,
    } = useCourseEnrollment(
        id,
        course?.enrollment ?? null,
        Boolean(user),
    );
    const [duplicateEnrollment, setDuplicateEnrollment] = useState(false);

    useEffect(() => {
        if (enrollmentError?.toLowerCase().includes("already")) {
            setDuplicateEnrollment(true);
        }
    }, [enrollmentError]);

const isEnrolled = enrollment?.status === "active";

const isCompleted = enrollment?.status === "completed";

const hasFullAccess = isEnrolled || isCompleted;

    const {
        curriculum,
        isLoading: isCurriculumLoading,
        error: curriculumError,
        reload: reloadCurriculum,
    } = useCourseCurriculum(id);


const handleStartLearning = async () => {
    if (!course?.id || isEnrolling) {
        return;
    }

    if (isInitialized && !user) {
        const returnTo = `${location.pathname}${location.search}${location.hash}`;

        sessionStorage.setItem("hbt:auth-return-to", returnTo);
        navigate(`/login?next=${encodeURIComponent(returnTo)}`);
        return;
    }

    // Enrolling twice returns an "already enrolled" API error. Existing
    // students should always continue from the first incomplete lesson.
    if (!isEnrolled && !isCompleted) {
        setDuplicateEnrollment(false);
        const createdEnrollment = await enroll();

        if (!createdEnrollment) {
            return;
        }

        await Promise.all([
            reload(),
            reloadCurriculum(),
        ]);
    }

    const lessons = curriculum?.sections
        .flatMap((section) => section.lessons) ?? [];
    const nextLesson = lessons.find(
        (lesson) => !lesson.progress?.is_completed,
    ) ?? lessons[0];

    if (nextLesson) {
        navigate(
            `/courses/${course.id}/lessons/${nextLesson.id}`,
        );
    }
};

    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    if (isLoading) {
        return (
            <main className="min-h-screen bg-background">
                <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-8">
                        <div className="h-9 w-40 rounded-full bg-muted" />

                        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
                            <div className="space-y-7">
                                <div className="space-y-4">
                                    <div className="h-6 w-32 rounded-full bg-muted" />
                                    <div className="h-12 w-4/5 rounded-lg bg-muted" />
                                    <div className="h-6 w-3/4 rounded-lg bg-muted" />
                                </div>

                                <div className="aspect-video rounded-3xl bg-muted" />

                                <div className="grid gap-3 sm:grid-cols-3">
                                    {[1, 2, 3].map(
                                        (item) => (
                                            <div
                                                key={item}
                                                className="h-24 rounded-2xl bg-muted"
                                            />
                                        ),
                                    )}
                                </div>

                                <div className="h-64 rounded-3xl bg-muted" />

                                <div className="h-96 rounded-3xl bg-muted" />
                            </div>

                            <div className="h-[520px] rounded-3xl bg-muted" />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Error
    |--------------------------------------------------------------------------
    */

    if (error || !course) {
        return (
            <main className="min-h-screen bg-background">
                <div className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
                    <div className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm sm:p-12">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F47822]/10">
                            <BookOpen className="h-7 w-7 text-[#F47822]" />
                        </div>

                        <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
                            Course unavailable
                        </h1>

                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                            {error ??
                                "We couldn't find this course."}
                        </p>

                        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() =>
                                    void reload()
                                }
                                className="inline-flex items-center justify-center rounded-xl bg-[#F47822] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#e96b17] hover:shadow-md"
                            >
                                Try again
                            </button>

                            <Link
                                to="/catalog"
                                className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                            >
                                Back to courses
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    const hasDiscount =
        !course.is_free &&
        course.discount_price !== null &&
        course.discount_price !== undefined &&
        course.price !== null &&
        course.price !== undefined &&
        course.discount_price < course.price;

    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 lg:px-8">
                {/* =====================================================
                    BACK
                ====================================================== */}

                <div className="mb-8">
                    <Link
                        to="/catalog"
                        className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-[#F47822]/40 hover:bg-[#F47822]/5 hover:text-[#F47822]"
                    >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-[#F47822]/10">
                            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        </span>

                        Back to courses
                    </Link>
                </div>

                {/* =====================================================
                    HERO
                ====================================================== */}

                <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
                    <div className="min-w-0 space-y-8">
                        {/* Heading */}

                        <div className="space-y-5">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F47822]/20 bg-[#F47822]/10 px-3 py-1.5 text-xs font-semibold text-[#F47822]">
                                    <GraduationCap className="h-3.5 w-3.5" />

                                    {getDifficultyLabel(
                                        course.difficulty,
                                    )}
                                </span>

                                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    <Globe2 className="h-3.5 w-3.5" />

                                    {course.language}
                                </span>

                                {course.is_free && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F47822] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                                        <Sparkles className="h-3.5 w-3.5" />

                                        Free
                                    </span>
                                )}
                            </div>

                            <div>
                                <h1 className="max-w-4xl text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl lg:leading-[1.08]">
                                    {course.title}
                                </h1>

                                {course.short_description && (
                                    <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                                        {
                                            course.short_description
                                        }
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Course image */}

                        <div className="group relative overflow-hidden rounded-3xl border border-border bg-muted shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
                            <CourseThumbnail title={course.title} image={course.thumbnail} video={course.title.toLowerCase().includes("can bus") ? (course.preview_video ?? `${env.apiUrl.replace(/\/api\/?$/, "")}/storage/lessons/prev.mp4`) : null} showMute={course.title.toLowerCase().includes("can bus")} />
                        </div>

                        {/* Stats */}

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="group rounded-2xl border border-border bg-card p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                                        <Clock3 className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Duration
                                        </p>

                                        <p className="mt-0.5 text-sm font-bold text-foreground">
                                            {formatDuration(
                                                course.duration_minutes,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group rounded-2xl border border-border bg-card p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3A3A3A]/10 text-[#3A3A3A]">
                                        <GraduationCap className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Difficulty
                                        </p>

                                        <p className="mt-0.5 text-sm font-bold capitalize text-foreground">
                                            {
                                                course.difficulty
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group rounded-2xl border border-border bg-card p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                                        <Globe2 className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Language
                                        </p>

                                        <p className="mt-0.5 text-sm font-bold uppercase text-foreground">
                                            {
                                                course.language
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* About */}

                        <article id="course-description" className="rounded-3xl border border-border bg-card p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] sm:p-8">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                                    <BookOpen className="h-5 w-5" />
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F47822]">
                                        Course overview
                                    </p>

                                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                                        About this course
                                    </h2>
                                </div>
                            </div>

                            <p className="whitespace-pre-line text-base leading-8 text-muted-foreground">
                                {
                                    course.description
                                }
                            </p>
                        </article>

                        <CourseQuizzes courseId={course.id} enrolled={isEnrolled || isCompleted} />

                        {/* Curriculum */}

                        <div className="pt-2">
                            {isCurriculumLoading ? (
                                <section className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="h-4 w-32 animate-pulse rounded bg-muted" />

                                            <div className="mt-3 h-8 w-56 animate-pulse rounded bg-muted" />
                                        </div>

                                        <div className="hidden h-5 w-32 animate-pulse rounded bg-muted sm:block" />
                                    </div>

                                    <div className="space-y-4">
                                        {[1, 2].map(
                                            (item) => (
                                                <div
                                                    key={
                                                        item
                                                    }
                                                    className="overflow-hidden rounded-2xl border border-border"
                                                >
                                                    <div className="h-20 animate-pulse bg-muted" />

                                                    <div className="space-y-3 p-5">
                                                        <div className="h-12 animate-pulse rounded-xl bg-muted" />

                                                        <div className="h-12 animate-pulse rounded-xl bg-muted" />
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </section>
                            ) : curriculumError ? (
                                <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F47822]/10">
                                        <BookOpen className="h-6 w-6 text-[#F47822]" />
                                    </div>

                                    <h3 className="mt-4 text-lg font-bold text-foreground">
                                        Curriculum unavailable
                                    </h3>

                                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                                        {
                                            curriculumError
                                        }
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            void reloadCurriculum()
                                        }
                                        className="mt-5 rounded-xl bg-[#F47822] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#e96b17] hover:shadow-md"
                                    >
                                        Try again
                                    </button>
                                </div>
                            ) : curriculum ? (
                                <div className="space-y-6">
                                    {hasFullAccess && <ContinueLearningCard
    curriculum={curriculum}
    isCourseCompleted={isCompleted}
/>
}

<CourseCurriculum
    curriculum={curriculum}
    isCourseCompleted={isCompleted}
    hasFullAccess={hasFullAccess}
/>

                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* =====================================================
                        SIDEBAR
                    ====================================================== */}

                    <aside className="h-fit lg:sticky lg:top-28">
                        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
                            <div className="h-1.5 bg-[#F47822]" />

                            <div className="p-6 sm:p-7">
                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                    <Sparkles className="h-4 w-4 text-[#F47822]" />

                                    Start learning today
                                </div>

                                <div className="mt-5">
                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Course price
                                    </p>

                                    <div className="mt-2 flex flex-wrap items-end gap-3">
                                        <p className="text-4xl font-black tracking-tight text-foreground">
                                            {formatPrice(
                                                course.price,
                                                course.discount_price,
                                                course.is_free,
                                                course.currency,
                                            )}
                                        </p>

                                        {hasDiscount && (
                                            <span className="pb-1 text-sm text-muted-foreground line-through">
                                                {
                                                    course.price
                                                }{" "}
                                                {
                                                    course.currency
                                                }
                                            </span>
                                        )}
                                    </div>

                                    {hasDiscount && (
                                        <span className="mt-2 inline-flex rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-600">
                                            Special price
                                        </span>
                                    )}
                                </div>

                                <button
    type="button"
    onClick={() => void handleStartLearning()}
    disabled={isEnrolling || duplicateEnrollment}

    className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F47822] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e96b17] hover:shadow-[0_12px_28px_rgba(244,120,34,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
>
    <PlayCircle className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />

    {isEnrolling
    ? "Enrolling..."
    : duplicateEnrollment
      ? "Already enrolled"
    : isCompleted
      ? "Review course"
      : isEnrolled
        ? "Continue learning"
        : course.is_free
          ? "Start learning"
          : "Enroll now"}
</button>

                                {enrollmentError && (
                                    <p className="mt-3 text-center text-sm text-red-600">
                                        {enrollmentError}
                                    </p>
                                )}

                                <div className="mt-7 border-t border-border pt-6">
                                    <p className="text-sm font-bold text-foreground">
                                        This course includes
                                    </p>

                                    <div className="mt-4 space-y-3.5">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F47822]" />

                                            <span className="text-sm leading-5 text-muted-foreground">
                                                Structured course curriculum
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#F47822]" />

                                            <span className="text-sm leading-5 text-muted-foreground">
                                                {formatDuration(
                                                    course.duration_minutes,
                                                )}{" "}
                                                of learning content
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-[#F47822]" />

                                            <span className="text-sm leading-5 text-muted-foreground">
                                                {
                                                    getDifficultyLabel(
                                                        course.difficulty,
                                                    )
                                                }{" "}
                                                level training
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F47822]" />

                                            <span className="text-sm leading-5 text-muted-foreground">
                                                Available in{" "}
                                                {course.language.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#F47822]" />

                                            <span className="text-sm leading-5 text-muted-foreground">
                                                Learn at your own pace
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-7 grid grid-cols-2 gap-3 border-t border-border pt-6">
                                    <div className="rounded-xl bg-muted/60 p-3.5">
                                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                            Duration
                                        </p>

                                        <p className="mt-1 text-sm font-bold text-foreground">
                                            {formatDuration(
                                                course.duration_minutes,
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-muted/60 p-3.5">
                                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                            Level
                                        </p>

                                        <p className="mt-1 text-sm font-bold capitalize text-foreground">
                                            {
                                                course.difficulty
                                            }
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-muted/60 p-3.5">
                                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                            Language
                                        </p>

                                        <p className="mt-1 text-sm font-bold uppercase text-foreground">
                                            {
                                                course.language
                                            }
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-muted/60 p-3.5">
                                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                            Access
                                        </p>

                                        <p className="mt-1 text-sm font-bold text-foreground">
                                            Lifetime
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </section>
            </div>
        </main>
    );
}
