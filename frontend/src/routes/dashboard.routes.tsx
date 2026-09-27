import type {
    RouteObject,
} from "react-router-dom";

import {
    AuthGuard,
    RoleGuard,
} from "@/features/auth";

import {
    DashboardLayout,
} from "@/layouts/DashboardLayout";

import { AnnouncementsPage, MessagesPage } from "@/features/messages/pages/MessagesPage";

export const dashboardRoutes:
    RouteObject[] = [
        {
            element: <AuthGuard />,
            children: [
                { path: "/checkout", lazy: () => import("@/features/payments/CheckoutPage").then((m) => ({ Component: m.CheckoutPage })) },
                { path: "/checkout/:orderId", lazy: () => import("@/features/payments/CheckoutPage").then((m) => ({ Component: m.CheckoutPage })) },
                { path: "/checkout/:orderId/success", lazy: () => import("@/features/payments/CheckoutPage").then((m) => ({ Component: m.CheckoutSuccessPage })) },
                {
                    element: <RoleGuard roles={["Student"]} />,
                    children: [
                        {
                            element: <DashboardLayout />,
                            children: [
                                { path: "/dashboard", lazy: () => import("@/features/dashboard/pages/DashboardPage").then((m) => ({ Component: m.DashboardPage })) },
                                { path: "/challenges", lazy: () => import("@/features/challenges/pages/ChallengesPage").then((m) => ({ Component: m.ChallengesPage })) },
                                { path: "/my-courses", lazy: () => import("@/features/enrollments/pages/MyCoursesPage").then((m) => ({ Component: m.MyCoursesPage })) },
                                { path: "/certificates", lazy: () => import("@/features/certificates/pages/CertificatesPage").then((m) => ({ Component: m.CertificatesPage })) },
                                { path: "/achievements", lazy: () => import("@/features/dashboard/pages/AchievementsPage").then((m) => ({ Component: m.AchievementsPage })) },
                                { path: "/assessments", lazy: () => import("@/features/assessments/pages/AssessmentsPage").then((m) => ({ Component: m.AssessmentsPage })) },
                                { path: "/assessments/:assessmentId/exam", lazy: () => import("@/features/assessments/pages/AssessmentExamPage").then((m) => ({ Component: m.AssessmentExamPage })) },
                                { path: "/diagnostics", lazy: () => import("@/features/diagnostics/pages/DiagnosticsPage").then((m) => ({ Component: m.DiagnosticsPage })) },
                                { path: "/diagnostics/history", lazy: () => import("@/features/diagnostics/pages/DiagnosticsHistoryPage").then((m) => ({ Component: m.DiagnosticsHistoryPage })) },
                                { path: "/diagnostics/:scenarioId", lazy: () => import("@/features/diagnostics/pages/DiagnosticBriefingPage").then((m) => ({ Component: m.DiagnosticBriefingPage })) },
                                { path: "/diagnostics/attempts/:attemptId", lazy: () => import("@/features/diagnostics/pages/DiagnosticWorkspacePage").then((m) => ({ Component: m.DiagnosticWorkspacePage })) },
                                { path: "/diagnostics/attempts/:attemptId/result", lazy: () => import("@/features/diagnostics/pages/DiagnosticResultPage").then((m) => ({ Component: m.DiagnosticResultPage })) },
                                 { path: "/simulator", lazy: () => import("@/features/simulator/pages/SimulatorHubPage").then((m) => ({ Component: m.SimulatorHubPage })) },
                                 { path: "/simulator/:tool", lazy: () => import("@/features/simulator/pages/SimulatorLabPage").then((m) => ({ Component: m.SimulatorLabPage })) },
                                 { path: "/reports", lazy: () => import("@/features/simulator/pages/SimulatorReportsPage").then((m) => ({ Component: m.SimulatorReportsPage })) },
                                { path: "/favourite", lazy: () => import("@/features/favorites/pages/FavouritesPage").then((m) => ({ Component: m.FavouritesPage })) },
                                { path: "/subscription", lazy: () => import("@/features/subscription/pages/SubscriptionPage").then((m) => ({ Component: m.SubscriptionPage })) },
                                { path: "/billing", lazy: () => import("@/features/payments/BillingPage").then((m) => ({ Component: m.BillingPage })) },
                                { path: "/support", lazy: () => import("@/features/support/pages/SupportPage").then((m) => ({ Component: m.SupportPage })) },
                                { path: "/ai-mentor", lazy: () => import("@/features/ai-mentor/pages/AiMentorPage").then((m) => ({ Component: m.AiMentorPage })) },
                                { path: "/messages", element: <MessagesPage /> },
                                { path: "/announcements", element: <AnnouncementsPage /> },
                                { path: "/settings", lazy: () => import("@/features/settings/pages/SettingsPage").then((m) => ({ Component: m.SettingsPage })) },
                                { path: "/profile", lazy: () => import("@/features/profile/pages/ProfilePage").then((m) => ({ Component: m.ProfilePage })) },
                            ],
                        },
                    ],
                },
            ],
        },
    ];
