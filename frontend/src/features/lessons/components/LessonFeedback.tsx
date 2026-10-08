import { CheckCircle2, MessageSquare, Send, Star } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { submitCourseFeedback } from "../api/feedback.api";

export function LessonFeedback({
  courseId,
  lessonId,
}: {
  courseId: string;
  lessonId: string;
}) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [lastRating, setLastRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (!rating || saving) return;
    setSaving(true);
    setError(null);
    try {
      await submitCourseFeedback(courseId, {
        lesson_id: lessonId,
        rating,
        comment: comment.trim() || undefined,
      });
      setSent(true);
      setLastRating(rating);
      setComment("");
      setRating(0);
    } catch {
      setError(t("lessonPlayer.feedback.sendFail"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
          <MessageSquare className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#F47822]">
            {t("lessonPlayer.feedback.eyebrow")}
          </p>
          <h2 className="text-xl font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("lessonPlayer.feedback.title")}</h2>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500">
        {t("lessonPlayer.feedback.desc")}
      </p>
      <div className="mt-6 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={t("lessonPlayer.feedback.stars", { n: value })}
          >
            <Star
              className={`h-6 w-6 transition ${value <= rating ? "fill-[#F47822] text-[#F47822]" : "text-gray-300 hover:text-[#F47822]"}`}
            />
          </button>
        ))}
        {rating === 0 && !sent && (
          <span className="ms-2 text-xs text-gray-400">
            {t("lessonPlayer.feedback.ratingHint")}
          </span>
        )}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder={t("lessonPlayer.feedback.commentPh")}
        className="mt-5 min-h-32 w-full rounded-2xl border border-gray-100 dark:border-white/10 bg-[#FCFCFC] dark:bg-[#232329] p-4 text-sm outline-none transition focus:border-[#F47822]/50 focus:ring-4 focus:ring-[#F47822]/10"
      />
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400">
          {t("lessonPlayer.feedback.privacy")}
        </span>
        <button
          type="button"
          disabled={!rating || saving}
          onClick={() => void submit()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#F47822]/20 transition hover:bg-[#DF6819] disabled:opacity-50"
        >
          {saving ? t("lessonPlayer.feedback.sending") : t("lessonPlayer.feedback.send")}
          <Send className="h-4 w-4 rtl:-scale-x-100" />
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
      {sent && (
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          {lastRating > 0
            ? t("lessonPlayer.feedback.ratedThanks", { n: lastRating })
            : t("lessonPlayer.feedback.thanks")}
        </p>
      )}
    </div>
  );
}
