import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Clock3,
    GraduationCap,
    PlayCircle,
    Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useMyEnrollments } from "../hooks/useMyEnrollments";

function formatLearningTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes} min learned`;
    }

    return `${Math.floor(minutes / 60)}h ${minutes % 60}m learned`;
}

export function MyCoursesPage() {
    const {
        enrollments,
        isLoading,
        error,
        reload,
    } = useMyEnrollments();

    const visibleEnrollments = enrollments.filter(
        (enrollment) => enrollment.status !== "cancelled",
    );
    const completedCount = visibleEnrollments.filter(
        (enrollment) => enrollment.status === "completed",
    ).length;

    if (isLoading) {
        return (
            <main className="min-h-full bg-background">
                <div className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {[1, 2, 3].map((item) => <div key={item} className="h-64 animate-pulse rounded-3xl bg-[#3A3A3A]/5" />)}
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-full bg-background"><div className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10"><div className="rounded-3xl border border-red-200 bg-red-50 p-7 text-center">
                <p className="text-sm font-semibold text-red-700">
                    {error}
                </p>
                <button
                    type="button"
                    onClick={() => void reload()}
                    className="mt-4 rounded-xl bg-[#F47822] px-4 py-2 text-sm font-semibold text-white"
                >
                    Try again
                </button>
            </div></div></main>
        );
    }

    if (visibleEnrollments.length === 0) {
        return (
            <main className="min-h-full bg-background"><div className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10"><div className="rounded-3xl border border-dashed border-[#3A3A3A]/15 bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F47822]/10">
                    <BookOpen className="h-6 w-6 text-[#F47822]" />
                </div>
                <h1 className="mt-5 text-xl font-bold text-[#3A3A3A]">
                    No courses yet
                </h1>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#3A3A3A]/55">
                    Enroll in a course to keep all your learning and progress in one place.
                </p>
                <Link
                    to="/catalog"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-semibold text-white"
                >
                    Explore courses
                    <PlayCircle className="h-4 w-4" />
                </Link>
            </div></div></main>
        );
    }

    return (
        <main className="min-h-full bg-background">
        <section className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
            <div className="mb-7 overflow-hidden rounded-3xl bg-[#3A3A3A] p-6 text-white shadow-[0_12px_35px_rgba(58,58,58,0.12)] sm:p-7">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">Learning library</p>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight">My courses</h1>
                        <p className="mt-1 text-sm text-white/60">Pick up where you left off and keep your momentum.</p>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        <div className="flex min-w-[130px] items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-3.5 py-3 backdrop-blur-sm">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white"><BookOpen className="h-4 w-4" /></div>
                            <div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">In progress</p><p className="mt-0.5 text-lg font-bold leading-none text-white">{visibleEnrollments.length - completedCount}</p></div>
                        </div>
                        <div className="flex min-w-[130px] items-center gap-3 rounded-2xl bg-[#F47822] px-3.5 py-3 shadow-[0_8px_20px_rgba(244,120,34,0.20)]">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white"><Trophy className="h-4 w-4" /></div>
                            <div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/70">Completed</p><p className="mt-0.5 text-lg font-bold leading-none text-white">{completedCount}</p></div>
                        </div>
                    </div>
                </div>
            </div>
        <div className="grid max-w-6xl gap-5 lg:grid-cols-2">
            {visibleEnrollments.map((enrollment) => {
                const progress = Math.min(
                    Math.max(enrollment.progress?.progress_percentage ?? 0, 0),
                    100,
                );
                const completed = enrollment.status === "completed";
                const course = enrollment.course;

                return (
                    <article key={enrollment.id} className="group overflow-hidden rounded-3xl border border-[#3A3A3A]/10 bg-white shadow-[0_8px_30px_rgba(58,58,58,0.05)] transition-all duration-200 hover:-translate-y-1 hover:border-[#F47822]/35 hover:shadow-[0_18px_40px_rgba(58,58,58,0.11)]">
                        <div className="grid sm:grid-cols-[148px_1fr]">
                            <div className={completed ? "relative flex min-h-40 items-center justify-center overflow-hidden bg-emerald-600 p-6" : "relative flex min-h-40 items-center justify-center overflow-hidden bg-[#3A3A3A] p-6"}>
                                {course?.thumbnail ? <img src={course.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" /> : null}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm">
                                    {completed ? <GraduationCap className="h-7 w-7" /> : <BookOpen className="h-7 w-7" />}
                                </div>
                                <span className="absolute bottom-4 left-4 rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">{completed ? "Complete" : "Learning"}</span>
                            </div>
                            <div className="p-5 sm:p-6">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className={completed ? "text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600" : "text-[10px] font-bold uppercase tracking-[0.15em] text-[#F47822]"}>{completed ? "Certificate eligible" : "Continue your course"}</p>
                                        <h2 className="mt-2 line-clamp-2 text-lg font-bold leading-snug text-[#3A3A3A]">{course?.title ?? "Course"}</h2>
                                    </div>
                                    {completed ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <span className="text-lg font-bold text-[#F47822]">{progress}%</span>}
                                </div>
                                <div className="mt-5 flex items-center justify-between text-xs"><span className="font-medium text-[#3A3A3A]/55">{enrollment.completed_lessons ?? 0} of {enrollment.total_lessons ?? 0} lessons</span><span className="text-[#3A3A3A]/45">{formatLearningTime(enrollment.progress?.time_spent ?? 0)}</span></div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#3A3A3A]/8"><div className={completed ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-gradient-to-r from-[#F47822] to-[#ff9a55]"} style={{ width: `${completed ? 100 : progress}%` }} /></div>
                                <Link to={`/courses/${enrollment.course_id}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(244,120,34,0.18)] transition-all duration-200 hover:bg-[#df6817] hover:shadow-[0_10px_22px_rgba(244,120,34,0.26)]"><PlayCircle className="h-4 w-4" />{completed ? "Review course" : "Continue learning"}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
        </section>
        </main>
    );
}
