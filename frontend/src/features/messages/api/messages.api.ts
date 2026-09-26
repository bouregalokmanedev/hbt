import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { authStorage } from "@/lib/storage/auth-storage";
import { env } from "@/config/env";

export interface Contact { id: string; user_id?: number | null; name: string; email: string; role: string | null; last_read_at?: string | null; }
export interface MessageAttachment { name: string; mime: string; size: number; url: string; }
export interface ReplyPreview { sender_name: string; body_excerpt: string; has_attachment: boolean; }
export interface MessageItem {
    id: string;
    conversation_id: string;
    sender?: { id: string; name: string };
    message_type: string;
    body: string | null;
    metadata?: {
        reactions?: Record<string, number[]>;
        attachment?: { name?: string; mime?: string; size?: number; path?: string };
        deleted_for?: number[];
        deleted_for_all?: boolean;
    } & Record<string, unknown>;
    attachment?: MessageAttachment | null;
    deleted?: null | "mine" | "all";
    reply_to?: string | null;
    reply_preview?: ReplyPreview | null;
    reactions?: Record<string, number[]>;
    reacted?: string[];
    pendingMine?: boolean;
    sendFailed?: boolean;
    created_at: string;
}
export interface Conversation {
    id: string;
    type: "direct" | "announcement" | "group";
    subject: string | null;
    status: "active" | "archived";
    broadcast_id?: string | null;
    replies_enabled: boolean;
    quick_replies: string[];
    last_message_at: string | null;
    participant: Contact | null;
    messages?: MessageItem[];
    unread_count: number;
    member_count: number;
    participants?: { id: string; name: string }[] | null;
}

export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export const ATTACHMENT_ACCEPT = ".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg";

const ATTACHMENT_EXTENSIONS = ["pdf", "doc", "docx", "png", "jpg", "jpeg"];

export const MESSAGE_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"] as const;

export type MessageReaction = (typeof MESSAGE_REACTIONS)[number];

export type DeleteScope = "for_me" | "for_all";

export interface MessagesWindow {
    data: MessageItem[];
    meta: { has_more: boolean };
}

/** Reactions arrive inside `metadata.reactions` on the wire; accept a top-level copy too. */
export function messageReactions(message: MessageItem): Record<string, number[]> {
    return message.reactions ?? message.metadata?.reactions ?? {};
}

export function isGroupConversation(conversation: Pick<Conversation, "type" | "subject">): boolean {
    return conversation.type === "group";
}

export function isRecentEnoughForDeleteForAll(createdAt: string, windowMinutes = 15): boolean {
    const sent = new Date(createdAt).getTime();
    if (!Number.isFinite(sent)) return false;
    return Date.now() - sent < windowMinutes * 60 * 1000;
}

export function isAllowedAttachment(file: File): boolean {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    return ATTACHMENT_EXTENSIONS.includes(extension);
}

export function formatAttachmentSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function postMultipart<T>(endpoint: string, form: FormData, fallbackError: string): Promise<T> {
    const token = authStorage.getToken();
    const response = await fetch(`${env.apiUrl}${endpoint}`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
    });
    const payload = await response.json().catch(() => null) as { data?: T; message?: string } | null;
    if (!response.ok) {
        throw new ApiError(payload?.message ?? fallbackError, response.status);
    }
    return (payload && typeof payload === "object" && "data" in payload ? payload.data : payload) as T;
}

export const messagesApi = {
    list: () => api<Conversation[]>("/v1/messages/conversations"),
    contacts: () => api<Contact[]>("/v1/messages/contacts"),
    get: (id: string) => api<Conversation>(`/v1/messages/conversations/${id}`),
    create: (data: { recipient_id: string; subject?: string; message?: string }) => api<Conversation>("/v1/messages/conversations", { method: "POST", body: data }),
    createGroup: (data: { recipient_ids: string[]; subject: string; message?: string }) => api<Conversation>("/v1/messages/conversations", { method: "POST", body: data }),
    send: (conversationId: string, body: string, messageType: "text" | "quick_reply" = "text", file?: File | null, replyToId?: string | null) => {
        if (!file) return api<MessageItem>(`/v1/messages/conversations/${conversationId}/messages`, { method: "POST", body: { body, message_type: messageType, ...(replyToId ? { reply_to: replyToId } : {}) } });
        const form = new FormData();
        form.append("body", body);
        form.append("message_type", messageType);
        if (replyToId) form.append("reply_to", replyToId);
        form.append("file", file);
        return postMultipart<MessageItem>(`/v1/messages/conversations/${conversationId}/messages`, form, "Unable to send your message.");
    },
    fetchMessages: async (conversationId: string, params?: { before?: string; per_page?: number; search?: string }): Promise<MessagesWindow> => {
        const query = new URLSearchParams();
        if (params?.before) query.set("before", params.before);
        if (params?.per_page) query.set("per_page", String(params.per_page));
        if (params?.search?.trim()) query.set("search", params.search.trim());
        const suffix = query.toString() ? `?${query.toString()}` : "";
        const token = authStorage.getToken();
        const response = await fetch(`${env.apiUrl}/v1/messages/conversations/${conversationId}/messages${suffix}`, {
            headers: {
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        const payload = await response.json().catch(() => null) as { data?: MessageItem[]; meta?: { has_more?: boolean }; message?: string } | null;
        if (!response.ok) {
            throw new ApiError(payload?.message ?? "Unable to load messages.", response.status);
        }
        return { data: payload?.data ?? [], meta: { has_more: payload?.meta?.has_more ?? false } };
    },
    removeMessage: (id: string, scope: DeleteScope) => api<MessageItem>(`/v1/messages/${id}`, { method: "DELETE", body: { scope } }),
    toggleReaction: (id: string, emoji: string) => api<MessageItem>(`/v1/messages/${id}/reactions`, { method: "POST", body: { emoji } }),
    read: (conversationId: string) => api<{ success: boolean }>(`/v1/messages/conversations/${conversationId}/read`, { method: "PATCH" }),
    archive: (conversationId: string) => api<void>(`/v1/messages/conversations/${conversationId}/archive`, { method: "PATCH" }),
};
