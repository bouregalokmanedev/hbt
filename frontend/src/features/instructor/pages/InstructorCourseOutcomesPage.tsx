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
import { useTranslation } from "react-i18next";

import {
    getInstructorCourseCertificates,
    getInstructorCourseFeedback,
} from "../api/instructorApi";

export function InstructorCourseOutcomesPage() {
    const { t, i18n } = useTranslation();
    const locale = i18n.language;
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
                <h1 className="font-semibold text-red-900">{t("instructor.outcomes.errorTitle")}</h1>
                <p className="mt-2 text-sm text-red-700">{t("instructor.outcomes.errorDesc")}</p>
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
                        {t("instructor.outcomes.back")} <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                    </Link>
                    <p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">{t("instructor.outcomes.eyebrow")}</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#3A3A3A]">{t("instructor.outcomes.title")}</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3A3A3A]/50">{t("instructor.outcomes.description")}</p>
                </div>
                <Link to={`/instructor/courses/${courseId}/analytics`} className="rounded-xl border border-[#3A3A3A]/10 px-4 py-3 text-xs font-semibold text-[#3A3A3A]/65 transition hover:border-[#F47822]/30 hover:text-[#F47822]">
                    {t("instructor.outcomes.viewAnalytics")}
                </Link>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric icon={Star} label={t("instructor.outcomes.metrics.rating")} value={feedbackData.summary.total ? `${feedbackData.summary.average_rating}/5` : "—"} detail={t("instructor.outcomes.metrics.reviews", { count: feedbackData.summary.total })} />
                <Metric icon={MessageSquareText} label={t("instructor.outcomes.metrics.feedback")} value={feedbackData.summary.total} detail={t("instructor.outcomes.metrics.feedbackDetail")} />
                <Metric icon={Award} label={t("instructor.outcomes.metrics.issued")} value={certificateData.summary.issued} detail={t("instructor.outcomes.metrics.issuedMonth", { count: certificateData.summary.issued_this_month })} />
                <Metric icon={Users} label={t("instructor.outcomes.metrics.eligibility")} value={`${certificateData.summary.issuance_rate}%`} detail={t("instructor.outcomes.metrics.completedDetail", { count: certificateData.summary.completed_students })} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[.88fr_1.12fr]">
                <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)]">
                    <SectionHeading icon={Star} title={t("instructor.outcomes.ratingTitle")} subtitle={t("instructor.outcomes.ratingSub")} />
                    {feedbackData.summary.total ? (
                        <div className="mt-6 space-y-3">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                const count = feedbackData.summary.rating_distribution[String(rating)] ?? 0;
                                const percentage = Math.round((count / feedbackData.summary.total) * 100);

                                return (
                                    <div key={rating} className="flex items-center gap-3">
                                        <span className="w-7 shrink-0 text-xs font-bold text-[#3A3A3A]">{rating}</span>
                                        <Star className="h-3.5 w-3.5 shrink-0 fill-[#F47822] text-[#F47822]" />
                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#3A3A3A]/7">
                                            <div className="h-full rounded-full bg-[#F47822]" style={{ width: `${percentage}%` }} />
                                        </div>
                                        <span className="w-8 shrink-0 text-right text-xs text-[#3A3A3A]/45 rtl:text-left">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <Empty text={t("instructor.outcomes.ratingEmpty")} />}
                </section>

                <section className="rounded-2xl border border-[#3A3A3A]/8 bg-[#3A3A3A] p-5 text-white shadow-[0_8px_30px_rgba(58,58,58,.1)]">
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F9A16C]">{t("instructor.outcomes.certEyebrow")}</p>
                    <h2 className="mt-3 text-lg font-semibold">{t("instructor.outcomes.certTitle")}</h2>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-white/65">{t("instructor.outcomes.certDesc")}</p>
                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <CertificateStat label={t("instructor.outcomes.certIssued")} value={certificateData.summary.issued} />
                        <CertificateStat label={t("instructor.outcomes.certCompleted")} value={certificateData.summary.completed_students} />
                    </div>
                </section>
            </div>

            <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)]">
                <SectionHeading icon={MessageSquareText} title={t("instructor.outcomes.feedbackTitle")} subtitle={t("instructor.outcomes.feedbackSub")} />
                {feedbackData.recent_feedback.length ? (
                    <div className="mt-5 grid gap-3 lg:grid-cols-2">
                        {feedbackData.recent_feedback.map((item) => (
                            <article key={item.id} className="rounded-xl border border-[#3A3A3A]/8 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[#3A3A3A]">{item.student_name}</p>
                                        <p className="mt-1 text-[11px] text-[#3A3A3A]/45">{item.lesson_title ? t("instructor.outcomes.lessonPrefix", { title: item.lesson_title }) : t("instructor.outcomes.courseFeedback")} · {formatDate(item.submitted_at, locale)}</p>
                                    </div>
                                    <Rating value={item.rating} />
                                </div>
                                <p className="mt-4 text-sm leading-6 text-[#3A3A3A]/65">{item.comment}</p>
                            </article>
                        ))}
                    </div>
                ) : <div className="mt-5"><Empty text={t("instructor.outcomes.feedbackEmpty")} /></div>}
            </section>

            <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)]">
                <SectionHeading icon={Award} title={t("instructor.outcomes.historyTitle")} subtitle={t("instructor.outcomes.historySub")} />
                {certificateData.certificates.length ? (
                    <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left rtl:text-right">
                            <thead className="border-b border-[#3A3A3A]/7 text-[10px] font-bold uppercase tracking-[.12em] text-[#3A3A3A]/35">
                                <tr><th className="pb-3">{t("instructor.outcomes.colLearner")}</th><th className="pb-3">{t("instructor.outcomes.colNumber")}</th><th className="pb-3">{t("instructor.outcomes.colIssued")}</th><th className="pb-3 text-right rtl:text-left">{t("instructor.outcomes.colProfile")}</th></tr>
                            </thead>
                            <tbody className="divide-y divide-[#3A3A3A]/7">
                                {certificateData.certificates.map((certificate) => (
                                    <tr key={certificate.id}>
                                        <td className="py-4"><p className="text-sm font-semibold text-[#3A3A3A]">{certificate.student_name}</p><p className="mt-1 text-xs text-[#3A3A3A]/45">{certificate.student_email ?? "—"}</p></td>
                                        <td className="py-4 font-mono text-xs text-[#3A3A3A]/60">{certificate.certificate_number}</td>
                                        <td className="py-4 text-sm text-[#3A3A3A]/60">{formatDate(certificate.issued_at, locale)}</td>
                                        <td className="py-4 text-right rtl:text-left"><Link to={`/instructor/students/${certificate.student_id}`} className="inline-flex rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#F47822] transition hover:bg-[#F47822]/8">{t("instructor.outcomes.viewLearner")}</Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <div className="mt-5"><Empty text={t("instructor.outcomes.historyEmpty")} /></div>}
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
    return <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[#F47822]/10 px-2 py-1 text-xs font-bold text-[#F47822]">{value}<Star className="h-3 w-3 fill-current" /></span>;
}

function Empty({ text }: { text: string }) {
    return <p className="rounded-xl bg-[#FCFCFC] px-4 py-7 text-center text-xs leading-5 text-[#3A3A3A]/45">{text}</p>;
}

function formatDate(value: string | null, locale: string): string {
    return value ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value)) : "—";
}

function OutcomesSkeleton() {
    return <div className="mx-auto max-w-6xl space-y-5"><div className="h-32 animate-pulse rounded-2xl bg-black/5" /><div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-black/5" />)}</div><div className="h-72 animate-pulse rounded-2xl bg-black/5" /></div>;
}
