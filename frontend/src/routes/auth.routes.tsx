import type {
    RouteObject,
} from "react-router-dom";

import {
    GuestGuard,
} from "@/features/auth";

export const authRoutes:
    RouteObject[] = [
        {
            path: "/auth/google/callback",
            lazy: () => import("@/features/auth/pages/GoogleCallbackPage").then((m) => ({ Component: m.GoogleCallbackPage })),
        },
        {
            element: <GuestGuard />,
            children: [
               
                        {
                            path: "/login",
                            lazy: () => import("@/features/auth/pages/LoginPage").then((m) => ({ Component: m.LoginPage })),
                        },

                        {
                            path: "/register",
                            lazy: () => import("@/features/auth/pages/RegisterPage").then((m) => ({ Component: m.RegisterPage })),
                        },

                        {
                            path: "/forgot-password",
                            lazy: () => import("@/features/auth/pages/ForgotPasswordPage").then((m) => ({ Component: m.ForgotPasswordPage })),
                        },

                        {
                            path: "/reset-password",
                            lazy: () => import("@/features/auth/pages/ResetPasswordPage").then((m) => ({ Component: m.ResetPasswordPage })),
                        },
                    ],
                },
            
        
    ];
