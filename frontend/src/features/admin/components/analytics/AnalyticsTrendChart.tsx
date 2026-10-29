import { useTranslation } from "react-i18next";

export interface TrendSeries {
    key: string;
    label: string;
    color: string;
}

interface TrendRow {
    date: string;
    [key: string]: string | number;
}

export type { TrendRow };

export function AnalyticsTrendChart({
    data,
    series,
    locale,
    ariaLabel,
    emptyLabel,
}: {
    data: TrendRow[];
    series: TrendSeries[];
    locale: string;
    ariaLabel: string;
    emptyLabel: string;
}) {
    const { t } = useTranslation();
    const max = Math.max(
        1,
        ...data.flatMap((row) =>
            series.map((item) => Number(row[item.key]) || 0),
        ),
    );
    const firstDate = data[0]?.date ?? "";
    const lastDate = data[data.length - 1]?.date ?? "";

    const formatDate = (value: string) =>
        new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
            month: "short",
            day: "numeric",
        }).format(new Date(`${value}T12:00:00`));

    return (
        <div data-testid="analytics-trend" className="flex h-full flex-col">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {series.map((item) => (
                    <span
                        key={item.key}
                        className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#3A3A3A]/55 dark:text-white/55"
                    >
                        <span
                            aria-hidden="true"
                            className={`h-2 w-2 rounded-full ${item.color}`}
                        />
                        {item.label}
                    </span>
                ))}
            </div>

            {data.length === 0 ? (
                <div className="mt-6 grid min-h-56 flex-1 place-items-center rounded-2xl border border-dashed border-[#3A3A3A]/12 text-xs font-semibold text-[#3A3A3A]/40 dark:border-white/12 dark:text-white/40">
                    {emptyLabel}
                </div>
            ) : (
                <div className="mt-5 flex flex-1 flex-col">
                    <div
                        dir="ltr"
                        role="img"
                        aria-label={ariaLabel}
                        className="flex min-h-56 flex-1 items-end gap-[3px] border-b border-[#3A3A3A]/10 pb-2 dark:border-white/10"
                    >
                        {data.map((row) => (
                            <div
                                key={row.date}
                                className="group flex h-full min-w-0 flex-1 items-end justify-center gap-[1px]"
                            >
                                {series.map((item) => {
                                    const value = Number(row[item.key]) || 0;
                                    return (
                                        <span
                                            key={item.key}
                                            title={`${formatDate(row.date)} · ${item.label}: ${value.toLocaleString(locale === "ar" ? "ar" : "en")}`}
                                            className={`w-full max-w-3 rounded-t-[2px] ${item.color} transition-opacity ${
                                                value === 0
                                                    ? "opacity-15"
                                                    : "opacity-80 group-hover:opacity-100"
                                            }`}
                                            style={{
                                                height: `${Math.max(
                                                    value === 0 ? 1 : 4,
                                                    (value / max) * 100,
                                                )}%`,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-[#3A3A3A]/35 dark:text-white/35">
                        <span>{formatDate(firstDate)}</span>
                        <span className="hidden sm:inline">
                            {t("admin.analytics.chart.middle", {
                                count: data.length,
                            })}
                        </span>
                        <span>{formatDate(lastDate)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
