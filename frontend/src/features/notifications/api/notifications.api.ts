import { api } from "@/lib/api/client";

export interface StudentNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    action_url: string | null;
    conversation_id?: string | null;
    broadcast_id?: string | null;
    read_at: string | null;
    created_at: string;
}

export const notificationsApi = {
    list: () => api<{ items: StudentNotification[]; unread_count: number }>("/v1/notifications"),
    read: (id: string) => api<StudentNotification>(`/v1/notifications/${id}/read`, { method: "PATCH" }),
    readAll: () => api<{ success: boolean }>("/v1/notifications/read-all", { method: "PATCH" }),
};
