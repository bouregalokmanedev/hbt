import type {
    RouteObject,
} from "react-router-dom";

import {
    GuestGuard,
} from "@/features/auth";

import {
    LoginPage,
    GoogleCallbackPage,
    RegisterPage,
    ForgotPasswordPage,
    ResetPasswordPage,
} from "@/features/auth/pages";

export const authRoutes:
    RouteObject[] = [
        {
            path: "/auth/google/callback",
            element: <GoogleCallbackPage />,
        },
        {
            element: <GuestGuard />,
            children: [
               
                        {
                            path: "/login",
                            element:
                                <LoginPage />,
                        },

                        {
                            path: "/register",
                            element:
                                <RegisterPage />,
                        },

                        {
                            path: "/forgot-password",
                            element:
                                <ForgotPasswordPage />,
                        },

                        {
                            path: "/reset-password",
                            element:
                                <ResetPasswordPage />,
                        },
                    ],
                },
            
        
    ];
