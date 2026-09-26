import type { RouteObject } from "react-router-dom";

import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthGuard, RoleGuard } from "@/features/auth";
import { AdminActivityPage, AdminAnalyticsPage, AdminAnnouncementsPage, AdminAssessmentsPage, AdminCommercePage, AdminCoursesPage, AdminDashboardPage, AdminDiagnosticsPage, AdminEnrollmentsPage, AdminInstructorsPage, AdminProfilePage, AdminRiskPage, AdminRolesPage, AdminSecurityPage, AdminSettingsPage, AdminSimulatorPage, AdminStudentsPage, AdminSupportPage, AdminSystemPage, AdminUsersPage } from "@/features/admin/pages";
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
                            { path: "/admin/students", element: <AdminStudentsPage /> },
                            { path: "/admin/instructors", element: <AdminInstructorsPage /> },
                            { path: "/admin/courses", element: <AdminCoursesPage /> },
                            { path: "/admin/enrollments", element: <AdminEnrollmentsPage /> },
                            { path: "/admin/assessments", element: <AdminAssessmentsPage /> },
                            { path: "/admin/diagnostics", element: <AdminDiagnosticsPage /> },
                            { path: "/admin/simulator", element: <AdminSimulatorPage /> },
                            { path: "/admin/commerce", element: <AdminCommercePage /> },
                            { path: "/admin/analytics", element: <AdminAnalyticsPage /> },
                            { path: "/admin/activity", element: <AdminActivityPage /> },
                            { path: "/admin/announcements", element: <AdminAnnouncementsPage /> },
                            { path: "/admin/risk", element: <AdminRiskPage /> },
                            { path: "/admin/security", element: <AdminSecurityPage /> },
                            { path: "/admin/roles", element: <AdminRolesPage /> },
                            { path: "/admin/support", element: <AdminSupportPage /> },
                            { path: "/admin/system", element: <AdminSystemPage /> },
                            { path: "/admin/settings", element: <AdminSettingsPage /> },
                            { path: "/admin/profile", element: <AdminProfilePage /> },
                            { path: "/admin/messages", element: <MessagesPage basePath="/admin" /> },
                        ],
                    },
                ],
            },
        ],
    },
];
