import { useMemo } from "react";
import {
    ArrowRight,
    BookOpen,
    Flame,
    PlayCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { User } from "@/features/auth/types/auth.types";
import { UserAvatar } from "@/components/ui";
import { BadgeIcon } from "./BadgeIcon";
import { badgeAccent } from "./badge-icons";
import { levelText } from "../i18n/level-text";
import type { Achievement } from "../types/dashboard.types";

interface DashboardHeaderProps {
    user: User;
    progression: {
        total_xp: number;
        level: number;
        title: string;
        progress_percent: number;
        next_level_xp: number;
        next_level_title: string;
        current_streak: number;
        learning_days?: Array<{ date: string; active: boolean }>;
    };
    achievements?: Achievement[];
}

export function DashboardHeader({
    user,
    progression,
    achievements = [],
}: DashboardHeaderProps) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === "ar" ? "ar" : undefined;
    const firstName =
        user.first_name || t("dashboard.header.student");

    const hour = new Date().getHours();
    const greeting =
        hour < 12
            ? t("dashboard.header.greetMorning")
            : hour < 18
              ? t("dashboard.header.greetAfternoon")
              : t("dashboard.header.greetEvening");

    const today = new Intl.DateTimeFormat(locale, {
        weekday: "long",
        month: "long",
        day: "numeric",
    }).format(new Date());

    const remaining = Math.max(
        0,
        progression.next_level_xp - progression.total_xp,
    );
    const activeDays = (progression.learning_days ?? [])
        .slice(-7)
        .filter((day) => day.active).length;

    // Three random badges shown as icons on the level card (earned first).
    const badgePicks = useMemo(() => {
        const shuffle = (values: Achievement[]) => {
            const shuffled = [...values];

            for (let i = shuffled.length - 1; i > 0; i -= 1) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            return shuffled;
        };

        const earned = shuffle(
            achievements.filter((achievement) => achievement.completed),
        );
        const locked = shuffle(
            achievements.filter((achievement) => !achievement.completed),
        );

        return [...earned, ...locked].slice(0, 3);
    }, [achievements]);

    return (
        <section
            data-testid="dashboard-header"
            className="relative rounded-[28px] border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-6 shadow-[0_10px_30px_rgba(58,58,58,0.05)] sm:p-8"
        >
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                {/* Greeting + actions */}
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                            {today}
                        </p>

                        <span
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#F47822]/10 px-3 py-1 text-[11px] font-bold text-[#F47822]"
                            title="Consecutive learning days"
                        >
                            <Flame className="h-3.5 w-3.5" />
                            {progression.current_streak === 1
                                ? t("dashboard.header.dayOne", { count: progression.current_streak })
                                : t("dashboard.header.dayOther", { count: progression.current_streak })}
                        </span>

                        {activeDays > 0 && (
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                <span dir="ltr">{activeDays}/7</span>
                            </span>
                        )}
                    </div>

                    <div className="mt-4 flex items-start gap-4">
                        <div className="relative shrink-0">
                            <UserAvatar
                                user={user}
                                className="h-14 w-14"
                                fallbackClassName="bg-[#3A3A3A] text-base font-black text-white"
                            />

                            <span className="absolute -bottom-1 -end-1 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-emerald-500" />
                        </div>

                        <div className="min-w-0">
                            <h1 className="text-2xl font-black tracking-[-0.02em] text-[#3A3A3A] dark:text-[#ececef] sm:text-[32px] sm:leading-tight">
                                {greeting},{" "}
                                <span className="text-[#F47822]">{firstName}</span>
                            </h1>

                            <p className="mt-1.5 max-w-xl text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">
                                {t("dashboard.header.tagline")}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2.5">
                        <Link
                            to="/my-courses"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.22)] transition hover:bg-[#E96D18]"
                        >
                            <PlayCircle className="h-4 w-4" />
                            {t("dashboard.header.focusCta")}
                        </Link>

                        <Link
                            to="/catalog"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#3A3A3A]/12 dark:border-white/12 bg-white dark:bg-[#1b1b20] px-5 py-3 text-sm font-bold text-[#3A3A3A] dark:text-[#ececef] transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                        >
                            <BookOpen className="h-4 w-4" />
                            {t("dashboard.header.browseCta")}
                        </Link>
                    </div>
                </div>

                {/* Level card */}
                <div className="rounded-2xl border border-[#F47822]/20 bg-[#FFF8F4] dark:bg-[#F47822]/[0.08] p-5 sm:p-6">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">
                                {t("dashboard.header.level")}
                            </p>

                            <p className="mt-1 text-5xl font-black tabular-nums text-[#3A3A3A] dark:text-[#ececef]" dir="ltr">
                                {progression.level}
                            </p>
                        </div>

                        <div className="text-end">
                            <p className="text-sm font-black text-[#3A3A3A] dark:text-[#ececef]">
                                {levelText(progression.title, t)}
                            </p>

                            <p className="mt-0.5 text-xs font-bold text-[#3A3A3A]/50 dark:text-white/50" dir="ltr">
                                {progression.total_xp.toLocaleString()} XP
                            </p>
                        </div>
                    </div>

                    {badgePicks.length > 0 && (
                        <div className="mt-4 flex items-center gap-2">
                            {badgePicks.map((badge) => (
                                <span
                                    key={badge.id}
                                    title={badge.title}
                                    aria-label={badge.title}
                                    className="grid h-9 w-9 place-items-center rounded-xl border bg-white shadow-sm dark:bg-white/10"
                                    style={{
                                        color: badgeAccent(badge.id),
                                        borderColor: `${badgeAccent(badge.id)}40`,
                                    }}
                                >
                                    <BadgeIcon
                                        id={badge.id}
                                        title={badge.title}
                                        icon={badge.icon}
                                        locked={!badge.completed}
                                        className="h-4 w-4"
                                    />
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#3A3A3A]/8 dark:bg-white/8">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[#F47822] to-[#ffab67]"
                            style={{ width: `${progression.progress_percent}%` }}
                        />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 text-xs font-semibold text-[#3A3A3A]/55 dark:text-white/55">
                        <span className="truncate">{levelText(progression.title, t)}</span>

                        <span className="flex shrink-0 items-center gap-1 font-bold text-[#D96319]">
                            <span dir="ltr">{remaining.toLocaleString()} XP</span>
                            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                            <span className="truncate">{levelText(progression.next_level_title, t)}</span>
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
