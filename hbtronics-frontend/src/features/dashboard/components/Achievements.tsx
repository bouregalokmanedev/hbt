import {
    ArrowRight,
    Award,
    Check,
    Lock,
    Trophy,
} from "lucide-react";

import type {
    Achievement,
} from "../types/dashboard.types";

interface AchievementsProps {
    achievements: Achievement[];
}

export function Achievements({
    achievements,
}: AchievementsProps) {
    const completedCount =
        achievements.filter(
            (achievement) =>
                achievement.completed,
        ).length;

    const totalCount =
        achievements.length;

    return (
        <section className="relative overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_8px_30px_rgba(58,58,58,0.05)]">
            {/* Background glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[#F47822]/7 blur-3xl" />

            <div className="relative p-5 sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
                            Milestones
                        </p>

                        <h2 className="mt-1 text-base font-semibold text-[#3A3A3A] sm:text-lg">
                            Achievements
                        </h2>

                        <p className="mt-1 text-xs text-[#3A3A3A]/45">
                            Keep progressing and unlock new milestones.
                        </p>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3A3A3A]/5">
                        <Trophy className="h-4 w-4 text-[#3A3A3A]/55" />
                    </div>
                </div>

                {/* Summary */}
                {totalCount > 0 && (
                    <div className="mt-5 flex items-center justify-between rounded-xl border border-[#3A3A3A]/6 bg-[#FAFAFA] px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F47822]/10">
                                <Award className="h-4 w-4 text-[#F47822]" />
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-[#3A3A3A]">
                                    Your progress
                                </p>

                                <p className="mt-0.5 text-[10px] text-[#3A3A3A]/40">
                                    {completedCount} of{" "}
                                    {totalCount} completed
                                </p>
                            </div>
                        </div>

                        <span className="text-sm font-bold text-[#F47822]">
                            {completedCount}/{totalCount}
                        </span>
                    </div>
                )}

                {/* Empty state */}
                {achievements.length === 0 ? (
                    <div className="mt-5 rounded-xl border border-dashed border-[#3A3A3A]/10 bg-[#F8F8F8] px-5 py-8 text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                            <Trophy className="h-5 w-5 text-[#3A3A3A]/25" />
                        </div>

                        <h3 className="mt-4 text-sm font-semibold text-[#3A3A3A]">
                            Your first achievement is waiting
                        </h3>

                        <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#3A3A3A]/45">
                            Complete lessons, courses and assessments
                            to start building your achievement collection.
                        </p>
                    </div>
                ) : (
                    <div className="mt-5 space-y-3">
                        {achievements.map(
                            (achievement) => {
                                const progress =
                                    achievement.target > 0
                                        ? Math.min(
                                              Math.round(
                                                  (achievement.progress /
                                                      achievement.target) *
                                                      100,
                                              ),
                                              100,
                                          )
                                        : achievement.completed
                                          ? 100
                                          : 0;

                                return (
                                    <div
                                        key={
                                            achievement.id
                                        }
                                        className="group rounded-xl border border-[#3A3A3A]/7 bg-[#FAFAFA] p-3.5 transition duration-200 hover:border-[#F47822]/20 hover:bg-white hover:shadow-[0_8px_24px_rgba(58,58,58,0.05)]"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div
                                                className={`
                                                    flex
                                                    h-10
                                                    w-10
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-xl
                                                    transition
                                                    ${
                                                        achievement.completed
                                                            ? "bg-[#F47822] text-white"
                                                            : "bg-[#3A3A3A]/6 text-[#3A3A3A]/45 group-hover:bg-[#F47822]/10 group-hover:text-[#F47822]"
                                                    }
                                                `}
                                            >
                                                {achievement.completed ? (
                                                    <Check className="h-4 w-4" />
                                                ) : achievement.icon ? (
                                                    <span className="text-sm">
                                                        {
                                                            achievement.icon
                                                        }
                                                    </span>
                                                ) : (
                                                    <Lock className="h-4 w-4" />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="truncate text-xs font-semibold text-[#3A3A3A]">
                                                            {
                                                                achievement.title
                                                            }
                                                        </h3>

                                                        {achievement.description && (
                                                            <p className="mt-0.5 truncate text-[10px] text-[#3A3A3A]/40">
                                                                {
                                                                    achievement.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    {achievement.completed ? (
                                                        <span className="shrink-0 rounded-full bg-[#F47822]/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-[#F47822]">
                                                            Completed
                                                        </span>
                                                    ) : (
                                                        <span className="shrink-0 text-[10px] font-semibold text-[#3A3A3A]/40">
                                                            {
                                                                achievement.progress
                                                            }
                                                            /
                                                            {
                                                                achievement.target
                                                            }
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Progress */}
                                                {!achievement.completed && (
                                                    <div className="mt-3">
                                                        <div className="h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/7">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-[#F47822] to-[#ff9a55] transition-all duration-700"
                                                                style={{
                                                                    width: `${progress}%`,
                                                                }}
                                                            />
                                                        </div>

                                                        <div className="mt-1 flex justify-between">
                                                            <span className="text-[9px] text-[#3A3A3A]/30">
                                                                {progress}%
                                                            </span>

                                                            <span className="text-[9px] text-[#3A3A3A]/30">
                                                                {
                                                                    achievement.target
                                                                }{" "}
                                                                target
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </div>
                )}

                {/* Footer */}
                {achievements.length > 0 && (
                    <button
                        type="button"
                        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#3A3A3A]/8 py-2.5 text-[10px] font-semibold text-[#3A3A3A]/50 transition hover:border-[#F47822]/20 hover:bg-[#F47822]/5 hover:text-[#F47822]"
                    >
                        View all achievements

                        <ArrowRight className="h-3 w-3" />
                    </button>
                )}
            </div>
        </section>
    );
}