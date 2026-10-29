import { ArrowRight, Award, BadgeCheck, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import {
    downloadCertificate,
    getCertificates,
} from "@/features/certificates/api/certificates.api";

import type { CourseJourney } from "../types/journey.types";

interface CourseCertificateRow {
    id: string;
    course_id?: string | null;
    course_title: string;
    certificate_number: string;
    issued_at: string | null;
}

export function CourseCertificate({
    courseId,
    courseTitle,
    authenticated,
    journey = null,
    className = "",
}: {
    courseId: string;
    courseTitle: string;
    authenticated: boolean;
    /**
     * Canonical learner journey. When present it is authoritative: it tells
     * us whether the certificate already exists, and where the learner
     * should go next when it does not.
     */
    journey?: CourseJourney | null;
    className?: string;
}) {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === "ar" ? "ar" : undefined;
    const steps = t("courseDetails.certificate.steps", { returnObjects: true }) as { title: string; text: string }[];
    const [fetched, setFetched] = useState<CourseCertificateRow | null>(null);
    const [checked, setChecked] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const journeyCertificate = journey?.certificate ?? null;
    const journeyCertificateId = journeyCertificate?.id ?? null;
    const journeyCertificateNumber = journeyCertificate?.certificate_number ?? null;
    const journeyCertificateIssuedAt = journeyCertificate?.issued_at ?? null;

    // The journey is the source of truth once it has loaded. The certificate
    // list request only fills in legacy payloads that predate the journey.
    const earned: CourseCertificateRow | null = journeyCertificate
        ? {
              id: journeyCertificate.id,
              course_id: courseId,
              course_title: courseTitle,
              certificate_number: journeyCertificate.certificate_number,
              issued_at: journeyCertificate.issued_at,
          }
        : fetched;

    useEffect(() => {
        if (!authenticated) {
            setChecked(true);
            return;
        }

        if (journeyCertificateId !== null) {
            setChecked(true);
            return;
        }

        let cancelled = false;

        void getCertificates()
            .then((all) => {
                if (cancelled) return;

                const found = (all as CourseCertificateRow[]).find(
                    (entry) => entry.course_id === courseId || entry.course_title === courseTitle,
                );
                setFetched(found ?? null);
            })
            .catch(() => {
                if (!cancelled) setFetched(null);
            })
            .finally(() => {
                if (!cancelled) setChecked(true);
            });

        return () => {
            cancelled = true;
        };
    }, [
        courseId,
        courseTitle,
        authenticated,
        journeyCertificateId,
        journeyCertificateNumber,
        journeyCertificateIssuedAt,
    ]);

    const handleDownload = async () => {
        if (!earned || downloading) return;
        setDownloading(true);
        try {
            await downloadCertificate({
                id: earned.id,
                certificate_number: earned.certificate_number,
            } as Parameters<typeof downloadCertificate>[0]);
        } catch {
            // The error toast/empty state stays visible; keep the button usable.
        } finally {
            setDownloading(false);
        }
    };

    if (checked && earned) {
        return (
            <section className={`overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50/60 via-white to-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] sm:p-8 ${className}`}>
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
                        <BadgeCheck className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">{t("courseDetails.certificate.earnedEyebrow")}</p>
                        <h2 className="mt-2 text-xl font-bold text-foreground">{t("courseDetails.certificate.earnedTitle", { title: courseTitle })}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {earned.certificate_number}
                            {earned.issued_at ? (
                                <>
                                    {" · "}
                                    {t("courseDetails.certificate.issued")}{" "}
                                    {new Intl.DateTimeFormat(dateLocale, { month: "short", day: "numeric", year: "numeric" }).format(
                                        new Date(earned.issued_at),
                                    )}
                                </>
                            ) : null}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => void handleDownload()}
                                disabled={downloading}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#e96b17] disabled:opacity-60"
                            >
                                <Download className="h-4 w-4" />
                                {downloading ? t("courseDetails.certificate.preparing") : t("courseDetails.certificate.downloadPdf")}
                            </button>
                            <Link
                                to="/certificates"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-muted"
                            >
                                {t("courseDetails.certificate.myCertificates")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const certificateReady = Boolean(journey?.certificate_ready);
    const nextStep = journey?.next_step ?? null;
    const nextStepPath = nextStep && nextStep.type !== "completed"
        ? nextStep.path
        : certificateReady
            ? "/certificates"
            : "/assessments";
    const nextStepLabel = certificateReady
        ? t("courseDetails.certificate.viewCertificate")
        : nextStep?.type === "lesson"
            ? t("courseDetails.certificate.continueLearning")
            : nextStep?.type === "quiz"
                ? t("courseDetails.certificate.continueCheckpoint")
                : t("courseDetails.certificate.viewAssessments");

    return (
        <section className={`rounded-3xl border border-border bg-card p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] sm:p-8 ${className}`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("courseDetails.certificate.eyebrow")}</p>
                    <h2 className="mt-2 text-xl font-bold text-foreground">{t("courseDetails.certificate.title")}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {certificateReady
                            ? t("courseDetails.certificate.readyDesc")
                            : t("courseDetails.certificate.desc")}
                    </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F47822]/10">
                    <Award className="h-5 w-5 text-[#F47822]" />
                </div>
            </div>
            <ol className="mt-6 grid gap-3 sm:grid-cols-3">
                {steps.map((step, index) => (
                    <li key={step.title} className="rounded-2xl bg-muted/45 p-4">
                        <p className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F47822] text-xs font-bold text-white">
                            {index + 1}
                        </p>
                        <p className="mt-3 text-sm font-bold text-foreground">{step.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.text}</p>
                    </li>
                ))}
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
                {!authenticated ? (
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#e96b17]"
                    >
                        {t("courseDetails.certificate.loginCta")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                ) : (
                    <Link
                        to={nextStepPath}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#e96b17]"
                    >
                        {nextStepLabel} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                )}
                <Link
                    to="/verify-certificate"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-muted"
                >
                    {t("courseDetails.certificate.verify")}
                </Link>
            </div>
        </section>
    );
}
