import {
    BookOpen,
    Filter,
    Grid2X2,
    List,
    Plus,
    RefreshCw,
    Search,
} from "lucide-react";
import {
    useState,
} from "react";
import {
    Link,
} from "react-router-dom";

import {
    InstructorCourseTable,
} from "../components/InstructorCourseTable";
import {
    useInstructorCourses,
} from "../hooks/useInstructorCourses";

const statuses = ["all", "published", "draft", "review", "archived"] as const;

export function InstructorCoursePage() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<(typeof statuses)[number]>("all");
    const [view, setView] = useState<"cards" | "list">("cards");
    const courses = useInstructorCourses({ per_page: 50, search, ...(status !== "all" ? { status } : {}) });
    const data = courses.data;
    const allCourses = data?.data ?? [];
    const published = allCourses.filter((course) => course.status === "published").length;
    const drafts = allCourses.filter((course) => course.status === "draft").length;

    return (
        <div className="mx-auto max-w-7xl space-y-6 lg:space-y-7">
            <section className="rounded-3xl border border-[#3A3A3A]/8 bg-white p-6 shadow-[0_12px_32px_rgba(58,58,58,.045)] sm:p-7"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#F47822]">Teaching library</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#3A3A3A]">My courses</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#3A3A3A]/50">Create, refine, publish, and measure every learning experience you own.</p></div><Link to="/instructor/courses/new" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(244,120,34,.2)] transition hover:bg-[#de6414]"><Plus className="h-4 w-4" />Create course</Link></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><LibraryMetric label="Courses in library" value={data?.meta.total ?? 0} icon={BookOpen} /><LibraryMetric label="Currently published" value={published} icon={Filter} /><LibraryMetric label="Drafts to refine" value={drafts} icon={RefreshCw} /></div></section>
            <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-4 shadow-[0_10px_30px_rgba(58,58,58,.04)] sm:p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><label className="relative block w-full xl:max-w-md"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/35" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses by title" className="h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] pl-10 pr-3 text-sm text-[#3A3A3A] outline-none transition focus:border-[#F47822] focus:bg-white focus:ring-4 focus:ring-[#F47822]/8" /></label><div className="flex flex-wrap items-center gap-3"><div className="flex flex-wrap gap-1.5">{statuses.map((item) => <button key={item} type="button" onClick={() => setStatus(item)} className={`h-9 rounded-lg px-3 text-xs font-semibold capitalize transition ${status === item ? "bg-[#3A3A3A] text-white shadow-sm" : "bg-[#3A3A3A]/5 text-[#3A3A3A]/60 hover:bg-[#F47822]/10 hover:text-[#F47822]"}`}>{item === "all" ? "All courses" : item}</button>)}</div><div className="flex rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] p-1" role="group" aria-label="Course view"><button type="button" onClick={() => setView("cards")} aria-pressed={view === "cards"} title="Card view" className={`grid h-8 w-8 place-items-center rounded-lg transition ${view === "cards" ? "bg-white text-[#F47822] shadow-sm" : "text-[#3A3A3A]/42 hover:text-[#3A3A3A]"}`}><Grid2X2 className="h-4 w-4" /></button><button type="button" onClick={() => setView("list")} aria-pressed={view === "list"} title="List view" className={`grid h-8 w-8 place-items-center rounded-lg transition ${view === "list" ? "bg-white text-[#F47822] shadow-sm" : "text-[#3A3A3A]/42 hover:text-[#3A3A3A]"}`}><List className="h-4 w-4" /></button></div></div></div></section>
            {courses.isLoading && <CourseSkeleton />}
            {!courses.isLoading && courses.isError && <div className="rounded-2xl border border-red-200 bg-red-50 p-6"><p className="font-semibold text-red-900">Unable to load your courses</p><p className="mt-1 text-sm text-red-700">Please try again to refresh your teaching library.</p><button type="button" onClick={() => courses.refetch()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-semibold text-white"><RefreshCw className="h-4 w-4" />Try again</button></div>}
            {!courses.isLoading && !courses.isError && <InstructorCourseTable courses={allCourses} view={view} />}
        </div>
    );
}

function LibraryMetric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof BookOpen }) { return <div className="flex items-center gap-3 rounded-xl bg-[#FCFCFC] px-4 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]"><Icon className="h-4 w-4" /></span><div><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#3A3A3A]/38">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight text-[#3A3A3A]">{value}</p></div></div>; }
function CourseSkeleton() { return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[350px] animate-pulse rounded-2xl bg-black/5" />)}</div>; }
