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
import { Navigate } from "react-router-dom";
import { VerifyCertificatePage } from "@/features/verify-certificate/pages/VerifyCertificatePage";
import { LegalPage } from "@/features/legal/LegalPage";
import { DemoExperiencePage, AiMentorIntroPage } from "@/features/demo";

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
                path: "/demo",
                element: <DemoExperiencePage />,
            },
            {
                path: "/ai-mentor/intro",
                element: <AiMentorIntroPage />,
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
                path: "/store",
                element: <Navigate to="/catalog" replace />,
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
                path:"/verify-certificate",
                element:
                <VerifyCertificatePage />
            },
            {
                path:"/verify-certificate/:certificateNumber",
                element:
                <VerifyCertificatePage />
            },
            // Short shareable form used by the certificate share button.
            {
                path:"/verify/:certificateNumber",
                element:
                <VerifyCertificatePage />
            },
            {
                path:"/privacy",
                element:
                <LegalPage page="privacy" />
            },
            {
                path:"/terms",
                element:
                <LegalPage page="terms" />
            },
            {
                path:"/cookies",
                element:
                <LegalPage page="cookies" />
            },
            {
                path: "/dev/ui",
                element: <UiShowcasePage />,
            },
        ],
    },
];
