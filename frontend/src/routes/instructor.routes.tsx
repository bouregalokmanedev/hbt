import type {
    RouteObject,
} from "react-router-dom";

import {
    AuthGuard,
    RoleGuard,
} from "@/features/auth";

import {
    InstructorAssessmentWorkspacePage,
    InstructorCourseAnalyticsPage,
    InstructorCourseEditorPage,
    InstructorCourseOutcomesPage,
    InstructorCoursePage,
    InstructorCurriculumPage,
    InstructorDashboardPage,
    InstructorDiagnosticsPage,
    InstructorSimulatorPage,
    InstructorLoungePage,
    InstructorProfilePage,
    InstructorQuizWorkspacePage,
    InstructorRevenuePage,
    InstructorSettingsPage,
    InstructorStudentProfilePage,
    InstructorStudentsPage,
} from "@/features/instructor/pages";

import {
    InstructorLayout,
} from "@/layouts/instructor/InstructorLayout";
import { MessagesPage } from "@/features/messages/pages/MessagesPage";
import { InstructorAnnouncementsPage } from "@/features/instructor/pages/InstructorAnnouncementsPage";

export const instructorRoutes: RouteObject[] = [
    {
        element: <AuthGuard />,
        children: [
            {
                element: (
                    <RoleGuard
                        roles={[
                            "Instructor",
                        ]}
                    />
                ),
                children: [
                    {
                        element:
                            <InstructorLayout />,
                        children: [
                            {
                                path: "/instructor",
                                element:
                                    <InstructorDashboardPage />,
                            },
                            {
                                path: "/instructor/courses",
                                element:
                                    <InstructorCoursePage />,
                            },
                            {
                                path: "/instructor/courses/new",
                                element:
                                    <InstructorCourseEditorPage />,
                            },
                            {
                                path: "/instructor/courses/:courseId",
                                element:
                                    <InstructorCourseEditorPage />,
                            },
                            {
                                path: "/instructor/courses/:courseId/curriculum",
                                element:
                                    <InstructorCurriculumPage />,
                            },
                            {
                                path: "/instructor/courses/:courseId/quizzes",
                                element:
                                    <InstructorQuizWorkspacePage />,
                            },
                            {
                                path: "/instructor/courses/:courseId/assessments",
                                element:
                                    <InstructorAssessmentWorkspacePage />,
                            },
                            {
                                path: "/instructor/courses/:courseId/analytics",
                                element:
                                    <InstructorCourseAnalyticsPage />,
                            },
                            {
                                path: "/instructor/courses/:courseId/outcomes",
                                element:
                                    <InstructorCourseOutcomesPage />,
                            },
                            {
                                path: "/instructor/students",
                                element:
                                    <InstructorStudentsPage />,
                            },
                            {
                                path: "/instructor/students/:studentId",
                                element:
                                    <InstructorStudentProfilePage />,
                            },
                            { path: "/instructor/messages", element: <MessagesPage basePath="/instructor" getProfilePath={(participant) => participant.role === "Student" && participant.user_id ? `/instructor/students/${participant.user_id}` : null} /> },
                            { path: "/instructor/announcements", element: <MessagesPage mode="announcements" basePath="/instructor" announceHref="/instructor/announcements/new" /> },
                            { path: "/instructor/announcements/new", element: <InstructorAnnouncementsPage /> },
                            { path: "/instructor/diagnostics", element: <InstructorDiagnosticsPage /> },
                            { path: "/instructor/simulator", element: <InstructorSimulatorPage /> },
                            { path: "/instructor/lounge", element: <InstructorLoungePage /> },
                            { path: "/instructor/revenue", element: <InstructorRevenuePage /> },
                            { path: "/instructor/profile", element: <InstructorProfilePage /> },
                            { path: "/instructor/settings", element: <InstructorSettingsPage /> },
                        ],
                    },
                ],
            },
        ],
    },
];
