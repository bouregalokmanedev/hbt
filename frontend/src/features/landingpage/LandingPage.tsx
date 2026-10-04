import { useEffect } from "react";

import  HeroSection from "@/features/landingpage/components/Hero";
import VisionSection from "@/features/landingpage/components/VisionSection";
import { SimulatorSection } from "./components/SimulatorSection";
import { CoursesSection } from "./components/CourseSection";
import CertificationSection  from "./components/CertificationSection";
import  CTASection  from "./components/FinalCTA";
import { Footer } from "./components/FooterSection";
import AIMentorSection from "./components/AiMentorSection";
import StudentProof from "./components/StudentProof";

/**
 * Scroll rhythm (md+): snap-proximity keeps viewport-sized sections landing
 * one-per-screen while still letting taller, content-sized sections flow
 * through without trapping the scroll. `scroll-p-20` keeps anchors/snaps
 * clear of the fixed navbar (matches the layout's `pt-20`).
 * Below md the page flows naturally.
 */
const SNAP_CLASSES = ["scroll-p-20", "md:snap-y", "md:snap-proximity"];

export function LandingPage() {
    useEffect(() => {
        const root = document.documentElement;
        root.classList.add(...SNAP_CLASSES);
        return () => {
            root.classList.remove(...SNAP_CLASSES);
        };
    }, []);

    return (
        <>
            <main>
                <HeroSection />
                <VisionSection />
                <CTASection />

            </main>
            <Footer />
        </>
    );
}
