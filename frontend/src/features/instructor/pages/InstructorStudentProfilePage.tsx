import {
    ArrowLeft,
    Award,
    BookOpen,
    CheckCircle2,
    ClipboardCheck,
    FlaskConical,
    History,
} from "lucide-react";
import {
    Link,
    useParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    useQuery,
} from "@tanstack/react-query";

import {
    getInstructorStudent,
} from "../api/instructorApi";
import type { SimulatorSessionRow } from "../types/instructor";

export function InstructorStudentProfilePage() {
    const { t, i18n } = useTranslation();
    const locale = i18n.language;
    const { studentId } = useParams();
    const profile = useQuery({ queryKey: ["instructor", "student", studentId], queryFn: () => getInstructorStudent(Number(studentId)), enabled: Boolean(studentId) });
    if (profile.isLoading) return <div className="space-y-5"><div className="h-32 animate-pulse rounded-2xl bg-black/5" /><div className="h-72 animate-pulse rounded-2xl bg-black/5" /></div>;
    if (profile.isError || !profile.data) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 className="font-semibold text-red-900">{t("instructor.students.detail.unavailable")}</h1><p className="mt-2 text-sm text-red-700">{t("instructor.students.detail.unavailableDesc")}</p></div>;
    const data = profile.data;
    return <div className="mx-auto max-w-5xl space-y-6"><header><Link to="/instructor/students" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3A3A3A]/50 hover:text-[#F47822]"><ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" /> {t("instructor.students.detail.back")}</Link><div className="mt-5 rounded-2xl bg-[#3A3A3A] p-6 text-white"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F9A16C]">{t("instructor.students.detail.eyebrow")}</p><h1 className="mt-3 text-2xl font-semibold">{data.student.name}</h1><p className="mt-1 text-sm text-white/60">{data.student.email}</p></div></header><section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)]"><SectionHeading icon={BookOpen} title={t("instructor.students.detail.progressTitle")} subtitle={t("instructor.students.detail.progressSub")} /><div className="mt-5 space-y-3">{data.courses.map((item) => <article key={item.course.id} className="rounded-xl border border-[#3A3A3A]/7 bg-[#FCFCFC] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-[#3A3A3A]">{item.course.title}</h2><p className="mt-1 text-xs text-[#3A3A3A]/45">{t("instructor.students.detail.lessonsDone", { count: item.progress.completed_lessons, minutes: Math.round(item.progress.time_spent / 60) })}</p></div><span className="rounded-full bg-[#F47822]/10 px-2.5 py-1 text-xs font-bold text-[#F47822]">{item.progress.percentage}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#3A3A3A]/7"><div className="h-full rounded-full bg-[#F47822]" style={{ width: `${item.progress.percentage}%` }} /></div></article>)}</div></section><div className="grid gap-6 lg:grid-cols-2"><AttemptList title={t("instructor.students.detail.quizTitle")} icon={ClipboardCheck} empty={t("instructor.students.detail.quizEmpty")} items={data.quiz_attempts.map((item) => ({ id: item.id, title: item.quiz_title, course: item.course_title, score: `${item.score}%`, passed: item.passed }))} /><AttemptList title={t("instructor.students.detail.assessTitle")} icon={Award} empty={t("instructor.students.detail.assessEmpty")} items={data.assessment_attempts.map((item) => ({ id: item.id, title: item.assessment_title, course: item.course_title, score: item.score === null ? t("instructor.students.detail.pending") : `${item.score}%`, passed: Boolean(item.passed) }))} /></div><section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)]"><SectionHeading icon={Award} title={t("instructor.students.detail.certTitle")} subtitle={t("instructor.students.detail.certSub")} />{data.certificates.length ? <div className="mt-5 divide-y divide-[#3A3A3A]/7">{data.certificates.map((certificate) => <div key={certificate.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#3A3A3A]">{certificate.course_title}</p><p className="mt-1 text-xs text-[#3A3A3A]/45">{certificate.certificate_number}</p></div><p className="shrink-0 text-[11px] text-[#3A3A3A]/40">{formatDate(certificate.issued_at, locale, t("instructor.students.detail.recently"))}</p></div>)}</div> : <p className="mt-5 rounded-xl bg-[#FCFCFC] px-4 py-6 text-center text-xs text-[#3A3A3A]/45">{t("instructor.students.detail.certEmpty")}</p>}</section><section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)]"><SectionHeading icon={History} title={t("instructor.students.detail.activityTitle")} subtitle={t("instructor.students.detail.activitySub")} />{data.activity.length ? <div className="mt-5 divide-y divide-[#3A3A3A]/7">{data.activity.slice(0, 8).map((item, index) => <div key={`${item.type}-${item.occurred_at}-${index}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><div className="h-2 w-2 shrink-0 rounded-full bg-[#F47822]" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#3A3A3A]">{item.title}</p><p className="mt-1 truncate text-xs text-[#3A3A3A]/45">{item.detail}</p></div><p className="shrink-0 text-[11px] text-[#3A3A3A]/40">{formatDate(item.occurred_at, locale, t("instructor.students.detail.recently"))}</p></div>)}</div> : <p className="mt-5 rounded-xl bg-[#FCFCFC] px-4 py-6 text-center text-xs text-[#3A3A3A]/45">{t("instructor.students.detail.activityEmpty")}</p>}</section>{data.simulator ? <SimulatorSection simulator={data.simulator} locale={locale} /> : null}</div>;
}

