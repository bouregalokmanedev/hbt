import {
    Activity,
    ArrowUpRight,
    BookOpen,
    CheckCircle2,
    Clock3,
    FileCheck2,
    PlayCircle,
} from "lucide-react";

import type {
    RecentActivityItem,
} from "../types/dashboard.types";

interface RecentActivityProps {
    activities: RecentActivityItem[];
}

function getActivityIcon(
    description: string,
) {
    const value = description.toLowerCase();

    if (
        value.includes("complete") ||
        value.includes("completed")
    ) {
        return CheckCircle2;
    }

    if (
        value.includes("course") ||
        value.includes("lesson")
    ) {
        return BookOpen;
    }

    if (
        value.includes("assessment") ||
        value.includes("quiz") ||
        value.includes("exam")
    ) {
        return FileCheck2;
    }

    if (
        value.includes("started") ||
        value.includes("continue")
    ) {
        return PlayCircle;
    }

    return Activity;
}

function formatActivityDate(
    value: string,
) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    const now = new Date();

    const diff =
        now.getTime() -
        date.getTime();

    const minutes = Math.floor(
        diff / 60000,
    );

    if (minutes < 1) {
        return "Just now";
    }

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(
        minutes / 60,
    );

    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.floor(
        hours / 24,
    );

    if (days < 7) {
        return `${days}d ago`;
    }

    return date.toLocaleDateString(
        undefined,
        {
            month: "short",
            day: "numeric",
        },
    );
}

export function RecentActivity({
    activities,
}: RecentActivityProps) {
    return (
        <section className="relative overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_8px_30px_rgba(58,58,58,0.05)]">
            {/* Background glow */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-[#F47822]/7 blur-3xl" />

            <div className="relative p-5 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
                            Activity
                        </p>

                        <h2 className="mt-1 text-base font-semibold text-[#3A3A3A] sm:text-lg">
                            Recent activity
                        </h2>

                        <p className="mt-1 text-xs text-[#3A3A3A]/45">
                            Your latest learning activity.
                        </p>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3A3A3A]/5">
                        <Clock3 className="h-4 w-4 text-[#3A3A3A]/55" />
                    </div>
                </div>

                {/* Empty state */}
                {activities.length === 0 ? (
                    <div className="mt-5 rounded-xl border border-dashed border-[#3A3A3A]/10 bg-[#F8F8F8] px-5 py-8 text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                            <Activity className="h-5 w-5 text-[#3A3A3A]/35" />
                        </div>

                        <h3 className="mt-4 text-sm font-semibold text-[#3A3A3A]">
                            No recent activity
                        </h3>

                        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#3A3A3A]/50">
                            Your learning activity will appear here as
                            you complete lessons, courses and assessments.
                        </p>
                    </div>
                ) : (
                    <div className="mt-5">
                        <div className="relative">
                            {/* Timeline */}
                            <div className="absolute bottom-5 left-[17px] top-5 w-px bg-[#3A3A3A]/8" />

                            <div className="space-y-1">
                                {activities.map(
                                    (
                                        activity,
                                        index,
                                    ) => {
                                        const Icon =
                                            getActivityIcon(
                                                activity.description,
                                            );

                                        const isLast =
                                            index ===
                                            activities.length -
                                                1;

                                        return (
                                            <div
                                                key={
                                                    activity.id
                                                }
                                                className="group relative flex gap-4 rounded-xl px-1 py-3 transition hover:bg-[#F8F8F8]"
                                            >
                                                {/* Icon */}
                                                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white bg-[#F3F3F3] shadow-sm transition group-hover:bg-[#F47822]/10">
                                                    <Icon className="h-3.5 w-3.5 text-[#3A3A3A]/50 transition group-hover:text-[#F47822]" />
                                                </div>

                                                {/* Content */}
                                                <div
                                                    className={`min-w-0 flex-1 ${
                                                        isLast
                                                            ? ""
                                                            : "border-b border-[#3A3A3A]/6 pb-3"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <p className="text-xs font-medium leading-5 text-[#3A3A3A] sm:text-sm">
                                                            {
                                                                activity.description
                                                            }
                                                        </p>

                                                        <span className="shrink-0 whitespace-nowrap text-[10px] font-medium text-[#3A3A3A]/35">
                                                            {formatActivityDate(
                                                                activity.created_at,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-[#3A3A3A]/35">
                                                        <span>
                                                            Learning
                                                        </span>

                                                        <ArrowUpRight className="h-2.5 w-2.5" />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}