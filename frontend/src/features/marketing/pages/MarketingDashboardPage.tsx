import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertTriangle,
    ArrowRight,
    ArrowUpRight,
    CalendarClock,
    CreditCard,
    Flame,
    Inbox,
    Megaphone,
    Percent,
    RefreshCw,
    TicketCheck,
    UserPlus,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import { marketingApi, type MarketingOverview, type PerformanceOverview } from "../api/marketing.api";

type T = ReturnType<typeof useTranslation>["t"];

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

const nf = new Intl.NumberFormat("en-US");

function money(cents: number, currency: string): string {
    return `${nf.format(Math.round(cents / 100))} ${currency}`;
}

function flagOf(country: string | null): string {
    if (!country || country.length !== 2) return "\u{1F30D}";
    const base = 0x1f1e6 + (country.toUpperCase().charCodeAt(0) - 65);
    const second = 0x1f1e6 + (country.toUpperCase().charCodeAt(1) - 65);
    return String.fromCodePoint(base, second);
}

function ago(iso: string, t: T): string {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
    if (minutes < 1) return t("marketing.dashboard.ago.justNow");
    if (minutes < 60) return t("marketing.dashboard.ago.minutes", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("marketing.dashboard.ago.hours", { count: hours });
    return t("marketing.dashboard.ago.days", { count: Math.floor(hours / 24) });
}

/** English-style plural picked in JS so Arabic never falls back to a raw key. */
function plural(t: T, base: string, count: number): string {
    return t(count === 1 ? `${base}One` : `${base}Other`, { count });
}

/** Percentage change vs the previous period; null when there is no baseline. */
function deltaOf(current: number, previous: number): number | null {
    if (previous <= 0) return null;
    return Math.round(((current - previous) / previous) * 100);
}

function DeltaChip({ value }: { value: number | null }) {
    const { t } = useTranslation();
    if (value === null) {
        return (
            <span className="rounded-full bg-[#3A3A3A]/6 px-2 py-0.5 font-mono text-[10px] font-bold text-[#3A3A3A]/45 dark:bg-white/8 dark:text-white/45">
                new
            </span>
        );
    }
    const up = value >= 0;
    return (
        <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                up
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
        >
            <ArrowUpRight className={`h-3 w-3 ${up ? "" : "rotate-90"}`} />
            {Math.abs(value)}%
        </span>
    );
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <section
            className={`rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-sm dark:border-white/8 dark:bg-[#1b1b20] ${className}`}
        >
            {children}
        </section>
    );
}

function KpiCard({
    label,
    value,
    delta,
    detail,
}: {
    label: string;
    value: string;
    delta?: number | null;
    detail?: string;
}) {
    return (
        <Card className="p-5">
            <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40 dark:text-white/40">
                    {label}
                </p>
                {delta !== undefined && <DeltaChip value={delta} />}
            </div>
            <p className="mt-2 text-3xl font-black tracking-tight text-[#3A3A3A] dark:text-[#ececef]">{value}</p>
            {detail && <p className="mt-1 text-xs text-[#3A3A3A]/50 dark:text-white/50">{detail}</p>}
        </Card>
    );
}

