import type {
    RouteObject,
} from "react-router-dom";

import {
    GuestGuard,
} from "@/features/auth";

import {
    LoginPage,
    RegisterPage,
    ForgotPasswordPage,
    ResetPasswordPage,
} from "@/features/auth/pages";

export const authRoutes:
    RouteObject[] = [
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