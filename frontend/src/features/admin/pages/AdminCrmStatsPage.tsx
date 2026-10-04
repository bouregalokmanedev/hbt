import { useState, type ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, MessageSquare, ShoppingCart, TrendingUp, UserPlus, Wallet } from "lucide-react";

import { useTranslation } from "react-i18next";

import { adminApi } from "../api/adminApi";
import type { CrmMetricKey, CrmRange } from "../types/admin";
import { AdminHeading, AdminPanel, ErrorAdminPage, LoadingAdminPage, Metric } from "../components/AdminUi";

const RANGES: CrmRange[] = ["week", "month", "6months", "year", "2years"];
const METRICS: CrmMetricKey[] = ["signups", "enrollments", "orders", "revenue", "messages"];

const METRIC_ICONS: Record<CrmMetricKey, ElementType> = {
    signups: UserPlus,
    enrollments: GraduationCap,
    orders: ShoppingCart,
    revenue: Wallet,
    messages: MessageSquare,
};

export function AdminCrmStatsPage() {
    const { t, i18n } = useTranslation();
    const [range, setRange] = useState<CrmRange>("month");
    const [metric, setMetric] = useState<CrmMetricKey>("signups");

    const stats = useQuery({
        queryKey: ["admin", "crm-stats", range],
        queryFn: () => adminApi.crmStats(range),
    });

    if (stats.isLoading) return <LoadingAdminPage />;
    if (stats.isError || !stats.data) return <ErrorAdminPage onRetry={() => void stats.refetch()} />;

    const data = stats.data;
    const values = data.series[metric] ?? [];
    const max = Math.max(...values, 1);
    const numberFormat = new Intl.NumberFormat(i18n.language);

    const formatValue = (key: CrmMetricKey, value: number) =>
        key === "revenue"
            ? `${numberFormat.format(value)} ${t("admin.crm.currency")}`
            : numberFormat.format(value);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <AdminHeading
                eyebrow={t("admin.crm.eyebrow")}
                title={t("admin.crm.title")}
                description={t("admin.crm.description")}
                action={
                    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#3A3A3A]/10 bg-white p-1.5">
                        {RANGES.map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setRange(item)}
                                aria-pressed={range === item}
                                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                                    range === item
                                        ? "bg-[#3A3A3A] text-white shadow"
                                        : "text-[#3A3A3A]/55 hover:text-[#F47822]"
                                }`}
                            >
                                {t(`admin.crm.range.${item}`)}
                            </button>
                        ))}
                    </div>
                }
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {METRICS.map((key, index) => {
                    const Icon = METRIC_ICONS[key];
                    return (
                        <Metric
                            key={key}
                            label={t(`admin.crm.metrics.${key}`)}
                            value={formatValue(key, data.totals[key] ?? 0)}
                            detail={t("admin.crm.totalDetail", { range: t(`admin.crm.range.${range}`) })}
                            accent={index === 0}
                            icon={<Icon className="h-5 w-5" />}
                        />
                    );
                })}
            </div>

            <div className="flex flex-wrap gap-2">
                {METRICS.map((key) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setMetric(key)}
                        aria-pressed={metric === key}
                        className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                            metric === key
                                ? "bg-[#F47822] text-white shadow-[0_8px_18px_rgba(244,120,34,0.2)]"
                                : "border border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/60 hover:border-[#F47822]/40 hover:text-[#F47822]"
                        }`}
                    >
                        {t(`admin.crm.metrics.${key}`)}
                    </button>
                ))}
            </div>

            <AdminPanel>
                <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                        <TrendingUp className="h-5 w-5" />
                    </span>
                    <div>
                        <h2 className="font-semibold">
                            {t("admin.crm.chartTitle", { metric: t(`admin.crm.metrics.${metric}`) })}
                        </h2>
                        <p className="mt-1 text-xs text-[#3A3A3A]/45">
                            {t(data.bucket === "day" ? "admin.crm.perDay" : "admin.crm.perMonth")}
                            {" · "}
                            {data.period.from} → {data.period.to}
                        </p>
                    </div>
                </div>
                <div className="mt-8 flex h-60 items-end gap-1.5">
                    {values.length ? (
                        values.map((value, index) => {
                            const label = data.labels[index] ?? String(index);
                            return (
                                <div key={label} className="group flex h-full flex-1 items-end">
                                    <div
                                        title={`${label}: ${formatValue(metric, value)}`}
                                        className={`w-full rounded-t-md transition ${
                                            value === 0
                                                ? "bg-[#F47822]/25"
                                                : "bg-[#F47822]/75 group-hover:bg-[#F47822]"
                                        }`}
                                        style={{ height: `${Math.max((value / max) * 100, 3)}%` }}
                                    />
                                </div>
                            );
                        })
                    ) : (
                        <p className="m-auto text-sm text-[#3A3A3A]/45">{t("admin.crm.empty")}</p>
                    )}
                </div>
                <div className="mt-3 flex justify-between text-[10px] text-[#3A3A3A]/38">
                    <span>{data.labels[0]}</span>
                    <span>{data.labels[data.labels.length - 1]}</span>
                </div>
            </AdminPanel>
        </div>
    );
}