/** Pure-SVG area sparkline: no chart library, scales to any width. */
function Sparkline({ series, currency }: { series: Array<{ date: string; value: number }>; currency: string }) {
    const { t } = useTranslation();
    const width = 640;
    const height = 140;
    const values = series.map((point) => point.value);
    const max = Math.max(...values, 1);
    const stepX = series.length > 1 ? width / (series.length - 1) : width;

    const coords = values.map((value, index) => ({
        x: index * stepX,
        y: height - (value / max) * (height - 12) - 6,
    }));

    const line = coords.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
    const area = `${line} L${width},${height} L0,${height} Z`;
    const peak = Math.max(...values);
    const peakIndex = values.indexOf(peak);
    const last = values[values.length - 1] ?? 0;

    return (
        <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40 dark:text-white/40">
                        {t("marketing.dashboard.spark.label")}
                    </p>
                    <p className="mt-1 text-2xl font-black text-[#3A3A3A] dark:text-[#ececef]">
                        {money(values.reduce((sum, value) => sum + value, 0), currency)}
                    </p>
                </div>
                <p className="font-mono text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                    {t("marketing.dashboard.spark.stats", { peak: money(peak, currency), last: money(last, currency) })}
                </p>
            </div>

            <svg
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                role="img"
                aria-label={t("marketing.dashboard.spark.aria")}
                className="mt-4 h-32 w-full"
            >
                <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F47822" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#F47822" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((ratio) => (
                    <line
                        key={ratio}
                        x1="0"
                        x2={width}
                        y1={height * ratio}
                        y2={height * ratio}
                        stroke="currentColor"
                        strokeOpacity="0.06"
                        strokeWidth="1"
                    />
                ))}
                <path d={area} fill="url(#revenueFill)" />
                <path d={line} fill="none" stroke="#F47822" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {peak > 0 && (
                    <circle cx={coords[peakIndex]?.x ?? 0} cy={coords[peakIndex]?.y ?? 0} r="3.5" fill="#F47822" />
                )}
            </svg>

            <div className="mt-1 flex justify-between font-mono text-[10px] text-[#3A3A3A]/40 dark:text-white/40">
                <span>{series[0]?.date.slice(5)}</span>
                <span>{series[series.length - 1]?.date.slice(5)}</span>
            </div>
        </div>
    );
}

function FunnelCard({ funnel }: { funnel: MarketingOverview["funnel"] }) {
    const { t } = useTranslation();
    const steps = [
        { label: t("marketing.dashboard.journey.visitors"), value: funnel.visitors },
        { label: t("marketing.dashboard.journey.courseViews"), value: funnel.course_views },
        { label: t("marketing.dashboard.journey.signups"), value: funnel.signups },
        { label: t("marketing.dashboard.journey.enrollments"), value: funnel.enrollments },
        { label: t("marketing.dashboard.journey.paidOrders"), value: funnel.paid_orders },
    ];
    const max = Math.max(...steps.map((step) => step.value), 1);

    return (
        <Card className="p-5 sm:p-6">
            <h2 className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("marketing.dashboard.journey.title")}</h2>
            <ol className="mt-4 space-y-3.5">
                {steps.map((step, index) => {
                    const previous = index > 0 ? steps[index - 1].value : null;
                    const conversion = previous && previous > 0 ? Math.round((step.value / previous) * 100) : null;
                    return (
                        <li key={step.label}>
                            <div className="flex items-center justify-between gap-3 text-xs">
                                <span className="font-semibold text-[#3A3A3A] dark:text-[#ececef]">{step.label}</span>
                                <span className="flex items-center gap-2 font-mono text-[#3A3A3A]/55 dark:text-white/55">
                                    {conversion !== null && (
                                        <span className="rounded-full bg-[#F47822]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#F47822]">
                                            {conversion}%
                                        </span>
                                    )}
                                    {nf.format(step.value)}
                                </span>
                            </div>
                            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#3A3A3A]/8 dark:bg-white/8">
                                <div
                                    className="h-full rounded-full bg-[#F47822] transition-all duration-500"
                                    style={{ width: `${Math.max(4, Math.round((step.value / max) * 100))}%` }}
                                />
                            </div>
                        </li>
                    );
                })}
            </ol>
        </Card>
    );
}

const ATTENTION_ICONS = { lead: Inbox, order: TicketCheck, campaign: Percent, broadcast: Megaphone } as const;

function AttentionRow({
    icon,
    title,
    detail,
    to,
    cta,
}: {
    icon: React.ElementType;
    title: string;
    detail: string;
    to?: string;
    cta?: string;
}) {
    const Icon = icon;
    const body = (
        <span className="flex w-full items-center gap-3 text-start">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">{title}</span>
                <span className="block truncate text-[11px] text-[#3A3A3A]/50 dark:text-white/50">{detail}</span>
            </span>
            {cta && (
                <span className="flex shrink-0 items-center gap-1 rounded-lg bg-[#F47822] px-2.5 py-1.5 text-[10px] font-bold text-white">
                    {cta}
                    <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                </span>
            )}
        </span>
    );

    if (!to) {
        return <li className="rounded-xl bg-[#FAFAFA] px-3 py-3 dark:bg-white/5">{body}</li>;
    }
    return (
        <li>
            <Link
                to={to}
                className="block rounded-xl px-3 py-3 transition hover:bg-[#FFF8F4] dark:hover:bg-[#F47822]/10"
            >
                {body}
            </Link>
        </li>
    );
}

