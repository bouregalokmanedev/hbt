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
}
