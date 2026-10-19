import {
    createBrowserRouter,
} from "react-router-dom";

import {
    NotFound,
} from "@/components/feedback";

import {
    publicRoutes,
} from "./public.routes";

import {
    authRoutes,
} from "./auth.routes";

import {
    dashboardRoutes,
} from "./dashboard.routes";

import {
    instructorRoutes,
} from "./instructor.routes";
import {
    supportRoutes,
} from "./support.routes";
import {
    marketingRoutes,
} from "./marketing.routes";
import {
    adminRoutes,
} from "./admin.routes";

export const router =
    createBrowserRouter([
        ...publicRoutes,
        ...authRoutes,
        ...dashboardRoutes,
        ...instructorRoutes,
        ...supportRoutes,
        ...marketingRoutes,
        ...adminRoutes,
        {
            path: "*",
            element: <NotFound />,
        },
    ]);