function ActivityFeed({ activity }: { activity: MarketingOverview["activity"] }) {
    const { t } = useTranslation();
    const iconFor = { signup: UserPlus, lead: Inbox, order: CreditCard } as const;
    const accentFor = {
        signup: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        lead: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
        order: "bg-[#F47822]/10 text-[#F47822]",
    } as const;

    if (activity.length === 0) {
        return (
            <Card className="p-5 sm:p-6">
                <h2 className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("marketing.dashboard.activity.title")}</h2>
                <p className="mt-3 rounded-xl bg-[#FAFAFA] px-3 py-4 text-center text-xs text-[#3A3A3A]/50 dark:bg-white/5 dark:text-white/50">
                    {t("marketing.dashboard.activity.empty")}
                </p>
            </Card>
        );
    }

    return (
        <Card className="p-5 sm:p-6">
            <h2 className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("marketing.dashboard.activity.title")}</h2>
            <ul className="mt-3 space-y-1">
                {activity.map((row, index) => {
                    const Icon = iconFor[row.type] ?? UserPlus;
                    return (
                        <li
                            key={`${row.type}-${row.at}-${index}`}
                            className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-[#FAFAFA] dark:hover:bg-white/5"
                        >
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${accentFor[row.type] ?? accentFor.signup}`}>
                                <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">{row.title}</span>
                                <span className="block truncate text-[11px] text-[#3A3A3A]/50 dark:text-white/50">{row.subtitle}</span>
                            </span>
                            <span className="shrink-0 font-mono text-[10px] text-[#3A3A3A]/40 dark:text-white/40">{ago(row.at, t)}</span>
                        </li>
                    );
                })}
            </ul>
        </Card>
    );
}

function CountryBars({ rows }: { rows: MarketingOverview["top_countries"] }) {
    const { t } = useTranslation();
    const total = rows.reduce((sum, row) => sum + row.visitors, 0) || 1;
    const max = Math.max(...rows.map((row) => row.visitors), 1);

    return (
        <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("marketing.dashboard.countries.title")}</h2>
                <span className="font-mono text-[10px] text-[#3A3A3A]/40 dark:text-white/40">30d</span>
            </div>
            <ul className="mt-4 space-y-3">
                {rows.map((row) => (
                    <li key={row.country ?? "unknown"} className="flex items-center gap-3">
                        <span className="w-6 text-base leading-none" aria-hidden>
                            {flagOf(row.country)}
                        </span>
                        <span className="w-8 shrink-0 font-mono text-[11px] font-bold text-[#3A3A3A] dark:text-[#ececef]">
                            {row.country ?? "—"}
                        </span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#3A3A3A]/8 dark:bg-white/8">
                            <span
                                className="block h-full rounded-full bg-[#F47822] transition-all duration-500"
                                style={{ width: `${Math.max(6, Math.round((row.visitors / max) * 100))}%` }}
                            />
                        </span>
                        <span className="w-16 shrink-0 text-end font-mono text-[11px] text-[#3A3A3A]/55 dark:text-white/55">
                            {Math.round((row.visitors / total) * 100)}% · {row.visitors}
                        </span>
                    </li>
                ))}
            </ul>
        </Card>
    );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function LeaderboardCard() {
    const { t } = useTranslation();
    const [perf, setPerf] = useState<PerformanceOverview | null>(null);
    const [editFor, setEditFor] = useState<string | null>(null);
    const [quotaDraft, setQuotaDraft] = useState("");

    useEffect(() => {
        void marketingApi.performance().then(setPerf).catch(() => undefined);
    }, []);

    const saveQuota = async (userId: string) => {
        const target = Number(quotaDraft);
        if (!Number.isFinite(target) || target < 0) return;
        try {
            await marketingApi.setQuota({ user_id: userId, target });
            const fresh = await marketingApi.performance();
            setPerf(fresh);
            setEditFor(null);
        } catch {
            // Keep the editor open; the row stays editable.
        }
    };

    return (
        <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                    {t("marketing.leaderboard.title")}
                    {perf && <span className="ms-2 text-xs font-medium text-[#3A3A3A]/40 dark:text-white/40">{perf.month}</span>}
                </h2>
            </div>
            {!perf ? (
                <div className="mt-4 h-24 animate-pulse rounded-2xl bg-[#3A3A3A]/5" />
            ) : perf.reps.length === 0 ? (
                <p className="mt-4 text-xs text-[#3A3A3A]/45 dark:text-white/45">{t("marketing.leaderboard.empty")}</p>
            ) : (
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[640px] text-start text-xs">
                        <thead>
                            <tr className="border-b border-[#3A3A3A]/8 text-[10px] uppercase tracking-[0.12em] text-[#3A3A3A]/40 dark:text-white/40">
                                <th className="px-3 py-2 text-start font-bold">{t("marketing.leaderboard.columns.rep")}</th>
                                <th className="px-3 py-2 text-start font-bold">{t("marketing.leaderboard.columns.open")}</th>
                                <th className="px-3 py-2 text-start font-bold">{t("marketing.leaderboard.columns.due")}</th>
                                <th className="px-3 py-2 text-start font-bold">{t("marketing.leaderboard.columns.won")}</th>
                                <th className="px-3 py-2 text-start font-bold">{t("marketing.leaderboard.columns.quota")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {perf.reps.map((rep) => (
                                <tr key={rep.id} className="border-b border-[#3A3A3A]/5 last:border-0">
                                    <td className="px-3 py-2">
                                        <p className="font-bold text-[#3A3A3A] dark:text-[#ececef]">{rep.name}</p>
                                        <p dir="ltr" className="text-[10px] text-[#3A3A3A]/45 rtl:text-end dark:text-white/45">{rep.email}</p>
                                    </td>
                                    <td className="px-3 py-2 font-bold text-[#3A3A3A] dark:text-white/85">{rep.open}</td>
                                    <td className={`px-3 py-2 font-bold ${rep.overdue > 0 ? "text-rose-600" : "text-[#3A3A3A]/60 dark:text-white/60"}`}>{rep.due_today}</td>
                                    <td className="px-3 py-2 font-black text-emerald-600">{rep.won_month}</td>
                                    <td className="px-3 py-2">
                                        {editFor === rep.id ? (
                                            <span className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={quotaDraft}
                                                    onChange={(event) => setQuotaDraft(event.target.value)}
                                                    className="h-8 w-16 rounded-lg border border-[#F47822] px-2 text-xs outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => void saveQuota(rep.id)}
                                                    className="rounded-lg bg-[#F47822] px-2 py-1.5 text-[10px] font-bold text-white"
                                                >
                                                    {t("marketing.leaderboard.save")}
                                                </button>
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditFor(rep.id);
                                                    setQuotaDraft(String(rep.quota_target));
                                                }}
                                                className="flex items-center gap-2 text-start"
                                                title={t("marketing.leaderboard.setQuota")}
                                            >
                                                {rep.quota_target > 0 ? (
                                                    <>
                                                        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[#3A3A3A]/8 dark:bg-white/10">
                                                            <span
                                                                className="block h-full rounded-full bg-[#F47822]"
                                                                style={{ width: `${rep.quota_progress ?? 0}%` }}
                                                            />
                                                        </span>
                                                        <span className="text-[10px] font-bold text-[#3A3A3A]/60 dark:text-white/60">
                                                            {rep.won_month}/{rep.quota_target}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-[#F47822]/70">{t("marketing.leaderboard.setQuota")}</span>
                                                )}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}

export function MarketingDashboardPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<MarketingOverview | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(() => {
        setError(null);
        setData(null);
        void marketingApi
            .overview()
            .then((overview) => setData(overview))
            .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : t("marketing.dashboard.error")));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (error) {
        return (
            <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
                <p
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                >
                    {error}
                </p>
                <button
                    type="button"
                    onClick={load}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#E96D18]"
                >
                    <RefreshCw className="h-4 w-4" />
                    {t("marketing.shared.retry")}
                </button>
            </main>
        );
    }

    if (!data) {
        return (
            <main className="mx-auto max-w-[1280px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
                <div className="h-32 animate-pulse rounded-3xl bg-white dark:bg-[#1b1b20]" />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-28 animate-pulse rounded-2xl bg-white dark:bg-[#1b1b20]" />
                    ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="h-64 animate-pulse rounded-2xl bg-white dark:bg-[#1b1b20] lg:col-span-2" />
                    <div className="h-64 animate-pulse rounded-2xl bg-white dark:bg-[#1b1b20]" />
                </div>
            </main>
        );
    }

    const currency = data.currency;
    const revenueDelta = deltaOf(data.revenue_7d, data.revenue_prev_7d);
    const signupsDelta = deltaOf(data.signups_7d, data.signups_prev_7d);
    const visitorsDelta = deltaOf(data.visitors_7d, data.visitors_prev_7d);

    const attention = [
        data.unread_leads > 0 && {
            key: "leads",
            icon: ATTENTION_ICONS.lead,
            title: plural(t, "marketing.dashboard.attention.leads", data.unread_leads),
            detail: t("marketing.dashboard.attention.leadsDetail", { total: data.leads }),
            to: "/marketing/leads",
            cta: t("marketing.dashboard.attention.leadsCta"),
        },
        data.pending_orders > 0 && {
            key: "orders",
            icon: ATTENTION_ICONS.order,
            title: plural(t, "marketing.dashboard.attention.orders", data.pending_orders),
            detail: t("marketing.dashboard.attention.ordersDetail"),
        },
        {
            key: "campaigns",
            icon: ATTENTION_ICONS.campaign,
            title: data.live_campaigns > 0 ? plural(t, "marketing.dashboard.attention.live", data.live_campaigns) : t("marketing.dashboard.attention.noLive"),
            detail: t("marketing.dashboard.attention.campaignsDetail", { count: data.active_campaigns }),
            to: "/marketing/campaigns",
            cta: data.live_campaigns > 0 ? t("marketing.dashboard.attention.manage") : t("marketing.dashboard.attention.create"),
        },
        {
            key: "broadcast",
            icon: ATTENTION_ICONS.broadcast,
            title: t("marketing.dashboard.attention.broadcastTitle"),
            detail: t("marketing.dashboard.attention.broadcastDetail"),
            to: "/marketing/broadcasts",
            cta: t("marketing.dashboard.attention.compose"),
        },
    ].filter(Boolean) as Array<{
        key: string;
        icon: React.ElementType;
        title: string;
        detail: string;
        to?: string;
        cta?: string;
    }>;

    return (
        <main className="mx-auto max-w-[1280px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            {/* Hero ------------------------------------------------ */}
            <header className="overflow-hidden rounded-3xl bg-[#3A3A3A] px-6 py-7 text-white shadow-[0_18px_50px_rgba(58,58,58,0.18)] sm:px-8 dark:bg-[#17171b]">
                <div className="flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">{t("marketing.shared.eyebrow")}</p>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{t("marketing.dashboard.title")}</h1>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                            {t("marketing.dashboard.hero.summary", {
                                revenue: money(data.revenue_7d, currency),
                                visitors: nf.format(data.visitors_7d),
                                leads: plural(t, "marketing.dashboard.hero.leads", data.unread_leads),
                            })}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            to="/marketing/campaigns"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#E96D18]"
                        >
                            {t("marketing.dashboard.hero.newCampaign")}
                        </Link>
                        <Link
                            to="/marketing/broadcasts"
                            className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"
                        >
                            {t("marketing.dashboard.hero.broadcast")}
                        </Link>
                        <Link
                            to="/marketing/leads"
                            className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"
                        >
                            {t("marketing.dashboard.hero.leadsCta", { count: data.unread_leads })}
                        </Link>
                    </div>
                </div>
            </header>

            {/* KPI row --------------------------------------------- */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label={t("marketing.dashboard.kpi.revenue")}
                    value={money(data.revenue_7d, currency)}
                    delta={revenueDelta}
                    detail={t("marketing.dashboard.kpi.revenueDetail", { value: money(data.revenue_today, currency) })}
                />
                <KpiCard
                    label={t("marketing.dashboard.kpi.signups")}
                    value={nf.format(data.signups_7d)}
                    delta={signupsDelta}
                    detail={t("marketing.dashboard.kpi.signupsDetail", { count: nf.format(data.enrollments_7d) })}
                />
                <KpiCard
                    label={t("marketing.dashboard.kpi.visitors")}
                    value={nf.format(data.visitors_7d)}
                    delta={visitorsDelta}
                    detail={t("marketing.dashboard.kpi.visitorsDetail")}
                />
                <KpiCard
                    label={t("marketing.dashboard.kpi.unreadLeads")}
                    value={nf.format(data.unread_leads)}
                    detail={t("marketing.dashboard.kpi.unreadLeadsDetail", { total: nf.format(data.leads), referrals: nf.format(data.referral_signups) })}
                />
            </div>

            {/* Pipeline strip ------------------------------------- */}
            <Card className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("marketing.dashboard.pipeline.title")}</h2>
                    <Link to="/marketing/leads" className="text-xs font-bold text-[#F47822] hover:underline">
                        {t("marketing.dashboard.pipeline.open")}
                    </Link>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {(Object.keys(data.pipeline.by_stage) as Array<keyof typeof data.pipeline.by_stage>).map((stage) => (
                        <div key={stage} className="rounded-2xl border border-[#3A3A3A]/8 bg-[#FAFAFA] p-3 text-center dark:border-white/8 dark:bg-[#1b1b20]">
                            <p className="text-2xl font-black tracking-tight text-[#3A3A3A] dark:text-[#ececef]">{data.pipeline.by_stage[stage]}</p>
                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/45 dark:text-white/45">
                                {t(`marketing.leads.filters.${stage}`)}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#3A3A3A]/60 dark:text-white/60">
                    <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5 text-[#F47822]" />
                        {plural(t, "marketing.dashboard.pipeline.due", data.pipeline.due_today)}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 ${data.pipeline.overdue > 0 ? "font-bold text-rose-600" : ""}`}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {plural(t, "marketing.dashboard.pipeline.overdue", data.pipeline.overdue)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5 text-emerald-500" />
                        {plural(t, "marketing.dashboard.pipeline.hot", data.pipeline.hot)}
                    </span>
                    <span>
                        {plural(t, "marketing.dashboard.pipeline.won", data.pipeline.won_30d)}
                    </span>
                    <span>
                        {data.pipeline.win_rate !== null
                            ? t("marketing.dashboard.pipeline.winRate", { rate: data.pipeline.win_rate })
                            : t("marketing.dashboard.pipeline.winRateNA")}
                    </span>
                </div>
            </Card>

            {/* Team leaderboard ----------------------------------- */}
            <LeaderboardCard />

            {/* Chart + funnel -------------------------------------- */}
            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="p-5 sm:p-6 lg:col-span-2">
                    <Sparkline series={data.revenue_series} currency={currency} />
                </Card>
                <FunnelCard funnel={data.funnel} />
            </div>

            {/* Attention + activity -------------------------------- */}
            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="p-5 sm:p-6">
                    <h2 className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("marketing.dashboard.attention.title")}</h2>
                    <ul className="mt-3 space-y-1">
                        {attention.map((item) => (
                            <AttentionRow key={item.key} icon={item.icon} title={item.title} detail={item.detail} to={item.to} cta={item.cta} />
                        ))}
                    </ul>
                </Card>

                <div className="lg:col-span-2">
                    <ActivityFeed activity={data.activity} />
                </div>
            </div>

            {/* Geography ------------------------------------------- */}
            {data.top_countries.length > 0 && <CountryBars rows={data.top_countries} />}

            {/* Secondary stats ------------------------------------- */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard label={t("marketing.dashboard.kpi.pendingOrders")} value={nf.format(data.pending_orders)} detail={t("marketing.dashboard.kpi.pendingOrdersDetail")} />
                <KpiCard
                    label={t("marketing.dashboard.kpi.liveCampaigns")}
                    value={nf.format(data.live_campaigns)}
                    detail={t("marketing.dashboard.kpi.liveCampaignsDetail", { count: data.active_campaigns })}
                />
                <KpiCard label={t("marketing.dashboard.kpi.referralSignups")} value={nf.format(data.referral_signups)} detail={t("marketing.dashboard.kpi.referralSignupsDetail")} />
                <KpiCard label={t("marketing.dashboard.kpi.publishedCourses")} value={nf.format(data.published_courses)} detail={t("marketing.dashboard.kpi.publishedCoursesDetail")} />
            </div>
        </main>
    );
}
