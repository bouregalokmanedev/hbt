import { Award, BadgeCheck, Copy, ShieldAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { VerifiedCertificate } from "../types";

export type VerificationPopupState =
    | { kind: "success"; certificate: VerifiedCertificate }
    | { kind: "error"; message: string }
    | null;

interface VerificationPopupProps {
    state: VerificationPopupState;
    onClose: () => void;
    onViewDetails?: () => void;
}

function formatDate(value: string): string {
    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: "long",
        }).format(new Date(value));
    } catch {
        return value;
    }
}

export function VerificationPopup({ state, onClose, onViewDetails }: VerificationPopupProps) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!state) return;
        setCopied(false);

        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [state, onClose]);

    if (!state) return null;

    const isSuccess = state.kind === "success";

    const handleCopy = async () => {
        if (!isSuccess) return;
        try {
            await navigator.clipboard.writeText(state.certificate.certificate_number);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#3A3A3A]/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="verification-popup-title"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-200">
                {/* Brand top strip */}
                <div className={`h-1.5 w-full ${isSuccess ? "bg-[#F47822]" : "bg-red-500"}`} />
                <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-x-0 top-1.5 h-28 bg-gradient-to-b ${
                        isSuccess ? "from-[#F47822]/12 to-transparent" : "from-red-500/10 to-transparent"
                    }`}
                />

                <button
                    type="button"
                    onClick={onClose}
                    aria-label={t("verifyPage.popup.closeLabel")}
                    className="absolute end-4 top-4 rounded-lg p-1.5 text-[#3A3A3A]/45 transition hover:bg-[#F3F3F3] hover:text-[#3A3A3A]"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="relative px-7 pb-7 pt-8 text-center">
                    <div
                        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ${
                            isSuccess
                                ? "bg-[#F47822] text-white shadow-[0_10px_28px_rgba(244,120,34,.35)]"
                                : "bg-red-500 text-white shadow-[0_10px_28px_rgba(239,68,68,.3)]"
                        }`}
                    >
                        {isSuccess ? <BadgeCheck className="h-8 w-8" /> : <ShieldAlert className="h-8 w-8" />}
                    </div>

                    <p
                        className={`mt-5 text-[10px] font-bold uppercase tracking-[0.2em] ${
                            isSuccess ? "text-[#F47822]" : "text-red-500"
                        }`}
                    >
                        {isSuccess ? t("verifyPage.popup.verified") : t("verifyPage.popup.failed")}
                    </p>
                    <h2
                        id="verification-popup-title"
                        className="mt-2 text-xl font-bold leading-snug text-[#3A3A3A]"
                    >
                        {isSuccess ? t("verifyPage.popup.authenticMsg") : t("verifyPage.popup.notAuthentic")}
                    </h2>

                    {isSuccess ? (
                        <div className="mt-5 rounded-2xl border border-[#3A3A3A]/10 bg-[#F7F7F7] p-4 text-start">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10">
                                    <Award className="h-5 w-5 text-[#F47822]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-[#3A3A3A]">
                                        {state.certificate.course_title}
                                    </p>
                                    <p className="mt-0.5 truncate text-xs text-[#3A3A3A]/60">
                                        {t("verifyPage.result.awardedTo")}{" "}
                                        {state.certificate.recipient_name}
                                    </p>
                                    <p className="mt-1 text-[11px] text-[#3A3A3A]/50">
                                        {t("verifyPage.result.issued")}{" "}
                                        {formatDate(state.certificate.issued_at)}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => void handleCopy()}
                                className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-[#3A3A3A]/15 bg-white px-3 py-2 font-mono text-[11px] font-semibold text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#3A3A3A]"
                                title={t("verifyPage.popup.copyTitle")}
                            >
                                <span className="truncate">{state.certificate.certificate_number}</span>
                                <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#F47822]">
                                    <Copy className="h-3.5 w-3.5" />
                                    {copied ? t("verifyPage.popup.copied") : t("verifyPage.popup.copy")}
                                </span>
                            </button>
                        </div>
                    ) : (
                        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#3A3A3A]/60">{state.message}</p>
                    )}

                    <div className="mt-6 grid gap-2">
                        {isSuccess && onViewDetails ? (
                            <button
                                type="button"
                                onClick={onViewDetails}
                                className="inline-flex w-full items-center justify-center rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,.25)] transition hover:bg-[#E96D18]"
                            >
                                {t("verifyPage.popup.detailsLink")}
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={onClose}
                            className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition ${
                                isSuccess && onViewDetails
                                    ? "border border-[#3A3A3A]/10 bg-white text-[#3A3A3A] hover:bg-[#F3F3F3]"
                                    : isSuccess
                                      ? "bg-[#F47822] px-5 py-3 text-white shadow-[0_8px_20px_rgba(244,120,34,.25)] hover:bg-[#E96D18]"
                                      : "bg-[#3A3A3A] text-white hover:bg-[#2f2f2f]"
                            }`}
                        >
                            {isSuccess ? t("verifyPage.popup.done") : t("verifyPage.popup.tryAgain")}
                        </button>
                    </div>

                    <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.18em] text-[#3A3A3A]/35">
                        {t("verifyPage.popup.systemTag")}
                    </p>
                </div>
            </section>
        </div>
    );
}
