import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    ClipboardCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import type {
    UpcomingAssessment,
} from "../types/dashboard.types";

interface UpcomingAssessmentsProps {
    assessments: UpcomingAssessment[];
}

function formatAssessmentDate(date: string) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return {
            day: date,
            month: "",
        };
    }

    return {
        day: parsedDate.toLocaleDateString("en", {
            day: "2-digit",
        }),
        month: parsedDate.toLocaleDateString("en", {
            month: "short",
        }),
    };
}

function getScheduleLabel(date: string) {
    const scheduledAt = new Date(date);
    const today = new Date();

    if (Number.isNaN(scheduledAt.getTime())) return "Scheduled";

    const scheduledDay = new Date(scheduledAt.getFullYear(), scheduledAt.getMonth(), scheduledAt.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const days = Math.round((scheduledDay.getTime() - todayDay.getTime()) / 86400000);

    if (days < 0) return "Available now";
    if (days === 0) return "Due today";
    if (days === 1) return "Tomorrow";
    return `In ${days} days`;
}

export function UpcomingAssessments({
    assessments,
}: UpcomingAssessmentsProps) {
    return (
        <section
            className="
                overflow-hidden
                rounded-2xl
                border
                border-[#3A3A3A]/8
                bg-white
                shadow-[0_8px_30px_rgba(58,58,58,0.05)]
            "
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#3A3A3A]/6 px-5 py-5 sm:px-6">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
                        Stay prepared
                    </p>

                    <h2 className="mt-1 text-base font-semibold text-[#3A3A3A] sm:text-lg">
                        Upcoming assessments
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
                            text-[#3A3A3A]/45
                            transition
                            hover:text-[#F47822]
                        "
                    >
                        View all
                        <ArrowRight className="h-3.5 w-3.5" />
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

                        <h3 className="mt-4 text-sm font-semibold text-[#3A3A3A]">
                            You're all caught up
                        </h3>

                        <p className="mx-auto mt-1.5 max-w-xs text-xs leading-5 text-[#3A3A3A]/45">
                            No assessments are scheduled
                            right now. Keep learning and we'll
                            let you know when something is ready.
                        </p>

                        <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-[#3A3A3A]/8 bg-[#F7F7F7] px-3 py-1.5">
                            <CalendarDays className="h-3 w-3 text-[#F47822]" />

                            <span className="text-[10px] font-medium text-[#3A3A3A]/50">
                                No upcoming deadlines
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="divide-y divide-[#3A3A3A]/6">
                    {assessments.map((assessment) => {
                        const formattedDate =
                            formatAssessmentDate(
                                assessment.date,
                            );

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
                                        <h3 className="truncate text-sm font-semibold text-[#3A3A3A]">
                                            {assessment.title}
                                        </h3>

                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <span className="inline-flex items-center gap-1.5 text-[10px] text-[#3A3A3A]/45">
                                            <Clock3 className="h-3 w-3 text-[#3A3A3A]/30" />
                                            Scheduled assessment
                                        </span>

                                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${getScheduleLabel(assessment.date) === "Available now" || getScheduleLabel(assessment.date) === "Due today" ? "text-[#F47822]" : "text-[#3A3A3A]/50"}`}>
                                            <CheckCircle2 className="h-3 w-3" />
                                            {getScheduleLabel(assessment.date)}
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
                                        border-[#3A3A3A]/8
                                        text-[#3A3A3A]/35
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
