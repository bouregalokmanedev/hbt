import { Award, Flame, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { InstructorProgression } from "../types/instructor";

/** Backend event name -> i18n key, so awards read correctly in Arabic too. */
const EVENT_LABEL_KEYS: Record<string, string> = {
    course_published: "instructor.dashboard.progression.events.coursePublished",
    lesson_published: "instructor.dashboard.progression.events.lessonPublished",
    assessment_graded: "instructor.dashboard.progression.events.assessmentGraded",
    student_enrolled: "instructor.dashboard.progression.events.studentEnrolled",
    student_completed_course:
        "instructor.dashboard.progression.events.studentCompleted",
};

/**
 * Teaching levels: XP for publishing, grading and growing an audience.
 * Deliberately its own ladder — it never shares a ranking with learners.
 */
export function ProgressionCard({ data }: { data?: InstructorProgression }) {
    const { t } = useTranslation();

    if (!data) return null;

    const maxed = data.next_level_xp <= data.total_xp;
    const toNext = Math.max(0, data.next_level_xp - data.total_xp);

    return (
        <section
            data-testid="instructor-progression"
            className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_10px_30px_rgba(58,58,58,.045)] sm:p-6"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                        <Trophy className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-[#3A3A3A]">
                            {t("instructor.dashboard.progression.title")}
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/45">
                            {t("instructor.dashboard.progression.subtitle")}
                        </p>
                    </div>
                </div>
                <span className="shrink-0 rounded-full bg-[#F47822] px-2.5 py-1 text-[11px] font-black text-white">
                    {t("instructor.dashboard.progression.level", {
                        level: data.level,
                    })}
                </span>
            </div>

            <div className="mt-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-lg font-black tracking-tight text-[#3A3A3A]">
                        {data.title}
                    </p>
                    <p className="text-xs font-bold text-[#3A3A3A]/55">
                        {t("instructor.dashboard.progression.xp", {
                            value: data.total_xp,
                        })}
                    </p>
                </div>

                <div
                    className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#3A3A3A]/8"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={data.progress_percent}
                    aria-label={t("instructor.dashboard.progression.title")}
                >
                    <span
                        className="block h-full rounded-full bg-gradient-to-r from-[#F47822] to-[#ff8f45]"
                        style={{ width: `${data.progress_percent}%` }}
                    />
                </div>

                <p className="mt-2 text-[11px] font-semibold text-[#3A3A3A]/50">
                    {maxed
                        ? t("instructor.dashboard.progression.maxed")
                        : t("instructor.dashboard.progression.toNext", {
                            value: toNext,
                            title: data.next_level_title,
                        })}
                </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF8F4] px-3 py-1.5 text-[11px] font-black text-[#F47822]">
                    <Flame className="h-3.5 w-3.5" />
                    {t("instructor.dashboard.progression.streak", {
                        value: data.current_streak,
                    })}
                </span>
                <span className="rounded-full bg-[#3A3A3A]/6 px-3 py-1.5 text-[11px] font-bold text-[#3A3A3A]/60">
                    {t("instructor.dashboard.progression.best", {
                        value: data.longest_streak,
                    })}
                </span>
                <span className="ml-auto text-[10px] font-black uppercase tracking-[.12em] text-[#3A3A3A]/35">
                    {t("instructor.dashboard.progression.activity")}
                </span>
                <div className="flex gap-1.5">
                    {data.teaching_days.map((day) => (
                        <span
                            key={day.date}
                            title={t(
                                day.active
                                    ? "instructor.dashboard.progression.dayActive"
                                    : "instructor.dashboard.progression.dayInactive",
                            )}
                            className={`h-3.5 w-3.5 rounded-full ${
                                day.active
                                    ? "bg-[#F47822]"
                                    : "bg-[#3A3A3A]/12"
                            }`}
                        />
                    ))}
                </div>
            </div>

            <div className="mt-5">
                <p className="text-[11px] font-black uppercase tracking-[.12em] text-[#3A3A3A]/40">
                    {t("instructor.dashboard.progression.recent")}
                </p>

                {data.recent_awards.length === 0 ? (
                    <p className="mt-2 text-xs leading-5 text-[#3A3A3A]/45">
                        {t("instructor.dashboard.progression.empty")}
                    </p>
                ) : (
                    <ul className="mt-2 space-y-1.5">
                        {data.recent_awards.slice(0, 5).map((award) => (
                            <li
                                key={award.id}
                                className="flex items-center justify-between gap-3"
                            >
                                <span className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-[#3A3A3A]/75">
                                    <Award className="h-3.5 w-3.5 shrink-0 text-[#F47822]" />
                                    <span className="truncate">
                                        {t(
                                            EVENT_LABEL_KEYS[award.event] ??
                                                "instructor.dashboard.progression.events.other",
                                        )}
                                    </span>
                                </span>
                                <span className="shrink-0 text-xs font-black text-[#F47822]">
                                    +{award.xp}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
