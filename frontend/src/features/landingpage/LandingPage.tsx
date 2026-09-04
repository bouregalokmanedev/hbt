
import  HeroSection from "@/features/landingpage/components/Hero";
import { SimulatorSection } from "./components/SimulatorSection";
import { CoursesSection } from "./components/CourseSection";
import { CertificationSection } from "./components/CertificationSection";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/FooterSection";
import { AIMentor } from "./components/AiMentorSection";
import StudentProof from "./components/StudentProof";

export function LandingPage() {
    return (
        <>
            <main>
                <HeroSection />
                <SimulatorSection />
                <CoursesSection />
                <AIMentor />
                <StudentProof />
                <CertificationSection />
                <FinalCTA />
                
            </main>
            <Footer />
        </>
    );
}