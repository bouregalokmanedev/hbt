import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import {
    Activity,
    AlertTriangle,
    Award,
    BarChart3,
    BookOpen,
    CalendarRange,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    Download,
    GraduationCap,
    LayoutDashboard,
    LifeBuoy,
    ListChecks,
    RefreshCw,
    ServerCog,
    ShieldCheck,
    TrendingUp,
    UserPlus,
    Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { adminApi } from "../api/adminApi";
import {
    AdminButton,
    AdminHeading,
    AdminPanel,
    AdminSelect,
    ErrorAdminPage,
    LoadingAdminPage,
    SectionLink,
    Status,
} from "../components/AdminUi";
import { AnalyticsKpi } from "../components/analytics/AnalyticsKpi";
import { AnalyticsTrendChart } from "../components/analytics/AnalyticsTrendChart";
import type { TrendRow, TrendSeries } from "../components/analytics/AnalyticsTrendChart";
import type {
    AnalyticsDelta,
    AnalyticsResponse,
    AssignmentAnalyticsRow,
    CourseAnalyticsRow,
} from "../types/admin";

const TABS = [
    "overview",
    "users",
    "courses",
    "enrollments",
    "learning",
    "assignments",
] as const;

type Tab = (typeof TABS)[number];
type Preset = "7" | "30" | "90" | "custom";
type MetricKind = "count" | "percent" | "duration";

const TAB_ICONS: Record<Tab, typeof LayoutDashboard> = {
    overview: LayoutDashboard,
    users: Users,
    courses: BookOpen,
    enrollments: UserPlus,
    learning: GraduationCap,
    assignments: ClipboardCheck,
};

function isoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function dateForPreset(days: number): { from: string; to: string } {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (days - 1));

    return { from: isoDate(from), to: isoDate(to) };
}

