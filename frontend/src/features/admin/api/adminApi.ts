import { env } from "@/config/env";
import { ApiError } from "@/lib/api/errors";
import { api } from "@/lib/api/client";
import { authStorage } from "@/lib/storage/auth-storage";

import type {
    AdminActivity,
    AdminBroadcast,
    AdminCourse,
    AdminDashboard,
    AdminEnrollment,
    AdminUser,
    AnalyticsResponse,
    AuditSummary,
    Paginated,
    SystemHealth,
    SystemStatistics,
} from "../types/admin";

type Query = Record<string, string | number | boolean | undefined>;

function queryString(query: Query = {}): string {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== "") params.set(key, String(value));
    });
    return params.size ? `?${params.toString()}` : "";
}

async function paginated<T>(path: string, query?: Query): Promise<Paginated<T>> {
    const token = authStorage.getToken();
    const response = await fetch(`${env.apiUrl}${path}${queryString(query)}`, {
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const payload = await response.json().catch(() => null) as Paginated<T> | { message?: string } | null;
    if (!response.ok) throw new ApiError(payload && "message" in payload && payload.message ? payload.message : "Unable to load administration data.", response.status);
    return payload as Paginated<T>;
}

export const adminApi = {
    dashboard: () => api<AdminDashboard>("/v1/admin/dashboard"),
    users: (query?: Query) => paginated<AdminUser>("/v1/admin/users", query),
    courses: (query?: Query) => paginated<AdminCourse>("/v1/admin/courses", query),
    enrollments: (query?: Query) => paginated<AdminEnrollment>("/v1/admin/enrollments", query),
    activity: (query?: Query) => paginated<AdminActivity>("/v1/admin/activity", query),
    broadcasts: (query?: Query) => paginated<AdminBroadcast>("/v1/admin/notifications/broadcasts", query),
    analytics: (kind: "users" | "courses" | "enrollments" | "learning", query?: Query) => api<AnalyticsResponse>(`/v1/admin/analytics/${kind}${queryString(query)}`),
    systemHealth: () => api<SystemHealth>("/v1/admin/system/health"),
    systemStatistics: () => api<SystemStatistics>("/v1/admin/system/statistics"),
    auditSummary: () => api<AuditSummary>("/v1/admin/system/audit-log"),
    suspendUser: (id: string) => api<AdminUser>(`/v1/admin/users/${id}/suspend`, { method: "PATCH" }),
    activateUser: (id: string) => api<AdminUser>(`/v1/admin/users/${id}/activate`, { method: "PATCH" }),
    setRole: (id: string, role: string) => api<AdminUser>(`/v1/admin/users/${id}/role`, { method: "PATCH", body: { role } }),
    courseAction: (id: string, action: "approve" | "publish" | "archive" | "restore") => api<AdminCourse>(`/v1/admin/courses/${id}/${action}`, { method: "PATCH" }),
    rejectCourse: (id: string, reason: string) => api<AdminCourse>(`/v1/admin/courses/${id}/reject`, { method: "PATCH", body: { reason } }),
    broadcast: (payload: { audience: string; recipient_ids?: string[]; type?: string; title: string; message: string; action_url?: string; replies_enabled?: boolean; quick_replies?: string[] }) => api<AdminBroadcast>("/v1/admin/notifications/broadcast", { method: "POST", body: payload }),
};
