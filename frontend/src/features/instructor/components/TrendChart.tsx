import { useTranslation } from "react-i18next";

import type { TrendPoint } from "../types/instructor";

export type { TrendPoint };

const W = 640;
const H = 210;
const PAD = { top: 16, right: 14, bottom: 30, left: 36 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;
const BASELINE = PAD.top + INNER_H;

type SeriesKey = "enrollments" | "completions";

/**
 * A two-series trend drawn with plain SVG.
 *
 * Deliberately dependency-free: this is four polylines and three axis labels,
 * not something that justifies shipping a charting library to every student.
 */
export function TrendChart({ series }: { series: TrendPoint[] }) {
    const { t, i18n } = useTranslation();

    if (series.length === 0) return null;

    const max = Math.max(
        1,
        ...series.map((point) => Math.max(point.enrollments, point.completions)),
    );
    const step = series.length > 1 ? INNER_W / (series.length - 1) : 0;

    const coords = (index: number, value: number): [number, number] => [
        PAD.left + index * step,
        BASELINE - (value / max) * INNER_H,
    ];

    const path = (key: SeriesKey): string =>
        series
            .map((point, index) => {
                const [x, y] = coords(index, point[key]);
                return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
            })
            .join(" ");

    const area = (key: SeriesKey): string =>
        `${path(key)} L${(PAD.left + INNER_W).toFixed(2)} ${BASELINE} L${PAD.left} ${BASELINE} Z`;

    const tickIndexes = [
        0,
        Math.floor((series.length - 1) / 2),
        series.length - 1,
    ].filter((value, index, all) => all.indexOf(value) === index);

    const dateFormat = new Intl.DateTimeFormat(i18n.language, {
        month: "short",
        day: "numeric",
    });

    const totals = series.reduce(
        (sum, point) => ({
            enrollments: sum.enrollments + point.enrollments,
            completions: sum.completions + point.completions,
        }),
        { enrollments: 0, completions: 0 },
    );

    const summary = t("instructor.dashboard.momentum.summary", {
        days: series.length,
        enrollments: totals.enrollments,
        completions: totals.completions,
    });

    return (
        <div data-testid="trend-chart">
            <svg
                role="img"
                aria-label={summary}
                viewBox={`0 0 ${W} ${H}`}
                className="h-auto w-full overflow-visible"
            >
                {[0, 0.5, 1].map((ratio) => {
                    const y = BASELINE - ratio * INNER_H;
                    return (
                        <g key={ratio}>
                            <line
                                x1={PAD.left}
                                x2={PAD.left + INNER_W}
                                y1={y}
                                y2={y}
                                stroke="#3A3A3A"
                                strokeOpacity={ratio === 0 ? 0.18 : 0.08}
                                strokeWidth={1}
                            />
                            <text
                                x={PAD.left - 8}
                                y={y + 4}
                                textAnchor="end"
                                fontSize={10}
                                fill="#3A3A3A"
                                fillOpacity={0.45}
                            >
                                {Math.round(ratio * max)}
                            </text>
                        </g>
                    );
                })}

                <path d={area("enrollments")} fill="#F47822" fillOpacity={0.12} />
                <path
                    d={path("enrollments")}
                    fill="none"
                    stroke="#F47822"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d={path("completions")}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {tickIndexes.map((index) => {
                    const [x] = coords(index, 0);
                    return (
                        <text
                            key={index}
                            x={x}
                            y={H - 8}
                            textAnchor={index === 0 ? "start" : index === series.length - 1 ? "end" : "middle"}
                            fontSize={10}
                            fill="#3A3A3A"
                            fillOpacity={0.45}
                        >
                            {dateFormat.format(new Date(`${series[index].date}T00:00:00`))}
                        </text>
                    );
                })}
            </svg>

            <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] font-semibold text-[#3A3A3A]/60">
                <li className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F47822]" aria-hidden />
                    {t("instructor.dashboard.momentum.enrollments")} · {totals.enrollments}
                </li>
                <li className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded-full bg-emerald-500" aria-hidden />
                    {t("instructor.dashboard.momentum.completions")} · {totals.completions}
                </li>
            </ul>
        </div>
    );
}
