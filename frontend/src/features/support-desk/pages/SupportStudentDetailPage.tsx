import { AlertTriangle, ArrowLeft, Award, BookOpen, Clock3, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { supportDeskApi, type DeskStudentDetail } from "../api/supportDesk.api";

function statusColor(status: string): string {
    if (status === "open") return "bg-[#F47822]/10 text-[#F47822]";
    if (status === "pending") return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400";
    if (status === "resolved") return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    if (status === "completed") return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    return "bg-[#3A3A3A]/8 dark:bg-white/8 text-[#3A3A3A]/60 dark:text-white/60";
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: string }) {
    return (
        <div className="rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40 dark:text-white/40">{label}</p>
            <p className={`mt-1.5 text-2xl font-black ${tone}`}>{value}</p>
        </div>
    );
}

/**
 * Read-only student detail: enrollments with progress, certificates and the
 * student's support tickets, all in one place so an agent never has to guess.
 */
export function SupportStudentDetailPage() {
    const { t, i18n } = useTranslation();
    const { studentId } = useParams<{ studentId: string }>();
    const [student, setStudent] = useState<DeskStudentDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!studentId) return;
        let cancelled = false;
        void supportDeskApi
            .student(studentId)
            .then((data) => {
                if (!cancelled) setStudent(data);
            })
            .catch((cause: unknown) => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : t("supportDesk.student.loadFail"));
            });
        return () => {
            cancelled = true;
        };
    }, [studentId, t]);

    if (error) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-6">
                <p role="alert" className="rounded-2xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>
                <Link to="/support-desk/students" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#F47822]">
                    <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" /> {t("supportDesk.student.backToDirectory")}
                </Link>
            </main>
        );
    }

    if (!student) {
        return (
            <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
                <div className="h-32 animate-pulse rounded-3xl bg-white dark:bg-[#1b1b20]" />
                <div className="h-64 animate-pulse rounded-3xl bg-white dark:bg-[#1b1b20]" />
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
            <Link to="/support-desk/students" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3A3A3A]/50 dark:text-white/50 hover:text-[#3A3A3A]">
                <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" /> {t("supportDesk.student.backToDirectory")}
            </Link>

            <section className="rounded-3xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">{student.name}</h1>
                        <p dir="ltr" className="mt-1 text-xs text-[#3A3A3A]/50 dark:text-white/50 rtl:text-right">{student.email}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                            <Clock3 className="h-3 w-3" />
                            {t("supportDesk.student.joined", { date: student.joined_at ? new Date(student.joined_at).toLocaleDateString(i18n.language) : "—" })}
                            {student.last_active_at && ` · ${t("supportDesk.student.lastActive", { date: new Date(student.last_active_at).toLocaleDateString(i18n.language) })}`}
                        </p>
                    </div>
                    <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${student.status === "active" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-[#F7F7F7] dark:bg-[#101013] text-[#3A3A3A]/55 dark:text-white/55"}`}>
                        {student.status ?? "—"}
                    </span>
                </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MiniStat label={t("supportDesk.student.enrollments")} value={student.summary.enrollments} tone="text-[#F47822]" />
                <MiniStat label={t("supportDesk.student.completed")} value={student.summary.completed} tone="text-emerald-600 dark:text-emerald-400" />
                <MiniStat label={t("supportDesk.student.certificates")} value={student.summary.certificates} tone="text-[#3A3A3A] dark:text-[#ececef]" />
                <MiniStat label={t("supportDesk.student.openTickets")} value={student.summary.open_tickets} tone="text-amber-600 dark:text-amber-400" />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded-3xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-5 shadow-sm sm:p-6">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                        <BookOpen className="h-4 w-4 text-[#F47822]" /> {t("supportDesk.student.enrollmentsTitle")}
                    </h2>
                    {student.enrollments.length === 0 ? (
                        <p className="mt-3 text-xs text-[#3A3A3A]/50 dark:text-white/50">{t("supportDesk.student.noEnrollments")}</p>
                    ) : (
                        <ul className="mt-3 divide-y divide-[#3A3A3A]/6">
                            {student.enrollments.map((enrollment) => (
                                <li key={enrollment.id} className="py-3">
                                    <div className="flex items-center gap-3">
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{enrollment.course?.title ?? "—"}</span>
                                            <span className="mt-0.5 block text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                                                {enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString(i18n.language) : "—"}
                                            </span>
                                        </span>
                                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusColor(enrollment.status)}`}>{enrollment.status}</span>
                                    </div>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/8 dark:bg-white/8">
                                        <div className="h-full rounded-full bg-[#F47822]" style={{ width: `${enrollment.progress_percentage}%` }} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <div className="space-y-5">
                    <section className="rounded-3xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-5 shadow-sm sm:p-6">
                        <h2 className="flex items-center gap-2 text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                            <Award className="h-4 w-4 text-[#F47822]" /> {t("supportDesk.student.certificatesTitle")}
                        </h2>
                        {student.certificates.length === 0 ? (
                            <p className="mt-3 text-xs text-[#3A3A3A]/50 dark:text-white/50">{t("supportDesk.student.noCertificates")}</p>
                        ) : (
                            <ul className="mt-3 divide-y divide-[#3A3A3A]/6">
                                {student.certificates.map((certificate) => (
                                    <li key={certificate.id} className="flex items-center gap-3 py-2.5">
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{certificate.course_title ?? "—"}</span>
                                            <span dir="ltr" className="block text-[10px] text-[#3A3A3A]/40 dark:text-white/40 rtl:text-right">{certificate.certificate_number}</span>
                                        </span>
                                        <span className="shrink-0 text-[11px] text-[#3A3A3A]/50 dark:text-white/50">
                                            {certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString(i18n.language) : "—"}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="rounded-3xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-5 shadow-sm sm:p-6">
                        <h2 className="flex items-center gap-2 text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                            <Ticket className="h-4 w-4 text-[#F47822]" /> {t("supportDesk.student.ticketsTitle")}
                        </h2>
                        {student.tickets.length === 0 ? (
                            <p className="mt-3 text-xs text-[#3A3A3A]/50 dark:text-white/50">{t("supportDesk.student.noTickets")}</p>
                        ) : (
                            <ul className="mt-3 divide-y divide-[#3A3A3A]/6">
                                {student.tickets.map((ticket) => (
                                    <li key={ticket.id}>
                                        <Link to={`/support-desk/tickets/${ticket.id}`} className="flex items-center gap-3 py-2.5">
                                            {ticket.overdue && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />}
                                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{ticket.subject}</span>
                                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusColor(ticket.status)}`}>{ticket.status}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}
