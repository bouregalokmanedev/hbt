import { api } from "@/lib/api/client";

export type SettingsGroup = Record<string, unknown>;

export interface StudentSettings {
    account: SettingsGroup;
    appearance: SettingsGroup;
    notifications: SettingsGroup;
    privacy: SettingsGroup;
    learning: SettingsGroup;
    security: SettingsGroup;
    assessment: SettingsGroup;
}

export const settingsApi = {
    get: () => api<StudentSettings>("/v1/student/settings"),
    update: (path: string, body: SettingsGroup) => api<SettingsGroup>(`/v1/student/settings/${path}`, { method: "PATCH", body }),
    changePassword: (body: { current_password: string; password: string; password_confirmation: string }) => api<null>("/v1/student/settings/security/password", { method: "PATCH", body }),
    security: () => api<SettingsGroup>("/v1/student/settings/security"),
    sessions: (all = false) => api<Array<{ id: string; device_name: string; browser: string; platform: string; ip_address: string; last_activity_at: string; is_current: boolean }>>(`/sessions${all ? "?all=1" : ""}`),
    revokeSession: (id: string) => api<null>(`/sessions/${id}`, { method: "DELETE" }),
    revokeOtherSessions: () => api<null>("/sessions/others", { method: "DELETE" }),
    loginActivity: (all = false) => api<Array<{ id: string; event: string; successful: boolean; ip_address: string; browser: string; platform: string; device_type: string; created_at: string }>>(`/v1/student/settings/security/login-activity${all ? "?all=1" : ""}`),
    enableTwoFactor: (method: "email" | "phone") => api<{ verification_required: boolean; method: "email" | "phone" }>("/v1/student/settings/security/two-factor/enable", { method: "POST", body: { method } }),
    verifyTwoFactor: (code: string, method: "email" | "phone") => api<SettingsGroup>("/v1/student/settings/security/two-factor/verify", { method: "POST", body: { code, method } }),
    disableTwoFactor: () => api<SettingsGroup>("/v1/student/settings/security/two-factor", { method: "DELETE" }),
    achievements: () => api<{ summary: Record<string, number>; certificates: Array<{ id: string; course_title: string; certificate_number: string; issued_at: string }> }>("/v1/student/settings/achievements"),
    export: () => api<unknown>("/v1/student/settings/export"),
    deleteAccount: (body: { reason: string; other_reason?: string; current_password: string; confirm_deletion: boolean }) => api<null>("/v1/student/settings/account", { method: "DELETE", body }),
};
