import {
    BarChart3,
    Clock3,
} from "lucide-react";

import type {
    WeeklyActivity as WeeklyActivityData,
} from "../types/dashboard.types";

interface WeeklyActivityProps {
    activity: WeeklyActivityData[];
}

export function WeeklyActivity({
    activity,
}: WeeklyActivityProps) {
    const totalMinutes = activity.reduce(
        (total, item) =>
            total + Math.max(item.minutes, 0),
        0,
    );

    const maxMinutes = Math.max(
        ...activity.map((item) =>
            Math.max(item.minutes, 0),
        ),
        60,
    );

    const activeDays = activity.filter(
        (item) => item.minutes > 0,
    ).length;

    const averageMinutes =
        activity.length > 0
            ? Math.round(
                  totalMinutes / activity.length,
              )
            : 0;

    const totalHours = Math.floor(
        totalMinutes / 60,
    );

    const remainingMinutes =
        totalMinutes % 60;

    const formattedTotal =
        totalHours > 0
            ? `${totalHours}h ${remainingMinutes}m`
            : `${totalMinutes}m`;

    return (
        <section className="relative overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_8px_30px_rgba(58,58,58,0.05)]">
            {/* Background glow */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-[#F47822]/7 blur-3xl" />

            <div className="relative p-5 sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
                            Learning activity
                        </p>

                        <h2 className="mt-1 text-base font-semibold text-[#3A3A3A] sm:text-lg">
                            Weekly activity
                        </h2>

                        <p className="mt-1 text-xs text-[#3A3A3A]/45">
                            Your learning time over the last 7 days.
                        </p>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/8">
                        <BarChart3 className="h-4 w-4 text-[#F47822]" />
                    </div>
                </div>

                {/* Summary */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#3A3A3A]/6 bg-[#FAFAFA] px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Clock3 className="h-3.5 w-3.5 text-[#F47822]" />

                            <span className="text-[10px] font-medium uppercase tracking-wide text-[#3A3A3A]/40">
                                Total time
                            </span>
                        </div>

                        <p className="mt-1 text-lg font-bold text-[#3A3A3A]">
                            {formattedTotal}
                        </p>
                    </div>

                    <div className="rounded-xl border border-[#3A3A3A]/6 bg-[#FAFAFA] px-4 py-3">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-[#3A3A3A]/40">
                            Active days
                        </span>

                        <p className="mt-1 text-lg font-bold text-[#3A3A3A]">
                            {activeDays}
                            <span className="ml-1 text-xs font-medium text-[#3A3A3A]/35">
                                / {activity.length}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Chart */}
                {activity.length === 0 ? (
                    <div className="mt-5 flex h-44 items-center justify-center rounded-xl border border-dashed border-[#3A3A3A]/10 bg-[#F8F8F8]">
                        <div className="text-center">
                            <BarChart3 className="mx-auto h-5 w-5 text-[#3A3A3A]/25" />

                            <p className="mt-2 text-xs font-medium text-[#3A3A3A]/45">
                                No learning activity yet
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mt-6">
                            <div className="flex h-44 items-end gap-2 sm:gap-3">
                                {activity.map(
                                    (item) => {
                                        const minutes =
                                            Math.max(
                                                item.minutes,
                                                0,
                                            );

                                        const height =
                                            minutes === 0
                                                ? 4
                                                : Math.max(
                                                      (minutes /
                                                          maxMinutes) *
                                                          100,
                                                      10,
                                                  );

                                        const isActive =
                                            minutes > 0;

                                        return (
                                            <div
                                                key={`${item.day}-${item.date ?? ""}`}
                                                className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                                            >
                                                {/* Tooltip */}
                                                <div className="mb-2 rounded-md bg-[#3A3A3A] px-2 py-1 text-[9px] font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                                                    {minutes} min
                                                </div>

                                                {/* Bar */}
                                                <div className="flex h-full w-full items-end justify-center">
                                                    <div
                                                        className={`
                                                            relative
                                                            w-full
                                                            max-w-[38px]
                                                            rounded-t-lg
                                                            transition-all
                                                            duration-500
                                                            ${
                                                                isActive
                                                                    ? "bg-gradient-to-t from-[#F47822] to-[#ff9a55] group-hover:from-[#E96D18] group-hover:to-[#F47822]"
                                                                    : "bg-[#3A3A3A]/7"
                                                            }
                                                        `}
                                                        style={{
                                                            height: `${height}%`,
                                                        }}
                                                    >
                                                        {isActive && (
                                                            <div className="absolute inset-x-0 top-0 h-1 rounded-full bg-white/30" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Day */}
                                                <span
                                                    className={`
                                                        mt-2
                                                        text-[10px]
                                                        font-medium
                                                        ${
                                                            isActive
                                                                ? "text-[#3A3A3A]/65"
                                                                : "text-[#3A3A3A]/30"
                                                        }
                                                    `}
                                                >
                                                    {item.day}
                                                </span>
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-5 flex items-center justify-between border-t border-[#3A3A3A]/6 pt-4">
                            <p className="text-[10px] text-[#3A3A3A]/40">
                                Average
                            </p>

                            <p className="text-[11px] font-semibold text-[#3A3A3A]/65">
                                {averageMinutes} min / day
                            </p>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}