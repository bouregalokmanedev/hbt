import {
    BookOpen,
    Award,
    Clock3,
    CheckCircle2,
    ArrowUpRight,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import type {
    DashboardStats as DashboardStatsType,
} from "../types/dashboard.types";

interface DashboardStatsProps {
    stats: DashboardStatsType;
}

export function DashboardStats({
    stats,
}: DashboardStatsProps) {
    const { t } = useTranslation();

    const progress = Math.min(
        Math.max(stats.current_progress, 0),
        100,
    );

    const statCards = [
        {
            label: t("dashboard.stats.active"),
            value: stats.active_courses,
            icon: BookOpen,
            description:
                stats.active_courses === 0
                    ? t("dashboard.stats.activeEmpty")
                    : t("dashboard.stats.activeDesc"),
        },
        {
            label: t("dashboard.stats.completed"),
            value: stats.completed_courses,
            icon: CheckCircle2,
            description:
                stats.completed_courses === 0
                    ? t("dashboard.stats.completedEmpty")
                    : t("dashboard.stats.completedDesc"),
        },
        {
            label: t("dashboard.stats.time"),
            value: t("dashboard.stats.timeValue", { hours: stats.learning_hours }),
            icon: Clock3,
            description:
                stats.learning_hours === 0
                    ? t("dashboard.stats.timeEmpty")
                    : t("dashboard.stats.timeDesc"),
        },
        {
            label: t("dashboard.stats.certs"),
            value: stats.certificates,
            icon: Award,
            description:
                stats.certificates === 0
                    ? t("dashboard.stats.certsEmpty")
                    : t("dashboard.stats.certsDesc"),
        },
    ];

    return (
        <section data-testid="dashboard-stats" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {statCards.map((card) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.label}
                        className="
                            group
                            relative
                            overflow-hidden
                            rounded-2xl
                            border
                            border-[#3A3A3A]/8 dark:border-white/8
                            bg-white dark:bg-[#1b1b20]
                            p-5
                            shadow-[0_6px_25px_rgba(58,58,58,0.045)]
                            transition-all
                            duration-300
                            hover:-translate-y-0.5
                            hover:border-[#F47822]/20
                            hover:shadow-[0_12px_35px_rgba(58,58,58,0.08)]
                        "
                    >
                        {/* subtle hover glow */}
                        <div
                            className="
                                pointer-events-none
                                absolute
                                -right-10
                                -top-10
                                h-24
                                w-24
                                rounded-full
                                bg-[#F47822]/5
                                blur-2xl
                                opacity-0
                                transition-opacity
                                duration-300
                                group-hover:opacity-100
                            "
                        />

                        <div className="relative">
                            <div className="flex items-start justify-between">
                                <div
                                    className="
                                        flex
                                        h-9
                                        w-9
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-[#F47822]/10
                                        text-[#F47822]
                                        transition
                                        duration-300
                                        group-hover:bg-[#F47822]
                                        group-hover:text-white
                                    "
                                >
                                    <Icon className="h-4 w-4" />
                                </div>

                                <ArrowUpRight
                                    className="
                                        h-3.5
                                        w-3.5
                                        text-[#3A3A3A]/15 dark:text-white/15
                                        transition
                                        duration-300
                                        group-hover:text-[#F47822]/60
                                    "
                                />
                            </div>

                            <div className="mt-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
                                    {card.label}
                                </p>

                                <p className="mt-1 text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
                                    {card.value}
                                </p>

                                <p className="mt-1 text-[11px] leading-4 text-[#3A3A3A]/40 dark:text-white/40">
                                    {card.description}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Current Progress */}
            <div
                className="
                    group
                    relative
                    overflow-hidden
                    rounded-2xl
                    bg-[#3A3A3A]
                    p-5
                    text-white
                    shadow-[0_8px_30px_rgba(58,58,58,0.12)]
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:shadow-[0_14px_38px_rgba(58,58,58,0.16)]
                "
            >
                {/* Background glow */}
                <div
                    className="
                        pointer-events-none
                        absolute
                        -right-10
                        -top-10
                        h-32
                        w-32
                        rounded-full
                        bg-[#F47822]/20
                        blur-3xl
                    "
                />

                <div className="relative">
                    <div className="flex items-start justify-between">
                        <div
                            className="
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-xl
                                bg-[#F47822]
                                text-white
                                shadow-[0_6px_18px_rgba(244,120,34,0.25)]
                            "
                        >
                            <span className="text-xs font-bold">
                                %
                            </span>
                        </div>

                        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                            {t("dashboard.stats.overall")}
                        </span>
                    </div>

                    <div className="mt-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                            {t("dashboard.stats.progress")}
                        </p>

                        <div className="mt-1 flex items-end justify-between gap-3">
                            <p className="text-2xl font-bold tracking-tight">
                                {progress}%
                            </p>

                            <p className="pb-0.5 text-[10px] text-white/40">
                                {t("dashboard.header.brand")}
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                                className="
                                    h-full
                                    rounded-full
                                    bg-[#F47822]
                                    shadow-[0_0_12px_rgba(244,120,34,0.55)]
                                    transition-all
                                    duration-700
                                "
                                style={{
                                    width: `${progress}%`,
                                }}
                            />
                        </div>

                        <div className="mt-2 flex justify-between text-[9px] text-white/35">
                            <span>0%</span>
                            <span>100%</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
