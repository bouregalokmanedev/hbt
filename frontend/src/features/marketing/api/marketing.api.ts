import { env } from "@/config/env";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { handleUnauthorizedResponse } from "@/lib/api/unauthorized";
import { authStorage } from "@/lib/storage/auth-storage";

export interface MarketingOverview {
    revenue_today: number;
    revenue_7d: number;
    revenue_prev_7d: number;
    pending_orders: number;
    signups_7d: number;
    signups_prev_7d: number;
    enrollments_7d: number;
    enrollments_prev_7d: number;
    published_courses: number;
    active_campaigns: number;
    live_campaigns: number;
    referral_signups: number;
    leads: number;
    unread_leads: number;
    visitors_7d: number;
    visitors_prev_7d: number;
    currency: string;
    revenue_series: Array<{ date: string; value: number }>;
    signups_series: Array<{ date: string; value: number }>;
    funnel: {
        visitors: number;
        course_views: number;
        signups: number;
        enrollments: number;
        paid_orders: number;
    };
    activity: Array<{ type: "signup" | "lead" | "order"; title: string; subtitle: string; at: string }>;
    pipeline: {
        by_stage: Record<string, number>;
        due_today: number;
        overdue: number;
        hot: number;
        won_30d: number;
        lost_30d: number;
        win_rate: number | null;
        top_sources: Array<{ source: string; total: number }>;
    };
    top_countries: Array<{ country: string | null; events: number; visitors: number }>;
}

export interface Discount {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    type: "percent" | "fixed";
    value: number;
    currency: string | null;
    applies_to: "all" | "courses" | "plans";
    course_ids: string[];
    starts_at: string | null;
    ends_at: string | null;
    max_uses: number | null;
    used_count: number;
    active: boolean;
    live: boolean;
    created_at: string | null;
}

export interface FeaturedSlot {
    id: string;
    course_id: string;
    course_title: string | null;
    position: number;
    badge_label: string | null;
    active: boolean;
}

export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";

export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "proposal", "won", "lost"];

export interface LeadOwner {
    id: string;
    name: string;
    email: string;
}

export interface Lead {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    inquiry: string | null;
    subject: string | null;
    message: string | null;
    status: LeadStatus;
    score: number;
    source: string | null;
    course_interest: string | null;
    owner: LeadOwner | null;
    utm: { source: string | null; medium: string | null; campaign: string | null; term: string | null; content: string | null };
    next_follow_up_at: string | null;
    closed_at: string | null;
    lost_reason: string | null;
    overdue: boolean;
    converted: boolean;
    read: boolean;
    activities_count: number;
    created_at: string | null;
}

export interface LeadActivityRow {
    id: string;
    type: string;
    body: string | null;
    by: string | null;
    at: string | null;
}

export interface LeadJourneyEvent {
    event: string;
    page: string | null;
    country: string | null;
    properties: Record<string, unknown> | null;
    at: string | null;
}

export interface LeadDetail extends Lead {
    activities: LeadActivityRow[];
    journey: LeadJourneyEvent[];
    account: {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
        created_at: string | null;
        enrollments: number;
        paid_total: number;
    } | null;
}

export interface LeadSummary {
    total: number;
    unread: number;
    converted: number;
    by_stage: Record<string, number>;
    due_today: number;
    overdue: number;
    hot: number;
    won_30d: number;
    sources: Array<{ source: string; total: number }>;
}

