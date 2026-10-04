import type { RouteObject } from "react-router-dom";

import { PublicLayout } from "@/layouts/PublicLayout";
import { Navigate } from "react-router-dom";
import { LegalPage } from "@/features/legal/LegalPage";

export const publicRoutes: RouteObject[] = [
    {
        element: <PublicLayout />,
        children: [
            {
                path: "/",
                lazy: () => import("@/features/landingpage/LandingPage").then((m) => ({ Component: m.LandingPage })),
            },
            {
                path: "/demo",
                lazy: () => import("@/features/demo/pages/DemoExperiencePage").then((m) => ({ Component: m.DemoExperiencePage })),
            },
            {
                path: "/ai-mentor/intro",
                lazy: () => import("@/features/demo/pages/AiMentorIntroPage").then((m) => ({ Component: m.AiMentorIntroPage })),
            },
            {
                path: "/catalog",
                lazy: () => import("@/features/courses/pages/CoursesPage").then((m) => ({ Component: m.CoursesPage })),
            },
            {
                path:"/courses/:id",
                lazy: () => import("@/features/courses/pages/CourseDetailsPage").then((m) => ({ Component: m.CourseDetailsPage }))
            },
            {
                path:"/courses/:courseId/lessons/:lessonId",
                lazy: () => import("@/features/lessons/pages/LessonPlayerPage").then((m) => ({ Component: m.LessonPlayerPage }))
            },
            { path: "/courses/:courseId/quizzes/:quizId", lazy: () => import("@/features/lessons/pages/QuizPlayerPage").then((m) => ({ Component: m.QuizPlayerPage })) },
            {
                path:"/company",
                lazy: () => import("@/features/company/CompanyPage").then((m) => ({ Component: m.CompanyPage }))
            },
            {
                path: "/store",
                element: <Navigate to="/catalog" replace />,
            },
            {
                path:"/contact",
                lazy: () => import("@/features/contact/ContactPage").then((m) => ({ Component: m.ContactPage }))
            },
            {
                path: "/help",
                lazy: () => import("@/features/help/pages/HelpCenterPage").then((m) => ({ Component: m.HelpCenterPage })),
            },
            {
                path: "/help/track",
                lazy: () => import("@/features/help/pages/TicketTrackPage").then((m) => ({ Component: m.TicketTrackPage })),
            },
            {
                path: "/help/:slug",
                lazy: () => import("@/features/help/pages/HelpArticlePage").then((m) => ({ Component: m.HelpArticlePage })),
            },
            {
                path:"/pricing",
                lazy: () => import("@/features/pricing/PricingPage").then((m) => ({ Component: m.PricingPage }))
            },
            {
                path:"/verify-certificate",
                lazy: () => import("@/features/verify-certificate/pages/VerifyCertificatePage").then((m) => ({ Component: m.VerifyCertificatePage }))
            },
            {
                path:"/verify-certificate/:certificateNumber",
                lazy: () => import("@/features/verify-certificate/pages/VerifyCertificatePage").then((m) => ({ Component: m.VerifyCertificatePage }))
            },
            // Short shareable form used by the certificate share button.
            {
                path:"/verify/:certificateNumber",
                lazy: () => import("@/features/verify-certificate/pages/VerifyCertificatePage").then((m) => ({ Component: m.VerifyCertificatePage }))
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
                lazy: () => import("@/features/dev/pages/UiShowcasePage").then((m) => ({ Component: m.UiShowcasePage })),
            },
        ],
    },
];
