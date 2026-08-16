import type {
    RouteObject,
} from "react-router-dom";

import {
    AuthGuard,
} from "@/features/auth";

import {
    DashboardLayout,
} from "@/layouts/DashboardLayout";

import {
    DashboardPage,
} from "@/features/dashboard/pages";

import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import {
    ProfilePage,
} from "@/features/profile/pages/ProfilePage";


export const dashboardRoutes:
    RouteObject[] = [
        {
            element: <AuthGuard />,
            children: [
                {
                    element:
                        <DashboardLayout />,
                    children: [
                        {
                            path: "/dashboard",
                            element:
                                <DashboardPage />,

                        },
                       
                        {
                             path: "/settings",
                                 element:
                                 <SettingsPage />
                        },
                        {
                            path:"/profile",
                            element:
                            <ProfilePage />
                        }
                    ],
                },
            ],
        },
    ];