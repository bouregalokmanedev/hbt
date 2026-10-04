import { createBrowserRouter } from "react-router-dom";

import { NotFound, RouteError } from "@/components/feedback";

import { adminRoutes } from "@/routes/admin.routes";
import { authRoutes } from "@/routes/auth.routes";
import { dashboardRoutes } from "@/routes/dashboard.routes";
import { instructorRoutes } from "@/routes/instructor.routes";
import { publicRoutes } from "@/routes/public.routes";
import { supportRoutes } from "@/routes/support.routes";

export const router = createBrowserRouter([
    // One error boundary for every route module: a failed lazy import or a
    // throwing loader renders a recoverable screen instead of a blank page.
    {
        errorElement: <RouteError />,
        children: [
            ...publicRoutes,
            ...authRoutes,
            ...dashboardRoutes,
            ...instructorRoutes,
            ...supportRoutes,
            ...adminRoutes,

            {
                path: "*",
                element: <NotFound />,
            },
        ],
    },
]);