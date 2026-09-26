import {
    Activity,
    ArrowUpRight,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    FileCheck2,
    PlayCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

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

type TimeAgo =
    | { kind: "now" }
    | { kind: "minutes"; count: number }
    | { kind: "hours"; count: number }
    | { kind: "days"; count: number }
    | { kind: "date"; value: string };

function activityAge(
    value: string,
): TimeAgo {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return { kind: "date", value };
    }

    const now = new Date();

    const diff =
        now.getTime() -
        date.getTime();

    const minutes = Math.floor(
        diff / 60000,
    );

    if (minutes < 1) {
        return { kind: "now" };
    }

    if (minutes < 60) {
        return { kind: "minutes", count: minutes };
    }

    const hours = Math.floor(
        minutes / 60,
    );

    if (hours < 24) {
        return { kind: "hours", count: hours };
    }

    const days = Math.floor(
        hours / 24,
    );

    if (days < 7) {
        return { kind: "days", count: days };
    }

    return { kind: "date", value };
}

function getActivityDestination(description: string) {
    const value = description.toLowerCase();

    if (value.includes("certificate")) {
        return { labelKey: "dashboard.sidebar.certificates", to: "/certificates" };
    }

    if (value.includes("assessment") || value.includes("quiz") || value.includes("exam")) {
        return { labelKey: "dashboard.sidebar.assessments", to: "/assessments" };
    }

    if (value.includes("course") || value.includes("lesson")) {
        return { labelKey: "dashboard.sidebar.myCourses", to: "/my-courses" };
    }

    return { labelKey: "dashboard.sidebar.dashboard", to: "/dashboard" };
}

