import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    ClipboardCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type {
    UpcomingAssessment,
} from "../types/dashboard.types";

interface UpcomingAssessmentsProps {
    assessments: UpcomingAssessment[];
}

type ScheduleStatus =
    | { kind: "unknown" }
    | { kind: "past" }
    | { kind: "today" }
    | { kind: "tomorrow" }
    | { kind: "future"; days: number };

function formatAssessmentDate(date: string, locale: string) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return {
            day: date,
            month: "",
        };
    }

    return {
        day: parsedDate.toLocaleDateString(locale, {
            day: "2-digit",
        }),
        month: parsedDate.toLocaleDateString(locale, {
            month: "short",
        }),
    };
}

function getScheduleStatus(date: string): ScheduleStatus {
    const scheduledAt = new Date(date);
    const today = new Date();

    if (Number.isNaN(scheduledAt.getTime())) return { kind: "unknown" };

    const scheduledDay = new Date(scheduledAt.getFullYear(), scheduledAt.getMonth(), scheduledAt.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const days = Math.round((scheduledDay.getTime() - todayDay.getTime()) / 86400000);

    if (days < 0) return { kind: "past" };
    if (days === 0) return { kind: "today" };
    if (days === 1) return { kind: "tomorrow" };
    return { kind: "future", days };
}

export function UpcomingAssessments({
    assessments,
}: UpcomingAssessmentsProps) {
    const { t, i18n } = useTranslation();

    const scheduleLabel = (status: ScheduleStatus): string => {
        switch (status.kind) {
            case "past":
                return t("dashboard.assessments.availableNow");
            case "today":
                return t("dashboard.assessments.dueToday");
            case "tomorrow":
                return t("dashboard.assessments.tomorrow");
            case "future":
                return t("dashboard.assessments.inDays", { count: status.days });
            default:
                return t("dashboard.assessments.scheduled");
        }
    };

    return (
        <section
            data-testid="upcoming-assessments-card"
            className="
                overflow-hidden
                rounded-2xl
                border
                border-[#3A3A3A]/8 dark:border-white/8
                bg-white dark:bg-[#1b1b20]
                shadow-[0_8px_30px_rgba(58,58,58,0.05)]
            "
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#3A3A3A]/6 dark:border-white/6 px-5 py-5 sm:px-6">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
                        {t("dashboard.assessments.eyebrow")}
                    </p>

                    <h2 className="mt-1 text-base font-semibold text-[#3A3A3A] dark:text-[#ececef] sm:text-lg">
                        {t("dashboard.assessments.title")}
                    </h2>
                </div>

                {assessments.length > 0 && (
                    <Link
                        to="/assessments"
                        className="
                            inline-flex
                            items-center
                            gap-1
                            text-[11px]
                            font-semibold
                            text-[#3A3A3A]/45 dark:text-white/45
                            transition
                            hover:text-[#F47822]
                        "
                    >
                        {t("dashboard.assessments.viewAll")}
                        <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                    </Link>
                )}
            </div>

            {assessments.length === 0 ? (
                <div className="relative overflow-hidden px-5 py-10 text-center sm:px-6">
                    {/* Soft background effect */}
                    <div
                        className="
                            pointer-events-none
                            absolute
                            -right-10
                            -top-10
                            h-32
                            w-32
                            rounded-full
                            bg-[#F47822]/8
                            blur-3xl
                        "
                    />

                    <div className="relative">
                        <div
                            className="
                                mx-auto
                                flex
                                h-12
                                w-12
                                items-center
                                justify-center
                                rounded-2xl
                                bg-[#3A3A3A]
                                text-white
                                shadow-[0_8px_20px_rgba(58,58,58,0.12)]
                            "
                        >
                            <ClipboardCheck className="h-5 w-5" />
                        </div>

                        <h3 className="mt-4 text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                            {t("dashboard.assessments.emptyTitle")}
                        </h3>

                        <p className="mx-auto mt-1.5 max-w-xs text-xs leading-5 text-[#3A3A3A]/45 dark:text-white/45">
                            {t("dashboard.assessments.emptyDesc")}
                        </p>

                        <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-[#3A3A3A]/8 dark:border-white/8 bg-[#F7F7F7] dark:bg-[#101013] px-3 py-1.5">
                            <CalendarDays className="h-3 w-3 text-[#F47822]" />

                            <span className="text-[10px] font-medium text-[#3A3A3A]/50 dark:text-white/50">
                                {t("dashboard.assessments.emptyHint")}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="divide-y divide-[#3A3A3A]/6 dark:divide-white/6">
                    {assessments.map((assessment) => {
                        const formattedDate =
                            formatAssessmentDate(
                                assessment.date,
                                i18n.language,
                            );
                        const scheduleStatus =
                            getScheduleStatus(assessment.date);
                        const isHot =
                            scheduleStatus.kind === "past" ||
                            scheduleStatus.kind === "today";

                        return (
                                <Link
                                    key={assessment.id}
                                    to={`/assessments/${assessment.id}/exam`}
                                    className="
                                        group
                                        flex
                                    items-center
                                    gap-4
                                    px-5
                                    py-4
                                    transition
                                    hover:bg-[#F7F7F7]/70
                                    sm:px-6
                                "
                            >
                                {/* Date */}
                                <div
                                    className="
                                        flex
                                        h-12
                                        w-12
                                        shrink-0
                                        flex-col
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-[#F47822]/10
                                        text-[#F47822]
                                        transition
                                        group-hover:bg-[#F47822]
                                        group-hover:text-white
                                    "
                                >
                                    <span className="text-[15px] font-bold leading-none">
                                        {formattedDate.day}
                                    </span>

                                    {formattedDate.month && (
                                        <span className="mt-1 text-[8px] font-semibold uppercase tracking-wide">
                                            {formattedDate.month}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                                            {assessment.title}
                                        </h3>

                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <span className="inline-flex items-center gap-1.5 text-[10px] text-[#3A3A3A]/45 dark:text-white/45">
                                            <Clock3 className="h-3 w-3 text-[#3A3A3A]/30 dark:text-white/30" />
                                            {t("dashboard.assessments.scheduled")}
                                        </span>

                                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${isHot ? "text-[#F47822]" : "text-[#3A3A3A]/50 dark:text-white/50"}`}>
                                            <CheckCircle2 className="h-3 w-3" />
                                            {scheduleLabel(scheduleStatus)}
                                        </span>
                                    </div>
                                </div>

                                {/* Action */}
                                <span
                                    className="
                                        flex
                                        h-8
                                        w-8
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-lg
                                        border
                                        border-[#3A3A3A]/8 dark:border-white/8
                                        text-[#3A3A3A]/35 dark:text-white/35
                                        transition
                                        hover:border-[#F47822]/20
                                        hover:bg-[#F47822]/10
                                        hover:text-[#F47822]
                                    "
                                >
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
