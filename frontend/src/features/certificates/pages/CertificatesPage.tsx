import { Award } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { CertificateCard } from "../components/CertificateCard";
import { certificateVerifyPath, downloadCertificate, getCertificates } from "../api/certificates.api";
import type { Certificate } from "../types/certificate.types";

export function CertificatesPage() {
    const { t } = useTranslation();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [sharedId, setSharedId] = useState<string | null>(null);

    const handleDownload = async (certificate: Certificate) => {
        setDownloadingId(certificate.id);
        try {
            await downloadCertificate(certificate);
        } catch {
            setError(t("certificates.downloadFail"));
        } finally {
            setDownloadingId(null);
        }
    };

    const handleShare = async (certificate: Certificate) => {
        const url = `${window.location.origin}${certificateVerifyPath(certificate)}`;
        const shareData = {
            title: t("certificates.shareTitle", { course: certificate.course_title }),
            text: t("certificates.shareText", { course: certificate.course_title }),
            url,
        };

        if (typeof navigator.share === "function") {
            try {
                await navigator.share(shareData);
            } catch {
                // Share sheet dismissed — nothing to copy back.
            }
            return;
        }

        try {
            await navigator.clipboard.writeText(url);
            setSharedId(certificate.id);
            setTimeout(() => setSharedId(null), 2000);
        } catch {
            // Clipboard unavailable (insecure context) — link stays on the verify button.
        }
    };

    useEffect(() => {
        void getCertificates().then(setCertificates).catch((reason: unknown) => {
            setError(reason instanceof Error ? reason.message : t("certificates.loadFail"));
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-sm text-[#3A3A3A]/55 dark:text-white/55">{t("certificates.loading")}</div>;
    if (error) return <div className="m-6 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-5 text-sm text-red-700 dark:text-red-400">{error}</div>;

    return (
        <main className="min-h-full bg-background">
            <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
                <section className="overflow-hidden rounded-3xl bg-[#3A3A3A] p-7 text-white shadow-[0_12px_35px_rgba(58,58,58,0.12)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("certificates.hero.eyebrow")}</p>
                    <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
                        <div><h1 className="text-2xl font-bold">{t("certificates.hero.title")}</h1><p className="mt-1 text-sm text-white/60">{t("certificates.hero.description")}</p></div>
                        <div className="flex min-w-[142px] items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-3.5 py-3 backdrop-blur-sm">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822] text-white shadow-[0_6px_16px_rgba(244,120,34,0.25)]"><Award className="h-5 w-5" /></div>
                            <div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">{t("certificates.hero.earned")}</p><p className="mt-0.5 text-lg font-bold leading-none text-white">{certificates.length}</p></div>
                        </div>
                    </div>
                </section>

                {certificates.length === 0 ? (
                    <section className="mt-6 rounded-3xl border border-dashed border-[#3A3A3A]/15 dark:border-white/15 bg-white dark:bg-[#1b1b20] px-6 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F47822]/10"><Award className="h-7 w-7 text-[#F47822]" /></div>
                        <h2 className="mt-5 text-xl font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("certificates.emptyTitle")}</h2>
                        <p className="mx-auto mt-2 max-w-md text-sm text-[#3A3A3A]/55 dark:text-white/55">{t("certificates.emptyDesc")}</p>
                    </section>
                ) : (
                    <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {certificates.map((certificate) => (
                            <CertificateCard
                                key={certificate.id}
                                certificate={certificate}
                                downloading={downloadingId === certificate.id}
                                shared={sharedId === certificate.id}
                                onDownload={() => void handleDownload(certificate)}
                                onShare={() => void handleShare(certificate)}
                            />
                        ))}
                    </section>
                )}
            </div>
        </main>
    );
}
