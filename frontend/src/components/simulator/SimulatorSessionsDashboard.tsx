import { Fragment, type ReactNode } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, FlaskConical, Search, TriangleAlert, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AVATAR_SQUARE_SHAPE } from "@/components/ui";

import type { SimulatorSessionsFilters } from "./simulatorSessionsFilters";

export type SimulatorMetricKey =
    | "sessions"
    | "completed"
    | "students"
    | "avgScore"
    | "passRate"
    | "avgHints"
    | "avgDuration";

type Totals = {
    sessions: number;
    completed: number;
    students?: number;
    average_score: number;
    pass_rate: number;
    average_hints?: number;
    average_duration_seconds: number;
};

type ToolRow = {
    tool: string;
    sessions: number;
    completed: number;
    average_score: number;
    pass_rate: number;
};

type VehicleRow = { vehicle_key: string; sessions: number; label?: string | null };

type SessionRow = {
    id: string;
    student: { id: number; name: string; email: string; avatar?: string | null } | null;
    tool: string;
    vehicle_key: string | null;
    scenario_key?: string | null;
    status: string;
    score: number | null;
    duration_seconds: number | null;
    started_at: string | null;
    result: {
        outcome: string | null;
        score: number | null;
        attempts: number | null;
        hints_used: number | null;
        duration_seconds: number | null;
    } | null;
};

type PageMeta = { current_page: number; last_page: number; per_page: number; total: number };

const TOOLS = ["scanner", "multimeter", "oscilloscope", "location", "schematic"] as const;

const TOOL_TONE: Record<string, string> = {
    scanner: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
    multimeter: "border-sky-500/30 bg-sky-500/10 text-sky-700",
    oscilloscope: "border-violet-500/30 bg-violet-500/10 text-violet-700",
    location: "border-amber-500/30 bg-amber-500/10 text-amber-700",
    schematic: "border-rose-500/30 bg-rose-500/10 text-rose-700",
};

function formatDuration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || seconds < 0) return "—";
    const total = Math.round(seconds);
    if (total < 60) return `${total}s`;
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return rest > 0 ? `${minutes}m ${rest}s` : `${minutes}m`;
}

