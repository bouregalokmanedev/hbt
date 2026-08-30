import {
    CheckCircle2,
    FileText,
    ExternalLink,
    Image as ImageIcon,
    MessageSquare,
    Send,
    Star,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { submitCourseFeedback } from "../api/feedback.api";
import type { LessonMedia } from "../types/lesson.types";

interface LessonResourcesProps {
    courseId: string;
    lessonId: string;
    lessonTitle: string;
    media: LessonMedia[];
}

export function LessonResources({
    courseId,
    lessonId,
    lessonTitle,
    media,
}: LessonResourcesProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const documents = media.filter((item) => item.type === "document");
    const images = media.filter((item) => item.type === "image");

    useEffect(() => {
        if (!showSuccess) return undefined;

        const timeout = window.setTimeout(() => setShowSuccess(false), 5000);

        return () => window.clearTimeout(timeout);
    }, [showSuccess]);

    const submit = async () => {
        if (rating === 0 || isSubmitting) return;

        try {
            setIsSubmitting(true);
            setError(null);
            await submitCourseFeedback(courseId, {
                lesson_id: lessonId,
                rating,
                comment: comment.trim() || undefined,
            });
            setComment("");
            setRating(0);
            setShowSuccess(true);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "Unable to send feedback. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="relative mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
            <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.045)] sm:p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
                    <FileText className="h-5 w-5" />
                </div>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F47822]">Study support</p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-[#3A3A3A]">
                    Lesson documentation
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                    Keep this lesson close as a reference. Its description, notes, and learning materials are available above while you review <span className="font-medium text-[#3A3A3A]">{lessonTitle}</span>.
                </p>
                <div className="mt-5 rounded-2xl border border-[#F47822]/10 bg-[#F47822]/[0.045] px-4 py-3 text-xs leading-5 text-gray-600">
                    Tip: use the curriculum to revisit a completed lesson whenever you need a refresher.
                </div>
                {(documents.length > 0 || images.length > 0) && <div className="mt-5 border-t border-gray-100 pt-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#3A3A3A]/45">Attached resources</p>{documents.length > 0 && <div className="mt-3 space-y-2">{documents.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs transition hover:border-[#F47822]/30 hover:bg-[#FFF8F4]"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#F47822]/10 text-[#F47822]"><FileText className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1 truncate font-semibold text-[#3A3A3A]">{item.original_name}</span><ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#3A3A3A]/40" /></a>)}</div>}{images.length > 0 && <div className="mt-3 grid grid-cols-2 gap-2">{images.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-[#FCFCFC]"><img src={item.url} alt={item.original_name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /><span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/55 px-2 py-1.5 text-[10px] font-semibold text-white"><ImageIcon className="h-3 w-3" /><span className="truncate">{item.original_name}</span></span></a>)}</div>}</div>}
            </article>

            <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.045)] sm:p-6">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F47822]">Help us improve</p>
                        <h2 className="mt-1 text-lg font-bold tracking-tight text-[#3A3A3A]">Lesson & course feedback</h2>
                        <p className="mt-1 text-sm text-gray-500">Share a quick rating or tell us what would make this clearer.</p>
                    </div>
                </div>
                <div className="mt-5 flex items-center gap-1.5" aria-label="Rate this lesson">
                    {[1, 2, 3, 4, 5].map((value) => (
                        <button
                            key={value}
                            type="button"
                            aria-label={`${value} star rating`}
                            aria-pressed={value === rating}
                            onClick={() => setRating(value)}
                            className="rounded-xl p-1.5 transition hover:bg-[#F47822]/10 focus:outline-none focus:ring-2 focus:ring-[#F47822]/30"
                        >
                            <Star className={`h-6 w-6 transition-colors ${value <= rating ? "fill-[#F47822] text-[#F47822]" : "text-gray-300 hover:text-[#F47822]/60"}`} />
                        </button>
                    ))}
                    <span className="ml-2 text-xs font-medium text-gray-500">{rating ? `${rating} of 5` : "Choose a rating"}</span>
                </div>
                <label className="mt-5 block text-xs font-semibold text-[#3A3A3A]" htmlFor="lesson-feedback">
                    Your feedback <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                    id="lesson-feedback"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="What helped, and what could we improve?"
                    className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-gray-200 bg-[#FCFCFC] px-4 py-3 text-sm leading-6 text-[#3A3A3A] outline-none transition placeholder:text-gray-400 focus:border-[#F47822]/60 focus:bg-white focus:ring-4 focus:ring-[#F47822]/10"
                />
                <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-500">Your feedback helps improve future lessons.</p>
                    <button
                        type="button"
                        disabled={rating === 0 || isSubmitting}
                        onClick={() => void submit()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(244,120,34,0.20)] transition hover:-translate-y-0.5 hover:bg-[#df6819] disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50"
                    >
                        {isSubmitting ? "Saving..." : "Send feedback"}
                        {!isSubmitting && <Send className="h-4 w-4" />}
                    </button>
                </div>
                {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}
            </article>

            {showSuccess && (
                <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-2.5rem)] items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 pr-12 text-sm shadow-[0_18px_50px_rgba(15,23,42,0.16)] sm:max-w-sm">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-bold text-[#3A3A3A]">Feedback sent</p>
                        <p className="mt-0.5 text-xs leading-5 text-gray-500">Thank you — your input helps us improve the learning experience.</p>
                    </div>
                    <button type="button" onClick={() => setShowSuccess(false)} className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" aria-label="Dismiss confirmation">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </section>
    );
}