export interface LeadList {
    data: Lead[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
    summary: LeadSummary;
}

export interface ConvertedUser {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    country: string | null;
    joined_at: string | null;
    source: string | null;
    course_interest: string | null;
    lead_status: string | null;
    enrollments: number;
    first_course: string | null;
    paid_total: number;
}

export interface ConvertedList {
    data: ConvertedUser[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export interface BroadcastRow {
    id: string;
    audience: string;
    title: string;
    created_at: string | null;
}

export interface ReferralOverview {
    total_referral_signups: number;
    ambassadors: number;
    top: Array<{ name: string | null; email: string | null; code: string | null; invites: number }>;
}

export interface RepPerformance {
    id: string;
    name: string;
    email: string;
    open: number;
    won_month: number;
    lost_month: number;
    due_today: number;
    overdue: number;
    quota_target: number;
    quota_progress: number | null;
}

export interface PerformanceOverview {
    month: string;
    reps: RepPerformance[];
}

export interface FunnelStage {
    key: string;
    phase: "discovery" | "conversion";
    label: string;
    value: number;
}

export interface VisitorAnalytics {
    days: number;
    visitors: number;
    top_pages: Array<{ page: string | null; views: number; visitors: number }>;
    top_clicks: Array<{ page: string | null; clicks: number; visitors: number }>;
    avg_seconds_on_page: number;
    countries: Array<{ country: string | null; events: number; visitors: number }>;
    regions: Array<{ region: string; visitors: number; countries: number }>;
    languages: Array<{ language: string; events: number; visitors: number }>;
    funnel_stages: FunnelStage[];
}

/**
 * Raw fetch that keeps the full payload — the leads index returns
 * `{ data, meta, summary }` and unwrapping would drop meta/summary.
 */
async function raw<T>(endpoint: string, init: RequestInit = {}, body?: unknown): Promise<T> {
    const token = authStorage.getToken();
    const headers = new Headers({ Accept: "application/json" });
    if (body !== undefined) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(`${env.apiUrl}${endpoint}`, {
        ...init,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    if (!response.ok) {
        handleUnauthorizedResponse(response.status, Boolean(token));
        throw new ApiError(
            (payload && typeof payload.message === "string" && payload.message) || "Request failed.",
            response.status,
        );
    }
    return payload as T;
}

export const marketingApi = {
    overview: () => api<MarketingOverview>("/v1/marketing/overview"),
    analytics: (days = 7) => api<VisitorAnalytics>(`/v1/marketing/analytics?days=${days}`),
    discounts: () => api<Discount[]>("/v1/marketing/discounts"),
    createDiscount: (body: Record<string, unknown>) =>
        api<Discount>("/v1/marketing/discounts", { method: "POST", body }),
    updateDiscount: (id: string, body: Record<string, unknown>) =>
        api<Discount>(`/v1/marketing/discounts/${id}`, { method: "PATCH", body }),
    deleteDiscount: (id: string) => api<unknown>(`/v1/marketing/discounts/${id}`, { method: "DELETE" }),
    featured: () => api<FeaturedSlot[]>("/v1/marketing/featured"),
    addFeatured: (body: { course_id: string; position?: number; badge_label?: string }) =>
        api<FeaturedSlot>("/v1/marketing/featured", { method: "POST", body }),
    updateFeatured: (id: string, body: Record<string, unknown>) =>
        api<FeaturedSlot>(`/v1/marketing/featured/${id}`, { method: "PATCH", body }),
    removeFeatured: (id: string) => api<unknown>(`/v1/marketing/featured/${id}`, { method: "DELETE" }),
    leads: (query = "") => raw<LeadList>(`/v1/marketing/leads${query}`),
    lead: (id: number | string) => api<LeadDetail>(`/v1/marketing/leads/${id}`),
    createLead: (body: Record<string, unknown>) => api<Lead>("/v1/marketing/leads", { method: "POST", body }),
    updateLead: (id: number | string, body: Record<string, unknown>) =>
        api<Lead>(`/v1/marketing/leads/${id}`, { method: "PATCH", body }),
    deleteLead: (id: number | string) => api<unknown>(`/v1/marketing/leads/${id}`, { method: "DELETE" }),
    readLead: (id: number | string) => api<Lead>(`/v1/marketing/leads/${id}/read`, { method: "PATCH", body: {} }),
    addLeadActivity: (id: number | string, body: { type: string; body: string }) =>
        api<LeadActivityRow>(`/v1/marketing/leads/${id}/activities`, { method: "POST", body }),
    team: () => api<LeadOwner[]>("/v1/marketing/leads/team"),
    /** CSV export: bearer auth means we stream the blob instead of linking. */
    exportLeadsCsv: async (query = "") => {
        const token = authStorage.getToken();
        const response = await fetch(`${env.apiUrl}/v1/marketing/leads/export${query}`, {
            headers: { Accept: "text/csv", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!response.ok) throw new ApiError("Export failed.", response.status);
        return response.blob();
    },
    importLeads: (file: File) => {
        const token = authStorage.getToken();
        const form = new FormData();
        form.append("file", file);
        return fetch(`${env.apiUrl}/v1/marketing/leads/import`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: form,
        }).then(async (response) => {
            const payload = (await response.json().catch(() => null)) as { message?: string; data?: { created: number; skipped: number } } | null;
            if (!response.ok || !payload) throw new ApiError(payload?.message || "Import failed.", response.status);
            return payload;
        });
    },
    convertedUsers: (query = "") => raw<ConvertedList>(`/v1/marketing/converted-users${query}`),
    performance: () => api<PerformanceOverview>("/v1/marketing/performance"),
    setQuota: (body: { user_id: string; target: number }) =>
        api<{ user_id: string; year_month: string; target: number }>("/v1/marketing/performance/quota", {
            method: "PUT",
            body,
        }),
    broadcasts: () => api<BroadcastRow[]>("/v1/marketing/broadcasts"),
    sendBroadcast: (body: Record<string, unknown>) =>
        api<unknown>("/v1/marketing/broadcasts", { method: "POST", body }),
    referrals: () => api<ReferralOverview>("/v1/marketing/referrals"),
};
