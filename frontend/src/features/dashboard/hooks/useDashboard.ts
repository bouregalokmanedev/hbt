import { useCallback, useEffect, useState } from "react";

import { dashboardApi } from "../api/dashboard.api";

import type { DashboardData } from "../types/dashboard.types";

interface UseDashboardState {
    dashboard: DashboardData | null;
    isLoading: boolean;
    error: string | null;
}

export function useDashboard() {
    const [state, setState] =
        useState<UseDashboardState>({
            dashboard: null,
            isLoading: true,
            error: null,
        });

    const loadDashboard = useCallback(async () => {
        console.log("[Dashboard] Requesting dashboard...");

        setState((current) => ({
            ...current,
            isLoading: true,
            error: null,
        }));

        try {
            const response =
                await dashboardApi.getDashboard();

            console.log(
                "[Dashboard] Response:",
                response,
            );

            setState({
                dashboard: response,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            console.error(
                "[Dashboard] Failed:",
                error,
            );

            setState({
                dashboard: null,
                isLoading: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unable to load your dashboard.",
            });
        }
    }, []);

    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);

    return {
        dashboard: state.dashboard,
        isLoading: state.isLoading,
        error: state.error,
        refetch: loadDashboard,
    };
}