import { api } from "@/lib/api/client";

export interface ReferralStats {
    code: string | null;
    invites: number;
    xp_earned: number;
    reward_xp: number;
}

export const referralsApi = {
    stats: () => api<ReferralStats>("/v1/referrals", { method: "POST", body: {} }),
};
