import {
    createBrowserRouter,
} from "react-router-dom";

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
    adminRoutes,
} from "./admin.routes";

export const router =
    createBrowserRouter([
        ...authRoutes,
        ...dashboardRoutes,
        ...instructorRoutes,
        ...adminRoutes,
    ]);
