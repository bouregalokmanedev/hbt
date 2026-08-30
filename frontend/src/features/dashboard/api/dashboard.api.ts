import { api } from "@/lib/api/client";

import type { DashboardData } from "../types/dashboard.types";

export const dashboardApi = {
    async getDashboard(): Promise<DashboardData> {
        return api<DashboardData>(
            "/v1/auth/dashboard",
        );
    },
};