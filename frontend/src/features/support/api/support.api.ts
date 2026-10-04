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
    rating?: number | null;
    rating_comment?: string | null;
    rated_at?: string | null;
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
    rate: (id: string, rating: number, comment?: string) =>
        api<SupportTicketDetail>(`/v1/support/tickets/${id}/rating`, {
            method: "POST",
            body: comment ? { rating, comment } : { rating },
        }),
    /**
     * Public status lookup: no session required, only the ticket reference
     * plus the address the ticket was filed with.
     */
    track: (id: string, email: string) =>
        api<SupportTicketDetail>(
            `/v1/support/tickets/${id}/status?email=${encodeURIComponent(email)}`,
        ),
};
