import type { RouteObject } from "react-router-dom";

import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthGuard, RoleGuard } from "@/features/auth";
import { MessagesPage } from "@/features/messages/pages/MessagesPage";
import { staffHubRoutes } from "@/features/staff-hub/routes";

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
                            { path: "/admin", lazy: () => import("@/features/admin/pages/AdminDashboardPage").then((m) => ({ Component: m.AdminDashboardPage })) },
                            { path: "/admin/users", lazy: () => import("@/features/admin/pages/AdminUsersPage").then((m) => ({ Component: m.AdminUsersPage })) },
                            { path: "/admin/students", lazy: () => import("@/features/admin/pages/AdminStudentsPage").then((m) => ({ Component: m.AdminStudentsPage })) },
                            { path: "/admin/instructors", lazy: () => import("@/features/admin/pages/AdminInstructorsPage").then((m) => ({ Component: m.AdminInstructorsPage })) },
                            { path: "/admin/courses", lazy: () => import("@/features/admin/pages/AdminCoursesPage").then((m) => ({ Component: m.AdminCoursesPage })) },
                            { path: "/admin/enrollments", lazy: () => import("@/features/admin/pages/AdminEnrollmentsPage").then((m) => ({ Component: m.AdminEnrollmentsPage })) },
                            { path: "/admin/assessments", lazy: () => import("@/features/admin/pages/AdminAssessmentsPage").then((m) => ({ Component: m.AdminAssessmentsPage })) },
                            { path: "/admin/diagnostics", lazy: () => import("@/features/admin/pages/AdminDiagnosticsPage").then((m) => ({ Component: m.AdminDiagnosticsPage })) },
                            { path: "/admin/simulator", lazy: () => import("@/features/admin/pages/AdminSimulatorPage").then((m) => ({ Component: m.AdminSimulatorPage })) },
                            { path: "/admin/commerce", lazy: () => import("@/features/admin/pages/AdminCommercePage").then((m) => ({ Component: m.AdminCommercePage })) },
                            { path: "/admin/analytics", lazy: () => import("@/features/admin/pages/AdminAnalyticsPage").then((m) => ({ Component: m.AdminAnalyticsPage })) },
                            { path: "/admin/crm-stats", lazy: () => import("@/features/admin/pages/AdminCrmStatsPage").then((m) => ({ Component: m.AdminCrmStatsPage })) },
                            { path: "/admin/activity", lazy: () => import("@/features/admin/pages/AdminActivityPage").then((m) => ({ Component: m.AdminActivityPage })) },
                            { path: "/admin/announcements", lazy: () => import("@/features/admin/pages/AdminAnnouncementsPage").then((m) => ({ Component: m.AdminAnnouncementsPage })) },
                            { path: "/admin/risk", lazy: () => import("@/features/admin/pages/AdminRiskPage").then((m) => ({ Component: m.AdminRiskPage })) },
                            { path: "/admin/security", lazy: () => import("@/features/admin/pages/AdminSecurityPage").then((m) => ({ Component: m.AdminSecurityPage })) },
                            { path: "/admin/roles", lazy: () => import("@/features/admin/pages/AdminRolesPage").then((m) => ({ Component: m.AdminRolesPage })) },
                            { path: "/admin/support", lazy: () => import("@/features/admin/pages/AdminSupportPage").then((m) => ({ Component: m.AdminSupportPage })) },
                            { path: "/admin/system", lazy: () => import("@/features/admin/pages/AdminSystemPage").then((m) => ({ Component: m.AdminSystemPage })) },
                            { path: "/admin/settings", lazy: () => import("@/features/admin/pages/AdminSettingsPage").then((m) => ({ Component: m.AdminSettingsPage })) },
                            { path: "/admin/profile", lazy: () => import("@/features/admin/pages/AdminProfilePage").then((m) => ({ Component: m.AdminProfilePage })) },
                            ...staffHubRoutes("/admin/staff-hub"),
                            { path: "/admin/messages", element: <MessagesPage basePath="/admin" announcementsHref="/admin/messages/announcements" /> },
                            // The composer + delivery history live at /admin/announcements;
                            // this is the admin's *inbox* of announcement threads.
                            { path: "/admin/messages/announcements", element: <MessagesPage mode="announcements" basePath="/admin" announcementsHref="/admin/messages/announcements" announceHref="/admin/announcements" /> },
                        ],
                    },
                ],
            },
        ],
    },
];
