import {
    Crown,
    Flame,
    Sparkles,
} from "lucide-react";

import type { User } from "@/features/auth/types/auth.types";

interface DashboardHeaderProps {
    user: User;
    progression: { total_xp: number; level: number; title: string; progress_percent: number; next_level_xp: number; current_streak: number };
}

export function DashboardHeader({
    user,
    progression,
}: DashboardHeaderProps) {
    const firstName =
        user.first_name || "Learner";

    const initials =
        `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`
            .toUpperCase();

    return (
        <section className="group relative min-h-[280px] overflow-hidden rounded-[28px] bg-[#3A3A3A] shadow-[0_16px_45px_rgba(58,58,58,0.14)]">
            {/* =====================================================
                BACKGROUND
            ===================================================== */}

            <div className="absolute inset-0 overflow-hidden">
                {/* Main orange glow */}
                <div className="absolute -right-24 -top-28 h-[340px] w-[340px] animate-[pulse_5s_ease-in-out_infinite] rounded-full bg-[#F47822]/15 blur-[80px]" />

                {/* Bottom glow */}
                <div className="absolute -bottom-40 left-[35%] h-[300px] w-[300px] rounded-full bg-[#F47822]/8 blur-[90px]" />

                {/* Subtle grid */}
                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                    }}
                />

                {/* Decorative rings */}
                <div className="absolute -right-8 top-10 h-28 w-28 rounded-full border border-white/5" />

                <div className="absolute right-12 top-16 h-16 w-16 rounded-full border border-white/5" />
            </div>

            {/* =====================================================
                FLOATING DECORATIONS
            ===================================================== */}

            <div className="absolute right-[19%] bottom-[23%] hidden animate-[bounce_5s_ease-in-out_infinite] lg:block">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm">
                    <Sparkles className="h-4 w-4 text-white/50" />
                </div>
            </div>

            {/* =====================================================
                CONTENT
            ===================================================== */}

            <div className="relative z-10 flex min-h-[280px] flex-col justify-between p-6 sm:p-7 lg:p-8">
                {/* =================================================
                    TOP BAR
                ================================================= */}

                <div className="flex items-center justify-between gap-4">
                    {/* Student */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={`${user.first_name} ${user.last_name}`}
                                    className="h-10 w-10 rounded-xl object-cover ring-2 ring-white/10"
                                />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[11px] font-bold text-white ring-2 ring-white/10 backdrop-blur-sm">
                                    {initials}
                                </div>
                            )}

                            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#3A3A3A] bg-emerald-400" />
                        </div>

                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/35">
                                HBT Learning Platform
                            </p>

                            <p className="mt-0.5 text-[11px] font-medium text-white/60">
                                {user.username
                                    ? `@${user.username}`
                                    : "Student"}
                            </p>
                        </div>
                    </div>

                    {/* Single Pro button */}
                    <button
                        type="button"
                        className="group/pro flex items-center gap-1.5 rounded-xl border border-[#F47822]/30 bg-[#F47822]/10 px-3.5 py-2 text-[11px] font-semibold text-[#F47822] backdrop-blur-sm transition-all duration-300 hover:border-[#F47822]/50 hover:bg-[#F47822]/20"
                    >
                        <Crown className="h-3.5 w-3.5 transition-transform duration-300 group-hover/pro:scale-110 group-hover/pro:rotate-[-8deg]" />

                        Get HBT Pro
                    </button>
                </div>

                {/* =================================================
                    GREETING
                ================================================= */}

                <div className="max-w-2xl py-5">
                    <div className="mb-2.5 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F47822] shadow-[0_0_12px_#F47822]" />

                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#F47822]">
                            Ready to learn?
                        </p>
                    </div>

                    <h1 className="text-3xl font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-4xl lg:text-[42px]">
                        Welcome back,
                        <span className="relative ml-2 inline-block text-[#F47822]">
                            {firstName}

                            <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-left animate-[scaleX_1s_ease-out] rounded-full bg-[#F47822]/40" />
                        </span>
                    </h1>

                    <p className="mt-3 max-w-lg text-xs leading-5 text-white/45 sm:text-sm">
                        Keep building your diagnostic skills.
                        Every lesson brings you one step closer
                        to becoming a better technician.
                    </p>
                </div>

                {/* =================================================
                    BOTTOM
                ================================================= */}

                <div className="flex items-center justify-between gap-4">
                    {/* Motivation */}
                    <div className="hidden items-center gap-2.5 sm:flex">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                            <Sparkles className="h-3.5 w-3.5 text-[#F47822]" />
                        </div>

                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/25">
                                Your goal
                            </p>

                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[11px] font-medium text-white/55">
                                    Learn something new today
                                </p>
                                <span className="inline-flex items-center gap-1 rounded-full border border-[#F47822]/25 bg-[#F47822]/10 px-2 py-0.5 text-[10px] font-bold text-[#F47822]" title="Consecutive learning days">
                                    <Flame className="h-3 w-3" />
                                    {progression.current_streak} day{progression.current_streak === 1 ? "" : "s"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                        <div title={`${progression.total_xp} XP earned`} className="min-w-[132px] rounded-xl border border-[#F47822]/30 bg-[#F47822]/10 px-3 py-2 backdrop-blur-sm"><div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wide text-[#F47822]"><span>Level {progression.level}</span><span>{progression.total_xp} XP</span></div><p className="mt-1 text-[10px] font-semibold text-white/80">{progression.title}</p><div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#F47822]" style={{ width: `${progression.progress_percent}%` }}/></div></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
