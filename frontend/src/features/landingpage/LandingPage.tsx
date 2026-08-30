
import { Hero } from "@/features/landingpage/components/Hero";
import { SimulatorSection } from "./components/SimulatorSection";
import { CoursesSection } from "./components/CourseSection";
import { CertificationSection } from "./components/CertificationSection";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/FooterSection";
import { AIMentor } from "./components/AiMentorSection";

export function LandingPage() {
    return (
        <>
            <main>
                <Hero />
                <SimulatorSection />
                <CoursesSection />
                <AIMentor />
                <CertificationSection />
                <FinalCTA />
                
            </main>
            <Footer />
        </>
    );
}