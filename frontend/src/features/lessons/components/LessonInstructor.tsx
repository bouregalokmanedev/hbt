import { ArrowRight, BookOpen, Loader2, Send, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { UserAvatar } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { coursesApi, getCourse } from "@/features/courses/api/courses.api";
import type { Course } from "@/features/courses/types/course.types";
import { messagesApi } from "@/features/messages/api/messages.api";

export function LessonInstructor({ courseId }: { courseId: string }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState<Course | null>(null);
    const [others, setOthers] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        void getCourse(courseId)
            .then(async (loaded) => {
                if (cancelled) return;
                setCourse(loaded);
                if (loaded.instructor?.id) {
                    try {
                        const list = await coursesApi.list({ instructor: loaded.instructor.id, per_page: 4 });
                        if (!cancelled) setOthers(list.data.filter((entry) => entry.id !== loaded.id).slice(0, 3));
                    } catch {
                        if (!cancelled) setOthers([]);
                    }
                }
            })
            .catch(() => {
                if (!cancelled) setCourse(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [courseId]);

    const send = async () => {
        if (!course?.instructor?.id || !message.trim() || sending) return;
        setSending(true);
        setError(null);
        try {
            const conversation = await messagesApi.create({
                recipient_id: course.instructor.id,
                subject: t("lessonPlayer.instructor.questionAbout", { title: course.title }),
                message: message.trim(),
            });
            setSent(true);
            setMessage("");
            navigate(`/messages?conversation=${conversation.id}`);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("lessonPlayer.instructor.sendFail"));
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="px-5 py-6 sm:px-7 sm:py-7">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.07]" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 animate-pulse rounded bg-gray-100 dark:bg-white/[0.07]" />
                        <div className="h-3 w-28 animate-pulse rounded bg-gray-100 dark:bg-white/[0.07]" />
                    </div>
                </div>
            </div>
        );
    }

    const instructor = course?.instructor ?? null;

    if (!instructor) {
        return <p className="px-5 py-6 text-sm text-gray-500 sm:px-7">{t("lessonPlayer.instructor.unavailable")}</p>;
    }

    const fullName = `${instructor.first_name} ${instructor.last_name}`.trim();

    return (
        <div className="space-y-6 px-5 py-6 sm:px-7 sm:py-7">
            {/* Mini profile */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <UserAvatar
                    user={instructor}
                    className="h-16 w-16 border border-gray-200 dark:border-white/10"
                    fallbackClassName="bg-[#F47822] text-xl font-bold text-white"
                />
                <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                        <UserRound className="h-3.5 w-3.5" /> {t("lessonPlayer.instructor.eyebrow")}
                    </p>
                    <h3 className="mt-1 truncate text-lg font-bold text-[#3A3A3A] dark:text-[#ececef]">{fullName}</h3>
                    <p className="text-xs font-medium text-gray-500">@{instructor.username}</p>
                </div>
            </div>
            {instructor.bio && <p className="whitespace-pre-line text-sm leading-7 text-gray-600 dark:text-gray-300">{instructor.bio}</p>}

            {/* More courses by this instructor */}
            <div className="rounded-2xl bg-[#F7F7F7] dark:bg-[#101013] p-4 sm:p-5">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                    <BookOpen className="h-3.5 w-3.5" /> {t("lessonPlayer.instructor.moreFrom", { name: instructor.first_name })}
                </p>
                {others.length === 0 ? (
                    <p className="mt-2 text-xs leading-5 text-gray-500">{t("lessonPlayer.instructor.noOthers")}</p>
                ) : (
                    <ul className="mt-3 space-y-2">
                        {others.map((entry) => (
                            <li key={entry.id}>
                                <Link
                                    to={`/courses/${entry.id}`}
                                    className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-4 py-3 transition hover:border-[#F47822]/30"
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef] group-hover:text-[#F47822]">{entry.title}</span>
                                        <span className="mt-0.5 block text-[11px] text-gray-500">{entry.is_free ? t("lessonPlayer.instructor.free") : `${entry.discount_price ?? entry.price} ${entry.currency}`}</span>
                                    </span>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#F47822] rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Contact */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 p-4 sm:p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("lessonPlayer.instructor.contact")}</p>
                {!user ? (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs leading-5 text-gray-500">{t("lessonPlayer.instructor.loginToMsg", { name: instructor.first_name })}</p>
                        <Link to="/login" className="inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#df6817]">
                            {t("lessonPlayer.instructor.login")} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                        </Link>
                    </div>
                ) : (
                    <>
                        <textarea
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            rows={3}
                            maxLength={5000}
                            placeholder={t("lessonPlayer.instructor.askPh", { name: instructor.first_name })}
                            className="mt-3 w-full resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-[#FAFAFA] dark:bg-[#232329] px-4 py-3 text-sm leading-6 text-[#3A3A3A] dark:text-[#ececef] outline-none transition placeholder:text-gray-400 focus:border-[#F47822] focus:bg-white dark:focus:bg-[#1b1b20]"
                        />
                        {error && <p role="alert" className="mt-2 rounded-xl bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
                        {sent && <p className="mt-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">{t("lessonPlayer.instructor.sent")}</p>}
                        <button
                            type="button"
                            onClick={() => void send()}
                            disabled={!message.trim() || sending}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-black disabled:opacity-50"
                        >
                            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            {sending ? t("lessonPlayer.instructor.sending") : t("lessonPlayer.instructor.message", { name: instructor.first_name })}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
