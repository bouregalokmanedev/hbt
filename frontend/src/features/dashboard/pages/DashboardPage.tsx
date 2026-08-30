import {
    RefreshCw,
} from "lucide-react";
import { ComingSoonCards } from "../components/ComingSoonCards";
import {
    DashboardHeader,
} from "../components/DashboardHeader";

import {
    DashboardStats,
} from "../components/DashboardStats";

import {
    CurrentLearning,
} from "../components/CurrentLearning";

import {
    UpcomingAssessments,
} from "../components/UpcomingAssessments";

import {
    RecentActivity,
} from "../components/RecentActivity";

import {
    useDashboard,
} from "../hooks/useDashboard";
import { WeeklyActivity } from "../components/WeeklyActivity";
import { Achievements } from "../components/Achievements";
import { AiMentorCard } from "../components/AiMentorCard";
import { BadgeUnlockedModal } from "../components/BadgeUnlockedModal";

export function DashboardPage() {
    const {
        dashboard,
        isLoading,
        error,
        refetch,
    } = useDashboard();

    if (isLoading && !dashboard) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#F47822]/20 border-t-[#F47822]" />

                    <p className="mt-4 text-sm text-[#3A3A3A]/50">
                        Loading your dashboard...
                    </p>
                </div>
            </div>
        );
    }

    if (error && !dashboard) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-5">
                <div className="max-w-md text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
                        <RefreshCw
                            className="h-6 w-6"
                        />
                    </div>

                    <h1 className="mt-5 text-xl font-bold text-[#3A3A3A]">
                        Unable to load your dashboard
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/50">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={refetch}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(244,120,34,0.18)] transition hover:bg-[#E96D18]"
                    >
                        <RefreshCw
                            className="h-4 w-4"
                        />

                        Try again
                    </button>
                </div>
            </div>
        );
    }

    if (!dashboard) {
        return null;
    }

    return (
        <main
    className="
        min-h-full
        bg-background
    "
>
            <div className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
                <div className="space-y-6">
                    <DashboardHeader
                        user={dashboard.user}
                        progression={dashboard.progression}
                    />

                    <DashboardStats
                        stats={dashboard.stats}
                    />

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
                        <CurrentLearning
                            courses={
                                dashboard.current_learning
                            }
                        />

                        <UpcomingAssessments
                            assessments={
                                dashboard.upcoming_assessments
                            }
                        />
                    </div>

                    <RecentActivity
                        activities={
                            dashboard.recent_activity
                        }
                    />
                    
                    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
    <WeeklyActivity
        activity={
            dashboard.weekly_activity
        }
    />
    

    <Achievements
        achievements={
            dashboard.achievements
        }
    />
    
</div>

<AiMentorCard
    mentor={dashboard.ai_mentor}
/>
<ComingSoonCards />
                </div>
            </div>
            <BadgeUnlockedModal
                userId={dashboard.user.id}
                achievements={dashboard.achievements}
            />
        </main>
    );
}
