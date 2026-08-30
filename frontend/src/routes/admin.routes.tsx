import type { RouteObject } from "react-router-dom";

import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthGuard, RoleGuard } from "@/features/auth";
import { AdminActivityPage, AdminAnalyticsPage, AdminAnnouncementsPage, AdminCoursesPage, AdminDashboardPage, AdminEnrollmentsPage, AdminSystemPage, AdminUsersPage } from "@/features/admin/pages";
import { MessagesPage } from "@/features/messages/pages/MessagesPage";

export const adminRoutes: RouteObject[] = [
    {
        element: <AuthGuard />,
        children: [
            {
                element: <RoleGuard roles={["Admin", "Super Admin"]} />,
                children: [
                    {
                        element: <AdminLayout />,
                        children: [
                            { path: "/admin", element: <AdminDashboardPage /> },
                            { path: "/admin/users", element: <AdminUsersPage /> },
                            { path: "/admin/courses", element: <AdminCoursesPage /> },
                            { path: "/admin/enrollments", element: <AdminEnrollmentsPage /> },
                            { path: "/admin/analytics", element: <AdminAnalyticsPage /> },
                            { path: "/admin/activity", element: <AdminActivityPage /> },
                            { path: "/admin/announcements", element: <AdminAnnouncementsPage /> },
                            { path: "/admin/system", element: <AdminSystemPage /> },
                            { path: "/admin/messages", element: <MessagesPage /> },
                        ],
                    },
                ],
            },
        ],
    },
];
