import {
    createBrowserRouter,
} from "react-router-dom";

import {
    authRoutes,
} from "./auth.routes";

import {
    dashboardRoutes,
} from "./dashboard.routes";

export const router =
    createBrowserRouter([
        ...authRoutes,
        ...dashboardRoutes,
    ]);