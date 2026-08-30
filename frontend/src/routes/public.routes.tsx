import type { RouteObject } from "react-router-dom";

import { UiShowcasePage } from "@/features/dev";
import { PublicLayout } from "@/layouts/PublicLayout";
import { CoursesPage } from "@/features/courses";
import { CourseDetailsPage } from "@/features/courses/pages/CourseDetailsPage";
import { LessonPlayerPage } from "@/features/lessons/pages/LessonPlayerPage";
import { QuizPlayerPage } from "@/features/lessons/pages/QuizPlayerPage";
import { LandingPage } from "@/features/landingpage/LandingPage";
import { CompanyPage } from "@/features/company/CompanyPage";
import { ContactPage } from "@/features/contact/ContactPage";
import { PricingPage } from "@/features/pricing/PricingPage";
import { ComingSoonPage } from "@/features/landingpage/CommingSoon";

function HomePage() {
  return <LandingPage />
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
            { path: "/courses/:courseId/quizzes/:quizId", element: <QuizPlayerPage /> },
            {
                path:"/company",
                element:
                <CompanyPage />
            },
            {
                path:"/store",
                element:
                <ComingSoonPage />
            },
            {
                path:"/contact",
                element:
                <ContactPage />
            },
            {
                path:"/pricing",
                element:
                <PricingPage />
            },
            {
                path: "/dev/ui",
                element: <UiShowcasePage />,
            },
        ],
    },
];