export function RecentActivity({
    activities,
}: RecentActivityProps) {
    const { t, i18n } = useTranslation();
    const [page, setPage] = useState(0);
    const pageSize = 3;
    const totalPages = Math.max(1, Math.ceil(activities.length / pageSize));

    const activityLabel = (activity: RecentActivityItem): string =>
        activity.event
            ? t(`dashboard.activity.events.${activity.event}`, {
                  defaultValue: activity.description,
              })
            : activity.description;

    const timeAgo = (value: string): string => {
        const age = activityAge(value);

        switch (age.kind) {
            case "now":
                return t("dashboard.activity.justNow");
            case "minutes":
                return t("dashboard.activity.minutesAgo", { count: age.count });
            case "hours":
                return t("dashboard.activity.hoursAgo", { count: age.count });
            case "days":
                return t("dashboard.activity.daysAgo", { count: age.count });
            default:
                return new Date(age.value).toLocaleDateString(
                    i18n.language,
                    {
                        month: "short",
                        day: "numeric",
                    },
                );
        }
    };
    const visibleActivities = useMemo(
        () => activities.slice(page * pageSize, page * pageSize + pageSize),
        [activities, page],
    );

    useEffect(() => {
        setPage((currentPage) => Math.min(currentPage, totalPages - 1));
    }, [totalPages]);

    return (
        <section className="relative overflow-hidden rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] shadow-[0_8px_30px_rgba(58,58,58,0.05)]">
            {/* Background glow */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-[#F47822]/7 blur-3xl" />

            <div className="relative p-5 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
                            {t("dashboard.activity.eyebrow")}
                        </p>

                        <h2 className="mt-1 text-base font-semibold text-[#3A3A3A] dark:text-[#ececef] sm:text-lg">
                            {t("dashboard.activity.title")}
                        </h2>

                        <p className="mt-1 text-xs text-[#3A3A3A]/45 dark:text-white/45">
                            {t("dashboard.activity.count", { count: activities.length })}
                        </p>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3A3A3A]/5 dark:bg-white/5">
                        <Clock3 className="h-4 w-4 text-[#3A3A3A]/55 dark:text-white/55" />
                    </div>
                </div>

                {/* Empty state */}
                {activities.length === 0 ? (
                    <div className="mt-5 rounded-xl border border-dashed border-[#3A3A3A]/10 dark:border-white/10 bg-[#F8F8F8] px-5 py-8 text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-[#1b1b20] shadow-sm">
                            <Activity className="h-5 w-5 text-[#3A3A3A]/35 dark:text-white/35" />
                        </div>

                        <h3 className="mt-4 text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                            {t("dashboard.activity.emptyTitle")}
                        </h3>

                        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">
                            {t("dashboard.activity.emptyDesc")}
                        </p>
                    </div>
                ) : (
                    <div className="mt-5">
                        <div className="relative">
                            {/* Timeline */}
                            <div className="absolute bottom-5 start-[17px] top-5 w-px bg-[#3A3A3A]/8 dark:bg-white/8" />

                            <div className="space-y-1">
                                {visibleActivities.map(
                                    (
                                        activity,
                                        index,
                                    ) => {
                                        const Icon =
                                            getActivityIcon(
                                                activity.description,
                                            );

                                        const isLast =
                                            index === visibleActivities.length - 1;
                                        const destination = getActivityDestination(activity.description);

                                        return (
                                            <Link
                                                key={
                                                    activity.id
                                                }
                                                to={destination.to}
                                                className="group relative flex gap-4 rounded-xl px-1 py-3 transition hover:bg-[#F8F8F8]"
                                            >
                                                {/* Icon */}
                                                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white bg-[#F3F3F3] dark:bg-[#101013] shadow-sm transition group-hover:bg-[#F47822]/10">
                                                    <Icon className="h-3.5 w-3.5 text-[#3A3A3A]/50 dark:text-white/50 transition group-hover:text-[#F47822]" />
                                                </div>

                                                {/* Content */}
                                                <div
                                                    className={`min-w-0 flex-1 ${
                                                        isLast
                                                            ? ""
                                                            : "border-b border-[#3A3A3A]/6 dark:border-white/6 pb-3"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <p className="text-xs font-medium leading-5 text-[#3A3A3A] dark:text-[#ececef] sm:text-sm">
                                                            {activityLabel(
                                                                activity,
                                                            )}
                                                        </p>

                                                        <span className="shrink-0 whitespace-nowrap text-[10px] font-medium text-[#3A3A3A]/35 dark:text-white/35">
                                                            {timeAgo(
                                                                activity.created_at,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-[#3A3A3A]/45 dark:text-white/45">
                                                        <span className="font-medium">{t(destination.labelKey)}</span>

                                                        <ArrowUpRight className="h-2.5 w-2.5 rtl:-scale-x-100" />
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    },
                                )}
                            </div>
                        </div>

                        {activities.length > pageSize && (
                            <div className="mt-4 flex items-center justify-between border-t border-[#3A3A3A]/6 dark:border-white/6 pt-4">
                                <p className="text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                                    {t("dashboard.activity.showing", {
                                        from: page * pageSize + 1,
                                        to: Math.min((page + 1) * pageSize, activities.length),
                                        total: activities.length,
                                    })}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={page === 0}
                                        onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 text-[#3A3A3A]/55 dark:text-white/55 transition hover:border-[#F47822]/25 hover:bg-[#F47822]/8 hover:text-[#F47822] disabled:cursor-not-allowed disabled:opacity-35"
                                        aria-label={t("dashboard.activity.prevAria")}
                                    >
                                        <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
                                    </button>
                                    <span className="min-w-10 text-center text-[11px] font-semibold text-[#3A3A3A]/55 dark:text-white/55">{page + 1} / {totalPages}</span>
                                    <button
                                        type="button"
                                        disabled={page === totalPages - 1}
                                        onClick={() => setPage((currentPage) => Math.min(totalPages - 1, currentPage + 1))}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#3A3A3A]/10 dark:border-white/10 text-[#3A3A3A]/55 dark:text-white/55 transition hover:border-[#F47822]/25 hover:bg-[#F47822]/8 hover:text-[#F47822] disabled:cursor-not-allowed disabled:opacity-35"
                                        aria-label={t("dashboard.activity.nextAria")}
                                    >
                                        <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
