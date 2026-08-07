import type { RouteObject } from "react-router-dom";

import { AdminLayout } from "@/layouts/AdminLayout";

function AdminPage() {
    return <div>Admin</div>;
}

export const adminRoutes: RouteObject[] = [
    {
        element: <AdminLayout />,
        children: [
            {
                path: "/admin",
                element: <AdminPage />,
            },
        ],
    },
];