function formatDate(value: string | null, locale: string): string {
    if (!value) return "—";
    return new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function isoDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shiftDays(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return isoDate(date);
}

function outcomeTone(outcome: string | null): string {
    if (outcome === "pass") return "border-emerald-500/25 bg-emerald-500/12 text-emerald-700";
    if (outcome === "fail" || outcome === "fault") return "border-red-500/25 bg-red-500/12 text-red-700";
    return "border-[#3A3A3A]/12 bg-[#3A3A3A]/[.07] text-[#3A3A3A]/55";
}

function scoreTone(score: number | null): string {
    if (score === null) return "bg-[#3A3A3A]/6 text-[#3A3A3A]/55";
    if (score >= 80) return "bg-emerald-50 text-emerald-700";
    if (score >= 50) return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-600";
}

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

type Props = {
    ns: string;
    title: string;
    subtitle?: string;
    metricKeys: SimulatorMetricKey[];
    totals?: Totals;
    byTool: ToolRow[];
    byVehicle: VehicleRow[];
    analyticsPending: boolean;
    analyticsError?: boolean;
    onRetryAnalytics?: () => void;
    rows: SessionRow[];
    meta?: PageMeta;
    sessionsPending: boolean;
    filters: SimulatorSessionsFilters;
    onFiltersChange: (patch: Partial<SimulatorSessionsFilters>) => void;
    testId: string;
};

export function SimulatorSessionsDashboard({
    ns,
    title,
    subtitle,
    metricKeys,
    totals,
    byTool,
    byVehicle,
    analyticsPending,
    analyticsError,
    onRetryAnalytics,
    rows,
    meta,
    sessionsPending,
    filters,
    onFiltersChange,
    testId,
}: Props) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language;
    const hasFilters = Boolean(
        filters.search.trim() || filters.tool || filters.status || filters.vehicle || filters.dateFrom || filters.dateTo,
    );
    const total = meta?.total ?? rows.length;
    const today = isoDate(new Date());
    const presetActive =
        filters.dateFrom === shiftDays(-6) && filters.dateTo === today
            ? "d7"
            : filters.dateFrom === shiftDays(-29) && filters.dateTo === today
              ? "d30"
              : !filters.dateFrom && !filters.dateTo
                ? "all"
                : "";

    const vehicleLabels = new Map(byVehicle.map((item) => [item.vehicle_key, item.label ?? null]));
    const vehicleLabel = (key: string | null): string | null =>
        key ? (vehicleLabels.get(key) ?? null) : null;
    const maxToolSessions = Math.max(1, ...byTool.map((item) => item.sessions));
    const maxVehicleSessions = Math.max(1, ...byVehicle.map((item) => item.sessions));

    const metricValue = (key: SimulatorMetricKey): string | number => {
        if (!totals) return "—";
        switch (key) {
            case "sessions":
                return totals.sessions;
            case "completed":
                return totals.completed;
            case "students":
                return totals.students ?? 0;
            case "avgScore":
                return `${totals.average_score}%`;
            case "passRate":
                return `${totals.pass_rate}%`;
            case "avgHints":
                return totals.average_hints ?? 0;
            case "avgDuration":
                return formatDuration(totals.average_duration_seconds);
        }
    };

    const chips: Array<{ key: string; label: string; clear: () => void }> = [];
    if (filters.search.trim())
        chips.push({ key: "search", label: filters.search.trim(), clear: () => onFiltersChange({ search: "" }) });
    if (filters.tool)
        chips.push({
            key: "tool",
            label: `${t(`${ns}.filters.tool`)}: ${t(`${ns}.tools.${filters.tool}`)}`,
            clear: () => onFiltersChange({ tool: "" }),
        });
    if (filters.status)
        chips.push({
            key: "status",
            label: `${t(`${ns}.filters.status`)}: ${t(`${ns}.status.${filters.status}`)}`,
            clear: () => onFiltersChange({ status: "" }),
        });
    if (filters.vehicle)
        chips.push({
            key: "vehicle",
            label: `${t(`${ns}.filters.vehicle`)}: ${vehicleLabel(filters.vehicle) ?? filters.vehicle}`,
            clear: () => onFiltersChange({ vehicle: "" }),
        });
    if (filters.dateFrom)
        chips.push({
            key: "dateFrom",
            label: `${t(`${ns}.filters.dateFrom`)}: ${filters.dateFrom}`,
            clear: () => onFiltersChange({ dateFrom: "" }),
        });
    if (filters.dateTo)
        chips.push({
            key: "dateTo",
            label: `${t(`${ns}.filters.dateTo`)}: ${filters.dateTo}`,
            clear: () => onFiltersChange({ dateTo: "" }),
        });

    const clearAll = () =>
        onFiltersChange({
            search: "",
            tool: "",
            status: "",
            vehicle: "",
            dateFrom: "",
            dateTo: "",
        });

    const pager =
        meta && meta.last_page > 1 ? (
            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={meta.current_page <= 1}
                    onClick={() => onFiltersChange({ page: Math.max(1, meta.current_page - 1) })}
                    data-testid={`${testId}-prev`}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#3A3A3A]/12 px-3 text-xs font-black text-[#3A3A3A]/65 transition hover:border-[#F47822]/35 hover:text-[#F47822] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
                    {t(`${ns}.prev`)}
                </button>
                <button
                    type="button"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => onFiltersChange({ page: Math.min(meta.last_page, meta.current_page + 1) })}
                    data-testid={`${testId}-next`}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#3A3A3A]/12 px-3 text-xs font-black text-[#3A3A3A]/65 transition hover:border-[#F47822]/35 hover:text-[#F47822] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {t(`${ns}.next`)}
                    <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                </button>
            </div>
        ) : null;

    const from = meta && total > 0 ? (meta.current_page - 1) * meta.per_page + 1 : 0;
    const to = meta ? Math.min(meta.current_page * meta.per_page, total) : total;

    return (
        <section className="space-y-4" data-testid={testId}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                        <Search className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[.14em] text-[#3A3A3A]/40">{title}</p>
                        {subtitle && <p className="mt-0.5 text-[11px] text-[#3A3A3A]/45">{subtitle}</p>}
                    </div>
                </div>
                <p
                    className="rounded-full bg-[#F47822]/10 px-3 py-1 font-mono text-[11px] font-black text-[#F47822]"
                    data-testid={`${testId}-total`}
                >
                    {t(`${ns}.results`, { n: total })}
                </p>
            </div>

            {analyticsError && (
                <div
                    role="alert"
                    data-testid={`${testId}-analytics-error`}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-500/30 bg-red-50 px-4 py-3"
                >
                    <TriangleAlert className="h-4 w-4 shrink-0 text-red-600" />
                    <p className="text-sm font-bold text-red-700">{t(`${ns}.analyticsError`)}</p>
                    <button
                        type="button"
                        onClick={onRetryAnalytics}
                        data-testid={`${testId}-analytics-retry`}
                        className="ms-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/30 bg-white px-3 text-xs font-black text-red-700 transition hover:border-red-500/50"
                    >
                        {t(`${ns}.retry`)}
                    </button>
                </div>
            )}

            <div className="overflow-hidden rounded-[28px] border border-[#3A3A3A]/8 bg-[#3A3A3A]/8 shadow-[0_10px_30px_rgba(58,58,58,.045)]">
                {analyticsPending ? (
                    <div className="h-[4.9rem] animate-pulse bg-white" />
                ) : (
                    <div className="flex flex-wrap gap-px">
                        {metricKeys.map((key) => (
                            <div key={key} className="min-w-[8.5rem] flex-1 bg-white px-4 py-3.5">
                                <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#3A3A3A]/40">
                                    {t(`${ns}.metrics.${key}`)}
                                </p>
                                <p className="mt-1 text-xl font-black tracking-tight text-[#3A3A3A]">
                                    {metricValue(key)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-[28px] border border-[#3A3A3A]/8 bg-white p-4 shadow-[0_10px_30px_rgba(58,58,58,.045)] sm:p-5">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#3A3A3A]/40">
                        {t(`${ns}.filters.title`)}
                    </p>
                    {hasFilters && (
                        <button
                            type="button"
                            onClick={clearAll}
                            data-testid={`${testId}-clear`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#3A3A3A]/12 px-3 text-xs font-black text-[#3A3A3A]/65 transition hover:border-[#F47822]/35 hover:text-[#F47822]"
                        >
                            <X className="h-3.5 w-3.5" />
                            {t(`${ns}.clearFilters`)}
                        </button>
                    )}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <label
                            htmlFor={`${testId}-search`}
                            className="block text-[10px] font-black uppercase tracking-[.12em] text-[#3A3A3A]/40"
                        >
                            {t(`${ns}.filters.search`)}
                        </label>
                        <div className="relative mt-1.5">
                            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/35" />
                            <input
                                id={`${testId}-search`}
                                type="search"
                                value={filters.search}
                                onChange={(event) => onFiltersChange({ search: event.target.value })}
                                placeholder={t(`${ns}.searchPh`)}
                                data-testid={`${testId}-search`}
                                className="h-11 w-full rounded-xl border border-[#3A3A3A]/12 bg-[#FCFCFC] ps-10 pe-9 text-sm text-[#3A3A3A] outline-none transition placeholder:text-[#3A3A3A]/35 focus:border-[#F47822]/40 focus:bg-white focus:ring-2 focus:ring-[#F47822]/15"
                            />
                            {filters.search && (
                                <button
                                    type="button"
                                    onClick={() => onFiltersChange({ search: "" })}
                                    aria-label={t(`${ns}.clearSearch`)}
                                    className="absolute end-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-[#3A3A3A]/40 transition hover:bg-[#3A3A3A]/8 hover:text-[#3A3A3A]"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor={`${testId}-tool`}
                            className="block text-[10px] font-black uppercase tracking-[.12em] text-[#3A3A3A]/40"
                        >
                            {t(`${ns}.filters.tool`)}
                        </label>
                        <select
                            id={`${testId}-tool`}
                            value={filters.tool}
                            onChange={(event) => onFiltersChange({ tool: event.target.value })}
                            data-testid={`${testId}-tool`}
                            className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 bg-[#FCFCFC] px-3 text-xs font-bold text-[#3A3A3A] outline-none transition focus:border-[#F47822]/40"
                        >
                            <option value="">{t(`${ns}.filters.allTools`)}</option>
                            {TOOLS.map((item) => (
                                <option key={item} value={item}>
                                    {t(`${ns}.tools.${item}`)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label
                            htmlFor={`${testId}-status`}
                            className="block text-[10px] font-black uppercase tracking-[.12em] text-[#3A3A3A]/40"
                        >
                            {t(`${ns}.filters.status`)}
                        </label>
                        <select
                            id={`${testId}-status`}
                            value={filters.status}
                            onChange={(event) => onFiltersChange({ status: event.target.value })}
                            data-testid={`${testId}-status`}
                            className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 bg-[#FCFCFC] px-3 text-xs font-bold text-[#3A3A3A] outline-none transition focus:border-[#F47822]/40"
                        >
                            <option value="">{t(`${ns}.filters.allStatuses`)}</option>
                            <option value="completed">{t(`${ns}.filters.completed`)}</option>
                            <option value="active">{t(`${ns}.filters.active`)}</option>
                        </select>
                    </div>
                    <div>
                        <label
                            htmlFor={`${testId}-vehicle`}
                            className="block text-[10px] font-black uppercase tracking-[.12em] text-[#3A3A3A]/40"
                        >
                            {t(`${ns}.filters.vehicle`)}
                        </label>
                        <select
                            id={`${testId}-vehicle`}
                            value={filters.vehicle}
                            onChange={(event) => onFiltersChange({ vehicle: event.target.value })}
                            data-testid={`${testId}-vehicle`}
                            className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/12 bg-[#FCFCFC] px-3 text-xs font-bold text-[#3A3A3A] outline-none transition focus:border-[#F47822]/40"
                        >
                            <option value="">{t(`${ns}.filters.allVehicles`)}</option>
                            {byVehicle.map((item) => (
                                <option key={item.vehicle_key} value={item.vehicle_key}>
                                    {item.label ?? item.vehicle_key} ({item.sessions})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#3A3A3A]/8 pt-3">
                    <span className="me-1 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[.12em] text-[#3A3A3A]/40">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {t(`${ns}.filters.dateRange`)}
                    </span>
                    <input
                        type="date"
                        value={filters.dateFrom}
                        max={filters.dateTo || undefined}
                        onChange={(event) => onFiltersChange({ dateFrom: event.target.value })}
                        aria-label={t(`${ns}.filters.dateFrom`)}
                        data-testid={`${testId}-date-from`}
                        className="h-10 rounded-xl border border-[#3A3A3A]/12 bg-[#FCFCFC] px-3 font-mono text-xs font-semibold text-[#3A3A3A] outline-none transition focus:border-[#F47822]/40"
                    />
                    <span className="text-[#3A3A3A]/35">–</span>
                    <input
                        type="date"
                        value={filters.dateTo}
                        min={filters.dateFrom || undefined}
                        onChange={(event) => onFiltersChange({ dateTo: event.target.value })}
                        aria-label={t(`${ns}.filters.dateTo`)}
                        data-testid={`${testId}-date-to`}
                        className="h-10 rounded-xl border border-[#3A3A3A]/12 bg-[#FCFCFC] px-3 font-mono text-xs font-semibold text-[#3A3A3A] outline-none transition focus:border-[#F47822]/40"
                    />
                    {(
                        [
                            ["d7", t(`${ns}.presets.d7`), { dateFrom: shiftDays(-6), dateTo: today }],
                            ["d30", t(`${ns}.presets.d30`), { dateFrom: shiftDays(-29), dateTo: today }],
                            ["all", t(`${ns}.presets.all`), { dateFrom: "", dateTo: "" }],
                        ] as Array<[string, string, { dateFrom: string; dateTo: string }]>
                    ).map(([key, label, range]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onFiltersChange(range)}
                            data-testid={`${testId}-preset-${key}`}
                            className={`h-10 rounded-xl border px-3 text-xs font-black transition ${
                                presetActive === key
                                    ? "border-[#F47822] bg-[#F47822] text-white"
                                    : "border-[#3A3A3A]/12 text-[#3A3A3A]/60 hover:border-[#F47822]/35 hover:text-[#F47822]"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {chips.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2" data-testid={`${testId}-chips`}>
                        {chips.map((chip) => (
                            <span
                                key={chip.key}
                                className="inline-flex items-center gap-1.5 rounded-full border border-[#F47822]/25 bg-[#F47822]/10 ps-3 pe-1.5 py-1 text-[11px] font-bold text-[#F47822]"
                            >
                                {chip.label}
                                <button
                                    type="button"
                                    onClick={chip.clear}
                                    aria-label={t(`${ns}.removeFilter`)}
                                    className="grid h-5 w-5 place-items-center rounded-full text-[#F47822]/70 transition hover:bg-[#F47822]/15 hover:text-[#F47822]"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-[28px] border border-[#3A3A3A]/8 bg-white p-4 shadow-[0_10px_30px_rgba(58,58,58,.045)] sm:p-5 lg:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#3A3A3A]/40">
                            {t(`${ns}.byTool`)}
                        </p>
                        <span className="rounded-full bg-[#3A3A3A]/8 px-2 py-0.5 font-mono text-[10px] font-black text-[#3A3A3A]/60">
                            {byTool.reduce((sum, item) => sum + item.sessions, 0)}
                        </span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {analyticsPending &&
                            Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="h-24 animate-pulse rounded-2xl bg-[#3A3A3A]/[.07]" />
                            ))}
                        {byTool.map((item) => (
                            <div key={item.tool} className="rounded-2xl border border-[#3A3A3A]/10 bg-[#FCFCFC] p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <span
                                        className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-black uppercase ${TOOL_TONE[item.tool] ?? "border-[#3A3A3A]/12 bg-[#3A3A3A]/[.07] text-[#3A3A3A]/60"}`}
                                    >
                                        {t(`${ns}.tools.${item.tool}`)}
                                    </span>
                                    <span className="flex items-baseline gap-1.5 font-mono text-xs font-black text-[#3A3A3A]">
                                        {item.sessions}
                                        <span className="text-[10px] font-bold text-[#F47822]">{item.pass_rate}%</span>
                                    </span>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/8">
                                    <div
                                        className="h-full rounded-full bg-[#F47822]"
                                        style={{ width: `${Math.round((item.sessions / maxToolSessions) * 100)}%` }}
                                    />
                                </div>
                                <p className="mt-1.5 text-[11px] text-[#3A3A3A]/50">
                                    {t(`${ns}.toolStats`, {
                                        completed: item.completed,
                                        score: item.average_score,
                                        pass: item.pass_rate,
                                    })}
                                </p>
                            </div>
                        ))}
                        {!analyticsPending && !analyticsError && byTool.length === 0 && (
                            <p className="text-xs text-[#3A3A3A]/45">{t(`${ns}.empty`)}</p>
                        )}
                    </div>
                </div>

                <div className="rounded-[28px] border border-[#3A3A3A]/8 bg-white p-4 shadow-[0_10px_30px_rgba(58,58,58,.045)] sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#3A3A3A]/40">
                            {t(`${ns}.byVehicle`)}
                        </p>
                        <span className="rounded-full bg-[#3A3A3A]/8 px-2 py-0.5 font-mono text-[10px] font-black text-[#3A3A3A]/60">
                            {byVehicle.length}
                        </span>
                    </div>
                    <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pe-1">
                        {analyticsPending &&
                            Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="h-11 animate-pulse rounded-xl bg-[#3A3A3A]/[.07]" />
                            ))}
                        {!analyticsPending && !analyticsError && byVehicle.length === 0 && (
                            <p className="text-xs text-[#3A3A3A]/45">{t(`${ns}.empty`)}</p>
                        )}
                        {byVehicle.map((item) => {
                            const active = filters.vehicle === item.vehicle_key;
                            return (
                                <button
                                    key={item.vehicle_key}
                                    type="button"
                                    onClick={() => onFiltersChange({ vehicle: active ? "" : item.vehicle_key })}
                                    data-testid={`${testId}-vehicle-chip-${item.vehicle_key}`}
                                    className={`w-full rounded-xl border px-3 py-2 text-start transition ${
                                        active
                                            ? "border-[#F47822]/40 bg-[#F47822]/10"
                                            : "border-transparent bg-[#FCFCFC] hover:border-[#F47822]/25"
                                    }`}
                                >
                                    <span className="flex items-center justify-between gap-2">
                                        <span className="truncate text-xs font-bold text-[#3A3A3A]">
                                            {item.label ?? item.vehicle_key}
                                        </span>
                                        <span
                                            className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-black ${active ? "bg-[#F47822] text-white" : "bg-[#3A3A3A]/8 text-[#3A3A3A]/60"}`}
                                        >
                                            {item.sessions}
                                        </span>
                                    </span>
                                    {item.label && (
                                        <span
                                            className="mt-0.5 block truncate font-mono text-[10px] text-[#3A3A3A]/40"
                                            dir="ltr"
                                        >
                                            {item.vehicle_key}
                                        </span>
                                    )}
                                    <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-[#3A3A3A]/8">
                                        <span
                                            className="block h-full rounded-full bg-[#F47822]/70"
                                            style={{
                                                width: `${Math.round((item.sessions / maxVehicleSessions) * 100)}%`,
                                            }}
                                        />
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="rounded-[28px] border border-[#3A3A3A]/8 bg-white p-4 shadow-[0_10px_30px_rgba(58,58,58,.045)] sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#3A3A3A]/40">
                            {t(`${ns}.sessionsTitle`)}
                        </p>
                        <p className="text-[11px] font-bold text-[#3A3A3A]/50" data-testid={`${testId}-range`}>
                            {meta && total > 0 ? t(`${ns}.showing`, { from, to, total }) : t(`${ns}.results`, { n: total })}
                        </p>
                    </div>
                    {pager}
                </div>

                {sessionsPending && (
                    <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="h-14 animate-pulse rounded-xl bg-[#3A3A3A]/[.07]" />
                        ))}
                    </div>
                )}

                {!sessionsPending && rows.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-[#3A3A3A]/15 p-10 text-center">
                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
                            <FlaskConical className="h-7 w-7" />
                        </span>
                        <p className="mt-4 text-sm font-bold text-[#3A3A3A]">
                            {hasFilters ? t(`${ns}.noMatch`) : t(`${ns}.empty`)}
                        </p>
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearAll}
                                className="mt-4 rounded-xl border border-[#3A3A3A]/12 px-4 py-2 text-xs font-black text-[#3A3A3A]/65 transition hover:border-[#F47822]/35 hover:text-[#F47822]"
                            >
                                {t(`${ns}.clearFilters`)}
                            </button>
                        )}
                    </div>
                )}

                {!sessionsPending && rows.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left rtl:text-right">
                            <thead className="text-[10px] font-black uppercase tracking-[.13em] text-[#3A3A3A]/38">
                                <tr className="border-b border-[#3A3A3A]/12">
                                    <th className="whitespace-nowrap py-3 pe-4">{t(`${ns}.headers.student`)}</th>
                                    <th className="whitespace-nowrap py-3 pe-4">{t(`${ns}.headers.tool`)}</th>
                                    <th className="whitespace-nowrap py-3 pe-4">{t(`${ns}.headers.vehicle`)}</th>
                                    <th className="whitespace-nowrap py-3 pe-4">{t(`${ns}.headers.score`)}</th>
                                    <th className="whitespace-nowrap py-3 pe-4">{t(`${ns}.headers.outcome`)}</th>
                                    <th className="whitespace-nowrap py-3 pe-4">
                                        {t(`${ns}.headers.performance`)}
                                    </th>
                                    <th className="whitespace-nowrap py-3 pe-4">{t(`${ns}.headers.started`)}</th>
                                    <th className="whitespace-nowrap py-3 pe-0">{t(`${ns}.headers.status`)}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3A3A3A]/7">
                                {rows.map((row) => {
                                    const perfParts: ReactNode[] = [];
                                    const attempts = row.result?.attempts ?? null;
                                    const hints = row.result?.hints_used ?? null;
                                    if (attempts !== null)
                                        perfParts.push(
                                            <span
                                                key="attempts"
                                                className="font-bold text-[#3A3A3A]"
                                                title={t(`${ns}.headers.attempts`)}
                                            >
                                                {t(`${ns}.perf.tries`, { n: attempts })}
                                            </span>,
                                        );
                                    if (hints !== null)
                                        perfParts.push(
                                            <span
                                                key="hints"
                                                className="text-[#3A3A3A]/70"
                                                title={t(`${ns}.headers.hints`)}
                                            >
                                                {t(`${ns}.perf.hints`, { n: hints })}
                                            </span>,
                                        );
                                    perfParts.push(
                                        <span key="duration" className="font-mono text-[#3A3A3A]">
                                            {formatDuration(row.result?.duration_seconds ?? row.duration_seconds)}
                                        </span>,
                                    );

                                    const label = vehicleLabel(row.vehicle_key);

                                    return (
                                        <tr
                                            key={row.id}
                                            className="transition hover:bg-[#FCFCFC]"
                                            data-testid={`${testId}-row-${row.id}`}
                                        >
                                            <td className="py-3.5 pe-4">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`grid h-8 w-8 shrink-0 place-items-center ${AVATAR_SQUARE_SHAPE} bg-[#F47822]/10 text-[10px] font-black text-[#F47822]`}>
                                                        {row.student?.name ? initials(row.student.name) : "?"}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-[#3A3A3A]">
                                                            {row.student?.name ?? t(`${ns}.unknownStudent`)}
                                                        </p>
                                                        <p className="truncate text-[11px] text-[#3A3A3A]/45">
                                                            {row.student?.email ?? "—"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 pe-4">
                                                <span
                                                    className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-black uppercase ${TOOL_TONE[row.tool] ?? "border-[#3A3A3A]/12 bg-[#3A3A3A]/[.07] text-[#3A3A3A]/60"}`}
                                                >
                                                    {t(`${ns}.tools.${row.tool}`)}
                                                </span>
                                            </td>
                                            <td className="py-3.5 pe-4">
                                                {label ? (
                                                    <>
                                                        <p className="truncate text-xs font-bold text-[#3A3A3A]">
                                                            {label}
                                                        </p>
                                                        <p className="mt-0.5 truncate font-mono text-[10px] text-[#3A3A3A]/40" dir="ltr">
                                                            {row.vehicle_key}
                                                            {row.scenario_key ? ` · ${row.scenario_key}` : ""}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="truncate font-mono text-[11px] text-[#3A3A3A]/70" dir="ltr">
                                                            {row.vehicle_key ?? "—"}
                                                        </p>
                                                        {row.scenario_key && (
                                                            <p className="mt-0.5 truncate font-mono text-[10px] text-[#3A3A3A]/40" dir="ltr">
                                                                {row.scenario_key}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                            <td className="py-3.5 pe-4">
                                                <span
                                                    className={`inline-block min-w-[2.75rem] rounded-lg px-2 py-1 text-center font-mono text-[11px] font-black ${scoreTone(row.result?.score ?? row.score ?? null)}`}
                                                >
                                                    {row.result?.score ?? row.score ?? "—"}
                                                </span>
                                            </td>
                                            <td className="py-3.5 pe-4">
                                                <span
                                                    className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-black uppercase ${outcomeTone(row.result?.outcome ?? null)}`}
                                                >
                                                    {row.result?.outcome
                                                        ? t(`${ns}.outcome.${row.result.outcome}`, {
                                                              defaultValue: row.result.outcome,
                                                          })
                                                        : "—"}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pe-4">
                                                <div className="inline-flex items-center gap-1.5 text-xs">
                                                    {perfParts.map((part, index) => (
                                                        <Fragment key={index}>
                                                            {index > 0 && (
                                                                <span className="text-[#3A3A3A]/25">·</span>
                                                            )}
                                                            {part}
                                                        </Fragment>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3.5 pe-4 text-[11px] text-[#3A3A3A]/50">
                                                {formatDate(row.started_at, locale)}
                                            </td>
                                            <td className="py-3.5 pe-0">
                                                <span
                                                    className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-black uppercase ${
                                                        row.status === "completed"
                                                            ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-700"
                                                            : "border-amber-500/25 bg-amber-500/15 text-amber-700"
                                                    }`}
                                                >
                                                    {t(`${ns}.status.${row.status}`)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {meta && meta.last_page > 1 && <div className="mt-4 flex justify-end">{pager}</div>}
            </div>
        </section>
    );
}
