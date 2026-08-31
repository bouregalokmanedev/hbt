import {
    BarChart3,
    BookOpen,
    CalendarDays,
    Clock3,
    ExternalLink,
    FilePenLine,
    Layers3,
    MessageSquareText,
    Settings2,
} from "lucide-react";
import {
    Link,
} from "react-router-dom";

import type {
    Course,
} from "@/features/courses/types/course.types";

interface InstructorCourseTableProps {
    courses: Course[];
    view: "cards" | "list";
}

const statusStyles: Record<string, string> = {
    published: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    draft: "bg-slate-100 text-slate-600 ring-slate-500/10",
    review: "bg-amber-50 text-amber-700 ring-amber-600/10",
    pending_review: "bg-amber-50 text-amber-700 ring-amber-600/10",
    archived: "bg-red-50 text-red-700 ring-red-600/10",
};

export function InstructorCourseTable({ courses, view }: InstructorCourseTableProps) {
    if (!courses.length) return <EmptyCourses />;

    return (
        <div className={view === "cards" ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
            {courses.map((course) => view === "cards" ? <CourseCard key={course.id} course={course} /> : <CourseListItem key={course.id} course={course} />)}
        </div>
    );
}

function CourseCard({ course }: { course: Course }) {
    const updatedAt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(course.updated_at));
    const status = course.status.replace("_", " ");

    return (
        <article className="group overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_10px_30px_rgba(58,58,58,.045)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(58,58,58,.1)]">
            <div className="relative h-36 overflow-hidden bg-[#3A3A3A]">
                {course.thumbnail ? <img src={course.thumbnail} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top_right,_rgba(244,120,34,.45),_transparent_42%),linear-gradient(135deg,_#3A3A3A,_#202020)]"><BookOpen className="h-8 w-8 text-white/70" /></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <span className={`absolute left-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ring-1 ${statusStyles[course.status] ?? "bg-white/90 text-[#3A3A3A] ring-white/30"}`}>{status}</span>
                <span className="absolute bottom-3 right-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#3A3A3A]">{course.difficulty}</span>
            </div>
            <div className="p-5">
                <div className="min-w-0"><h2 className="truncate text-base font-semibold tracking-tight text-[#3A3A3A]">{course.title}</h2><p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-[#3A3A3A]/52">{course.short_description}</p></div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-y border-[#3A3A3A]/7 py-3"><Detail icon={Clock3} value={`${course.duration_minutes} min`} /><Detail icon={Layers3} value={course.language.toUpperCase()} /><Detail icon={course.is_free ? BookOpen : Settings2} value={course.is_free ? "Free" : `${course.currency} ${course.price}`} /></div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#3A3A3A]/42"><CalendarDays className="h-3.5 w-3.5" />Updated {updatedAt}</div>
                <CourseActions course={course} />
            </div>
        </article>
    );
}

function CourseListItem({ course }: { course: Course }) {
    const updatedAt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(course.updated_at));
    const status = course.status.replace("_", " ");
    return <article className="group grid gap-5 rounded-2xl border border-[#3A3A3A]/8 bg-white p-4 shadow-[0_8px_25px_rgba(58,58,58,.035)] transition hover:border-[#F47822]/20 hover:shadow-[0_14px_32px_rgba(58,58,58,.07)] lg:grid-cols-[148px_minmax(0,1fr)_auto] lg:items-center lg:p-5"><div className="relative h-28 overflow-hidden rounded-xl bg-[#3A3A3A]">{course.thumbnail ? <img src={course.thumbnail} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top_right,_rgba(244,120,34,.45),_transparent_42%),linear-gradient(135deg,_#3A3A3A,_#202020)]"><BookOpen className="h-7 w-7 text-white/70" /></div>}<span className={`absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[9px] font-bold capitalize ring-1 ${statusStyles[course.status] ?? "bg-white/90 text-[#3A3A3A] ring-white/30"}`}>{status}</span></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-base font-semibold tracking-tight text-[#3A3A3A]">{course.title}</h2><span className="rounded-full bg-[#3A3A3A]/5 px-2.5 py-1 text-[10px] font-bold capitalize text-[#3A3A3A]/58">{course.difficulty}</span></div><p className="mt-2 line-clamp-2 max-w-2xl text-xs leading-5 text-[#3A3A3A]/52">{course.short_description}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[#3A3A3A]/46"><span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-[#F47822]" />{course.duration_minutes} min</span><span className="inline-flex items-center gap-1.5"><Layers3 className="h-3.5 w-3.5 text-[#F47822]" />{course.language.toUpperCase()}</span><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-[#F47822]" />Updated {updatedAt}</span></div></div><CourseActions course={course} compact /></article>;
}

function CourseActions({ course, compact = false }: { course: Course; compact?: boolean }) {
    const secondary = "inline-flex h-9 items-center justify-center rounded-xl border border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/58 shadow-[0_3px_8px_rgba(58,58,58,.035)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F47822]/35 hover:bg-[#FFF8F4] hover:text-[#F47822] hover:shadow-[0_7px_15px_rgba(244,120,34,.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/35";
    return <div className={`mt-5 flex items-center gap-2 ${compact ? "mt-0 flex-wrap lg:justify-end" : ""}`}><Link to={`/instructor/courses/${course.id}`} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F47822] px-3.5 text-xs font-bold text-white shadow-[0_6px_14px_rgba(244,120,34,.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#de6414] hover:shadow-[0_10px_20px_rgba(244,120,34,.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/40"><FilePenLine className="h-3.5 w-3.5" />Manage<span className="hidden sm:inline"> course</span></Link><Link title="Course analytics" aria-label={`View ${course.title} analytics`} to={`/instructor/courses/${course.id}/analytics`} className={`${secondary} w-9`}><BarChart3 className="h-3.5 w-3.5" /></Link><Link title="Learner outcomes" aria-label={`View ${course.title} outcomes`} to={`/instructor/courses/${course.id}/outcomes`} className={`${secondary} w-9`}><MessageSquareText className="h-3.5 w-3.5" /></Link>{course.status === "published" && <Link title="Preview course" aria-label={`Preview ${course.title}`} to={`/courses/${course.id}`} className={`${secondary} w-9`}><ExternalLink className="h-3.5 w-3.5" /></Link>}</div>;
}

function Detail({ icon: Icon, value }: { icon: typeof Clock3; value: string }) { return <div className="min-w-0 text-center"><Icon className="mx-auto h-3.5 w-3.5 text-[#F47822]" /><p className="mt-1 truncate text-[10px] font-semibold text-[#3A3A3A]/62">{value}</p></div>; }
function EmptyCourses() { return <div className="rounded-2xl border border-dashed border-[#3A3A3A]/15 bg-[#FCFCFC] px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]"><BookOpen className="h-5 w-5" /></div><h2 className="mt-4 text-base font-semibold text-[#3A3A3A]">No courses found</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#3A3A3A]/50">Adjust your filters or create a new course to begin building your teaching library.</p></div>; }
