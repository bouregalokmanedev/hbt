import  HeroSection from "@/features/landingpage/components/Hero";
import VisionSection from "@/features/landingpage/components/VisionSection";
import { LandingMarquee } from "./components/landing-ui";
import { SimulatorSection } from "./components/SimulatorSection";
import { CoursesSection } from "./components/CourseSection";
import CertificationSection  from "./components/CertificationSection";
import  CTASection  from "./components/FinalCTA";
import { Footer } from "./components/FooterSection";
import AIMentorSection from "./components/AiMentorSection";
import StudentProof from "./components/StudentProof";

export function LandingPage() {
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
