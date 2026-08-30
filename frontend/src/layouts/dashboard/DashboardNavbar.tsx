import { Menu } from "lucide-react";

import {
    useLocation,
} from "react-router-dom";

import {
    useAuth,
} from "@/features/auth/hooks/useAuth";
import { NotificationMenu } from "@/features/notifications/components/NotificationMenu";

interface DashboardNavbarProps {
    onMenuClick: () => void;
}

interface SectionConfig {
    title: string;
    description: string;
}


const sectionConfig: Record<
    string,
    SectionConfig
> = {
    "/dashboard": {
        title: "Learning Dashboard",
        description: "Continue your learning journey",
    },

    "/my-courses": {
        title: "My Courses",
        description: "Continue learning and track your progress",
    },

    "/catalog": {
        title: "Course Catalog",
        description: "Explore courses and expand your skills",
    },

    "/assessments": {
        title: "Assessments",
        description: "Test your knowledge and diagnostic skills",
    },

    "/achievements": {
        title: "Achievements",
        description: "Track your learning milestones",
    },

    "/certificates": {
        title: "Certificates",
        description: "View your earned certificates",
    },

    "/simulator": {
        title: "Simulator",
        description: "Practice real-world diagnostic scenarios",
    },

    "/ai-mentor": {
        title: "AI Mentor",
        description: "Get personalized help with your learning",
    },

    "/messages": {
        title: "Messages",
        description: "Stay connected with your learning community",
    },

    "/announcements": {
        title: "Announcements",
        description: "Stay up to date with HBT Learning",
    },

    "/favourite": {
        title: "Favourite",
        description: "Access your saved learning resources",
    },

    "/subscription": {
        title: "Subscription",
        description: "Manage your HBT learning plan",
    },

    "/settings": {
        title: "Settings",
        description: "Manage your account preferences",
    },

    "/profile": {
        title: "Profile",
        description: "Manage your personal information",
    },
};

export function DashboardNavbar({
    onMenuClick,
}: DashboardNavbarProps) {
    const location = useLocation();

    const {
        user,
    } = useAuth();

    const currentSection =
        sectionConfig[location.pathname] ??
        sectionConfig["/dashboard"];

    const firstName =
        user?.first_name ?? "";

    const lastName =
        user?.last_name ?? "";

    const fullName =
        `${firstName} ${lastName}`.trim();

    const initials =
        `${firstName.charAt(0)}${lastName.charAt(0)}`
            .toUpperCase();

    const role =
        user?.roles?.[0] ?? "Student";

    return (
        <header
            className="
                sticky
                top-0
                z-30
                flex
                h-[72px]
                shrink-0
                items-center
                border-b
                border-[#3A3A3A]/8
                bg-white/90
                transition-colors
        duration-300
                px-5
                backdrop-blur-xl
                sm:px-7
                lg:px-8
            "
        >
            <div className="flex w-full items-center justify-between gap-5">
                {/* ================================================== */}
                {/* LEFT SIDE */}
                {/* ================================================== */}

                <div className="flex min-w-0 items-center gap-3">
                    {/* Mobile menu */}
                    <button
                        type="button"
                        onClick={onMenuClick}
                        aria-label="Open navigation"
                        className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            text-[#3A3A3A]/50
                            transition
                            hover:bg-[#3A3A3A]/5
                            hover:text-[#3A3A3A]
                            lg:hidden
                        "
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Current section */}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="
                                truncate
                                text-sm
                                font-semibold
                                text-[#3A3A3A]
                                sm:text-[15px]
                            ">
                                {currentSection.title}
                            </h1>

                            <span className="
                                hidden
                                h-1
                                w-1
                                shrink-0
                                rounded-full
                                bg-[#F47822]
                                sm:block
                            " />
                        </div>

                        <p className="
                            mt-0.5
                            hidden
                            truncate
                            text-[10px]
                            text-[#3A3A3A]/40
                            sm:block
                        ">
                            {currentSection.description}
                        </p>
                    </div>
                </div>

                {/* ================================================== */}
                {/* RIGHT SIDE */}
                {/* ================================================== */}

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <NotificationMenu />

                    {/* Divider */}
                    <div className="
                        mx-1
                        hidden
                        h-7
                        w-px
                        bg-[#3A3A3A]/8
                        sm:block
                    " />

                    {/* Profile */}
                    <button
                        type="button"
                        className="
                            group
                            flex
                            items-center
                            gap-2.5
                            rounded-xl
                            px-1.5
                            py-1
                            transition
                            hover:bg-[#3A3A3A]/5
                        "
                    >
                        {/* Avatar */}
                        <div className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-[#F47822]/10
                            text-[10px]
                            font-bold
                            text-[#F47822]
                            ring-1
                            ring-[#F47822]/10
                        ">
                            {initials || "U"}
                        </div>

                        {/* User information */}
                        <div className="
                            hidden
                            min-w-0
                            text-left
                            sm:block
                        ">
                            <p className="
                                max-w-[120px]
                                truncate
                                text-[11px]
                                font-semibold
                                leading-4
                                text-[#3A3A3A]
                            ">
                                {fullName || "Student"}
                            </p>

                            <p className="
                                text-[9px]
                                font-medium
                                leading-3
                                text-[#3A3A3A]/40
                            ">
                                {role}
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        </header>
    );
}
