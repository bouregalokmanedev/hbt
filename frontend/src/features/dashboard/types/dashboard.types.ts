import type {
    User,
} from "@/features/auth/types/auth.types";
import { ReactNode } from "react";

export interface DashboardStats {
    active_courses: number;
    completed_courses: number;
    learning_hours: number;
    certificates: number;
    current_progress: number;
}

export interface CurrentLearningItem {
    id: string;
    title: string;
    progress: number;
}

export interface UpcomingAssessment {
    id: string;
    title: string;
    date: string;
}

export interface RecentActivityItem {
    id: string;
    description: string;
    event?: string;
    created_at: string;
}


export interface WeeklyActivity {
    date: string;
    day: string;
    minutes: number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    progress: number;
    target: number;
    completed: boolean;
}

export interface AIMentor {
    description: ReactNode;
    title: ReactNode;
    available: boolean;
    message: string;

    recommendation: {
        type:
            | "course"
            | "lesson"
            | "assessment"
            | null;

        id: string | null;

        title: string | null;
    } | null;

    queries_remaining: number;
}

export interface SkillGap {
    type: "quiz" | "lesson" | string;
    title: string;
    course_title: string;
    score: number | null;
    required: number | null;
    action_url: string;
}

export interface ReviewDueItem {
    id: string;
    title: string;
    course_title: string;
    wrong_count: number;
    action_url: string;
}

/** POST /v1/referrals — invite code plus funnel stats for the invite card. */
export interface ReferralSummary {
    code: string;
    invites: number;
    xp_earned: number;
    reward_xp: number;
}

export interface CohortOverview {
    total_enrollments: number;
    by_status: Record<string, number>;
    avg_progress: number;
    courses: number;
}

export interface DashboardData {
    user: User;
    stats: DashboardStats;
    current_learning: CurrentLearningItem[];
    upcoming_assessments: UpcomingAssessment[];
    recent_activity: RecentActivityItem[];
    weekly_activity: WeeklyActivity[];
    achievements: Achievement[];
    progression: { total_xp: number; level: number; title: string; next_level_xp: number; next_level_title: string; progress_percent: number; current_streak: number; longest_streak: number; last_activity_date: string | null; learning_days: Array<{ date: string; active: boolean }>; recent_awards: Array<{ id: string; event: string; xp: number; metadata?: { label?: string }; created_at: string }> };
    ai_mentor: AIMentor;
    skill_gaps?: SkillGap[];
    review_due?: ReviewDueItem[];
    cohort_overview?: CohortOverview | null;
}
