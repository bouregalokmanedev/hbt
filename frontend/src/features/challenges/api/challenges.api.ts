import { api } from "@/lib/api/client";

export type ChallengeStatus = "pending" | "in_progress" | "completed" | "claimed";

export interface Challenge {
    id: string;
    key: string;
    title: string;
    description: string | null;
    action: string;
    route: string | null;
    xp: number;
    status: ChallengeStatus;
    progress: number;
    target: number;
    completed_at: string | null;
    detail: Record<string, unknown> | null;
}

export interface ChallengeSummary {
    total: number;
    done: number;
    xp_available: number;
    xp_claimed: number;
}

export interface TodayBoard {
    date: string;
    challenges: Challenge[];
    summary: ChallengeSummary;
}

export interface ReviewBoard {
    date: string;
    challenges: Challenge[];
    summary: { total: number; done: number; xp_claimed: number };
}

export interface LeaderboardEntry {
    user_id: string;
    name: string;
    username?: string | null;
    completed: number;
    xp: number;
    last_finished_at?: string | null;
    first_finished_at?: string | null;
}

export interface LeaderboardBoard {
    date: string;
    top: LeaderboardEntry[];
    me: LeaderboardEntry | null;
}

export interface ActivityItem {
    id: string;
    user_id: string;
    name: string;
    challenge: string | null;
    key: string | null;
    action: string | null;
    xp: number;
    status: ChallengeStatus;
    completed_at: string | null;
    detail: Record<string, unknown> | null;
}

export interface Peer {
    user_id: string;
    name: string;
    username?: string | null;
}

export interface Rival {
    id: string;
    date: string | null;
    status: "pending" | "accepted" | "declined";
    direction: "sent" | "received";
    peer: Peer;
    result: RivalResult | null;
}

export interface RivalSide {
    user_id: string;
    name: string;
    username?: string | null;
    completed: number;
    total: number;
    xp_claimed: number;
    last_finished_at: string | null;
    challenges: {
        key: string;
        title: string;
        status: ChallengeStatus;
        progress: number;
        target: number;
        completed_at: string | null;
    }[];
}

export interface RivalResult {
    date: string;
    status: string;
    you: RivalSide;
    them: RivalSide;
    winner: RivalSide | null;
    challenger: RivalSide;
    challenged: RivalSide;
}

export const challengesApi = {
    today: () => api<TodayBoard>("/v1/challenges/today"),
    review: () => api<ReviewBoard>("/v1/challenges/review"),
    leaderboard: (limit = 20) => api<LeaderboardBoard>(`/v1/challenges/leaderboard?limit=${limit}`),
    activity: (limit = 30) => api<ActivityItem[]>(`/v1/challenges/activity?limit=${limit}`),
    peers: () => api<Peer[]>("/v1/challenges/peers"),
    rivals: () => api<Rival[]>("/v1/challenges/rivals"),
    challenge: (userId: string) =>
        api<{ rival: Rival }>("/v1/challenges/rivals", { method: "POST", body: { user_id: userId } }),
    accept: (id: string) =>
        api<{ rival: Rival }>(`/v1/challenges/rivals/${id}/accept`, { method: "POST" }),
    share: (id: string) => api<RivalResult>(`/v1/challenges/rivals/${id}/share`),
    claim: (id: string) =>
        api<{ challenge: Challenge }>(`/v1/challenges/${id}/claim`, { method: "POST" }),
};
