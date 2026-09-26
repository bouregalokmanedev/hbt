import { api } from "@/lib/api/client";

export interface SupportTicket {
    id: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    level: string;
    due_at: string | null;
    resolved_at: string | null;
    created_at: string | null;
    replies_count: number;
}

export interface SupportReply {
    id: string;
    author: string | null;
    author_id: number;
    author_uuid: string | null;
    body: string | null;
    internal: boolean;
    created_at: string | null;
}

export interface SupportTicketDetail extends SupportTicket {
    replies: SupportReply[];
}

interface TicketList {
    items: SupportTicket[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export const supportApi = {
    list: (page = 1) => api<TicketList>(`/v1/support/tickets?page=${page}&per_page=12`),
    detail: (id: string) => api<SupportTicketDetail>(`/v1/support/tickets/${id}`),
    create: (payload: { subject: string; category: string; priority: string; message: string }) =>
        api<SupportTicket>(`/v1/support/tickets`, { method: "POST", body: payload }),
    reply: (id: string, message: string) =>
        api<SupportTicketDetail>(`/v1/support/tickets/${id}/reply`, { method: "POST", body: { message } }),
    close: (id: string) => api<SupportTicket>(`/v1/support/tickets/${id}/close`, { method: "POST" }),
};
