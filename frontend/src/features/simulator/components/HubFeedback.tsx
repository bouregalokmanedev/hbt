import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquareQuote, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { UserAvatar } from "@/components/ui";
import {
    fetchPlatformFeedback,
    submitPlatformFeedback,
    SIMULATOR_LABS,
    type PlatformFeedbackLabFilter,
    type PlatformFeedbackList,
    type PlatformFeedbackMeta,
    type PlatformFeedbackReview,
    type SimulatorLabId,
} from "@/features/profile/api/platform-feedback.api";

interface HubFeedbackProps {
    onSubmitted?: () => void;
}

function Stars({ value, className = "" }: { value: number; className?: string }) {
    return (
        <span className={`inline-flex items-center gap-0.5 ${className}`} dir="ltr">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    className={`h-3.5 w-3.5 ${n <= value ? "fill-[#F47822] text-[#F47822]" : "text-[#3A3A3A]/25 dark:text-white/25"}`}
                />
            ))}
        </span>
    );
}

export function HubFeedback({ onSubmitted }: HubFeedbackProps) {
    const { t, i18n } = useTranslation();
    const [reviews, setReviews] = useState<PlatformFeedbackReview[]>([]);
    const [summary, setSummary] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState("");
    const [lab, setLab] = useState<SimulatorLabId | "">("");
    const [filter, setFilter] = useState<PlatformFeedbackLabFilter>("all");
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<PlatformFeedbackMeta>({
        page: 1,
        per_page: 3,
        total: 0,
        last_page: 1,
    });
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const applyPayload = (payload: PlatformFeedbackList | undefined) => {
        setReviews(Array.isArray(payload?.reviews) ? payload.reviews : []);
        setSummary(payload?.summary ?? { average: 0, count: 0 });
        setMeta(
            payload?.meta ?? { page: 1, per_page: 3, total: 0, last_page: 1 },
        );
    };

    const loadReviews = async (
        labFilter: PlatformFeedbackLabFilter,
        page = 1,
    ) => {
        setLoading(true);
        try {
            applyPayload(
                await fetchPlatformFeedback("simulator", labFilter, page),
            );
        } catch {
            setReviews([]);
            setSummary({ average: 0, count: 0 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadReviews("all", 1);
    }, []);

    const selectFilter = (next: PlatformFeedbackLabFilter) => {
        setFilter(next);
        setPage(1);
        void loadReviews(next, 1);
    };

    const changePage = (next: number) => {
        if (next < 1 || next > meta.last_page || next === page) return;
        setPage(next);
        void loadReviews(filter, next);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (rating < 1 || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            await submitPlatformFeedback({
                rating,
                comment: comment.trim() === "" ? undefined : comment.trim(),
                area: "simulator",
                lab: lab === "" ? undefined : lab,
            });
            setSent(true);
            setRating(0);
            setComment("");
            setLab("");
            // Keep the new review inside whatever scope is on screen.
            const submittedScope: PlatformFeedbackLabFilter = lab === "" ? "general" : lab;
            const nextFilter = filter === "all" || filter === submittedScope ? filter : "all";
            setFilter(nextFilter);
            setPage(1);
            await loadReviews(nextFilter, 1);
            onSubmitted?.();
        } catch {
            setError(t("simulator.hub.feedback.error"));
        } finally {
            setSubmitting(false);
        }
    };

    const dateLabel = (value: string | null) => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
    };

    const labLabel = (value: string | null) =>
        value
            ? t(`simulator.hub.feedback.labs.${value}`, { defaultValue: value })
            : t("simulator.hub.feedback.labGeneral");

    const filterOptions: { id: PlatformFeedbackLabFilter; label: string }[] = [
        { id: "all", label: t("simulator.hub.feedback.labAll") },
        { id: "general", label: t("simulator.hub.feedback.labGeneral") },
        ...SIMULATOR_LABS.map((id) => ({ id, label: labLabel(id) })),
    ];

    const labOptions: { id: SimulatorLabId | ""; label: string }[] = [
        { id: "", label: t("simulator.hub.feedback.labGeneral") },
        ...SIMULATOR_LABS.map((id) => ({ id, label: labLabel(id) })),
    ];

    const activeRating = hovered || rating;

    return (
        <section className="mt-6 overflow-hidden rounded-[20px] border border-[#3A3A3A]/8 bg-white dark:border-white/8 dark:bg-[#1b1b20]">
            <header className="flex flex-col gap-4 border-b border-[#3A3A3A]/6 p-5 dark:border-white/6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
                        <MessageSquareQuote className="h-4 w-4 text-[#F47822]" />
                        {t("simulator.hub.feedback.title", { defaultValue: "Feedback & reviews" })}
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-[#3A3A3A]/55 dark:text-white/55">
                        {t("simulator.hub.feedback.subtitle", {
                            defaultValue: "What students say about the simulator labs.",
                        })}
                    </p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-[#3A3A3A]/10 bg-[#F8F7F6] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <span className="text-2xl font-black text-[#1A1A1A] dark:text-white">
                        {loading ? "—" : summary.average.toFixed(1)}
                    </span>
                    <span className="min-w-0">
                        <Stars value={Math.round(summary.average)} />
                        <span className="mt-0.5 block text-[11px] font-medium text-[#3A3A3A]/50 dark:text-white/50">
                            {t("simulator.hub.feedback.count", { count: summary.count })}
                        </span>
                    </span>
                </div>
            </header>

            <div className="grid gap-0 lg:grid-cols-2">
                {/* Reviews list */}
                <div className="border-b border-[#3A3A3A]/6 p-5 dark:border-white/6 lg:border-b-0 lg:border-e">
                    <div
                        className="mb-4 flex flex-wrap gap-1.5"
                        aria-label={t("simulator.hub.feedback.filterLabel", { defaultValue: "Filter reviews by lab" })}
                    >
                        {filterOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                aria-pressed={filter === option.id}
                                onClick={() => selectFilter(option.id)}
                                className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                                    filter === option.id
                                        ? "bg-[#F47822] text-white"
                                        : "bg-[#F8F7F6] text-[#3A3A3A]/55 hover:text-[#F47822] dark:bg-white/5 dark:text-white/55 dark:hover:text-[#F47822]"
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-20 animate-pulse rounded-xl bg-[#F8F7F6] dark:bg-white/5" />
                            ))}
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-[#3A3A3A]/10 bg-[#F8F7F6] p-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
                            <p className="text-sm font-bold text-[#3A3A3A] dark:text-white">
                                {filter === "all"
                                    ? t("simulator.hub.feedback.empty", { defaultValue: "No reviews yet" })
                                    : t("simulator.hub.feedback.emptyFiltered", {
                                        defaultValue: "No reviews in this scope yet",
                                    })}
                            </p>
                            <p className="mt-1 text-xs text-[#3A3A3A]/50 dark:text-white/50">
                                {t("simulator.hub.feedback.emptyDesc", {
                                    defaultValue: "Be the first student to share what you think.",
                                })}
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-[#3A3A3A]/6 dark:divide-white/6">
                            {reviews.map((review) => {
                                const [firstName, ...rest] = review.author.name.split(" ");
                                return (
                                <li key={review.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                                    <UserAvatar
                                        user={{
                                            avatar: review.author.avatar,
                                            first_name: firstName ?? "",
                                            last_name: rest.join(" "),
                                        }}
                                        className="h-8 w-8 shrink-0 self-start border border-[#3A3A3A]/10 dark:border-white/10"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="truncate text-sm font-bold text-[#1A1A1A] dark:text-white">
                                                {review.author.name}
                                            </span>
                                            <span className="shrink-0 text-[11px] text-[#3A3A3A]/40 dark:text-white/40">
                                                {dateLabel(review.created_at)}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                            <Stars value={review.rating} />
                                            <span className="rounded-full bg-[#F47822]/10 px-2 py-0.5 text-[10px] font-black text-[#B85708] dark:text-[#F47822]">
                                                {labLabel(review.lab)}
                                            </span>
                                        </div>
                                        {review.comment && (
                                            <p className="mt-1.5 text-xs leading-5 text-[#3A3A3A]/60 dark:text-white/60">
                                                {review.comment}
                                            </p>
                                        )}
                                    </div>
                                </li>
                                );
                            })}
                        </ul>
                    )}
                    {!loading && meta.last_page > 1 && (
                        <nav
                            aria-label={t("simulator.hub.feedback.paginationLabel", {
                                defaultValue: "Reviews pagination",
                            })}
                            className="mt-4 flex items-center justify-between gap-3"
                        >
                            <button
                                type="button"
                                onClick={() => changePage(page - 1)}
                                disabled={page <= 1}
                                aria-label={t("simulator.hub.feedback.prevPage", {
                                    defaultValue: "Previous page",
                                })}
                                className="inline-flex items-center gap-1 rounded-xl border border-[#3A3A3A]/10 px-3 py-2 text-[11px] font-black text-[#3A3A3A] transition hover:border-[#F47822] hover:text-[#F47822] disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10 dark:text-white/70 dark:hover:border-[#F47822] dark:hover:text-[#F47822]"
                            >
                                <ChevronLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
                                {t("simulator.hub.feedback.prevShort", { defaultValue: "Prev" })}
                            </button>
                            <span className="text-[11px] font-bold tabular-nums text-[#3A3A3A]/50 dark:text-white/50">
                                {t("simulator.hub.feedback.pageOf", {
                                    defaultValue: "Page {{page}} of {{total}}",
                                    page: meta.page,
                                    total: meta.last_page,
                                })}
                            </span>
                            <button
                                type="button"
                                onClick={() => changePage(page + 1)}
                                disabled={page >= meta.last_page}
                                aria-label={t("simulator.hub.feedback.nextPage", {
                                    defaultValue: "Next page",
                                })}
                                className="inline-flex items-center gap-1 rounded-xl border border-[#3A3A3A]/10 px-3 py-2 text-[11px] font-black text-[#3A3A3A] transition hover:border-[#F47822] hover:text-[#F47822] disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10 dark:text-white/70 dark:hover:border-[#F47822] dark:hover:text-[#F47822]"
                            >
                                {t("simulator.hub.feedback.nextShort", { defaultValue: "Next" })}
                                <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                            </button>
                        </nav>
                    )}
                </div>

                {/* Review form */}
                <div className="p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
                        {t("simulator.hub.feedback.share", { defaultValue: "Share your feedback" })}
                    </p>

                    {sent ? (
                        <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                {t("simulator.hub.feedback.success", {
                                    defaultValue: "Thanks — your review is live!",
                                })}
                            </p>
                            <button
                                type="button"
                                onClick={() => setSent(false)}
                                className="mt-3 rounded-xl border border-[#3A3A3A]/10 bg-white px-4 py-2 text-xs font-bold text-[#3A3A3A] transition hover:bg-[#F8F7F6] dark:border-white/10 dark:bg-white/5 dark:text-white"
                            >
                                {t("simulator.hub.feedback.another", { defaultValue: "Write another" })}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/45 dark:text-white/45">
                                    {t("simulator.hub.feedback.aboutLabel", { defaultValue: "What is this review about?" })}
                                </span>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {labOptions.map((option) => (
                                        <button
                                            key={option.id || "general"}
                                            type="button"
                                            aria-pressed={lab === option.id}
                                            onClick={() => setLab(option.id)}
                                            className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                                                lab === option.id
                                                    ? "bg-[#3A3A3A] text-white dark:bg-white dark:text-[#1b1b20]"
                                                    : "bg-[#F8F7F6] text-[#3A3A3A]/55 hover:text-[#F47822] dark:bg-white/5 dark:text-white/55 dark:hover:text-[#F47822]"
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/45 dark:text-white/45">
                                    {t("simulator.hub.feedback.ratingLabel", { defaultValue: "Your rating" })}
                                </span>
                                <div className="mt-2 flex items-center gap-1" dir="ltr" onMouseLeave={() => setHovered(0)}>
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            aria-label={t("simulator.hub.feedback.ratingAria", { count: n })}
                                            onClick={() => setRating(n)}
                                            onMouseEnter={() => setHovered(n)}
                                            className="rounded-lg p-1 transition hover:bg-[#F47822]/10"
                                        >
                                            <Star
                                                className={`h-6 w-6 transition ${n <= activeRating ? "fill-[#F47822] text-[#F47822]" : "text-[#3A3A3A]/25 dark:text-white/25"}`}
                                            />
                                        </button>
                                    ))}
                                    {rating > 0 && (
                                        <span className="ms-2 font-mono text-xs font-black text-[#F47822]">{rating}/5</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="hub-feedback-comment"
                                    className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/45 dark:text-white/45"
                                >
                                    {t("simulator.hub.feedback.commentLabel", { defaultValue: "Your review" })}
                                </label>
                                <textarea
                                    id="hub-feedback-comment"
                                    value={comment}
                                    maxLength={2000}
                                    onChange={(event) => setComment(event.target.value)}
                                    rows={4}
                                    placeholder={t("simulator.hub.feedback.placeholder", {
                                        defaultValue: "What went well? What should improve?",
                                    })}
                                    className="mt-2 w-full resize-none rounded-xl border border-[#3A3A3A]/10 bg-[#F8F7F6] px-3 py-2.5 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#3A3A3A]/35 focus:border-[#F47822]/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/35"
                                />
                            </div>

                            {error && (
                                <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-300">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={rating < 1 || submitting}
                                className="w-full rounded-xl bg-[#F47822] px-4 py-3 text-sm font-black text-white transition hover:bg-[#E96D18] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting
                                    ? t("simulator.hub.feedback.submitting", { defaultValue: "Sending…" })
                                    : t("simulator.hub.feedback.submit", { defaultValue: "Submit review" })}
                            </button>

                            <p className="text-center text-[11px] text-[#3A3A3A]/40 dark:text-white/40">
                                {t("simulator.hub.feedback.hint", {
                                    defaultValue: "Pick a rating to publish your review.",
                                })}
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
}
