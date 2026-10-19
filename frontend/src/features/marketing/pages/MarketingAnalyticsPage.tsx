import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { marketingApi, type FunnelStage, type VisitorAnalytics } from "../api/marketing.api";

type T = ReturnType<typeof useTranslation>["t"];

const RANGES = [
    { days: 1, key: "d1" },
    { days: 7, key: "d7" },
    { days: 14, key: "w2" },
    { days: 30, key: "d30" },
    { days: 90, key: "m3" },
    { days: 180, key: "m6" },
    { days: 365, key: "y1" },
] as const;

const nf = new Intl.NumberFormat("en-US");

/** Value of a funnel stage (signups, enrollments, …) for the current range. */
function stageValue(stages: FunnelStage[], key: string): number {
    return stages.find((stage) => stage.key === key)?.value ?? 0;
}

/** Headline numbers: visitors, signups and enrolments for the window. */
function StatsStrip({ data }: { data: VisitorAnalytics }) {
    const { t } = useTranslation();
    const items = [
        { label: t("marketing.analytics.stats.visitors"), value: nf.format(data.visitors) },
        { label: t("marketing.analytics.stats.signups"), value: nf.format(stageValue(data.funnel_stages, "signups")) },
        { label: t("marketing.analytics.stats.enrollments"), value: nf.format(stageValue(data.funnel_stages, "enrollments")) },
        { label: t("marketing.analytics.stats.avgTime"), value: `${data.avg_seconds_on_page}s` },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => (
                <Card key={item.label} className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40 dark:text-white/40">
                        {item.label}
                    </p>
                    <p className="mt-2 text-3xl font-black tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
                        {item.value}
                    </p>
                </Card>
            ))}
        </div>
    );
}

/** Stage keys come from the API; map them to translation keys. */
const STAGE_KEYS: Record<string, string> = {
    landing: "landing",
    company: "company",
    simulator: "simulator",
    contact: "contact",
    pricing: "pricing",
    plan_cta: "planCta",
    signups: "signups",
    enrollments: "enrollments",
};

const LANGUAGE_NAMES: Record<string, string> = {
    en: "English",
    ar: "العربية",
    fr: "Français",
    es: "Español",
    pt: "Português",
    de: "Deutsch",
    it: "Italiano",
    tr: "Türkçe",
    ru: "Русский",
    zh: "中文",
    ja: "日本語",
};

function flagOf(country: string | null): string {
    if (!country || country.length !== 2) return "\u{1F30D}";
    const base = 0x1f1e6 + (country.toUpperCase().charCodeAt(0) - 65);
    const second = 0x1f1e6 + (country.toUpperCase().charCodeAt(1) - 65);
    return String.fromCodePoint(base, second);
}

function languageName(tag: string): string {
    return LANGUAGE_NAMES[tag] ?? tag.toUpperCase();
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <section
            className={`rounded-3xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#1b1b20] sm:p-6 ${className}`}
        >
            {children}
        </section>
    );
}

function CardTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{children}</h2>
            {hint && <span className="font-mono text-[10px] text-[#3A3A3A]/40 dark:text-white/40">{hint}</span>}
        </div>
    );
}