function SectionHeading({ icon: Icon, title, subtitle }: { icon: typeof BookOpen; title: string; subtitle: string }) { return <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]"><Icon className="h-4 w-4" /></div><div><h2 className="font-semibold text-[#3A3A3A]">{title}</h2><p className="mt-1 text-xs text-[#3A3A3A]/45">{subtitle}</p></div></div>; }

function formatSimDuration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || seconds < 0) return "—";
    const total = Math.round(seconds);
    if (total < 60) return `${total}s`;
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return rest > 0 ? `${minutes}m ${rest}s` : `${minutes}m`;
}

function SimulatorSection({ simulator, locale }: { simulator: { summary: { sessions: number; completed: number; average_score: number; pass_rate: number; average_hints: number; average_duration_seconds: number }; sessions: SimulatorSessionRow[] }; locale: string }) {
    const { t } = useTranslation();
    const summary = simulator.summary;
    const sessions = simulator.sessions;
    return (
        <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)]" data-testid="student-simulator-section">
            <SectionHeading icon={FlaskConical} title={t("instructor.students.detail.simulator.title")} subtitle={t("instructor.students.detail.simulator.subtitle")} />
            <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {([
                    [t("instructor.students.detail.simulator.sessionsCount", { count: summary.sessions }), String(summary.sessions)],
                    [t("instructor.students.detail.simulator.completedCount", { count: summary.completed }), String(summary.completed)],
                    [t("instructor.students.detail.simulator.avgScore"), `${summary.average_score}%`],
                    [t("instructor.students.detail.simulator.passRate"), `${summary.pass_rate}%`],
                    [t("instructor.students.detail.simulator.avgHints"), String(summary.average_hints)],
                    [t("instructor.students.detail.simulator.avgDuration"), formatSimDuration(summary.average_duration_seconds)],
                ] as Array<[string, string]>).map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-[#3A3A3A]/8 bg-[#FCFCFC] px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[.08em] text-[#3A3A3A]/40">{label}</p>
                        <p className="mt-1 text-lg font-black text-[#3A3A3A]">{value}</p>
                    </div>
                ))}
            </div>
            {sessions.length ? (
                <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left rtl:text-right">
                        <thead className="border-b border-[#3A3A3A]/8 text-[10px] font-bold uppercase tracking-[.13em] text-[#3A3A3A]/38">
                            <tr>
                                <th className="pb-3">{t("instructor.students.detail.simulator.headers.tool")}</th>
                                <th className="pb-3">{t("instructor.students.detail.simulator.headers.vehicle")}</th>
                                <th className="pb-3">{t("instructor.students.detail.simulator.headers.score")}</th>
                                <th className="pb-3">{t("instructor.students.detail.simulator.headers.outcome")}</th>
                                <th className="pb-3">{t("instructor.students.detail.simulator.headers.attempts")}</th>
                                <th className="pb-3">{t("instructor.students.detail.simulator.headers.hints")}</th>
                                <th className="pb-3">{t("instructor.students.detail.simulator.headers.duration")}</th>
                                <th className="pb-3">{t("instructor.students.detail.simulator.headers.started")}</th>
                                <th className="pb-3">{t("instructor.students.detail.simulator.headers.status")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3A3A3A]/7">
                            {sessions.map((session) => (
                                <tr key={session.id} className="transition hover:bg-[#FCFCFC]">
                                    <td className="py-3 pe-3">
                                        <span className="rounded-full border border-[#F47822]/25 bg-[#F47822]/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-[#F47822]">{session.tool}</span>
                                    </td>
                                    <td className="py-3 pe-3 font-mono text-[11px] text-[#3A3A3A]/60" dir="ltr">{session.vehicle_key ?? "—"}</td>
                                    <td className="py-3 pe-3 text-sm font-bold text-[#3A3A3A]">{session.result?.score ?? session.score ?? "—"}</td>
                                    <td className="py-3 pe-3">
                                        <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${session.result?.outcome === "pass" ? "bg-emerald-500/12 text-emerald-700" : session.result?.outcome === "fail" ? "bg-red-500/12 text-red-700" : "bg-[#3A3A3A]/[.07] text-[#3A3A3A]/55"}`}>
                                            {session.result?.outcome ? t(`instructor.students.detail.simulator.outcome.${session.result.outcome}`) : "—"}
                                        </span>
                                    </td>
                                    <td className="py-3 pe-3 text-sm font-semibold text-[#3A3A3A]">{session.result?.attempts ?? "—"}</td>
                                    <td className="py-3 pe-3 text-sm font-semibold text-[#3A3A3A]">{session.result?.hints_used ?? "—"}</td>
                                    <td className="py-3 pe-3 text-sm text-[#3A3A3A]">{formatSimDuration(session.result?.duration_seconds ?? session.duration_seconds)}</td>
                                    <td className="py-3 pe-3 text-[11px] text-[#3A3A3A]/50">{formatDate(session.started_at, locale, "—")}</td>
                                    <td className="py-3">
                                        <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${session.status === "completed" ? "bg-emerald-500/12 text-emerald-700" : "bg-amber-500/15 text-amber-700"}`}>
                                            {t(`instructor.students.detail.simulator.status.${session.status}`)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="mt-5 rounded-xl bg-[#FCFCFC] px-4 py-6 text-center text-xs text-[#3A3A3A]/45">{t("instructor.students.detail.simulator.empty")}</p>
            )}
        </section>
    );
}
function AttemptList({ title, icon, empty, items }: { title: string; icon: typeof BookOpen; empty: string; items: Array<{ id: string; title: string; course: string; score: string; passed: boolean }> }) {
    const { t } = useTranslation();
    return <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)]"><SectionHeading icon={icon} title={title} subtitle={t("instructor.students.detail.resultsSub")} />{items.length ? <div className="mt-5 divide-y divide-[#3A3A3A]/7">{items.map((item) => <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><CheckCircle2 className={`h-4 w-4 shrink-0 ${item.passed ? "text-emerald-500" : "text-[#3A3A3A]/25"}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#3A3A3A]">{item.title}</p><p className="mt-1 truncate text-xs text-[#3A3A3A]/45">{item.course}</p></div><span className="shrink-0 text-sm font-bold text-[#3A3A3A]">{item.score}</span></div>)}</div> : <p className="mt-5 rounded-xl bg-[#FCFCFC] px-4 py-6 text-center text-xs leading-5 text-[#3A3A3A]/45">{empty}</p>}</section>;
}

function formatDate(value: string | null, locale: string, fallback: string): string { return value ? new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(value)) : fallback; }
