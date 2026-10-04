import {
    Award,
    BadgeCheck,
    Check,
    CircleAlert,
    ClipboardPaste,
    Copy,
    Fingerprint,
    History,
    Loader2,
    LockKeyhole,
    QrCode,
    RotateCcw,
    ScanLine,
    Search,
    ShieldCheck,
    Sparkles,
    X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Footer } from "@/features/landingpage/components/FooterSection";

import { verifyCertificate } from "../api/verify-certificate.api";
import { VerificationPopup, type VerificationPopupState } from "../components/VerificationPopup";
import { normalizeCertificateNumber, VerifyCertificateError, type VerifiedCertificate } from "../types";

type Phase = "idle" | "verifying" | "success" | "error";

const RECENT_KEY = "hbt-recent-verifications";
const MAX_RECENT = 5;

function formatDate(value: string): string {
    try {
        return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(value));
    } catch {
        return value;
    }
}

function loadRecent(): string[] {
    try {
        const raw = localStorage.getItem(RECENT_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, MAX_RECENT) : [];
    } catch {
        return [];
    }
}

function Stepper({ phase, steps }: { phase: Phase; steps: string[] }) {
    const { t } = useTranslation();
    const activeIndex = phase === "idle" ? 0 : phase === "verifying" ? 1 : 2;
    return (
        <ol className="flex items-center gap-2" aria-label={t("verifyPage.stepsAria")}>
            {steps.map((label, index) => {
                const done = phase === "success" ? true : index < activeIndex;
                const active = phase !== "success" && index === activeIndex;
                return (
                    <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
                        <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ${
                                done
                                    ? "bg-[#F47822] text-white"
                                    : active
                                      ? "bg-[#3A3A3A] text-white"
                                      : "bg-[#3A3A3A]/8 text-[#3A3A3A]/40"
                            }`}
                        >
                            {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                        </span>
                        <span
                            className={`hidden text-[11px] font-bold uppercase tracking-[0.12em] sm:block ${
                                active || done ? "text-[#3A3A3A]" : "text-[#3A3A3A]/40"
                            }`}
                        >
                            {label}
                        </span>
                        {index < steps.length - 1 ? (
                            <span className={`mx-1 h-px flex-1 transition-colors duration-300 ${done ? "bg-[#F47822]" : "bg-[#3A3A3A]/10"}`} />
                        ) : null}
                    </li>
                );
            })}
        </ol>
    );
}

export function VerifyCertificatePage() {
    const { t } = useTranslation();
    const { certificateNumber: routeNumber } = useParams<{ certificateNumber?: string }>();
    const [searchParams] = useSearchParams();

    const VERIFY_STAGES = t("verifyPage.stages", { returnObjects: true }) as string[];
    const STEPS = t("verifyPage.steps", { returnObjects: true }) as string[];
    const heroChips = t("verifyPage.hero.chips", { returnObjects: true }) as string[];
    const howCards = t("verifyPage.how", { returnObjects: true }) as Array<{
        title: string;
        text: string;
    }>;
    const findIdBullets = t("verifyPage.findId.bullets", { returnObjects: true }) as string[];

    const [input, setInput] = useState("");
    const [phase, setPhase] = useState<Phase>("idle");
    const [stageIndex, setStageIndex] = useState(0);
    const [certificate, setCertificate] = useState<VerifiedCertificate | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [popup, setPopup] = useState<VerificationPopupState>(null);
    const [recent, setRecent] = useState<string[]>(() => loadRecent());
    const [copied, setCopied] = useState(false);

    const resultRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const autoVerifiedRef = useRef<string | null>(null);

    const normalizedInput = useMemo(() => normalizeCertificateNumber(input), [input]);
    const canSubmit = normalizedInput.length >= 6 && phase !== "verifying";

    const pushRecent = useCallback((value: string) => {
        setRecent((current) => {
            const next = [value, ...current.filter((item) => item !== value)].slice(0, MAX_RECENT);
            try {
                localStorage.setItem(RECENT_KEY, JSON.stringify(next));
            } catch {
                /* storage unavailable — ignore */
            }
            return next;
        });
    }, []);

    const runVerification = useCallback(
        async (raw: string) => {
            const value = normalizeCertificateNumber(raw);
            if (!value) {
                const message = t("verifyPage.form.emptyError");
                setError(message);
                setPhase("error");
                setPopup({ kind: "error", message });
                return;
            }
            setPhase("verifying");
            setStageIndex(0);
            setError(null);
            setCertificate(null);
            setPopup(null);

            // Staged progress copy for a smooth perceived flow.
            const timers: number[] = [];
            VERIFY_STAGES.forEach((_, index) => {
                if (index === 0) return;
                timers.push(window.setTimeout(() => setStageIndex(index), index * 650));
            });

            try {
                const result = await verifyCertificate(value);
                timers.forEach((timer) => window.clearTimeout(timer));
                setCertificate(result);
                setPhase("success");
                setPopup({ kind: "success", certificate: result });
                pushRecent(result.certificate_number);
            } catch (reason) {
                timers.forEach((timer) => window.clearTimeout(timer));
                const message =
                    reason instanceof VerifyCertificateError
                        ? reason.message
                        : reason instanceof Error
                          ? reason.message
                          : t("verifyPage.form.genericError");
                setError(message);
                setPhase("error");
                setPopup({ kind: "error", message });
            }
        },
        [pushRecent, t],
    );

    // Deep-link support: /verify-certificate/:id or /verify-certificate?code=ID
    useEffect(() => {
        const fromRoute = routeNumber ? normalizeCertificateNumber(routeNumber) : "";
        const fromQuery = normalizeCertificateNumber(searchParams.get("code") ?? "");
        const initial = fromRoute || fromQuery;
        if (initial && autoVerifiedRef.current !== initial) {
            autoVerifiedRef.current = initial;
            setInput(initial);
            void runVerification(initial);
        }
    }, [routeNumber, searchParams, runVerification]);

    // Reveal result smoothly.
    useEffect(() => {
        if ((phase === "success" || phase === "error") && resultRef.current) {
            resultRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [phase]);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (!canSubmit) return;
        void runVerification(input);
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setInput(normalizeCertificateNumber(text));
                inputRef.current?.focus();
            }
        } catch {
            inputRef.current?.focus();
        }
    };

    const handleCopyId = async () => {
        if (!certificate) return;
        try {
            await navigator.clipboard.writeText(certificate.certificate_number);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };

    const reset = () => {
        setInput("");
        setPhase("idle");
        setCertificate(null);
        setError(null);
        setPopup(null);
        inputRef.current?.focus();
    };

    return (
        <div className="verify-page-ar min-h-screen bg-[#F3F3F3] text-[#3A3A3A]">
            {/* ================= HERO ================= */}
            <section className="relative overflow-hidden bg-[#1d1d1d] text-white">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:56px_56px]"
                />
                <div aria-hidden="true" className="pointer-events-none absolute -top-32 end-[-8%] h-96 w-96 rounded-full bg-[#F47822]/20 blur-[120px]" />
                <div aria-hidden="true" className="pointer-events-none absolute bottom-[-40%] start-[-5%] h-80 w-80 rounded-full bg-[#F47822]/10 blur-[110px]" />
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F47822] to-transparent opacity-70" />

                <div className="relative mx-auto w-full max-w-5xl px-5 pb-14 pt-14 sm:px-8 sm:pt-20">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F47822]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                            {t("verifyPage.hero.badge")}
                        </span>
                    </div>

                    <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
                        {t("verifyPage.hero.titleA")}{" "}
                        <span className="text-[#F47822]">{t("verifyPage.hero.titleB")}</span>
                    </h1>
                    <p className="mt-5 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
                        {t("verifyPage.hero.description")}
                    </p>

                    <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                        {[
                            { icon: LockKeyhole, label: heroChips[0] ?? "" },
                            { icon: QrCode, label: heroChips[1] ?? "" },
                            { icon: BadgeCheck, label: heroChips[2] ?? "" },
                        ].map(({ icon: Icon, label }) => (
                            <span key={label} className="inline-flex items-center gap-2 text-xs font-semibold text-white/60">
                                <Icon className="h-4 w-4 text-[#F47822]" />
                                {label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* curved transition into the card */}
                <div aria-hidden="true" className="relative h-8 bg-[#F3F3F3] [border-radius:50%_50%_0_0/100%_100%_0_0]" />
            </section>

            {/* ================= VERIFICATION CARD ================= */}
            <main className="mx-auto w-full max-w-5xl px-5 sm:px-8">
                <section className="-mt-2 rounded-3xl border border-[#3A3A3A]/8 bg-white p-6 shadow-[0_20px_60px_rgba(58,58,58,0.10)] sm:p-8">
                    <Stepper phase={phase} steps={STEPS} />

                    <form onSubmit={handleSubmit} className="mt-7" noValidate>
                        <label htmlFor="certificate-id" className="text-xs font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/60">
                            {t("verifyPage.form.label")}
                        </label>
                        <div
                            className={`mt-2.5 flex flex-col gap-2.5 rounded-2xl border bg-[#F7F7F7] p-2.5 transition-colors duration-150 focus-within:border-[#3A3A3A]/25 sm:flex-row sm:items-center ${
                                phase === "error" ? "border-red-300" : "border-[#3A3A3A]/10"
                            }`}
                        >
                            <div className="flex flex-1 items-center gap-2.5 rounded-xl px-2.5">
                                <ScanLine className="h-5 w-5 shrink-0 text-[#F47822]" aria-hidden="true" />
                                <input
                                    ref={inputRef}
                                    id="certificate-id"
                                    name="certificate-id"
                                    type="text"
                                    autoComplete="off"
                                    autoCapitalize="characters"
                                    spellCheck={false}
                                    placeholder="e.g. HBT-XXXXXXXXXXXXXX"
                                    value={input}
                                    onChange={(event) => {
                                        setInput(event.target.value.toUpperCase());
                                        if (phase === "error") {
                                            setPhase("idle");
                                            setError(null);
                                        }
                                    }}
                                    disabled={phase === "verifying"}
                                    aria-describedby="certificate-id-hint"
                                    className="verify-cert-input h-12 w-full rounded-lg border border-transparent bg-transparent px-2 font-mono text-sm font-semibold tracking-wide text-[#3A3A3A] outline-none transition-colors placeholder:font-normal placeholder:text-[#3A3A3A]/35 focus:border-[#F47822] disabled:opacity-60"
                                />
                                {input ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setInput("");
                                            inputRef.current?.focus();
                                        }}
                                        aria-label={t("verifyPage.form.clearLabel")}
                                        className="rounded-lg p-1.5 text-[#3A3A3A]/40 transition hover:bg-[#3A3A3A]/8 hover:text-[#3A3A3A]"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => void handlePaste()}
                                    disabled={phase === "verifying"}
                                    className="inline-flex h-12 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 text-xs font-bold text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822] disabled:opacity-50"
                                >
                                    <ClipboardPaste className="h-4 w-4" />
                                    {t("verifyPage.form.paste")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#F47822] px-6 text-sm font-bold text-white shadow-[0_10px_24px_rgba(244,120,34,0.30)] transition hover:-translate-y-px hover:bg-[#E96D18] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:flex-none sm:px-8"
                                >
                                    {phase === "verifying" ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {t("verifyPage.form.verifying")}
                                        </>
                                    ) : (
                                        <>
                                            <Search className="h-4 w-4" />
                                            {t("verifyPage.form.verify")}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        <p id="certificate-id-hint" className="mt-2.5 flex items-center gap-1.5 text-xs text-[#3A3A3A]/50">
                            <Fingerprint className="h-3.5 w-3.5 text-[#3A3A3A]/35" />
                            {t("verifyPage.form.hint")}
                        </p>
                    </form>

                    {/* Progress */}
                    {phase === "verifying" ? (
                        <div className="mt-6 rounded-2xl border border-[#F47822]/20 bg-[#FFF7F1] p-5" role="status" aria-live="polite">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822] text-white">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                </span>
                                <div>
                                    <p className="text-sm font-bold text-[#3A3A3A]">{VERIFY_STAGES[stageIndex]}</p>
                                    <p className="font-mono text-[11px] text-[#3A3A3A]/50">{normalizedInput || "…"}</p>
                                </div>
                            </div>
                            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/8">
                                <div
                                    className="h-full rounded-full bg-[#F47822] transition-all duration-500"
                                    style={{ width: `${((stageIndex + 1) / VERIFY_STAGES.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    ) : null}

                    {/* Recent */}
                    {recent.length > 0 && phase !== "verifying" ? (
                        <div className="mt-6">
                            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/45">
                                <History className="h-3.5 w-3.5" />
                                {t("verifyPage.form.recent")}
                            </p>
                            <div className="mt-2.5 flex flex-wrap gap-2">
                                {recent.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => {
                                            setInput(item);
                                            void runVerification(item);
                                        }}
                                        className="rounded-full border border-[#3A3A3A]/10 bg-[#F7F7F7] px-3.5 py-1.5 font-mono text-[11px] font-semibold text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:bg-[#FFF4EC] hover:text-[#F47822]"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {/* Result */}
                    <div ref={resultRef} className="scroll-mt-28">
                        {phase === "success" && certificate ? (
                            <article className="mt-6 overflow-hidden rounded-2xl border border-emerald-600/15 bg-gradient-to-b from-emerald-50/60 to-white" aria-live="polite">
                                <div className="flex items-center gap-3 border-b border-emerald-600/10 px-5 py-4 sm:px-6">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                        <BadgeCheck className="h-5 w-5" />
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                                            {t("verifyPage.result.authentic")}
                                        </p>
                                        <p className="text-sm font-bold text-[#3A3A3A]">{t("verifyPage.result.valid")}</p>
                                    </div>
                                    <span className="hidden items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 sm:inline-flex">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                        {t("verifyPage.result.live")}
                                    </span>
                                </div>

                                <div className="grid gap-5 px-5 py-6 sm:px-6 md:grid-cols-[1fr_auto] md:items-center">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">
                                            {t("verifyPage.result.certOfCompletion")}
                                        </p>
                                        <h2 className="mt-1.5 text-xl font-black tracking-tight text-[#3A3A3A]">
                                            {certificate.course_title}
                                        </h2>
                                        <p className="mt-1.5 text-sm text-[#3A3A3A]/60">
                                            {t("verifyPage.result.awardedTo")}{" "}
                                            <span className="font-bold text-[#3A3A3A]">{certificate.recipient_name}</span>
                                            {" · "}{t("verifyPage.result.issued")} {formatDate(certificate.issued_at)}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => void handleCopyId()}
                                            className="mt-3.5 inline-flex max-w-full items-center gap-2 rounded-xl border border-dashed border-[#3A3A3A]/15 bg-white px-3 py-2 font-mono text-xs font-semibold text-[#3A3A3A]/70 transition hover:border-[#F47822]/40"
                                            title={t("verifyPage.result.copyTitle")}
                                        >
                                            <span className="truncate">{certificate.certificate_number}</span>
                                            {copied ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 shrink-0 text-[#3A3A3A]/40" />}
                                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#F47822]">
                                                {copied ? t("verifyPage.result.copied") : t("verifyPage.result.copy")}
                                            </span>
                                        </button>
                                    </div>
                                    <div className="flex shrink-0 items-center justify-center">
                                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#F47822]">
                                            <div aria-hidden="true" className="absolute inset-1.5 animate-[spin_18s_linear_infinite] rounded-full border border-dashed border-[#F47822]/50" />
                                            <Award className="h-9 w-9 text-[#F47822]" />
                                            <span className="absolute -bottom-1 bg-white px-1.5 text-[8px] font-black tracking-[0.18em] text-[#F47822]">
                                                VERIFIED
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 border-t border-[#3A3A3A]/8 bg-[#F7F7F7]/70 px-5 py-4 sm:flex-row sm:px-6">
                                    <Link
                                        to={`/verify-certificate/${encodeURIComponent(certificate.certificate_number)}`}
                                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#3A3A3A]/10 bg-white px-4 py-2.5 text-xs font-bold text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                                    >
                                        {t("verifyPage.result.shareLink")}
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={reset}
                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#F47822]"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        {t("verifyPage.result.verifyAnother")}
                                    </button>
                                </div>
                            </article>
                        ) : null}

                        {phase === "error" && error ? (
                            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4" role="alert" aria-live="assertive">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white">
                                    <CircleAlert className="h-4.5 w-4.5" />
                                </span>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-red-800">{t("verifyPage.errorBlock.title")}</p>
                                    <p className="mt-1 text-sm leading-6 text-red-700/80">{error}</p>
                                    <button
                                        type="button"
                                        onClick={() => inputRef.current?.focus()}
                                        className="mt-2.5 text-xs font-bold text-red-700 underline underline-offset-4 transition hover:text-red-900"
                                    >
                                        {t("verifyPage.errorBlock.retry")}
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </section>

                {/* ================= HOW IT WORKS ================= */}
                <section className="grid gap-4 py-10 md:grid-cols-3">
                    {howCards.map((card, index) => {
                        const Icon = [ScanLine, ShieldCheck, BadgeCheck][index] ?? ScanLine;
                        const step = `0${index + 1}`;
                        const { title, text } = card;
                        return (
                        <div key={step} className="rounded-3xl border border-[#3A3A3A]/8 bg-white p-6 shadow-[0_8px_30px_rgba(58,58,58,0.05)]">
                            <div className="flex items-center justify-between">
                                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F47822]/10">
                                    <Icon className="h-5 w-5 text-[#F47822]" />
                                </span>
                                <span className="font-mono text-xs font-bold text-[#3A3A3A]/25">{step}</span>
                            </div>
                            <h3 className="mt-4 text-sm font-bold text-[#3A3A3A]">{title}</h3>
                            <p className="mt-1.5 text-[13px] leading-6 text-[#3A3A3A]/60">{text}</p>
                        </div>
                        );
                    })}
                </section>

                {/* ================= FIND YOUR ID ================= */}
                <section className="mb-12 overflow-hidden rounded-3xl bg-[#3A3A3A] text-white shadow-[0_20px_50px_rgba(58,58,58,0.20)]">
                    <div className="grid md:grid-cols-[1.2fr_0.8fr]">
                        <div className="p-7 sm:p-9">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
                                {t("verifyPage.findId.eyebrow")}
                            </p>
                            <h2 className="mt-2.5 text-2xl font-black tracking-tight">
                                {t("verifyPage.findId.title")}
                            </h2>
                            <ul className="mt-5 space-y-3.5">
                                {findIdBullets.map((item) => (
                                    <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-white/65">
                                        <Check className="mt-1 h-4 w-4 shrink-0 text-[#F47822]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-6 flex flex-wrap gap-2.5">
                                <Link
                                    to="/catalog"
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#E96D18]"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    {t("verifyPage.findId.earnBtn")}
                                </Link>
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white/80 transition hover:border-white/30 hover:text-white"
                                >
                                    {t("verifyPage.findId.contactBtn")}
                                </Link>
                            </div>
                        </div>
                        <div className="relative flex items-center justify-center border-t border-white/10 bg-[#2a2a2a] p-8 md:border-s md:border-t-0">
                            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:36px_36px]" />
                            <div className="relative w-full max-w-[260px] rounded-2xl border border-white/10 bg-white p-5 text-[#3A3A3A] shadow-2xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-black uppercase tracking-[0.25em] text-[#3A3A3A]/40">
                                        {t("verifyPage.findId.cardLabel")}
                                    </span>
                                    <QrCode className="h-4 w-4 text-[#F47822]" />
                                </div>
                                <div className="mt-4 rounded-xl bg-[#F7F7F7] p-4 text-center">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#3A3A3A]/40">{t("verifyPage.findId.credId")}</p>
                                    <p className="mt-1.5 font-mono text-sm font-bold tracking-wide text-[#3A3A3A]">
                                        HBT-••••-••••••
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#F47822]/10 px-3 py-2.5">
                                    <ShieldCheck className="h-4 w-4 shrink-0 text-[#F47822]" />
                                    <p className="text-[11px] font-bold text-[#3A3A3A]">{t("verifyPage.findId.scanHint")}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />

            <VerificationPopup
                state={popup}
                onClose={() => setPopup(null)}
                onViewDetails={
                    popup?.kind === "success"
                        ? () => {
                              setPopup(null);
                              resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }
                        : undefined
                }
            />
        </div>
    );
}
