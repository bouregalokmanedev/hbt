import { CheckCircle2, MessageSquare, Send, Star } from "lucide-react";
import { useState } from "react";
import { submitCourseFeedback } from "../api/feedback.api";

export function LessonFeedback({
  courseId,
  lessonId,
}: {
  courseId: string;
  lessonId: string;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!rating || saving) return;
    setSaving(true);
    try {
      await submitCourseFeedback(courseId, {
        lesson_id: lessonId,
        rating,
        comment: comment.trim() || undefined,
      });
      setSent(true);
      setComment("");
      setRating(0);
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
            Help us improve
          </p>
          <h2 className="text-xl font-bold text-[#3A3A3A]">Lesson feedback</h2>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500">
        Tell us what helped and what could be clearer.
      </p>
      <div className="mt-6 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={`${value} stars`}
          >
            <Star
              className={`h-6 w-6 transition ${value <= rating ? "fill-[#F47822] text-[#F47822]" : "text-gray-300 hover:text-[#F47822]"}`}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Share a quick note (optional)"
        className="mt-5 min-h-32 w-full rounded-2xl border border-gray-100 bg-[#FCFCFC] p-4 text-sm outline-none transition focus:border-[#F47822]/50 focus:ring-4 focus:ring-[#F47822]/10"
      />
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400">
          Your response stays private to the learning team.
        </span>
        <button
          type="button"
          disabled={!rating || saving}
          onClick={() => void submit()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#F47822]/20 transition hover:bg-[#DF6819] disabled:opacity-50"
        >
          {saving ? "Sending..." : "Send feedback"}
          <Send className="h-4 w-4" />
        </button>
      </div>
      {sent && (
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          Thanks for helping us improve.
        </p>
      )}
    </div>
  );
}
