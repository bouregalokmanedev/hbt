
import  HeroSection from "@/features/landingpage/components/Hero";
import VisionSection from "@/features/landingpage/components/VisionSection";
import { SimulatorSection } from "./components/SimulatorSection";
import { CoursesSection } from "./components/CourseSection";
import CertificationSection  from "./components/CertificationSection";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/FooterSection";
import AIMentorSection from "./components/AiMentorSection";
import StudentProof from "./components/StudentProof";

export function LandingPage() {
    return (
        <>
            <main>
                <HeroSection />
                <VisionSection />
                <SimulatorSection />
                <CoursesSection />
                <AIMentorSection />
                <StudentProof />
                <CertificationSection />
                <FinalCTA />
                
            </main>
            <Footer />
        </>
    );
}