import type { ReactNode } from "react";
import {
    ArrowDownRight,
    ArrowUpRight,
    Minus,
} from "lucide-react";

import type { AnalyticsDelta } from "../../types/admin";

export interface AnalyticsKpiProps {
    metricKey: string;
    label: string;
    value: string | number;
    detail: string;
    icon: ReactNode;
    delta?: AnalyticsDelta;
    invert?: boolean;
    accent?: boolean;
}

export function AnalyticsKpi({
    metricKey,
    label,
    value,
    detail,
    icon,
    delta,
    invert = false,
    accent = false,
}: AnalyticsKpiProps) {
    const positive = (delta?.change ?? 0) > 0;
    const negative = (delta?.change ?? 0) < 0;
    const healthy = invert ? negative : positive;
    const unhealthy = invert ? positive : negative;
    const tone = healthy
        ? "text-emerald-600 dark:text-emerald-400"
        : unhealthy
          ? "text-red-600 dark:text-red-400"
          : "text-[#3A3A3A]/45 dark:text-white/45";
    const DeltaIcon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;
    const percent = Math.abs(delta?.change_percent ?? 0);

    return (
        <div
            data-testid={`analytics-kpi-${metricKey}`}
            className={`group relative overflow-hidden rounded-2xl border p-5 shadow-[0_8px_22px_rgba(58,58,58,.035)] transition-shadow duration-200 hover:shadow-[0_13px_28px_rgba(58,58,58,.08)] ${
                accent
                    ? "border-[#F47822]/20 bg-[#FFF8F4] dark:bg-[#F47822]/10"
                    : "border-[#3A3A3A]/8 bg-white dark:border-white/8 dark:bg-[#1b1b20]"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold leading-5 text-[#3A3A3A]/65 dark:text-white/65">
                        {label}
                    </p>
                    <p className="mt-1 text-[1.7rem] font-semibold leading-tight tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
                        {value}
                    </p>
                </div>
                <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                        accent
                            ? "bg-[#F47822] text-white"
                            : "bg-[#FFF1E8] text-[#F47822]"
                    }`}
                >
                    {icon}
                </span>
            </div>

            {delta ? (
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs leading-5">
                    <span className={`inline-flex items-center gap-0.5 font-bold ${tone}`}>
                        <DeltaIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {percent.toLocaleString(undefined, {
                            maximumFractionDigits: 1,
                        })}
                        %
                    </span>
                    <span className="text-[#3A3A3A]/45 dark:text-white/45">
                        {detail}
                    </span>
                </p>
            ) : (
                <p className="mt-2 text-xs leading-5 text-[#3A3A3A]/55 dark:text-white/55">
                    {detail}
                </p>
            )}

            <div
                className={`absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${
                    accent ? "bg-[#F47822]" : "bg-[#F47822]/60"
                }`}
            />
        </div>
    );
}
