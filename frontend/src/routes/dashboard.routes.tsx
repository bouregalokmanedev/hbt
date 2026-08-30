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



export const dashboardRoutes:
    RouteObject[] = [
        {
            element: <AuthGuard />,
            children: [
                {
                    element: <RoleGuard roles={["Student"]} />,
                    children: [
                        {
                            element: <DashboardLayout />,
                            children: [
                                { path: "/dashboard", element: <DashboardPage /> },
                                { path: "/my-courses", element: <MyCoursesPage /> },
                                { path: "/certificates", element: <CertificatesPage /> },
                                { path: "/achievements", element: <AchievementsPage /> },
                                { path: "/assessments", element: <AssessmentsPage /> },
                                { path: "/assessments/:assessmentId/exam", element: <AssessmentExamPage /> },
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
