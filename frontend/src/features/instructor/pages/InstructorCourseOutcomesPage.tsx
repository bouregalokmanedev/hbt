import {
    Award,
    ChevronRight,
    MessageSquareText,
    Star,
    Users,
} from "lucide-react";
import {
    useQuery,
} from "@tanstack/react-query";
import {
    Link,
    useParams,
} from "react-router-dom";

import {
    getInstructorCourseCertificates,
    getInstructorCourseFeedback,
} from "../api/instructorApi";

export function InstructorCourseOutcomesPage() {
    const { courseId } = useParams();
    const feedback = useQuery({
        queryKey: ["instructor", "course", courseId, "feedback"],
        queryFn: () => getInstructorCourseFeedback(courseId ?? ""),
        enabled: Boolean(courseId),
    });
    const certificates = useQuery({
        queryKey: ["instructor", "course", courseId, "certificates"],
        queryFn: () => getInstructorCourseCertificates(courseId ?? ""),
        enabled: Boolean(courseId),
    });

    if (feedback.isLoading || certificates.isLoading) {
        return <OutcomesSkeleton />;
    }

    if (feedback.isError || certificates.isError || !feedback.data || !certificates.data) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <h1 className="font-semibold text-red-900">Outcomes unavailable</h1>
                <p className="mt-2 text-sm text-red-700">You can only view feedback and certificates for courses you own.</p>
            </div>
        );
    }

    const feedbackData = feedback.data;
    const certificateData = certificates.data;

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <Link to={`/instructor/courses/${courseId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3A3A3A]/50 transition hover:text-[#F47822]">
                        Course editor <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">Learner outcomes</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#3A3A3A]">Feedback & certificates</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3A3A3A]/50">Read learner feedback and follow verified course completions. Certificate records stay read-only here.</p>
                </div>
                <Link to={`/instructor/courses/${courseId}/analytics`} className="rounded-xl border border-[#3A3A3A]/10 px-4 py-3 text-xs font-semibold text-[#3A3A3A]/65 transition hover:border-[#F47822]/30 hover:text-[#F47822]">
                    View analytics
                </Link>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric icon={Star} label="Average rating" value={feedbackData.summary.total ? `${feedbackData.summary.average_rating}/5` : "—"} detail={`${feedbackData.summary.total} learner reviews`} />
                <Metric icon={MessageSquareText} label="Feedback received" value={feedbackData.summary.total} detail="Course and lesson feedback" />
                <Metric icon={Award} label="Certificates issued" value={certificateData.summary.issued} detail={`${certificateData.summary.issued_this_month} issued this month`} />
                <Metric icon={Users} label="Certificate eligibility" value={`${certificateData.summary.issuance_rate}%`} detail={`${certificateData.summary.completed_students} learners completed`} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[.88fr_1.12fr]">
                <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)]">
                    <SectionHeading icon={Star} title="Rating overview" subtitle="A clear distribution of learner sentiment." />
                    {feedbackData.summary.total ? (
                        <div className="mt-6 space-y-3">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                const count = feedbackData.summary.rating_distribution[String(rating)] ?? 0;
                                const percentage = Math.round((count / feedbackData.summary.total) * 100);

                                return (
                                    <div key={rating} className="flex items-center gap-3">
                                        <span className="w-7 text-xs font-bold text-[#3A3A3A]">{rating}</span>
                                        <Star className="h-3.5 w-3.5 fill-[#F47822] text-[#F47822]" />
                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#3A3A3A]/7">
                                            <div className="h-full rounded-full bg-[#F47822]" style={{ width: `${percentage}%` }} />
                                        </div>
                                        <span className="w-8 text-right text-xs text-[#3A3A3A]/45">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <Empty text="Learner reviews will appear here after feedback is submitted." />}
                </section>

                <section className="rounded-2xl border border-[#3A3A3A]/8 bg-[#3A3A3A] p-5 text-white shadow-[0_8px_30px_rgba(58,58,58,.1)]">
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F9A16C]">Certificate integrity</p>
                    <h2 className="mt-3 text-lg font-semibold">Issued through course completion</h2>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-white/65">Certificates are awarded by the existing assessment and completion workflow. This workspace is intentionally view-only, so instructors can monitor outcomes without altering verified records.</p>
                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <CertificateStat label="Issued" value={certificateData.summary.issued} />
                        <CertificateStat label="Completed learners" value={certificateData.summary.completed_students} />
                    </div>
                </section>
            </div>

            <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)]">
                <SectionHeading icon={MessageSquareText} title="Recent learner feedback" subtitle="The latest course and lesson comments from enrolled learners." />
                {feedbackData.recent_feedback.length ? (
                    <div className="mt-5 grid gap-3 lg:grid-cols-2">
                        {feedbackData.recent_feedback.map((item) => (
                            <article key={item.id} className="rounded-xl border border-[#3A3A3A]/8 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-[#3A3A3A]">{item.student_name}</p>
                                        <p className="mt-1 text-[11px] text-[#3A3A3A]/45">{item.lesson_title ? `Lesson: ${item.lesson_title}` : "Course feedback"} · {formatDate(item.submitted_at)}</p>
                                    </div>
                                    <Rating value={item.rating} />
                                </div>
                                <p className="mt-4 text-sm leading-6 text-[#3A3A3A]/65">{item.comment}</p>
                            </article>
                        ))}
                    </div>
                ) : <div className="mt-5"><Empty text="No feedback yet. Learner feedback will appear as students complete lessons and share their experience." /></div>}
            </section>

            <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)]">
                <SectionHeading icon={Award} title="Certificate history" subtitle="Verified certificates issued to learners in this course." />
                {certificateData.certificates.length ? (
                    <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left">
                            <thead className="border-b border-[#3A3A3A]/7 text-[10px] font-bold uppercase tracking-[.12em] text-[#3A3A3A]/35">
                                <tr><th className="pb-3">Learner</th><th className="pb-3">Certificate number</th><th className="pb-3">Issued</th><th className="pb-3 text-right">Profile</th></tr>
                            </thead>
                            <tbody className="divide-y divide-[#3A3A3A]/7">
                                {certificateData.certificates.map((certificate) => (
                                    <tr key={certificate.id}>
                                        <td className="py-4"><p className="text-sm font-semibold text-[#3A3A3A]">{certificate.student_name}</p><p className="mt-1 text-xs text-[#3A3A3A]/45">{certificate.student_email ?? "—"}</p></td>
                                        <td className="py-4 font-mono text-xs text-[#3A3A3A]/60">{certificate.certificate_number}</td>
                                        <td className="py-4 text-sm text-[#3A3A3A]/60">{formatDate(certificate.issued_at)}</td>
                                        <td className="py-4 text-right"><Link to={`/instructor/students/${certificate.student_id}`} className="inline-flex rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#F47822] transition hover:bg-[#F47822]/8">View learner</Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <div className="mt-5"><Empty text="No certificates have been issued for this course yet." /></div>}
            </section>
        </div>
    );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Award; label: string; value: string | number; detail: string }) {
    return <div className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-[#3A3A3A]/45">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-[#3A3A3A]">{value}</p><p className="mt-2 text-[11px] text-[#3A3A3A]/45">{detail}</p></div><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]"><Icon className="h-5 w-5" /></div></div></div>;
}

function SectionHeading({ icon: Icon, title, subtitle }: { icon: typeof Award; title: string; subtitle: string }) {
    return <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]"><Icon className="h-4 w-4" /></div><div><h2 className="font-semibold text-[#3A3A3A]">{title}</h2><p className="mt-1 text-xs leading-5 text-[#3A3A3A]/45">{subtitle}</p></div></div>;
}

function CertificateStat({ label, value }: { label: string; value: number }) {
    return <div className="rounded-xl bg-white/10 p-3"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>;
}

function Rating({ value }: { value: number }) {
    return <span className="inline-flex items-center gap-0.5 rounded-full bg-[#F47822]/10 px-2 py-1 text-xs font-bold text-[#F47822]">{value}<Star className="h-3 w-3 fill-current" /></span>;
}

function Empty({ text }: { text: string }) {
    return <p className="rounded-xl bg-[#FCFCFC] px-4 py-7 text-center text-xs leading-5 text-[#3A3A3A]/45">{text}</p>;
}

function formatDate(value: string | null): string {
    return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)) : "—";
}

function OutcomesSkeleton() {
    return <div className="mx-auto max-w-6xl space-y-5"><div className="h-32 animate-pulse rounded-2xl bg-black/5" /><div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-black/5" />)}</div><div className="h-72 animate-pulse rounded-2xl bg-black/5" /></div>;
}
