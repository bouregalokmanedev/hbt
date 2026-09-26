import { useCallback, useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { SimulatorSessionsDashboard } from "@/components/simulator/SimulatorSessionsDashboard";
import {
    EMPTY_SIMULATOR_FILTERS,
    type SimulatorSessionsFilters,
} from "@/components/simulator/simulatorSessionsFilters";
import {
    getInstructorSimulatorAnalytics,
    getInstructorSimulatorSessions,
} from "../api/instructorApi";

export function SimulatorActivityTab() {
    const { t } = useTranslation();
    const [filters, setFilters] = useState<SimulatorSessionsFilters>(EMPTY_SIMULATOR_FILTERS);
    const search = useDeferredValue(filters.search).trim();

    const analytics = useQuery({
        queryKey: ["instructor", "simulator", "activity", "analytics"],
        queryFn: getInstructorSimulatorAnalytics,
    });

    const sessions = useQuery({
        queryKey: ["instructor", "simulator", "activity", "sessions", { ...filters, search }],
        queryFn: () =>
            getInstructorSimulatorSessions({
                search: search || undefined,
                tool: filters.tool || undefined,
                status: filters.status || undefined,
                vehicle: filters.vehicle || undefined,
                date_from: filters.dateFrom || undefined,
                date_to: filters.dateTo || undefined,
                page: filters.page,
                per_page: 20,
            }),
        placeholderData: (prev) => prev,
    });

    const onFiltersChange = useCallback((patch: Partial<SimulatorSessionsFilters>) => {
        setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
    }, []);

    return (
        <SimulatorSessionsDashboard
            ns="instructor.simulator.activity"
            title={t("instructor.simulator.tabs.activity")}
            subtitle={t("instructor.simulator.activity.description")}
            metricKeys={[
                "sessions",
                "completed",
                "students",
                "avgScore",
                "passRate",
                "avgHints",
                "avgDuration",
            ]}
            totals={analytics.data?.totals}
            byTool={analytics.data?.by_tool ?? []}
            byVehicle={analytics.data?.by_vehicle ?? []}
            analyticsPending={analytics.isPending}
            analyticsError={analytics.isError}
            onRetryAnalytics={() => void analytics.refetch()}
            rows={sessions.data?.data ?? []}
            meta={sessions.data?.meta}
            sessionsPending={sessions.isPending}
            filters={filters}
            onFiltersChange={onFiltersChange}
            testId="simulator-activity"
        />
    );
}
