import {
    CheckCircle2,
    Clock3,
    GraduationCap,
    TrendingUp,
    Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
    InstructorDashboard,
} from "../types/instructor";

interface InstructorStatsProps {
    data: InstructorDashboard;
}

export function InstructorStats({ data }: InstructorStatsProps) {
    const { t } = useTranslation();
    const stats = [
        { label: t("instructor.dashboard.stats.active"), value: data.students.active, detail: t("instructor.dashboard.stats.joined", { count: data.students.new_this_month }), icon: Users, tone: "orange" },
        { label: t("instructor.dashboard.stats.completion"), value: `${data.overview.completion_rate}%`, detail: t("instructor.dashboard.stats.journeys", { count: data.progress.completed }), icon: GraduationCap, tone: "dark" },
        { label: t("instructor.dashboard.stats.avgProgress"), value: `${data.progress.average_percentage}%`, detail: t("instructor.dashboard.stats.inProgress", { count: data.progress.in_progress }), icon: TrendingUp, tone: "orange" },
        { label: t("instructor.dashboard.stats.time"), value: `${data.learning.total_time_hours}h`, detail: t("instructor.dashboard.stats.quizScore", { count: data.learning.average_quiz_score }), icon: Clock3, tone: "dark" },
    ] as const;

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                const isOrange = stat.tone === "orange";

                return (
                    <article key={stat.label} className="group rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_10px_30px_rgba(58,58,58,.045)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(58,58,58,.09)]">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-[#3A3A3A]/48">{stat.label}</p>
                                <p className="mt-2 text-3xl font-semibold tracking-tight text-[#3A3A3A]">{stat.value}</p>
                            </div>
                            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isOrange ? "bg-[#F47822]/10 text-[#F47822]" : "bg-[#3A3A3A] text-white"}`}>
                                <Icon className="h-4.5 w-4.5" />
                            </span>
                        </div>
                        <p className="mt-4 border-t border-[#3A3A3A]/7 pt-3 text-[11px] leading-4 text-[#3A3A3A]/45">{stat.detail}</p>
                    </article>
                );
            })}
        </div>
    );
}
