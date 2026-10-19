import type { MarketingOverview } from "../api/marketing.api";

/** Shared Sales-dashboard payload for page smoke tests. */
export const overviewFixture: MarketingOverview = {
    revenue_today: 50000,
    revenue_7d: 250000,
    revenue_prev_7d: 200000,
    pending_orders: 44,
    signups_7d: 8,
    signups_prev_7d: 4,
    enrollments_7d: 3,
    enrollments_prev_7d: 1,
    published_courses: 6,
    active_campaigns: 2,
    live_campaigns: 1,
    referral_signups: 5,
    leads: 3,
    unread_leads: 1,
    visitors_7d: 120,
    visitors_prev_7d: 100,
    currency: "DZD",
    revenue_series: Array.from({ length: 14 }, (_, index) => ({
        date: `2026-10-${String(index + 1).padStart(2, "0")}`,
        value: index * 1000,
    })),
    signups_series: Array.from({ length: 14 }, (_, index) => ({
        date: `2026-10-${String(index + 1).padStart(2, "0")}`,
        value: index % 3,
    })),
    funnel: { visitors: 100, course_views: 40, signups: 8, enrollments: 3, paid_orders: 1 },
    pipeline: {
        by_stage: { new: 2, contacted: 1, qualified: 0, proposal: 0, won: 1, lost: 1 },
        due_today: 1,
        overdue: 0,
        hot: 1,
        won_30d: 1,
        lost_30d: 1,
        win_rate: 50,
        top_sources: [{ source: "contact_form", total: 2 }],
    },
    activity: [
        {
            type: "signup",
            title: "Amine Test",
            subtitle: "amine@example.com",
            at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
    ],
    top_countries: [
        { country: "DZ", events: 90, visitors: 60 },
        { country: "FR", events: 30, visitors: 20 },
    ],
};
