import { Check, Download, ExternalLink, Share2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

import { certificateVerifyPath } from "../api/certificates.api";
import type { Certificate } from "../types/certificate.types";

function formatDate(value: string, locale?: string): string {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}

interface CertificateCardProps {
    certificate: Certificate;
    downloading: boolean;
    shared: boolean;
    onDownload: () => void;
    onShare: () => void;
}

/**
 * Credential row: only what matters — what was earned, by whom, when, and the
 * QR + actions to verify/share it. The printed PDF keeps the ornamental frame.
 */
export function CertificateCard({
    certificate,
    downloading,
    shared,
    onDownload,
    onShare,
}: CertificateCardProps) {
    const { t, i18n } = useTranslation();

    const verifyPath = certificateVerifyPath(certificate);
    const verifyUrl = `${window.location.origin}${verifyPath}`;

    return (
        <article
            data-testid={`certificate-card-${certificate.certificate_number}`}
            className="rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.06)] transition hover:shadow-[0_14px_34px_rgba(58,58,58,0.10)] sm:p-6 dark:bg-[#1b1b20]"
        >
            <div className="flex items-start justify-between gap-3">
                <p className="text-base font-black tracking-[0.18em] text-[#3A3A3A] dark:text-white">
                    HB<span className="text-[#F47822]">·</span>TRONICS
                </p>

                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    {t("certificates.verifiedChip")}
                </span>
            </div>

            <h2 className="mt-5 text-lg font-black text-[#3A3A3A] dark:text-white">
                {t("certificates.cardTitle")}
            </h2>

            <p className="mt-3 break-words text-2xl font-black leading-tight text-[#3A3A3A] dark:text-white">
                {certificate.recipient_name}
            </p>
            <div className="mt-2 h-1 w-12 bg-[#F47822]" />

            <p className="mt-3 break-words text-sm font-semibold text-[#3A3A3A]/70 dark:text-white/70">
                {certificate.course_title}
            </p>

            <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-[#3A3A3A]/45 dark:text-white/45">
                {t("certificates.issued", { date: formatDate(certificate.issued_at, i18n.language) })}
                {" · "}
                <span dir="ltr" className="font-semibold">
                    {certificate.certificate_number}
                </span>
            </p>

            <div className="mt-5 flex items-center gap-3">
                <div className="shrink-0 rounded-lg bg-white p-1 dark:bg-white">
                    <QRCodeSVG value={verifyUrl} size={64} level="M" />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/60 dark:text-white/60">
                        {t("certificates.scanToVerify")}
                    </p>
                    <p dir="ltr" className="mt-1 truncate text-xs text-[#3A3A3A]/45 dark:text-white/45">
                        {verifyUrl}
                    </p>
                </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
                <button
                    type="button"
                    onClick={onDownload}
                    disabled={downloading}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#F47822] disabled:cursor-wait disabled:opacity-60"
                >
                    <Download className="h-4 w-4" />
                    {downloading ? t("certificates.preparing") : t("certificates.download")}
                </button>

                <button
                    type="button"
                    onClick={onShare}
                    data-testid={`certificate-share-${certificate.certificate_number}`}
                    aria-label={shared ? t("certificates.shareCopied") : t("certificates.shareAria")}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3A3A3A]/10 text-[#3A3A3A]/60 transition hover:border-[#F47822]/30 hover:bg-[#F47822]/5 hover:text-[#F47822] dark:border-white/10 dark:text-white/60"
                >
                    {shared ? (
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                        <Share2 className="h-4 w-4" />
                    )}
                </button>

                <Link
                    to={verifyPath}
                    data-testid={`certificate-verify-${certificate.certificate_number}`}
                    aria-label={t("certificates.verifyAria")}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3A3A3A]/10 text-[#3A3A3A]/60 transition hover:border-[#F47822]/30 hover:bg-[#F47822]/5 hover:text-[#F47822] dark:border-white/10 dark:text-white/60"
                >
                    <ExternalLink className="h-4 w-4" />
                </Link>
            </div>
        </article>
    );
}
