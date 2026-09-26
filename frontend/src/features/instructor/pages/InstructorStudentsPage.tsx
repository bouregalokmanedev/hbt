import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Clock3,
    Search,
    TrendingUp,
    Users,
} from "lucide-react";
import {
    useDeferredValue,
    useMemo,
    useState,
} from "react";
import {
    Link,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    useQuery,
} from "@tanstack/react-query";

import { AVATAR_SQUARE_SHAPE } from "@/components/ui";
import i18n from "@/i18n";

import {
    getInstructorStudents,
} from "../api/instructorApi";

export function InstructorStudentsPage() {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const [search, setSearch] = useState("");
    const deferredSearch = useDeferredValue(search);
    const students = useQuery({ queryKey: ["instructor", "students", deferredSearch], queryFn: () => getInstructorStudents(deferredSearch), staleTime: 20_000 });
    const learnerData = students.data ?? [];
    const insight = useMemo(() => ({ total: learnerData.length, progress: Math.round(learnerData.reduce((total, learner) => total + learner.average_progress, 0) / Math.max(learnerData.length, 1)), completed: learnerData.reduce((total, learner) => total + learner.completed_courses, 0), active: learnerData.filter((learner) => isActive(learner.last_activity_at)).length }), [learnerData]);

    return <div className="mx-auto max-w-7xl space-y-6 lg:space-y-7"><section className="rounded-3xl bg-[#3A3A3A] p-6 text-white shadow-[0_18px_45px_rgba(58,58,58,.13)] sm:p-7"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#F9A16C]">{t("instructor.students.eyebrow")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("instructor.students.title")}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/60">{t("instructor.students.description")}</p></div><span className="rounded-xl bg-white/10 px-4 py-3 text-xs font-semibold text-white/85">{t("instructor.students.activeBadge", { count: insight.active })}</span></div><div className="mt-6 grid gap-3 sm:grid-cols-4"><StudentMetric label={t("instructor.students.metrics.learners")} value={insight.total} icon={Users} /><StudentMetric label={t("instructor.students.metrics.avgProgress")} value={`${insight.progress}%`} icon={TrendingUp} /><StudentMetric label={t("instructor.students.metrics.completions")} value={insight.completed} icon={CheckCircle2} /><StudentMetric label={t("instructor.students.metrics.active")} value={insight.active} icon={Clock3} /></div></section><section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-4 shadow-[0_10px_30px_rgba(58,58,58,.04)] sm:p-5"><label className="relative block max-w-xl"><Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/35 ${isRTL ? "right-3.5" : "left-3.5"}`} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("instructor.students.searchPh")} className={`h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] pr-3 text-sm outline-none transition focus:border-[#F47822] focus:bg-white focus:ring-4 focus:ring-[#F47822]/8 ${isRTL ? "pl-3 pr-10" : "pl-10"}`} /></label></section>{students.isLoading && <StudentSkeleton />}{students.isError && <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{t("instructor.students.loadError")}</div>}{!students.isLoading && !students.isError && <section className="overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_10px_30px_rgba(58,58,58,.045)]">{learnerData.length ? <><div className="hidden grid-cols-[minmax(250px,1fr)_100px_120px_110px_136px] gap-4 border-b border-[#3A3A3A]/7 px-6 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-[#3A3A3A]/35 lg:grid"><span>{t("instructor.students.headers.learner")}</span><span>{t("instructor.students.headers.courses")}</span><span>{t("instructor.students.headers.progress")}</span><span>{t("instructor.students.headers.completed")}</span><span className="text-right rtl:text-left">{t("instructor.students.headers.profile")}</span></div><div className="divide-y divide-[#3A3A3A]/7">{learnerData.map((item) => <LearnerRow key={item.student.id} item={item} />)}</div></> : <EmptyStudents search={search} />}</section>}</div>;
}