function Bar({ label, value, max, suffix }: { label: React.ReactNode; value: number; max: number; suffix?: string }) {
    return (
        <div>
            <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-semibold text-[#3A3A3A] dark:text-[#ececef]">{label || "—"}</span>
                <span className="shrink-0 font-mono text-[#3A3A3A]/50 dark:text-white/50">
                    {value.toLocaleString()}
                    {suffix ?? ""}
                </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/8 dark:bg-white/8">
                <div
                    className="h-full rounded-full bg-[#F47822]"
                    style={{ width: `${max > 0 ? Math.round((value / max) * 100) : 0}%` }}
                />
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Conversion funnel                                                   */
/* ------------------------------------------------------------------ */

function Funnel({ stages }: { stages: FunnelStage[] }) {
    const { t } = useTranslation();
    const max = Math.max(1, ...stages.map((stage) => stage.value));
    const entry = Math.max(1, stages[0]?.value ?? 1);

    let previous: number | null = null;
    const rows = stages.map((stage) => {
        const continued = previous !== null && previous > 0 ? Math.round((stage.value / previous) * 100) : null;
        const ofEntry = Math.round((stage.value / entry) * 100);
        previous = stage.value;
        return { stage, continued, ofEntry };
    });

    if (stages.length === 0) {
        return (
            <Card>
                <CardTitle>{t("marketing.analytics.funnel.title")}</CardTitle>
                <p className="mt-3 rounded-xl bg-[#FAFAFA] px-3 py-4 text-center text-xs text-[#3A3A3A]/50 dark:bg-white/5 dark:text-white/50">
                    {t("marketing.analytics.funnel.empty")}
                </p>
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>{t("marketing.analytics.funnel.title")}</CardTitle>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.14em]">
                    <span className="flex items-center gap-1.5 text-[#3A3A3A]/45 dark:text-white/45">
                        <span className="h-2 w-2 rounded-full bg-[#3A3A3A]/40 dark:bg-white/40" /> {t("marketing.analytics.funnel.discovery")}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#F47822]">
                        <span className="h-2 w-2 rounded-full bg-[#F47822]" /> {t("marketing.analytics.funnel.conversion")}
                    </span>
                </div>
            </div>

            <ol className="mt-5">
                {rows.map(({ stage, continued, ofEntry }, index) => {
                    const previousStage = index > 0 ? rows[index - 1].stage : null;
                    const phaseBreak = previousStage !== null && previousStage.phase !== stage.phase;
                    const discovery = stage.phase === "discovery";
                    const dropped = continued === null ? null : Math.max(0, 100 - continued);

                    return (
                        <li key={stage.key}>
                            {phaseBreak && (
                                <div className="my-3 flex items-center gap-3">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                                        {t("marketing.analytics.funnel.conversion")}
                                    </span>
                                    <span className="h-px flex-1 bg-[#F47822]/25" />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <div className="flex flex-col items-center pt-0.5">
                                    <span
                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                                            discovery
                                                ? "bg-[#3A3A3A]/8 text-[#3A3A3A]/60 dark:bg-white/10 dark:text-white/60"
                                                : "bg-[#F47822] text-white shadow-[0_6px_14px_rgba(244,120,34,.35)]"
                                        }`}
                                    >
                                        {index + 1}
                                    </span>
                                    {index < rows.length - 1 && <span className="mt-1 w-px flex-1 bg-[#3A3A3A]/10 dark:bg-white/10" />}
                                </div>

                                <div className={`min-w-0 flex-1 ${index < rows.length - 1 ? "pb-5" : ""}`}>
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                        <span className="text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">{t(`marketing.analytics.funnel.stages.${STAGE_KEYS[stage.key] ?? stage.key}`)}</span>
                                        <span className="flex items-center gap-2 font-mono text-[11px]">
                                            <span className="font-bold text-[#3A3A3A] dark:text-[#ececef]">
                                                {stage.value.toLocaleString()}
                                            </span>
                                            <span className="text-[#3A3A3A]/40 dark:text-white/40">{t("marketing.analytics.funnel.ofEntry", { percent: ofEntry })}</span>
                                        </span>
                                    </div>

                                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#3A3A3A]/6 dark:bg-white/8">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                discovery ? "bg-[#3A3A3A]/45 dark:bg-white/45" : "bg-[#F47822]"
                                            }`}
                                            style={{ width: `${Math.max(3, Math.round((stage.value / max) * 100))}%` }}
                                        />
                                    </div>

                                    {continued !== null && (
                                        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px]">
                                            <span
                                                className={`rounded-full px-1.5 py-0.5 font-bold ${
                                                    continued >= 50
                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                        : continued >= 20
                                                          ? "bg-[#F47822]/10 text-[#F47822]"
                                                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                                                }`}
                                            >
                                                {t("marketing.analytics.funnel.continued", { percent: continued })}
                                            </span>
                                            <span className="text-[#3A3A3A]/40 dark:text-white/40">
                                                {t("marketing.analytics.funnel.dropped", { percent: dropped })}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </Card>
    );
}

/* ------------------------------------------------------------------ */
/* Geo & language cards                                                */
/* ------------------------------------------------------------------ */

function CountriesCard({ rows }: { rows: VisitorAnalytics["countries"] }) {
    const { t } = useTranslation();
    const total = rows.reduce((sum, row) => sum + row.visitors, 0) || 1;
    const max = Math.max(1, ...rows.map((row) => row.visitors));

    return (
        <Card>
            <CardTitle hint={t("marketing.analytics.countries.hint")}>{t("marketing.analytics.countries.title")}</CardTitle>
            {rows.length === 0 ? (
                <p className="mt-3 text-xs text-[#3A3A3A]/45 dark:text-white/45">
                    {t("marketing.analytics.countries.empty")}
                </p>
            ) : (
                <ul className="mt-4 space-y-3">
                    {rows.map((row) => (
                        <li key={row.country ?? "unknown"} className="flex items-center gap-2.5">
                            <span className="w-5 text-sm leading-none" aria-hidden>
                                {flagOf(row.country)}
                            </span>
                            <span className="w-7 shrink-0 font-mono text-[11px] font-bold text-[#3A3A3A] dark:text-[#ececef]">
                                {row.country ?? "—"}
                            </span>
                            <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#3A3A3A]/8 dark:bg-white/8">
                                <span
                                    className="block h-full rounded-full bg-[#F47822]"
                                    style={{ width: `${Math.max(6, Math.round((row.visitors / max) * 100))}%` }}
                                />
                            </span>
                            <span className="w-14 shrink-0 text-end font-mono text-[11px] text-[#3A3A3A]/55 dark:text-white/55">
                                {Math.round((row.visitors / total) * 100)}% · {row.visitors}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

function RegionsCard({ rows }: { rows: VisitorAnalytics["regions"] }) {
    const { t } = useTranslation();
    const total = rows.reduce((sum, row) => sum + row.visitors, 0) || 1;
    const max = Math.max(1, ...rows.map((row) => row.visitors));

    return (
        <Card>
            <CardTitle hint={t("marketing.analytics.regions.hint")}>{t("marketing.analytics.regions.title")}</CardTitle>
            {rows.length === 0 ? (
                <p className="mt-3 text-xs text-[#3A3A3A]/45 dark:text-white/45">{t("marketing.analytics.regions.empty")}</p>
            ) : (
                <ul className="mt-4 space-y-3">
                    {rows.map((row) => (
                        <li key={row.region}>
                            <div className="flex items-center justify-between gap-3 text-xs">
                                <span className="truncate font-semibold text-[#3A3A3A] dark:text-[#ececef]">{row.region}</span>
                                <span className="shrink-0 font-mono text-[#3A3A3A]/50 dark:text-white/50">
                                    {Math.round((row.visitors / total) * 100)}% · {row.visitors}
                                    <span className="text-[#3A3A3A]/35 dark:text-white/35"> · {t("marketing.analytics.regions.countries", { count: row.countries })}</span>
                                </span>
                            </div>
                            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#3A3A3A]/8 dark:bg-white/8">
                                <div
                                    className="h-full rounded-full bg-[#3A3A3A]/45 dark:bg-white/45"
                                    style={{ width: `${Math.max(6, Math.round((row.visitors / max) * 100))}%` }}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

function LanguagesCard({ rows }: { rows: VisitorAnalytics["languages"] }) {
    const { t } = useTranslation();
    const total = rows.reduce((sum, row) => sum + row.visitors, 0) || 1;
    const max = Math.max(1, ...rows.map((row) => row.visitors));

    return (
        <Card>
            <CardTitle hint={t("marketing.analytics.languages.hint")}>{t("marketing.analytics.languages.title")}</CardTitle>
            {rows.length === 0 ? (
                <p className="mt-3 text-xs text-[#3A3A3A]/45 dark:text-white/45">{t("marketing.analytics.languages.empty")}</p>
            ) : (
                <ul className="mt-4 space-y-3">
                    {rows.map((row) => (
                        <li key={row.language} className="flex items-center gap-2.5">
                            <span className="w-8 shrink-0 font-mono text-[11px] font-bold uppercase text-[#F47822]">
                                {row.language}
                            </span>
                            <span className="w-24 shrink-0 truncate text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                                {languageName(row.language)}
                            </span>
                            <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#3A3A3A]/8 dark:bg-white/8">
                                <span
                                    className="block h-full rounded-full bg-[#F47822]"
                                    style={{ width: `${Math.max(6, Math.round((row.visitors / max) * 100))}%` }}
                                />
                            </span>
                            <span className="w-14 shrink-0 text-end font-mono text-[11px] text-[#3A3A3A]/55 dark:text-white/55">
                                {Math.round((row.visitors / total) * 100)}% · {row.visitors}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function MarketingAnalyticsPage() {
    const { t } = useTranslation();
    const [days, setDays] = useState(7);
    const [data, setData] = useState<VisitorAnalytics | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setData(null);
        setError(null);
        void marketingApi
            .analytics(days)
            .then((analytics) => {
                if (!cancelled) setData(analytics);
            })
            .catch((cause: unknown) => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : t("marketing.analytics.error"));
            });
        return () => {
            cancelled = true;
        };
    }, [days]);

    return (
        <main className="mx-auto max-w-[1280px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">{t("marketing.shared.eyebrow")}</p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
                        {t("marketing.analytics.title")}
                    </h1>
                    <p className="mt-1 text-sm text-[#3A3A3A]/55 dark:text-white/55">
                        {data
                            ? t("marketing.analytics.summary", {
                                  visitors: data.visitors.toLocaleString(),
                                  seconds: data.avg_seconds_on_page,
                                  days: data.days,
                                  enrollments: nf.format(stageValue(data.funnel_stages, "enrollments")),
                              })
                            : t("marketing.shared.loading")}
                    </p>
                </div>
                <div className="flex gap-1.5 rounded-xl border border-[#3A3A3A]/8 bg-white p-1 shadow-sm dark:border-white/8 dark:bg-[#1b1b20]">
                    {RANGES.map((range) => (
                        <button
                            key={range.days}
                            type="button"
                            onClick={() => setDays(range.days)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                days === range.days
                                    ? "bg-[#3A3A3A] text-white dark:bg-[#F47822]"
                                    : "text-[#3A3A3A]/55 hover:text-[#3A3A3A] dark:text-white/55 dark:hover:text-white"
                            }`}
                        >
                            {t(`marketing.analytics.ranges.${range.key}`)}
                        </button>
                    ))}
                </div>
            </header>

            {error && (
                <p
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                >
                    {error}
                </p>
            )}

            {!data ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    {[0, 1].map((i) => (
                        <div key={i} className="h-72 animate-pulse rounded-3xl bg-white dark:bg-[#1b1b20]" />
                    ))}
                </div>
            ) : (
                <>
                    <StatsStrip data={data} />

                    <Funnel stages={data.funnel_stages} />

                    <div className="grid gap-5 lg:grid-cols-3">
                        <CountriesCard rows={data.countries} />
                        <RegionsCard rows={data.regions} />
                        <LanguagesCard rows={data.languages} />
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                        <Card>
                            <CardTitle hint={t("marketing.analytics.range", { count: data.days })}>{t("marketing.analytics.pages.title")}</CardTitle>
                            <div className="mt-4 space-y-3">
                                {data.top_pages.length === 0 && (
                                    <p className="text-xs text-[#3A3A3A]/45 dark:text-white/45">{t("marketing.analytics.pages.empty")}</p>
                                )}
                                {data.top_pages.map((row) => (
                                    <Bar
                                        key={row.page ?? "?"}
                                        label={row.page ?? "?"}
                                        value={row.views}
                                        max={data.top_pages[0]?.views ?? 1}
                                        suffix={` · ${row.visitors} visitors`}
                                    />
                                ))}
                            </div>
                        </Card>

                        <Card>
                            <CardTitle hint={t("marketing.analytics.clicks.hint")}>{t("marketing.analytics.clicks.title")}</CardTitle>
                            <div className="mt-4 space-y-3">
                                {data.top_clicks.length === 0 && (
                                    <p className="text-xs text-[#3A3A3A]/45 dark:text-white/45">
                                        {t("marketing.analytics.clicks.empty")}
                                    </p>
                                )}
                                {data.top_clicks.map((row, index) => (
                                    <Bar
                                        key={`${row.page}-${index}`}
                                        label={`${row.page ?? "?"} — click`}
                                        value={row.clicks}
                                        max={data.top_clicks[0]?.clicks ?? 1}
                                    />
                                ))}
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </main>
    );
}
