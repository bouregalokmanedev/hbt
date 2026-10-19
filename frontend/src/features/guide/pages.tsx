import { GuidePage } from "./GuidePage";
import { guideContent, superAdminChapter } from "./content";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function StudentGuidePage() {
    return <GuidePage content={guideContent.student} />;
}

export function InstructorGuidePage() {
    return <GuidePage content={guideContent.instructor} />;
}

export function SupportGuidePage() {
    return <GuidePage content={guideContent.support} />;
}

export function AdminGuidePage() {
    const { user } = useAuth();
    const isSuperAdmin = user?.roles?.includes("Super Admin") ?? false;
    return <GuidePage content={guideContent.admin} extraChapter={isSuperAdmin ? superAdminChapter : null} />;
}

export function MarketingGuidePage() {
    return <GuidePage content={guideContent.sales} />;
}
