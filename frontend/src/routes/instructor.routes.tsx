import type {
    RouteObject,
} from "react-router-dom";
import { Navigate } from "react-router-dom";

import {
    AuthGuard,
    RoleGuard,
} from "@/features/auth";

import {
    InstructorLayout,
} from "@/layouts/instructor/InstructorLayout";
import { MessagesPage } from "@/features/messages/pages/MessagesPage";
import { staffHubRoutes } from "@/features/staff-hub/routes";

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
                                lazy: () => import("@/features/instructor/pages/InstructorDashboardPage").then((m) => ({ Component: m.InstructorDashboardPage })),
                            },
                            {
                                path: "/instructor/courses",
                                lazy: () => import("@/features/instructor/pages/InstructorCoursePage").then((m) => ({ Component: m.InstructorCoursePage })),
                            },
                            {
                                path: "/instructor/courses/new",
                                lazy: () => import("@/features/instructor/pages/InstructorCourseEditorPage").then((m) => ({ Component: m.InstructorCourseEditorPage })),
                            },
                            {
                                path: "/instructor/courses/:courseId",
                                lazy: () => import("@/features/instructor/pages/InstructorCourseEditorPage").then((m) => ({ Component: m.InstructorCourseEditorPage })),
                            },
                            {
                                path: "/instructor/courses/:courseId/curriculum",
                                lazy: () => import("@/features/instructor/pages/InstructorCurriculumPage").then((m) => ({ Component: m.InstructorCurriculumPage })),
                            },
                            {
                                path: "/instructor/courses/:courseId/quizzes",
                                lazy: () => import("@/features/instructor/pages/InstructorQuizWorkspacePage").then((m) => ({ Component: m.InstructorQuizWorkspacePage })),
                            },
                            {
                                path: "/instructor/courses/:courseId/assessments",
                                lazy: () => import("@/features/instructor/pages/InstructorAssessmentWorkspacePage").then((m) => ({ Component: m.InstructorAssessmentWorkspacePage })),
                            },
                            {
                                path: "/instructor/courses/:courseId/analytics",
                                lazy: () => import("@/features/instructor/pages/InstructorCourseAnalyticsPage").then((m) => ({ Component: m.InstructorCourseAnalyticsPage })),
                            },
                            {
                                path: "/instructor/courses/:courseId/outcomes",
                                lazy: () => import("@/features/instructor/pages/InstructorCourseOutcomesPage").then((m) => ({ Component: m.InstructorCourseOutcomesPage })),
                            },
                            {
                                path: "/instructor/students",
                                lazy: () => import("@/features/instructor/pages/InstructorStudentsPage").then((m) => ({ Component: m.InstructorStudentsPage })),
                            },
                            {
                                path: "/instructor/students/:studentId",
                                lazy: () => import("@/features/instructor/pages/InstructorStudentProfilePage").then((m) => ({ Component: m.InstructorStudentProfilePage })),
                            },
                            { path: "/instructor/messages", element: <MessagesPage basePath="/instructor" getProfilePath={(participant) => participant.role === "Student" && participant.user_id ? `/instructor/students/${participant.user_id}` : null} /> },
                            { path: "/instructor/announcements", element: <MessagesPage mode="announcements" basePath="/instructor" announceHref="/instructor/announcements/new" /> },
                            { path: "/instructor/announcements/new", lazy: () => import("@/features/instructor/pages/InstructorAnnouncementsPage").then((m) => ({ Component: m.InstructorAnnouncementsPage })) },
                            ...staffHubRoutes("/instructor/staff-hub"),
                            { path: "/instructor/diagnostics", lazy: () => import("@/features/instructor/pages/InstructorDiagnosticsPage").then((m) => ({ Component: m.InstructorDiagnosticsPage })) },
                            { path: "/instructor/simulator", lazy: () => import("@/features/instructor/pages/InstructorSimulatorPage").then((m) => ({ Component: m.InstructorSimulatorPage })) },
                            // The old localStorage "lounge" feed was retired in
                            // favour of the real Staff Room — keep the URL alive.
                            { path: "/instructor/lounge", element: <Navigate to="/instructor/staff-hub/room" replace /> },
                            { path: "/instructor/revenue", lazy: () => import("@/features/instructor/pages/InstructorRevenuePage").then((m) => ({ Component: m.InstructorRevenuePage })) },
                            { path: "/instructor/profile", lazy: () => import("@/features/instructor/pages/InstructorProfilePage").then((m) => ({ Component: m.InstructorProfilePage })) },
                            { path: "/instructor/settings", lazy: () => import("@/features/instructor/pages/InstructorSettingsPage").then((m) => ({ Component: m.InstructorSettingsPage })) },
                        ],
                    },
                ],
            },
        ],
    },
];
