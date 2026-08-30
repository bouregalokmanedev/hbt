import {
    ArrowRight,
    Check,
    MessageSquarePlus,
    Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { submitCourseFeedback } from "@/features/lessons/api/feedback.api";

interface FeedbackCourse {
    id: string;
    title: string;
}

interface FeedbackCardProps {
    courses?: FeedbackCourse[];
}

const quickFeedback = [
    { label: "Really helpful", rating: 5, message: "This course has been really helpful." },
    { label: "Could be clearer", rating: 3, message: "Some parts of this course could be clearer." },
    { label: "Technical issue", rating: 2, message: "I ran into a technical issue while learning." },
];

export function FeedbackCard({ courses = [] }: FeedbackCardProps) {
    const [courseId, setCourseId] = useState("");
    const [rating, setRating] = useState<number | null>(null);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!courses.some((course) => course.id === courseId)) {
            setCourseId(courses[0]?.id ?? "");
        }
    }, [courseId, courses]);

    const sendFeedback = async () => {
        if (!courseId || !rating || isSubmitting) return;

        setIsSubmitting(true);
        setError("");

        try {
            await submitCourseFeedback(courseId, {
                rating,
                comment: comment.trim() || undefined,
            });
            setSubmitted(true);
            setComment("");
        } catch {
            setError("We couldn't send your feedback. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.05)]">

            <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3A3A3A]/5">
                    <MessageSquarePlus className="h-4 w-4 text-[#3A3A3A]/55" />
                </div>

                <div className="min-w-0">

                    <p className="text-sm font-semibold text-[#3A3A3A]">
                        Help us improve
                    </p>

                    <p className="mt-0.5 text-[10px] leading-4 text-[#3A3A3A]/40">
                        Your feedback helps us build a better learning experience.
                    </p>

                </div>

            </div>

            <div className="mt-4 rounded-xl border border-[#F47822]/10 bg-[#F47822]/5 p-3">

                <div className="flex items-start gap-2.5">

                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F47822]" />

                    <p className="text-[10px] leading-4 text-[#3A3A3A]/55">
                        Choose a quick response or leave a note about one of your active courses.
                    </p>

                </div>

            </div>

            {courses.length > 0 ? (
                <div className="mt-4 space-y-2.5">
                    {courses.length > 1 && (
                        <select
                            aria-label="Course to review"
                            value={courseId}
                            onChange={(event) => { setCourseId(event.target.value); setSubmitted(false); }}
                            className="w-full rounded-lg border border-[#3A3A3A]/10 bg-white px-3 py-2 text-xs font-medium text-[#3A3A3A] outline-none transition focus:border-[#F47822]/60"
                        >
                            {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
                        </select>
                    )}

                    <div className="flex flex-wrap gap-0.5">
                        {quickFeedback.map((option) => (
                            <button
                                key={option.label}
                                type="button"
                                onClick={() => { setRating(option.rating); setComment(option.message); setSubmitted(false); }}
                                className={`rounded-full border px-1.5 py-0.5 text-[1px] font-semibold leading-3 transition ${rating === option.rating && comment === option.message ? "border-[#F47822] bg-[#F47822] text-white" : "border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/65 hover:border-[#F47822]/35"}`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={comment}
                        onChange={(event) => { setComment(event.target.value); setSubmitted(false); }}
                        placeholder="Add a note (optional)"
                        rows={2}
                        className="w-full resize-none rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 py-2 text-xs text-[#3A3A3A] outline-none transition placeholder:text-[#3A3A3A]/35 focus:border-[#F47822]/60 focus:bg-white"
                    />

                    {error && <p className="text-[10px] font-medium text-red-600">{error}</p>}

                    <button
                        type="button"
                        disabled={!rating || isSubmitting || submitted}
                        onClick={() => void sendFeedback()}
                        className="flex w-full items-center justify-between rounded-xl bg-[#F7F7F7] px-4 py-3 text-left transition hover:bg-[#F47822]/10 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                        <span className="text-xs font-medium text-[#3A3A3A]">{submitted ? "Feedback sent — thank you" : isSubmitting ? "Sending feedback..." : "Send feedback"}</span>
                        {submitted ? <Check className="h-3.5 w-3.5 text-[#F47822]" /> : <ArrowRight className="h-3.5 w-3.5 text-[#3A3A3A]/35" />}
                    </button>
                </div>
            ) : (
                <p className="mt-4 rounded-xl border border-dashed border-[#3A3A3A]/12 px-3 py-3 text-center text-[10px] leading-4 text-[#3A3A3A]/45">
                    Enroll in a course to share course feedback.
                </p>
            )}

        </section>
    );
}
