import { Home, Menu } from "lucide-react";

import { Link, useLocation } from "react-router-dom";
import { NotificationMenu } from "@/features/notifications/components/NotificationMenu";

interface DashboardNavbarProps {
  onMenuClick: () => void;
}

interface SectionConfig {
  title: string;
  description: string;
}

const sectionConfig: Record<string, SectionConfig> = {
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

export function DashboardNavbar({ onMenuClick }: DashboardNavbarProps) {
  const location = useLocation();

  const currentSection =
    sectionConfig[location.pathname] ?? sectionConfig["/dashboard"];

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
              <h1
                className="
                                truncate
                                text-sm
                                font-semibold
                                text-[#3A3A3A]
                                sm:text-[15px]
                            "
              >
                {currentSection.title}
              </h1>

              <span
                className="
                                hidden
                                h-1
                                w-1
                                shrink-0
                                rounded-full
                                bg-[#F47822]
                                sm:block
                            "
              />
            </div>

            <p
              className="
                            mt-0.5
                            hidden
                            truncate
                            text-[10px]
                            text-[#3A3A3A]/40
                            sm:block
                        "
            >
              {currentSection.description}
            </p>
          </div>
        </div>

        {/* ================================================== */}
        {/* RIGHT SIDE */}
        {/* ================================================== */}

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            to="/"
            aria-label="Go to home page"
            className="grid h-9 w-9 place-items-center rounded-xl border border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/60 shadow-[0_4px_12px_rgba(58,58,58,.04)] transition-all hover:-translate-y-0.5 hover:border-[#F47822]/35 hover:bg-[#FFF8F4] hover:text-[#F47822]"
          >
            <Home className="h-4 w-4" />
          </Link>
          <NotificationMenu />
        </div>
      </div>
    </header>
  );
}
