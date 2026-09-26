import {
    ArrowRight,
    Check,
    Loader2,
    MessageSquarePlus,
    Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { submitPlatformFeedback } from "@/features/profile/api/platform-feedback.api";

interface FeedbackCardProps {
    // Kept optional so existing parents can pass (and ignore) courses during transition.
    courses?: unknown[];
}

const quickFeedbackKeys = [
    { id: "easy", labelKey: "profilePage.feedback.quickEasy", messageKey: "profilePage.feedback.quickEasyMsg", rating: 5, area: "navigation" },
    { id: "okay", labelKey: "profilePage.feedback.quickOkay", messageKey: "profilePage.feedback.quickOkayMsg", rating: 3, area: "design" },
    { id: "confusing", labelKey: "profilePage.feedback.quickConfusing", messageKey: "profilePage.feedback.quickConfusingMsg", rating: 2, area: "navigation" },
    { id: "issue", labelKey: "profilePage.feedback.quickIssue", messageKey: "profilePage.feedback.quickIssueMsg", rating: 2, area: "performance" },
];

export function FeedbackCard({}: FeedbackCardProps = {}) {
    const { t } = useTranslation();
    const [rating, setRating] = useState<number | null>(null);
    const [area, setArea] = useState<string>("navigation");
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const quickFeedback = quickFeedbackKeys.map((option) => ({
        id: option.id,
        label: t(option.labelKey),
        message: t(option.messageKey),
        rating: option.rating,
        area: option.area,
    }));

    const pickQuick = (option: (typeof quickFeedback)[number]) => {
        setRating(option.rating);
        setArea(option.area);
        setComment(option.message);
        setSubmitted(false);
        setError("");
    };

    const sendFeedback = async () => {
        if (!rating || isSubmitting) return;

        setIsSubmitting(true);
        setError("");

        try {
            await submitPlatformFeedback({
                rating,
                comment: comment.trim() || undefined,
                area,
            });
            setSubmitted(true);
            setComment("");
        } catch {
            setError(t("profilePage.feedback.sendError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section
            data-testid="profile-feedback-card"
            className="rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-5 shadow-[0_8px_30px_rgba(58,58,58,0.05)]"
        >

            <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3A3A3A]/5 dark:bg-white/5">
                    <MessageSquarePlus className="h-4 w-4 text-[#3A3A3A]/55 dark:text-white/55" />
                </div>

                <div className="min-w-0">

                    <p className="text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                        {t("profilePage.feedback.title")}
                    </p>

                    <p className="mt-0.5 text-[10px] leading-4 text-[#3A3A3A]/40 dark:text-white/40">
                        {t("profilePage.feedback.description")}
                    </p>

                </div>

            </div>

            <div className="mt-4 rounded-xl border border-[#F47822]/10 bg-[#F47822]/5 p-3">

                <div className="flex items-start gap-2.5">

                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F47822]" />

                    <p className="text-[10px] leading-4 text-[#3A3A3A]/55 dark:text-white/55">
                        {t("profilePage.feedback.hint")}
                    </p>

                </div>

            </div>

            <div className="mt-4 space-y-2.5">

                <div className="flex flex-wrap gap-1.5">
                    {quickFeedback.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            data-testid={`profile-feedback-quick-${option.id}`}
                            onClick={() => pickQuick(option)}
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-4 transition ${rating === option.rating && comment === option.message ? "border-[#F47822] bg-[#F47822] text-white" : "border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] text-[#3A3A3A]/65 dark:text-white/65 hover:border-[#F47822]/35"}`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <textarea
                    value={comment}
                    onChange={(event) => { setComment(event.target.value); setSubmitted(false); }}
                    placeholder={t("profilePage.feedback.notePh")}
                    rows={2}
                    data-testid="profile-feedback-note"
                    className="w-full resize-none rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-[#FAFAFA] dark:bg-[#232329] px-3 py-2 text-xs text-[#3A3A3A] dark:text-[#ececef] outline-none transition placeholder:text-[#3A3A3A]/35 dark:placeholder:text-white/35 focus:border-[#F47822]/60 focus:bg-white dark:focus:bg-[#1b1b20]"
                />

                {error && (
                    <p data-testid="profile-feedback-error" className="text-[10px] font-medium text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}

                <button
                    type="button"
                    data-testid="profile-feedback-send"
                    disabled={!rating || isSubmitting || submitted}
                    onClick={() => void sendFeedback()}
                    className="flex w-full items-center justify-between rounded-xl bg-[#F7F7F7] dark:bg-[#101013] px-4 py-3 text-left transition hover:bg-[#F47822]/10 disabled:cursor-not-allowed disabled:opacity-55"
                >
                    <span className="text-xs font-medium text-[#3A3A3A] dark:text-[#ececef]">
                        {submitted
                            ? t("profilePage.feedback.sent")
                            : isSubmitting
                                ? <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />{t("profilePage.feedback.sending")}</span>
                                : t("profilePage.feedback.send")}
                    </span>
                    {submitted
                        ? <Check className="h-3.5 w-3.5 text-[#F47822]" data-testid="profile-feedback-sent" />
                        : <ArrowRight className="h-3.5 w-3.5 text-[#3A3A3A]/35 dark:text-white/35 rtl:-scale-x-100" />}
                </button>
            </div>

        </section>
    );
}
