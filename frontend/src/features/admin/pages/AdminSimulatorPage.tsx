import { useCallback, useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { SimulatorSessionsDashboard } from "@/components/simulator/SimulatorSessionsDashboard";
import {
    EMPTY_SIMULATOR_FILTERS,
    type SimulatorSessionsFilters,
} from "@/components/simulator/simulatorSessionsFilters";
import { adminApi } from "../api/adminApi";
import { AdminHeading } from "../components/AdminUi";

export function AdminSimulatorPage() {
    const { t } = useTranslation();
    const [filters, setFilters] = useState<SimulatorSessionsFilters>(EMPTY_SIMULATOR_FILTERS);
    const search = useDeferredValue(filters.search).trim();

    const analytics = useQuery({
        queryKey: ["admin", "simulator", "analytics"],
        queryFn: adminApi.simulatorAnalytics,
    });

    const sessions = useQuery({
        queryKey: ["admin", "simulator", "sessions", { ...filters, search }],
        queryFn: () =>
            adminApi.simulatorSessions({
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
        <div className="mx-auto max-w-7xl space-y-6" data-testid="admin-simulator-page">
            <AdminHeading
                eyebrow={t("admin.simulator.eyebrow")}
                title={t("admin.simulator.title")}
                description={t("admin.simulator.description")}
            />
            <SimulatorSessionsDashboard
                ns="admin.simulator"
                title={t("admin.simulator.sectionTitle")}
                subtitle={t("admin.simulator.sectionNote")}
                metricKeys={[
                    "sessions",
                    "completed",
                    "students",
                    "avgScore",
                    "passRate",
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
                testId="admin-simulator"
            />
        </div>
    );
}
