import type {
    RouteObject,
} from "react-router-dom";

import {
    AuthGuard,
    RoleGuard,
} from "@/features/auth";

import {
    InstructorDashboardPage,
    InstructorCoursePage,
    InstructorCourseEditorPage,
    InstructorCurriculumPage,
    InstructorQuizWorkspacePage,
    InstructorStudentProfilePage,
    InstructorStudentsPage,
    InstructorCourseAnalyticsPage,
    InstructorCourseOutcomesPage,
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
                            { path: "/instructor/messages", element: <MessagesPage /> },
                            { path: "/instructor/announcements", element: <InstructorAnnouncementsPage /> },
                        ],
                    },
                ],
            },
        ],
    },
];
