import { Award, Download, ExternalLink, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { downloadCertificate, getCertificates } from "../api/certificates.api";
import type { Certificate } from "../types/certificate.types";
import { env } from "@/config/env";

function formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export function CertificatesPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const handleDownload = async (certificate: Certificate) => {
        setDownloadingId(certificate.id);
        try {
            await downloadCertificate(certificate);
        } catch {
            setError("Unable to download this certificate. Please try again.");
        } finally {
            setDownloadingId(null);
        }
    };

    useEffect(() => {
        void getCertificates().then(setCertificates).catch((reason: unknown) => {
            setError(reason instanceof Error ? reason.message : "Unable to load certificates.");
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-sm text-[#3A3A3A]/55">Loading certificates…</div>;
    if (error) return <div className="m-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>;

    return (
        <main className="min-h-full bg-background">
            <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
                <section className="overflow-hidden rounded-3xl bg-[#3A3A3A] p-7 text-white shadow-[0_12px_35px_rgba(58,58,58,0.12)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">Your achievements</p>
                    <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
                        <div><h1 className="text-2xl font-bold">Certificates</h1><p className="mt-1 text-sm text-white/60">Your verified learning milestones, ready to share.</p></div>
                        <div className="flex min-w-[142px] items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-3.5 py-3 backdrop-blur-sm">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822] text-white shadow-[0_6px_16px_rgba(244,120,34,0.25)]"><Award className="h-5 w-5" /></div>
                            <div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">Certificates earned</p><p className="mt-0.5 text-lg font-bold leading-none text-white">{certificates.length}</p></div>
                        </div>
                    </div>
                </section>

                {certificates.length === 0 ? (
                    <section className="mt-6 rounded-3xl border border-dashed border-[#3A3A3A]/15 bg-white px-6 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F47822]/10"><Award className="h-7 w-7 text-[#F47822]" /></div>
                        <h2 className="mt-5 text-xl font-bold text-[#3A3A3A]">Your certificates will appear here</h2>
                        <p className="mx-auto mt-2 max-w-md text-sm text-[#3A3A3A]/55">Complete an eligible course to receive a verified HBT certificate.</p>
                    </section>
                ) : <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{certificates.map((certificate) => (
                    <article key={certificate.id} className="overflow-hidden rounded-3xl border border-[#3A3A3A]/10 bg-white p-6 shadow-[0_8px_30px_rgba(58,58,58,0.05)] transition hover:-translate-y-0.5 hover:border-[#F47822]/30 hover:shadow-[0_14px_34px_rgba(58,58,58,0.10)]">
                        <div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F47822]/10"><Award className="h-5 w-5 text-[#F47822]" /></div><ShieldCheck className="h-5 w-5 text-emerald-600" /></div>
                        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#F47822]">Certificate of completion</p>
                        <h2 className="mt-2 text-lg font-bold text-[#3A3A3A]">{certificate.course_title}</h2>
                        <p className="mt-2 text-sm text-[#3A3A3A]/55">Awarded to {certificate.recipient_name}</p>
                        <p className="mt-5 text-xs text-[#3A3A3A]/45">Issued {formatDate(certificate.issued_at)} · {certificate.certificate_number}</p>
                        <div className="mt-5 flex gap-2"><button type="button" onClick={() => void handleDownload(certificate)} disabled={downloadingId === certificate.id} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#F47822] disabled:cursor-wait disabled:opacity-60"><Download className="h-4 w-4" />{downloadingId === certificate.id ? "Preparing PDF…" : "Download PDF"}</button><a href={`${env.apiUrl}/v1/certificates/verify/${certificate.certificate_number}`} target="_blank" rel="noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3A3A3A]/10 text-[#3A3A3A]/60 transition hover:border-[#F47822]/30 hover:bg-[#F47822]/5 hover:text-[#F47822]" aria-label="Verify certificate"><ExternalLink className="h-4 w-4" /></a></div>
                    </article>
                ))}</section>}
            </div>
        </main>
    );
}
