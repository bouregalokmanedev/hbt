import type { RouteObject } from "react-router-dom";

import { DashboardLayout } from "@/layouts/DashboardLayout";

function DashboardPage() {
    return <div>Dashboard</div>;
}

export const dashboardRoutes: RouteObject[] = [
    {
        element: <DashboardLayout />,
        children: [
            {
                path: "/dashboard",
                element: <DashboardPage />,
            },
        ],
    },
];