function mergeSeries(
    left: TrendRow[] | undefined,
    right: TrendRow[] | undefined,
): TrendRow[] {
    const rows = new Map<string, TrendRow>();

    for (const row of [...(left ?? []), ...(right ?? [])]) {
        rows.set(row.date, {
            ...(rows.get(row.date) ?? { date: row.date }),
            ...row,
        });
    }

    return [...rows.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function buildChart(
    tab: Tab,
    data: AnalyticsResponse,
    t: TFunction,
): { rows: TrendRow[]; series: TrendSeries[] } {
    switch (tab) {
        case "overview":
            return {
                rows: data.growth_series ?? [],
                series: [
                    {
                        key: "new_users",
                        label: t("admin.analytics.chartLabels.newUsers"),
                        color: "bg-[#F47822]",
                    },
                    {
                        key: "new_enrollments",
                        label: t("admin.analytics.chartLabels.newEnrollments"),
                        color: "bg-[#3A3A3A] dark:bg-white/70",
                    },
                    {
                        key: "completions",
                        label: t("admin.analytics.chartLabels.completions"),
                        color: "bg-emerald-500",
                    },
                ],
            };

        case "users":
            return {
                rows: (data.series ?? []) as TrendRow[],
                series: [
                    {
                        key: "new_users",
                        label: t("admin.analytics.chartLabels.newUsers"),
                        color: "bg-[#F47822]",
                    },
                ],
            };

        case "courses":
            return {
                rows: mergeSeries(
                    (data.created_series ?? []).map((row) => ({
                        date: String(row.date),
                        created: Number(row.courses) || 0,
                    })),
                    (data.published_series ?? []).map((row) => ({
                        date: String(row.date),
                        published: Number(row.courses) || 0,
                    })),
                ),
                series: [
                    {
                        key: "created",
                        label: t("admin.analytics.chartLabels.created"),
                        color: "bg-[#3A3A3A] dark:bg-white/70",
                    },
                    {
                        key: "published",
                        label: t("admin.analytics.chartLabels.published"),
                        color: "bg-[#F47822]",
                    },
                ],
            };

        case "enrollments":
            return {
                rows: mergeSeries(
                    (data.enrollment_series ?? []).map((row) => ({
                        date: String(row.date),
                        enrollments: Number(row.enrollments) || 0,
                    })),
                    (data.completion_series ?? []).map((row) => ({
                        date: String(row.date),
                        completions: Number(row.completions) || 0,
                    })),
                ),
                series: [
                    {
                        key: "enrollments",
                        label: t("admin.analytics.chartLabels.enrollments"),
                        color: "bg-[#F47822]",
                    },
                    {
                        key: "completions",
                        label: t("admin.analytics.chartLabels.completions"),
                        color: "bg-emerald-500",
                    },
                ],
            };

        case "learning":
            return {
                rows: (data.engagement_series ?? []) as TrendRow[],
                series: [
                    {
                        key: "active_learners",
                        label: t("admin.analytics.chartLabels.activeLearners"),
                        color: "bg-[#F47822]",
                    },
                ],
            };

        case "assignments":
            return {
                rows: mergeSeries(
                    (data.submission_series ?? []).map((row) => ({
                        date: String(row.date),
                        submissions: Number(row.submissions) || 0,
                    })),
                    (data.grading_series ?? []).map((row) => ({
                        date: String(row.date),
                        graded: Number(row.graded) || 0,
                    })),
                ),
                series: [
                    {
                        key: "submissions",
                        label: t("admin.analytics.chartLabels.submissions"),
                        color: "bg-[#F47822]",
                    },
                    {
                        key: "graded",
                        label: t("admin.analytics.chartLabels.graded"),
                        color: "bg-emerald-500",
                    },
                ],
            };
    }
}

function formatDuration(
    seconds: number,
    t: TFunction,
    locale: string,
): string {
    const format = (value: number) =>
        value.toLocaleString(locale === "ar" ? "ar" : "en", {
            maximumFractionDigits: 0,
        });

    if (seconds >= 3600) {
        return t("admin.analytics.duration.hoursMinutes", {
            hours: format(Math.floor(seconds / 3600)),
            minutes: format(Math.round((seconds % 3600) / 60)),
        });
    }

    if (seconds >= 60) {
        return t("admin.analytics.duration.minutes", {
            value: format(Math.floor(seconds / 60)),
        });
    }

    return t("admin.analytics.duration.seconds", {
        value: format(seconds),
    });
}

function formatMetric(
    value: number,
    kind: MetricKind,
    t: TFunction,
    locale: string,
): string {
    if (kind === "percent") {
        return `${value.toLocaleString(locale === "ar" ? "ar" : "en")}%`;
    }

    if (kind === "duration") {
        return formatDuration(value, t, locale);
    }

    return value.toLocaleString(locale === "ar" ? "ar" : "en");
}

function csvCell(value: string | number | null | undefined): string {
    const text = `${value ?? ""}`;
    if (/[",\n]/.test(text)) {
        return `"${text.replaceAll('"', '""')}"`;
    }

    return text;
}

function buildCsv(
    tab: Tab,
    data: AnalyticsResponse,
    t: TFunction,
): string {
    const rows: Array<Array<string | number | null | undefined>> = [
        [t("admin.analytics.title"), t(`admin.analytics.tabs.${tab}`)],
        [
            t("admin.analytics.export.period"),
            `${data.period?.from ?? ""} – ${data.period?.to ?? ""}`,
        ],
        [],
        [t("admin.analytics.export.metric"), t("admin.analytics.export.value")],
    ];

    for (const [key, value] of Object.entries(data.summary ?? {})) {
        rows.push([
            t(`admin.analytics.metrics.${key}`, { defaultValue: key }),
            value,
        ]);
    }

    const courses =
        tab === "assignments" ? data.assignment_by_course : data.by_course;

    if (tab === "overview") {
        rows.push([]);
        rows.push([
            t("admin.analytics.table.course"),
            t("admin.analytics.table.learners"),
            t("admin.analytics.table.avgProgress"),
            t("admin.analytics.table.completions"),
            t("admin.analytics.table.completionRate"),
        ]);
        for (const course of data.top_courses ?? []) {
            rows.push([
                course.course_title,
                course.learners_count,
                `${course.average_progress}%`,
                course.completions_count,
                `${course.completion_rate}%`,
            ]);
        }
    } else if (tab === "assignments") {
        rows.push([]);
        rows.push([
            t("admin.analytics.table.course"),
            t("admin.analytics.table.assignments"),
            t("admin.analytics.table.published"),
            t("admin.analytics.table.submissions"),
            t("admin.analytics.table.pending"),
            t("admin.analytics.table.graded"),
            t("admin.analytics.table.overdue"),
            t("admin.analytics.table.avgGrade"),
        ]);
        for (const course of (courses ?? []) as AssignmentAnalyticsRow[]) {
            rows.push([
                course.course_title,
                course.assignments_count,
                course.published_count,
                course.submissions_count,
                course.pending_grading,
                course.graded_count,
                course.overdue_count,
                `${course.average_grade}%`,
            ]);
        }
    } else if (courses) {
        rows.push([]);
        rows.push([
            t("admin.analytics.table.course"),
            t("admin.analytics.table.learners"),
            t("admin.analytics.table.avgProgress"),
            t("admin.analytics.table.completions"),
            t("admin.analytics.table.completionRate"),
        ]);
        for (const course of courses as CourseAnalyticsRow[]) {
            rows.push([
                course.course_title,
                course.learners_count,
                `${course.average_progress}%`,
                course.completions_count,
                `${course.completion_rate}%`,
            ]);
        }
    }

    return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

/* ------------------------------------------------------------------ */
/* KPI strip                                                          */
/* ------------------------------------------------------------------ */

function AnalyticsMetrics({
    tab,
    data,
}: {
    tab: Tab;
    data: AnalyticsResponse;
}) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language;
    const summary = data.summary ?? {};
    const comparison = data.comparison ?? {};

    const item = (
        metricKey: string,
        value: number,
        icon: React.ReactNode,
        options: {
            kind?: MetricKind;
            scope?: "allTime" | "period";
            delta?: AnalyticsDelta;
            invert?: boolean;
            accent?: boolean;
        } = {},
    ) => ({
        metricKey,
        label: t(`admin.analytics.metrics.${metricKey}`),
        value: formatMetric(value, options.kind ?? "count", t, locale),
        detail: options.delta
            ? t("admin.analytics.comparison.vsPrevious")
            : t(
                  `admin.analytics.details.${options.scope ?? "allTime"}`,
              ),
        icon,
        delta: options.delta,
        invert: options.invert,
        accent: options.accent,
    });

    let items: ReturnType<typeof item>[];

    if (tab === "overview") {
        items = [
            item("new_users", comparison.new_users?.current ?? 0, <Users className="h-4 w-4" />, {
                scope: "period",
                delta: comparison.new_users,
                accent: true,
            }),
            item(
                "new_enrollments",
                comparison.new_enrollments?.current ?? 0,
                <UserPlus className="h-4 w-4" />,
                { scope: "period", delta: comparison.new_enrollments },
            ),
            item(
                "completions_in_period",
                comparison.completions_in_period?.current ?? 0,
                <Award className="h-4 w-4" />,
                { scope: "period", delta: comparison.completions_in_period },
            ),
            item(
                "submissions_in_period",
                comparison.submissions_in_period?.current ?? 0,
                <ClipboardCheck className="h-4 w-4" />,
                { scope: "period", delta: comparison.submissions_in_period },
            ),
        ];
    } else if (tab === "users") {
        items = [
            item("total", summary.total ?? 0, <Users className="h-4 w-4" />, { accent: true }),
            item("students", summary.students ?? 0, <GraduationCap className="h-4 w-4" />),
            item("instructors", summary.instructors ?? 0, <BookOpen className="h-4 w-4" />),
            item("new_in_period", summary.new_in_period ?? 0, <UserPlus className="h-4 w-4" />, {
                scope: "period",
                delta: comparison.new_in_period,
            }),
        ];
    } else if (tab === "courses") {
        items = [
            item("published", summary.published ?? 0, <CheckCircle2 className="h-4 w-4" />, {
                accent: true,
            }),
            item("review", summary.review ?? 0, <ListChecks className="h-4 w-4" />),
            item("draft", summary.draft ?? 0, <BookOpen className="h-4 w-4" />),
            item(
                "published_in_period",
                summary.published_in_period ?? 0,
                <TrendingUp className="h-4 w-4" />,
                { scope: "period", delta: comparison.published_in_period },
            ),
        ];
    } else if (tab === "enrollments") {
        items = [
            item("total", summary.total ?? 0, <UserPlus className="h-4 w-4" />, { accent: true }),
            item("activeEnrollments", summary.active ?? 0, <Activity className="h-4 w-4" />),
            item("completed", summary.completed ?? 0, <Award className="h-4 w-4" />),
            item("completion_rate", summary.completion_rate ?? 0, <TrendingUp className="h-4 w-4" />, {
                kind: "percent",
            }),
            item("new_in_period", summary.new_in_period ?? 0, <CalendarRange className="h-4 w-4" />, {
                scope: "period",
                delta: comparison.new_in_period,
            }),
            item(
                "completed_in_period",
                summary.completed_in_period ?? 0,
                <CheckCircle2 className="h-4 w-4" />,
                { scope: "period", delta: comparison.completed_in_period },
            ),
        ];
    } else if (tab === "learning") {
        items = [
            item("average_progress", summary.average_progress ?? 0, <BarChart3 className="h-4 w-4" />, {
                kind: "percent",
                accent: true,
            }),
            item("completion_rate", summary.completion_rate ?? 0, <CheckCircle2 className="h-4 w-4" />, {
                kind: "percent",
            }),
            item(
                "active_learners",
                summary.active_learners ?? 0,
                <GraduationCap className="h-4 w-4" />,
                {
                    scope: "period",
                    delta: comparison.active_learners,
                },
            ),
            item("time_spent_seconds", summary.time_spent_seconds ?? 0, <Clock3 className="h-4 w-4" />, {
                kind: "duration",
            }),
        ];
    } else {
        items = [
            item("published", summary.published ?? 0, <ClipboardCheck className="h-4 w-4" />, {
                accent: true,
            }),
            item("submissions", summary.submissions ?? 0, <ListChecks className="h-4 w-4" />),
            item("pending_grading", summary.pending_grading ?? 0, <Clock3 className="h-4 w-4" />, {
                invert: true,
            }),
            item("average_grade", summary.average_grade ?? 0, <Award className="h-4 w-4" />, {
                kind: "percent",
            }),
            item("overdue", summary.overdue ?? 0, <AlertTriangle className="h-4 w-4" />, {
                invert: true,
            }),
            item("graded", summary.graded ?? 0, <CheckCircle2 className="h-4 w-4" />),
        ];
    }

    return (
        <div
            className={`grid grid-cols-2 gap-4 ${
                items.length === 6 ? "xl:grid-cols-3" : "xl:grid-cols-4"
            }`}
        >
            {items.map((entry) => (
                <AnalyticsKpi key={entry.metricKey} {...entry} />
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Side panels                                                        */
/* ------------------------------------------------------------------ */

type BreakdownRow = {
    key: string;
    label: string;
    value: string;
    percent?: number;
    tone?: string;
};

function BreakdownList({
    title,
    description,
    rows,
    testId,
}: {
    title: string;
    description: string;
    rows: BreakdownRow[];
    testId?: string;
}) {
    return (
        <AdminPanel data-testid={testId}>
            <h2 className="text-sm font-bold text-foreground">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {description}
            </p>
            <div className="mt-5 space-y-4">
                {rows.map((row) => (
                    <div key={row.key}>
                        <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-semibold text-foreground/70">
                                {row.label}
                            </span>
                            <strong className="shrink-0 text-foreground">
                                {row.value}
                            </strong>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/7 dark:bg-white/8">
                            {row.percent !== undefined && (
                                <div
                                    className={`h-full rounded-full ${
                                        row.tone ?? "bg-[#F47822]"
                                    }`}
                                    style={{
                                        width: `${Math.min(100, Math.max(0, row.percent))}%`,
                                    }}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </AdminPanel>
    );
}

function OperationsPanel({
    data,
    health,
    healthLoading,
}: {
    data: AnalyticsResponse;
    health?: { status: string } | null;
    healthLoading: boolean;
}) {
    const { t } = useTranslation();
    const operations = data.operations ?? {};

    const rows = [
        {
            key: "assignments_pending_grading",
            value: operations.assignments_pending_grading ?? 0,
            icon: ClipboardCheck,
            to: undefined,
            tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
        },
        {
            key: "assignments_overdue",
            value: operations.assignments_overdue ?? 0,
            icon: AlertTriangle,
            to: undefined,
            tone: "text-red-600 bg-red-50 dark:bg-red-500/10",
        },
        {
            key: "courses_in_review",
            value: operations.courses_in_review ?? 0,
            icon: ListChecks,
            to: "/admin/courses",
            tone: "text-sky-600 bg-sky-50 dark:bg-sky-500/10",
        },
        {
            key: "simulator_sessions_active",
            value: operations.simulator_sessions_active ?? 0,
            icon: Activity,
            to: "/admin/simulator",
            tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
        },
    ];

    return (
        <AdminPanel data-testid="analytics-operations">
            <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                    <ListChecks className="h-4 w-4" />
                </span>
                <div>
                    <h2 className="text-sm font-bold text-foreground">
                        {t("admin.analytics.operations.title")}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t("admin.analytics.operations.desc")}
                    </p>
                </div>
            </div>

            <div className="mt-5 space-y-2">
                {rows.map((row) => {
                    const Icon = row.icon;
                    const content = (
                        <>
                            <span
                                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${row.tone}`}
                            >
                                <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-xs font-semibold text-foreground">
                                    {t(
                                        `admin.analytics.operations.${row.key}`,
                                    )}
                                </span>
                                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                                    {t(
                                        `admin.analytics.operations.${row.key}Hint`,
                                    )}
                                </span>
                            </span>
                            <span className="text-lg font-semibold tabular-nums text-foreground">
                                {row.value.toLocaleString()}
                            </span>
                        </>
                    );

                    return row.to ? (
                        <Link
                            key={row.key}
                            to={row.to}
                            className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:border-[#F47822]/20 hover:bg-[#FFF8F4] dark:hover:bg-[#F47822]/10"
                        >
                            {content}
                        </Link>
                    ) : (
                        <div
                            key={row.key}
                            className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2"
                        >
                            {content}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FCFCFC] p-3 dark:bg-white/5">
                <div className="flex items-center gap-2">
                    <ServerCog className="h-4 w-4 text-[#F47822]" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                            {t("admin.analytics.operations.systemHealth")}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold capitalize text-foreground">
                            {health?.status ??
                                (healthLoading
                                    ? t("admin.analytics.operations.checking")
                                    : t("admin.analytics.operations.unknown"))}
                        </p>
                    </div>
                </div>
                <Status
                    value={health?.status ?? t("admin.analytics.operations.unknown")}
                />
            </div>

            <div className="mt-3">
                <SectionLink to="/admin/system">
                    {t("admin.analytics.operations.openSystem")}
                </SectionLink>
            </div>
        </AdminPanel>
    );
}

function WorkspacesPanel() {
    const { t } = useTranslation();

    const links = [
        { to: "/admin/activity", key: "activity", icon: Activity },
        { to: "/admin/security", key: "security", icon: ShieldCheck },
        { to: "/admin/risk", key: "risk", icon: AlertTriangle },
        { to: "/admin/support", key: "support", icon: LifeBuoy },
    ];

    return (
        <AdminPanel data-testid="analytics-workspaces">
            <h2 className="text-sm font-bold text-foreground">
                {t("admin.analytics.workspaces.title")}
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t("admin.analytics.workspaces.desc")}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.to}
                            to={link.to}
                            className="group flex items-center gap-2.5 rounded-xl border border-[#3A3A3A]/8 px-3 py-2.5 text-xs font-semibold text-foreground/70 transition hover:border-[#F47822]/30 hover:bg-[#FFF8F4] hover:text-[#F47822] dark:border-white/8 dark:hover:bg-[#F47822]/10"
                        >
                            <Icon className="h-4 w-4 shrink-0 text-[#F47822]" />
                            <span className="min-w-0 flex-1 truncate">
                                {t(`admin.analytics.workspaces.${link.key}`)}
                            </span>
                            <span className="text-[#F47822] transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                                →
                            </span>
                        </Link>
                    );
                })}
            </div>
        </AdminPanel>
    );
}

function PlatformActivityPanel({
    simulator,
    diagnostics,
}: {
    simulator?: {
        sessions: number;
        students: number;
        passRate: number;
        averageScore: number;
    } | null;
    diagnostics?: {
        scenarios: number;
        attempts: number;
        passRate: number | null;
        averageScore: number | null;
    } | null;
}) {
    const { t } = useTranslation();

    const cards = [
        {
            key: "simulator",
            to: "/admin/simulator",
            icon: Activity,
            values: simulator
                ? [
                      {
                          key: "sessions",
                          value: simulator.sessions.toLocaleString(),
                      },
                      {
                          key: "students",
                          value: simulator.students.toLocaleString(),
                      },
                      {
                          key: "passRate",
                          value: `${simulator.passRate}%`,
                      },
                      {
                          key: "averageScore",
                          value: `${simulator.averageScore}%`,
                      },
                  ]
                : [],
        },
        {
            key: "diagnostics",
            to: "/admin/diagnostics",
            icon: ListChecks,
            values: diagnostics
                ? [
                      {
                          key: "scenarios",
                          value: diagnostics.scenarios.toLocaleString(),
                      },
                      {
                          key: "attempts",
                          value: diagnostics.attempts.toLocaleString(),
                      },
                      {
                          key: "passRate",
                          value:
                              diagnostics.passRate === null
                                  ? "—"
                                  : `${diagnostics.passRate}%`,
                      },
                      {
                          key: "averageScore",
                          value:
                              diagnostics.averageScore === null
                                  ? "—"
                                  : `${diagnostics.averageScore}%`,
                      },
                  ]
                : [],
        },
    ];

    return (
        <AdminPanel data-testid="analytics-platform-activity">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-sm font-bold text-foreground">
                        {t("admin.analytics.platform.title")}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t("admin.analytics.platform.desc")}
                    </p>
                </div>
                <span className="rounded-full bg-[#3A3A3A]/6 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground dark:bg-white/8">
                    {t("admin.analytics.platform.allTime")}
                </span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.key}
                            to={card.to}
                            className="group rounded-2xl border border-[#3A3A3A]/8 p-4 transition hover:border-[#F47822]/30 hover:shadow-[0_10px_24px_rgba(244,120,34,0.08)] dark:border-white/8"
                        >
                            <div className="flex items-center gap-2">
                                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                                    <Icon className="h-4 w-4" />
                                </span>
                                <p className="text-xs font-bold text-foreground">
                                    {t(
                                        `admin.analytics.platform.${card.key}.title`,
                                    )}
                                </p>
                            </div>
                            {card.values.length === 0 ? (
                                <p className="mt-4 text-xs text-muted-foreground">
                                    {t("admin.analytics.platform.unavailable")}
                                </p>
                            ) : (
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    {card.values.map((value) => (
                                        <div key={value.key}>
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                                {t(
                                                    `admin.analytics.platform.${card.key}.${value.key}`,
                                                )}
                                            </p>
                                            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                                                {value.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </div>
        </AdminPanel>
    );
}

/* ------------------------------------------------------------------ */
/* Tables                                                             */
/* ------------------------------------------------------------------ */

function CoursePerformanceTable({
    rows,
    title,
    description,
    testId,
}: {
    rows: CourseAnalyticsRow[];
    title: string;
    description: string;
    testId: string;
}) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language;

    return (
        <AdminPanel data-testid={testId}>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-sm font-bold text-foreground">{title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>
                <SectionLink to="/admin/courses">
                    {t("admin.analytics.table.openCourses")}
                </SectionLink>
            </div>

            {rows.length === 0 ? (
                <p className="mt-6 rounded-xl border border-dashed border-[#3A3A3A]/12 px-4 py-8 text-center text-xs font-semibold text-muted-foreground dark:border-white/12">
                    {t("admin.analytics.table.empty")}
                </p>
            ) : (
                <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[680px] text-sm">
                        <thead>
                            <tr className="border-b border-[#3A3A3A]/8 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground dark:border-white/8">
                                <th className="pb-3 pe-4 text-start">
                                    {t("admin.analytics.table.course")}
                                </th>
                                <th className="pb-3 px-3 text-end">
                                    {t("admin.analytics.table.learners")}
                                </th>
                                <th className="pb-3 px-3 text-start">
                                    {t("admin.analytics.table.avgProgress")}
                                </th>
                                <th className="pb-3 px-3 text-end">
                                    {t("admin.analytics.table.completions")}
                                </th>
                                <th className="pb-3 px-3 text-end">
                                    {t("admin.analytics.table.completionRate")}
                                </th>
                                <th className="pb-3 ps-3 text-end">
                                    {t("admin.analytics.table.timeSpent")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3A3A3A]/6 dark:divide-white/6">
                            {rows.map((row) => (
                                <tr key={row.course_id}>
                                    <td
                                        className="max-w-[260px] truncate py-3 pe-4 text-xs font-semibold text-foreground"
                                        dir="auto"
                                    >
                                        {row.course_title}
                                    </td>
                                    <td className="px-3 py-3 text-end text-xs tabular-nums text-foreground/70">
                                        {row.learners_count.toLocaleString()}
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#3A3A3A]/7 dark:bg-white/8">
                                                <div
                                                    className="h-full rounded-full bg-[#F47822]"
                                                    style={{
                                                        width: `${Math.min(100, Math.max(0, row.average_progress))}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-[11px] font-semibold tabular-nums text-foreground/70">
                                                {row.average_progress}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-end text-xs tabular-nums text-foreground/70">
                                        {row.completions_count.toLocaleString()}
                                    </td>
                                    <td className="px-3 py-3 text-end text-xs font-semibold tabular-nums text-foreground">
                                        {row.completion_rate}%
                                    </td>
                                    <td className="ps-3 py-3 text-end text-xs tabular-nums text-foreground/70">
                                        {formatDuration(
                                            row.time_spent_seconds,
                                            t,
                                            locale,
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminPanel>
    );
}

function AssignmentPerformanceTable({
    rows,
}: {
    rows: AssignmentAnalyticsRow[];
}) {
    const { t } = useTranslation();

    return (
        <AdminPanel data-testid="analytics-assignment-table">
            <div>
                <h2 className="text-sm font-bold text-foreground">
                    {t("admin.analytics.table.assignmentPerformance")}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                    {t("admin.analytics.table.assignmentPerformanceDesc")}
                </p>
            </div>

            {rows.length === 0 ? (
                <p className="mt-6 rounded-xl border border-dashed border-[#3A3A3A]/12 px-4 py-8 text-center text-xs font-semibold text-muted-foreground dark:border-white/12">
                    {t("admin.analytics.table.emptyAssignments")}
                </p>
            ) : (
                <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead>
                            <tr className="border-b border-[#3A3A3A]/8 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground dark:border-white/8">
                                <th className="pb-3 pe-4 text-start">
                                    {t("admin.analytics.table.course")}
                                </th>
                                <th className="pb-3 px-3 text-end">
                                    {t("admin.analytics.table.assignments")}
                                </th>
                                <th className="pb-3 px-3 text-end">
                                    {t("admin.analytics.table.published")}
                                </th>
                                <th className="pb-3 px-3 text-end">
                                    {t("admin.analytics.table.submissions")}
                                </th>
                                <th className="pb-3 px-3 text-end">
                                    {t("admin.analytics.table.pending")}
                                </th>
                                <th className="pb-3 px-3 text-end">
                                    {t("admin.analytics.table.graded")}
                                </th>
                                <th className="pb-3 px-3 text-end">
                                    {t("admin.analytics.table.overdue")}
                                </th>
                                <th className="pb-3 ps-3 text-end">
                                    {t("admin.analytics.table.avgGrade")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3A3A3A]/6 dark:divide-white/6">
                            {rows.map((row) => (
                                <tr key={row.course_id}>
                                    <td
                                        className="max-w-[240px] truncate py-3 pe-4 text-xs font-semibold text-foreground"
                                        dir="auto"
                                    >
                                        {row.course_title}
                                    </td>
                                    <td className="px-3 py-3 text-end text-xs tabular-nums text-foreground/70">
                                        {row.assignments_count}
                                    </td>
                                    <td className="px-3 py-3 text-end text-xs tabular-nums text-foreground/70">
                                        {row.published_count}
                                    </td>
                                    <td className="px-3 py-3 text-end text-xs tabular-nums text-foreground/70">
                                        {row.submissions_count}
                                    </td>
                                    <td className="px-3 py-3 text-end">
                                        <span
                                            className={`inline-flex min-w-7 justify-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                                                row.pending_grading > 0
                                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                                                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                            }`}
                                        >
                                            {row.pending_grading}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-end text-xs tabular-nums text-foreground/70">
                                        {row.graded_count}
                                    </td>
                                    <td className="px-3 py-3 text-end">
                                        <span
                                            className={`text-xs font-semibold tabular-nums ${
                                                row.overdue_count > 0
                                                    ? "text-red-600 dark:text-red-400"
                                                    : "text-foreground/70"
                                            }`}
                                        >
                                            {row.overdue_count}
                                        </span>
                                    </td>
                                    <td className="ps-3 py-3 text-end text-xs font-semibold tabular-nums text-foreground">
                                        {row.average_grade > 0
                                            ? `${row.average_grade}%`
                                            : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminPanel>
    );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export function AdminAnalyticsPage() {
    const { t, i18n } = useTranslation();
    const locale = i18n.language;
    const [tab, setTab] = useState<Tab>("overview");
    const [preset, setPreset] = useState<Preset>("30");
    const [range, setRange] = useState(() => dateForPreset(30));
    const [retained, setRetained] = useState<
        Partial<Record<Tab, AnalyticsResponse>>
    >({});

    const analytics = useQuery({
        queryKey: ["admin", "analytics", tab, range.from, range.to],
        queryFn: () =>
            adminApi.analytics(tab, {
                date_from: range.from,
                date_to: range.to,
            }),
    });

    const isOverview = tab === "overview";

    useEffect(() => {
        if (analytics.data) {
            setRetained((current) => ({
                ...current,
                [tab]: analytics.data,
            }));
        }
    }, [analytics.data, tab]);

    const health = useQuery({
        queryKey: ["admin", "system", "health"],
        queryFn: adminApi.systemHealth,
        enabled: isOverview,
        refetchInterval: isOverview ? 60_000 : false,
    });
    const simulator = useQuery({
        queryKey: ["admin", "simulator", "analytics"],
        queryFn: adminApi.simulatorAnalytics,
        enabled: isOverview,
    });
    const diagnostics = useQuery({
        queryKey: ["admin", "diagnostic", "analytics"],
        queryFn: adminApi.diagnosticAnalytics,
        enabled: isOverview,
    });

    const applyPreset = (value: string) => {
        const next = value as Preset;
        setPreset(next);
        if (next === "custom") return;
        setRange(dateForPreset(Number(next)));
    };

    const setFrom = (value: string) => {
        setPreset("custom");
        setRange((current) => ({
            from: value,
            to: value > current.to ? value : current.to,
        }));
    };

    const setTo = (value: string) => {
        setPreset("custom");
        setRange((current) => ({
            from: value < current.from ? value : current.from,
            to: value,
        }));
    };

    const refresh = () => {
        void analytics.refetch();
        if (isOverview) {
            void health.refetch();
            void simulator.refetch();
            void diagnostics.refetch();
        }
    };

    const data = analytics.data ?? retained[tab];

    const chart = useMemo(
        () =>
            data
                ? buildChart(tab, data, t)
                : { rows: [], series: [] },
        [data, tab, t],
    );

    if (!data && analytics.isLoading) return <LoadingAdminPage />;
    if (!data) {
        return <ErrorAdminPage onRetry={() => void analytics.refetch()} />;
    }

    const summary = data.summary ?? {};
    const comparison = data.comparison ?? {};

    const exportCsv = () => {
        if (typeof URL.createObjectURL !== "function") return;
        const blob = new Blob(["\uFEFF", buildCsv(tab, data, t)], {
            type: "text/csv;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `hbtronics-analytics-${tab}-${range.from}-${range.to}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const updatedAt = analytics.dataUpdatedAt
        ? new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
              hour: "2-digit",
              minute: "2-digit",
          }).format(new Date(analytics.dataUpdatedAt))
        : "—";

    const secondaryPanel = () => {
        if (tab === "overview") {
            return (
                <div className="space-y-6">
                    <OperationsPanel
                        data={data}
                        health={health.data}
                        healthLoading={health.isLoading}
                    />
                    <WorkspacesPanel />
                </div>
            );
        }

        if (tab === "users") {
            const total = summary.total ?? 0;
            const rows: BreakdownRow[] = [
                {
                    key: "students",
                    label: t("admin.analytics.metrics.students"),
                    value: (summary.students ?? 0).toLocaleString(),
                    percent: total ? ((summary.students ?? 0) / total) * 100 : 0,
                },
                {
                    key: "instructors",
                    label: t("admin.analytics.metrics.instructors"),
                    value: (summary.instructors ?? 0).toLocaleString(),
                    percent: total ? ((summary.instructors ?? 0) / total) * 100 : 0,
                    tone: "bg-[#3A3A3A] dark:bg-white/70",
                },
                {
                    key: "administrators",
                    label: t("admin.analytics.metrics.administrators"),
                    value: (summary.administrators ?? 0).toLocaleString(),
                    percent: total ? ((summary.administrators ?? 0) / total) * 100 : 0,
                    tone: "bg-sky-500",
                },
                {
                    key: "active",
                    label: t("admin.analytics.metrics.active"),
                    value: (summary.active ?? 0).toLocaleString(),
                    percent: total ? ((summary.active ?? 0) / total) * 100 : 0,
                    tone: "bg-emerald-500",
                },
                {
                    key: "suspended",
                    label: t("admin.analytics.metrics.suspended"),
                    value: (summary.suspended ?? 0).toLocaleString(),
                    percent: total ? ((summary.suspended ?? 0) / total) * 100 : 0,
                    tone: "bg-red-500",
                },
            ];

            return (
                <BreakdownList
                    title={t("admin.analytics.panels.roleTitle")}
                    description={t("admin.analytics.panels.roleDesc")}
                    rows={rows}
                    testId="analytics-role-breakdown"
                />
            );
        }

        if (tab === "courses") {
            const total = summary.total ?? 0;
            const rows: BreakdownRow[] = [
                {
                    key: "published",
                    label: t("admin.analytics.metrics.published"),
                    value: (summary.published ?? 0).toLocaleString(),
                    percent: total ? ((summary.published ?? 0) / total) * 100 : 0,
                    tone: "bg-emerald-500",
                },
                {
                    key: "review",
                    label: t("admin.analytics.metrics.review"),
                    value: (summary.review ?? 0).toLocaleString(),
                    percent: total ? ((summary.review ?? 0) / total) * 100 : 0,
                    tone: "bg-amber-500",
                },
                {
                    key: "draft",
                    label: t("admin.analytics.metrics.draft"),
                    value: (summary.draft ?? 0).toLocaleString(),
                    percent: total ? ((summary.draft ?? 0) / total) * 100 : 0,
                    tone: "bg-[#3A3A3A] dark:bg-white/70",
                },
                {
                    key: "archived",
                    label: t("admin.analytics.metrics.archived"),
                    value: (summary.archived ?? 0).toLocaleString(),
                    percent: total ? ((summary.archived ?? 0) / total) * 100 : 0,
                    tone: "bg-[#3A3A3A]/35 dark:bg-white/30",
                },
            ];

            return (
                <BreakdownList
                    title={t("admin.analytics.panels.courseTitle")}
                    description={t("admin.analytics.panels.courseDesc")}
                    rows={rows}
                    testId="analytics-course-breakdown"
                />
            );
        }

        if (tab === "enrollments") {
            const total = summary.total ?? 0;
            const rows: BreakdownRow[] = [
                {
                    key: "active",
                    label: t("admin.analytics.metrics.activeEnrollments"),
                    value: (summary.active ?? 0).toLocaleString(),
                    percent: total ? ((summary.active ?? 0) / total) * 100 : 0,
                    tone: "bg-[#F47822]",
                },
                {
                    key: "completed",
                    label: t("admin.analytics.metrics.completed"),
                    value: (summary.completed ?? 0).toLocaleString(),
                    percent: total ? ((summary.completed ?? 0) / total) * 100 : 0,
                    tone: "bg-emerald-500",
                },
                {
                    key: "cancelled",
                    label: t("admin.analytics.metrics.cancelled"),
                    value: (summary.cancelled ?? 0).toLocaleString(),
                    percent: total ? ((summary.cancelled ?? 0) / total) * 100 : 0,
                    tone: "bg-red-500",
                },
                {
                    key: "completion_rate",
                    label: t("admin.analytics.metrics.completion_rate"),
                    value: `${summary.completion_rate ?? 0}%`,
                    percent: summary.completion_rate ?? 0,
                    tone: "bg-emerald-500",
                },
            ];

            return (
                <BreakdownList
                    title={t("admin.analytics.panels.enrollmentTitle")}
                    description={t("admin.analytics.panels.enrollmentDesc")}
                    rows={rows}
                    testId="analytics-enrollment-funnel"
                />
            );
        }

        if (tab === "learning") {
            const completed = summary.completed_learners ?? 0;
            const active = summary.active_learners ?? 0;
            const learners = Math.max(1, completed + active);
            const rows: BreakdownRow[] = [
                {
                    key: "average_progress",
                    label: t("admin.analytics.metrics.average_progress"),
                    value: `${summary.average_progress ?? 0}%`,
                    percent: summary.average_progress ?? 0,
                },
                {
                    key: "completion_rate",
                    label: t("admin.analytics.metrics.completion_rate"),
                    value: `${summary.completion_rate ?? 0}%`,
                    percent: summary.completion_rate ?? 0,
                    tone: "bg-emerald-500",
                },
                {
                    key: "completed_learners",
                    label: t("admin.analytics.metrics.completed_learners"),
                    value: completed.toLocaleString(),
                    percent: (completed / learners) * 100,
                    tone: "bg-sky-500",
                },
                {
                    key: "active_learners",
                    label: t("admin.analytics.metrics.active_learners"),
                    value: active.toLocaleString(),
                    percent: (active / learners) * 100,
                },
                {
                    key: "time_spent_seconds",
                    label: t("admin.analytics.metrics.time_spent_seconds"),
                    value: formatDuration(
                        summary.time_spent_seconds ?? 0,
                        t,
                        locale,
                    ),
                },
            ];

            return (
                <BreakdownList
                    title={t("admin.analytics.panels.learningTitle")}
                    description={t("admin.analytics.panels.learningDesc")}
                    rows={rows}
                    testId="analytics-learning-health"
                />
            );
        }

        const rows: BreakdownRow[] = [
            {
                key: "pending_grading",
                label: t("admin.analytics.metrics.pending_grading"),
                value: (summary.pending_grading ?? 0).toLocaleString(),
                percent:
                    (summary.submissions ?? 0) > 0
                        ? ((summary.pending_grading ?? 0) /
                              (summary.submissions ?? 1)) *
                          100
                        : 0,
                tone: "bg-amber-500",
            },
            {
                key: "graded",
                label: t("admin.analytics.metrics.graded"),
                value: (summary.graded ?? 0).toLocaleString(),
                percent:
                    (summary.submissions ?? 0) > 0
                        ? ((summary.graded ?? 0) /
                              (summary.submissions ?? 1)) *
                          100
                        : 0,
                tone: "bg-emerald-500",
            },
            {
                key: "overdue",
                label: t("admin.analytics.metrics.overdue"),
                value: (summary.overdue ?? 0).toLocaleString(),
                percent:
                    (summary.published ?? 0) > 0
                        ? ((summary.overdue ?? 0) /
                              (summary.published ?? 1)) *
                          100
                        : 0,
                tone: "bg-red-500",
            },
            {
                key: "average_grade",
                label: t("admin.analytics.metrics.average_grade"),
                value: `${summary.average_grade ?? 0}%`,
                percent: summary.average_grade ?? 0,
                tone: "bg-[#F47822]",
            },
        ];

        return (
            <BreakdownList
                title={t("admin.analytics.panels.gradingTitle")}
                description={t("admin.analytics.panels.gradingDesc")}
                rows={rows}
                testId="analytics-grading-health"
            />
        );
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6" data-testid="admin-analytics">
            <AdminHeading
                eyebrow={t("admin.analytics.eyebrow")}
                title={t("admin.analytics.title")}
                description={t("admin.analytics.description")}
                action={
                    <div className="flex flex-wrap items-end justify-end gap-2">
                        <div className="flex items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-2 text-xs font-semibold dark:border-white/10 dark:bg-[#1b1b20]">
                            <CalendarRange className="h-4 w-4 text-[#F47822]" />
                            <AdminSelect
                                ariaLabel={t("admin.analytics.range.label")}
                                value={preset}
                                onChange={applyPreset}
                                options={[
                                    {
                                        value: "7",
                                        label: t("admin.analytics.range.days7"),
                                    },
                                    {
                                        value: "30",
                                        label: t("admin.analytics.range.days30"),
                                    },
                                    {
                                        value: "90",
                                        label: t("admin.analytics.range.days90"),
                                    },
                                    {
                                        value: "custom",
                                        label: t("admin.analytics.range.custom"),
                                    },
                                ]}
                                size="sm"
                                className="[&>select]:border-0 [&>select]:bg-transparent [&>select]:ps-0"
                            />
                        </div>

                        <label className="flex items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground dark:border-white/10 dark:bg-[#1b1b20]">
                            {t("admin.analytics.range.from")}
                            <input
                                type="date"
                                value={range.from}
                                max={range.to}
                                onChange={(event) => setFrom(event.target.value)}
                                className="bg-transparent text-xs font-semibold text-foreground outline-none"
                            />
                        </label>

                        <label className="flex items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground dark:border-white/10 dark:bg-[#1b1b20]">
                            {t("admin.analytics.range.to")}
                            <input
                                type="date"
                                value={range.to}
                                min={range.from}
                                onChange={(event) => setTo(event.target.value)}
                                className="bg-transparent text-xs font-semibold text-foreground outline-none"
                            />
                        </label>

                        <AdminButton
                            variant="secondary"
                            size="md"
                            onClick={refresh}
                            disabled={analytics.isFetching}
                            aria-label={t("admin.analytics.actions.refresh")}
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${
                                    analytics.isFetching ? "animate-spin" : ""
                                }`}
                            />
                            <span className="hidden sm:inline">
                                {t("admin.analytics.actions.refresh")}
                            </span>
                        </AdminButton>

                        <AdminButton
                            variant="primary"
                            size="md"
                            onClick={exportCsv}
                            data-testid="analytics-export"
                        >
                            <Download className="h-4 w-4" />
                            {t("admin.analytics.actions.export")}
                        </AdminButton>
                    </div>
                }
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                    role="tablist"
                    aria-label={t("admin.analytics.tabs.label")}
                    className="flex max-w-full flex-wrap gap-1 rounded-2xl border border-[#3A3A3A]/8 bg-white p-1.5 dark:border-white/8 dark:bg-[#1b1b20]"
                >
                    {TABS.map((entry) => {
                        const Icon = TAB_ICONS[entry];
                        const active = entry === tab;
                        return (
                            <button
                                key={entry}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                data-testid={`analytics-tab-${entry}`}
                                onClick={() => setTab(entry)}
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                                    active
                                        ? "bg-[#3A3A3A] text-white shadow-sm dark:bg-white dark:text-[#1b1b20]"
                                        : "text-[#3A3A3A]/55 hover:bg-[#F47822]/8 hover:text-[#F47822] dark:text-white/55"
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {t(`admin.analytics.tabs.${entry}`)}
                            </button>
                        );
                    })}
                </div>

                <p className="text-[11px] font-semibold text-muted-foreground">
                    {t("admin.analytics.updated", { time: updatedAt })}
                </p>
            </div>

            <AnalyticsMetrics tab={tab} data={data} />

            <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
                <AdminPanel data-testid="analytics-chart-panel" className="flex h-full flex-col">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                            <TrendingUp className="h-4 w-4" />
                        </span>
                        <div>
                            <h2 className="font-semibold text-foreground">
                                {t("admin.analytics.trendTitle", {
                                    tab: t(`admin.analytics.tabs.${tab}`),
                                })}
                            </h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t("admin.analytics.trendDesc")}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-1 flex-col">
                        <AnalyticsTrendChart
                            data={chart.rows}
                            series={chart.series}
                            locale={locale}
                            ariaLabel={t("admin.analytics.chart.aria", {
                                tab: t(`admin.analytics.tabs.${tab}`),
                            })}
                            emptyLabel={t("admin.analytics.empty")}
                        />
                    </div>
                </AdminPanel>

                {secondaryPanel()}
            </div>

            {tab === "overview" && (
                <>
                    <CoursePerformanceTable
                        rows={data.top_courses ?? []}
                        title={t("admin.analytics.table.topCourses")}
                        description={t("admin.analytics.table.topCoursesDesc")}
                        testId="analytics-top-courses"
                    />
                    <PlatformActivityPanel
                        simulator={
                            simulator.data
                                ? {
                                      sessions: simulator.data.totals.sessions,
                                      students: simulator.data.totals.students,
                                      passRate: simulator.data.totals.pass_rate,
                                      averageScore:
                                          simulator.data.totals.average_score,
                                  }
                                : undefined
                        }
                        diagnostics={
                            diagnostics.data
                                ? {
                                      scenarios:
                                          diagnostics.data.total_scenarios,
                                      attempts: diagnostics.data.total_attempts,
                                      passRate: diagnostics.data.pass_rate,
                                      averageScore:
                                          diagnostics.data.avg_score,
                                  }
                                : undefined
                        }
                    />
                </>
            )}

            {tab === "learning" && (
                <CoursePerformanceTable
                    rows={data.by_course ?? []}
                    title={t("admin.analytics.table.coursePerformance")}
                    description={t(
                        "admin.analytics.table.coursePerformanceDesc",
                    )}
                    testId="analytics-course-table"
                />
            )}

            {tab === "assignments" && (
                <AssignmentPerformanceTable
                    rows={data.assignment_by_course ?? []}
                />
            )}

            {tab === "enrollments" && (
                <AdminPanel className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                            <UserPlus className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-sm font-bold text-foreground">
                                {t("admin.analytics.enrollmentLink.title")}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t("admin.analytics.enrollmentLink.desc")}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <SectionLink to="/admin/enrollments">
                            {t("admin.analytics.enrollmentLink.open")}
                        </SectionLink>
                        <SectionLink to="/admin/students">
                            {t("admin.analytics.enrollmentLink.students")}
                        </SectionLink>
                    </div>
                </AdminPanel>
            )}

            {tab === "courses" && (
                <AdminPanel className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                            <ListChecks className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-sm font-bold text-foreground">
                                {t("admin.analytics.reviewLink.title")}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t("admin.analytics.reviewLink.desc", {
                                    count: summary.review ?? 0,
                                })}
                            </p>
                        </div>
                    </div>
                    <SectionLink to="/admin/courses">
                        {t("admin.analytics.reviewLink.open")}
                    </SectionLink>
                </AdminPanel>
            )}

            {tab === "users" && comparison.new_in_period && (
                <AdminPanel className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                            <UserPlus className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-sm font-bold text-foreground">
                                {t("admin.analytics.usersLink.title")}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t("admin.analytics.usersLink.desc", {
                                    current:
                                        comparison.new_in_period.current,
                                    previous:
                                        comparison.new_in_period.previous,
                                })}
                            </p>
                        </div>
                    </div>
                    <SectionLink to="/admin/users">
                        {t("admin.analytics.usersLink.open")}
                    </SectionLink>
                </AdminPanel>
            )}
        </div>
    );
}
