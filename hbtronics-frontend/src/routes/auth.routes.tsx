import type { RouteObject } from "react-router-dom";

import { AuthLayout } from "@/layouts/AuthLayout";

function LoginPage() {
    return <div>Login</div>;
}

export const authRoutes: RouteObject[] = [
    {
        element: <AuthLayout />,
        children: [
            {
                path: "/login",
                element: <LoginPage />,
            },
        ],
    },
];