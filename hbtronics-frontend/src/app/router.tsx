import { createBrowserRouter } from "react-router-dom";

import { NotFound } from "@/components/feedback";

import { adminRoutes } from "@/routes/admin.routes";
import { authRoutes } from "@/routes/auth.routes";
import { dashboardRoutes } from "@/routes/dashboard.routes";
import { publicRoutes } from "@/routes/public.routes";

export const router = createBrowserRouter([
    ...publicRoutes,
    ...authRoutes,
    ...dashboardRoutes,
    ...adminRoutes,
    {
        path: "*",
        element: <NotFound />,
    },
]);