function LearnerRow({ item }: { item: Awaited<ReturnType<typeof getInstructorStudents>>[number] }) {
    const { t } = useTranslation();
    const active = isActive(item.last_activity_at);
    return <article className="grid gap-4 px-5 py-5 transition hover:bg-[#FCFCFC] lg:grid-cols-[minmax(250px,1fr)_100px_120px_110px_136px] lg:items-center lg:gap-4 lg:px-6"><div className="flex min-w-0 items-center gap-3"><Avatar name={item.student.name} /><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate text-sm font-semibold text-[#3A3A3A]">{item.student.name}</h2><span className={`h-2 w-2 shrink-0 rounded-full ${active ? "bg-emerald-500" : "bg-[#3A3A3A]/20"}`} /></div><p className="mt-1 truncate text-xs text-[#3A3A3A]/45">{item.student.email}</p><p className="mt-1 text-[10px] text-[#3A3A3A]/38">{active ? t("instructor.students.row.activeOn", { when: relativeDate(item.last_activity_at) }) : t("instructor.students.row.noActivity")}</p></div></div><Metric label={t("instructor.students.row.courses")} value={item.courses_count} /><div><Metric label={t("instructor.students.row.progress")} value={`${item.average_progress}%`} /><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/7"><div className="h-full rounded-full bg-[#F47822]" style={{ width: `${item.average_progress}%` }} /></div></div><Metric label={t("instructor.students.row.completed")} value={item.completed_courses} /><Link to={`/instructor/students/${item.student.id}`} className="
    group
    relative
    inline-flex
    h-10
    items-center
    justify-center
    gap-2
    overflow-hidden
    rounded-xl
    border
    border-[#F47822]/20
    bg-white
    px-4
    text-xs
    font-bold
    uppercase
    tracking-[0.04em]
    text-[#F47822]
    shadow-[0_5px_14px_rgba(58,58,58,0.05)]
    transition-all
    duration-300
    hover:-translate-y-0.5
    hover:border-[#F47822]
    hover:bg-[#F47822]
    hover:text-white
    hover:shadow-[0_10px_25px_rgba(244,120,34,0.2)]
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-[#F47822]/40
    active:translate-y-0
    lg:justify-self-end
">{t("instructor.students.row.profile")} <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" /></Link></article>;
}
function Avatar({ name }: { name: string }) { return <div className={`flex h-11 w-11 shrink-0 items-center justify-center ${AVATAR_SQUARE_SHAPE} bg-[#F47822]/10 text-xs font-bold text-[#F47822]`}>{name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase()}</div>; }
function Metric({ label, value }: { label: string; value: string | number }) { return <div><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#3A3A3A]/35">{label}</p><p className="mt-1 text-sm font-semibold text-[#3A3A3A]">{value}</p></div>; }
function StudentMetric({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Users }) { return <div className="rounded-xl bg-white/10 px-4 py-3"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.11em] text-white/42">{label}</p><Icon className="h-3.5 w-3.5 text-[#F9A16C]" /></div><p className="mt-2 text-2xl font-semibold">{value}</p></div>; }
function EmptyStudents({ search }: { search: string }) {
    const { t } = useTranslation();
    return <div className="px-6 py-16 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]"><BookOpen className="h-5 w-5" /></div><h2 className="mt-4 font-semibold text-[#3A3A3A]">{search ? t("instructor.students.empty.noMatch") : t("instructor.students.empty.none")}</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#3A3A3A]/50">{search ? t("instructor.students.empty.noMatchDesc") : t("instructor.students.empty.noneDesc")}</p></div>;
}
function StudentSkeleton() { return <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-black/5" />)}</div>; }
function isActive(value: string | null): boolean { return value ? Date.now() - new Date(value).getTime() <= 14 * 24 * 60 * 60 * 1000 : false; }
function relativeDate(value: string | null): string {
    if (!value) return i18n.t("instructor.students.row.recently");
    const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
    if (days === 0) return i18n.t("instructor.students.row.today");
    if (days === 1) return i18n.t("instructor.students.row.yesterday");
    return i18n.t("instructor.students.row.daysAgo", { count: days });
}
