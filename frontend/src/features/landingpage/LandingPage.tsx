import HeroSection from "@/features/landingpage/components/Hero";
import VisionSection from "@/features/landingpage/components/VisionSection";
import { LandingMarquee } from "./components/landing-ui";
import { SimulatorSection } from "./components/SimulatorSection";
import { CoursesSection } from "./components/CourseSection";
import CertificationSection  from "./components/CertificationSection";
import  CTASection  from "./components/FinalCTA";
import { Footer } from "./components/FooterSection";
import AIMentorSection from "./components/AiMentorSection";
import StudentProof from "./components/StudentProof";
import { useTranslation } from "react-i18next";
import { env } from "@/config/env";
import { usePageMeta } from "@/lib/page-meta";

export function LandingPage() {
    const { t } = useTranslation();

    usePageMeta({
        title: `${env.appName} — Learn. Practice. Diagnose.`,
        description: t("landingPage.hero.headline"),
    });

    return (
        <>
            <main>
                <HeroSection />
                <LandingMarquee />
                <VisionSection />
                <SimulatorSection />
                <CoursesSection />
                <CertificationSection />
                <AIMentorSection />
                <StudentProof />
                <CTASection />

            </main>
            <Footer />
        </>
    );
}
