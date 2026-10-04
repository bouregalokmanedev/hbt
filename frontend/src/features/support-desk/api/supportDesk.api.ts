import { env } from "@/config/env";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { authStorage } from "@/lib/storage/auth-storage";
import { errorMessage } from "@/lib/api/safe-error";

export interface DeskTicketSummary {
    id: string;
    subject: string;
    status: string;
    priority: string;
    level?: string;
    user?: string | null;
    email?: string | null;
    assignee?: string | null;
    due_at?: string | null;
    overdue: boolean;
    created_at?: string | null;
}

export interface DeskTicketReply {
    id: string;
    author?: string | null;
    body: string;
    internal: boolean;
    created_at?: string | null;
}

export interface DeskTicketDetails extends DeskTicketSummary {
    category?: string | null;
    replies: DeskTicketReply[];
    /** CSAT left by the student after the ticket was resolved or closed. */
    rating?: number | null;
    rating_comment?: string | null;
    rated_at?: string | null;
}

export interface DeskOverview {
    summary: {
        open: number;
        pending: number;
        resolved: number;
        overdue: number;
        unassigned: number;
        mine: number;
        resolvedByMe: number;
    };
    /** Average CSAT (1-5) across rated tickets plus how many rated. */
    csat?: { average: number; count: number };
    recent: DeskTicketSummary[];
    my_queue: DeskTicketSummary[];
}

export interface DeskTicketListResponse {
    data: DeskTicketSummary[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
    summary: { open: number; pending: number; overdue: number; unassigned: number };
}

export interface DeskTicketFilters {
    status?: string;
    level?: string;
    assigned?: "me" | "unassigned";
    overdue?: boolean;
    search?: string;
    page?: number;
    per_page?: number;
}

export type MailFolder = "inbox" | "sent" | "archive";

export interface MailThread {
    id: string;
    direction: "inbound" | "outbound";
    subject: string;
    from_name: string;
    from_email: string;
    to_name?: string | null;
    to_email: string;
    read: boolean;
    archived: boolean;
    message_count: number;
    preview: string;
    created_at?: string | null;
}

export interface MailMessage {
    id: string;
    direction: "inbound" | "outbound";
    body: string;
    from_name: string;
    from_email: string;
    to_name?: string | null;
    to_email: string;
    created_at?: string | null;
}

export interface MailThreadDetails extends MailThread {
    messages: MailMessage[];
}

export interface MailListResponse {
    data: MailThread[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
    summary: { inbox: number; inbox_unread: number; sent: number; archive: number };
}

export interface MailFilters {
    folder?: MailFolder;
    search?: string;
    page?: number;
    per_page?: number;
}

export interface MailRecipient {
    id: string;
    name: string;
    email: string;
}

export interface ComposePayload {
    to_email: string;
    to_name?: string;
    subject: string;
    body: string;
    recipient_user_id?: string;
}

function query(filters: DeskTicketFilters = {}): string {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.level) params.set("level", filters.level);
    if (filters.assigned) params.set("assigned", filters.assigned);
    if (filters.overdue) params.set("overdue", "true");
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.per_page) params.set("per_page", String(filters.per_page));
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
}

function mailQuery(filters: MailFilters = {}): string {
    const params = new URLSearchParams();
    if (filters.folder) params.set("folder", filters.folder);
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.per_page) params.set("per_page", String(filters.per_page));
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
}

/**
 * Raw fetch — the ticket index returns `{ data, meta, summary }` and the
 * shared api() helper would unwrap (and drop) `meta`/`summary`.
 */
async function rawDesk<T>(endpoint: string, init: RequestInit = {}, body?: unknown): Promise<T> {
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
        throw new ApiError(errorMessage(payload?.message), response.status);
    }
    return payload as T;
}

export const supportDeskApi = {
    overview: () => api<DeskOverview>("/v1/support-desk/overview"),
    tickets: (filters: DeskTicketFilters = {}) =>
        rawDesk<DeskTicketListResponse>(`/v1/support-desk/tickets${query(filters)}`),
    get: (id: string) => api<DeskTicketDetails>(`/v1/support-desk/tickets/${id}`),
    reply: (id: string, body: { message: string; internal?: boolean }) =>
        api<DeskTicketDetails>(`/v1/support-desk/tickets/${id}/replies`, { method: "POST", body }),
    assign: (id: string, assigneeId: string) =>
        api<unknown>(`/v1/support-desk/tickets/${id}/assign`, { method: "PATCH", body: { assignee_id: assigneeId } }),
    resolve: (id: string) =>
        api<DeskTicketDetails>(`/v1/support-desk/tickets/${id}/resolve`, { method: "POST", body: {} }),
    close: (id: string) =>
        api<DeskTicketDetails>(`/v1/support-desk/tickets/${id}/close`, { method: "POST", body: {} }),
    escalate: (id: string, body: { level: "admin" | "super_admin"; note?: string }) =>
        api<DeskTicketDetails>(`/v1/support-desk/tickets/${id}/escalate`, { method: "POST", body }),

    // Mailbox — contact-form threads plus everything agents send.
    mail: (filters: MailFilters = {}) => rawDesk<MailListResponse>(`/v1/support-desk/mail${mailQuery(filters)}`),
    mailThread: (id: string) => api<MailThreadDetails>(`/v1/support-desk/mail/${id}`),
    mailCompose: (body: ComposePayload) =>
        api<MailThreadDetails>("/v1/support-desk/mail", { method: "POST", body }),
    mailReply: (id: string, body: { body: string }) =>
        api<MailThreadDetails>(`/v1/support-desk/mail/${id}/reply`, { method: "POST", body }),
    mailRead: (id: string, read: boolean) =>
        api<MailThread>(`/v1/support-desk/mail/${id}/read`, { method: "PATCH", body: { read } }),
    mailArchive: (id: string, archived: boolean) =>
        api<MailThread>(`/v1/support-desk/mail/${id}/archive`, { method: "PATCH", body: { archived } }),
    mailRecipients: (search = "") =>
        api<MailRecipient[]>(
            `/v1/support-desk/mail/recipients${search ? `?search=${encodeURIComponent(search)}` : ""}`,
        ),
};
