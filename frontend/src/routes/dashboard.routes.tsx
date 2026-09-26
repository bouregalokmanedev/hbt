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

import {
    DashboardPage,
} from "@/features/dashboard/pages";
import { AchievementsPage } from "@/features/dashboard/pages/AchievementsPage";

import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import {
    ProfilePage,
} from "@/features/profile/pages/ProfilePage";
import { MyCoursesPage } from "@/features/enrollments/pages/MyCoursesPage";
import { CertificatesPage } from "@/features/certificates/pages/CertificatesPage";
import { AssessmentsPage } from "@/features/assessments/pages/AssessmentsPage";
import { AssessmentExamPage } from "@/features/assessments/pages/AssessmentExamPage";
import { AiMentorPage } from "@/features/ai-mentor/pages/AiMentorPage";
import { AnnouncementsPage, MessagesPage } from "@/features/messages/pages/MessagesPage";
import {
    DiagnosticBriefingPage,
    DiagnosticResultPage,
    DiagnosticWorkspacePage,
    DiagnosticsHistoryPage,
    DiagnosticsPage,
} from "@/features/diagnostics";
import { SimulatorHubPage } from "@/features/simulator/pages/SimulatorHubPage";
import { SimulatorLabPage } from "@/features/simulator/pages/SimulatorLabPage";
import { SimulatorReportsPage } from "@/features/simulator/pages/SimulatorReportsPage";
import { CheckoutPage, CheckoutSuccessPage } from "@/features/payments/CheckoutPage";
import { BillingPage } from "@/features/payments/BillingPage";
import { FavouritesPage } from "@/features/favorites/pages/FavouritesPage";
import { SubscriptionPage } from "@/features/subscription/pages/SubscriptionPage";
import { SupportPage } from "@/features/support/pages/SupportPage";
import { ChallengesPage } from "@/features/challenges/pages/ChallengesPage";



export const dashboardRoutes:
    RouteObject[] = [
        {
            element: <AuthGuard />,
            children: [
                { path: "/checkout", element: <CheckoutPage /> },
                { path: "/checkout/:orderId", element: <CheckoutPage /> },
                { path: "/checkout/:orderId/success", element: <CheckoutSuccessPage /> },
                {
                    element: <RoleGuard roles={["Student"]} />,
                    children: [
                        {
                            element: <DashboardLayout />,
                            children: [
                                { path: "/dashboard", element: <DashboardPage /> },
                                { path: "/challenges", element: <ChallengesPage /> },
                                { path: "/my-courses", element: <MyCoursesPage /> },
                                { path: "/certificates", element: <CertificatesPage /> },
                                { path: "/achievements", element: <AchievementsPage /> },
                                { path: "/assessments", element: <AssessmentsPage /> },
                                { path: "/assessments/:assessmentId/exam", element: <AssessmentExamPage /> },
                                { path: "/diagnostics", element: <DiagnosticsPage /> },
                                { path: "/diagnostics/history", element: <DiagnosticsHistoryPage /> },
                                { path: "/diagnostics/:scenarioId", element: <DiagnosticBriefingPage /> },
                                { path: "/diagnostics/attempts/:attemptId", element: <DiagnosticWorkspacePage /> },
                                { path: "/diagnostics/attempts/:attemptId/result", element: <DiagnosticResultPage /> },
                                 { path: "/simulator", element: <SimulatorHubPage /> },
                                 { path: "/simulator/:tool", element: <SimulatorLabPage /> },
                                 { path: "/reports", element: <SimulatorReportsPage /> },
                                { path: "/favourite", element: <FavouritesPage /> },
                                { path: "/subscription", element: <SubscriptionPage /> },
                                { path: "/billing", element: <BillingPage /> },
                                { path: "/support", element: <SupportPage /> },
                                { path: "/ai-mentor", element: <AiMentorPage /> },
                                { path: "/messages", element: <MessagesPage /> },
                                { path: "/announcements", element: <AnnouncementsPage /> },
                                { path: "/settings", element: <SettingsPage /> },
                                { path: "/profile", element: <ProfilePage /> },
                            ],
                        },
                    ],
                },
            ],
        },
    ];
