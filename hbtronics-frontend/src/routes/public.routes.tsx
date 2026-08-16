import type { RouteObject } from "react-router-dom";

import { UiShowcasePage } from "@/features/dev";
import { PublicLayout } from "@/layouts/PublicLayout";
import { CoursesPage } from "@/features/courses";
import { CourseDetailsPage } from "@/features/courses/pages/CourseDetailsPage";
import { LessonPlayerPage } from "@/features/lessons/pages/LessonPlayerPage";

function HomePage() {
    return <div>HBTronics</div>;
}

export const publicRoutes: RouteObject[] = [
    {
        element: <PublicLayout />,
        children: [
            {
                path: "/",
                element: <HomePage />,
            },
            {
                path: "/catalog",
                element: <CoursesPage />,
            },
            {
                path:"/courses/:id",
                element:<CourseDetailsPage />
            },
            {
                path:"/courses/:courseId/lessons/:lessonId",
                element:
                <LessonPlayerPage />
            },
            {
                path: "/dev/ui",
                element: <UiShowcasePage />,
            },
        ],
    },
];