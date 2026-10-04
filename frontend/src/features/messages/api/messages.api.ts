import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { authStorage } from "@/lib/storage/auth-storage";
import { env } from "@/config/env";

export interface Contact { id: string; user_id?: number | null; name: string; email: string; role: string | null; last_read_at?: string | null; online?: boolean | null; }
export interface MessageAttachment { name: string; mime: string; size: number; url: string; }
export interface ReplyPreview { sender_name: string; body_excerpt: string; has_attachment: boolean; }
export interface MessageItem {
    id: string;
    conversation_id: string;
    sender?: { id: string; name: string };
    message_type: string;
    body: string | null;
    edited?: boolean;
    edited_at?: string | null;
    attachment?: MessageAttachment | null;
    attachments?: MessageAttachment[] | null;
    forwarded_from?: { message_id: string; conversation_id: string; sender_name: string | null; body_excerpt: string } | null;
    deleted?: null | "mine" | "all";
    reply_to?: string | null;
    reply_preview?: ReplyPreview | null;
    reactions?: Record<string, number[]>;
    reacted?: string[];
    pendingMine?: boolean;
    sendFailed?: boolean;
    created_at: string;
}
export interface ConversationMember { id: string; name: string; role?: string | null; last_read_at?: string | null; }
export interface Conversation {
    id: string;
    type: "direct" | "announcement" | "group" | "staff_room";
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
    can_archive?: boolean;
    muted?: boolean;
    /** uuids of other participants typing right now — single-thread reads only */
    typing_user_ids?: string[] | null;
    /** ISO timestamp of the oldest unread message, or null once fully read */
    first_unread_at?: string | null;
    participants?: ConversationMember[] | null;
}

export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export const ATTACHMENT_ACCEPT = ".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg";

const ATTACHMENT_EXTENSIONS = ["pdf", "doc", "docx", "png", "jpg", "jpeg"];

export const MESSAGE_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"] as const;

export type DeleteScope = "for_me" | "for_all";

export interface MessagesWindow {
    data: MessageItem[];
    meta: { has_more: boolean };
}

export function messageReactions(message: MessageItem): Record<string, number[]> {
    return message.reactions ?? {};
}

/**
 * The roster a receipt should be measured against.
 *
 * `participants` is what the server eager loads on every conversation read;
 * the single `participant` field is only the counterpart, so it is a
 * last-resort fallback for payloads that predate the roster.
 */
export function conversationMembers(conversation: Pick<Conversation, "participants" | "participant">): ConversationMember[] {
    if (conversation.participants?.length) return conversation.participants;
    return conversation.participant ? [conversation.participant] : [];
}

/**
 * Read receipts for one of *my* messages: how many of the other members have
 * a `last_read_at` at or after it, out of how many there are.
 *
 * Returns `null` when the message is not mine or when the payload carried no
 * roster at all — callers fall back to the single-participant timestamp.
 * `null` `last_read_at` means the member opted out of receipts, so they simply
 * never count as having read it.
 */
export function readReceiptFor(
    message: MessageItem | undefined,
    members: ConversationMember[],
    myUuid: string | null,
): { read: number; total: number } | null {
    if (!message || !myUuid || message.sender?.id !== myUuid) return null;
    const sent = new Date(message.created_at).getTime();
    if (!Number.isFinite(sent)) return null;
    const others = members.filter((member) => member.id !== myUuid);
    const read = others.filter((member) => member.last_read_at && new Date(member.last_read_at).getTime() >= sent).length;
    return { read, total: others.length };
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
    list: async (page?: { limit?: number; offset?: number; type?: string }): Promise<Conversation[]> => {
        const query = new URLSearchParams();
        if (page?.limit) query.set("limit", String(page.limit));
        if (page?.offset) query.set("offset", String(page.offset));
        if (page?.type) query.set("type", page.type);
        const suffix = query.toString() ? `?${query.toString()}` : "";
        return api<Conversation[]>(`/v1/messages/conversations${suffix}`);
    },
    contacts: () => api<Contact[]>("/v1/messages/contacts"),
    get: (id: string) => api<Conversation>(`/v1/messages/conversations/${id}`),
    create: (data: { recipient_id: string; subject?: string; message?: string }) => api<Conversation>("/v1/messages/conversations", { method: "POST", body: data }),
    createGroup: (data: { recipient_ids: string[]; subject: string; message?: string }) => api<Conversation>("/v1/messages/conversations", { method: "POST", body: data }),
    send: (conversationId: string, body: string, messageType: "text" | "quick_reply" = "text", files: File[] = [], replyToId?: string | null) => {
        if (!files.length) return api<MessageItem>(`/v1/messages/conversations/${conversationId}/messages`, { method: "POST", body: { body, message_type: messageType, ...(replyToId ? { reply_to: replyToId } : {}) } });
        const form = new FormData();
        form.append("body", body);
        form.append("message_type", messageType);
        if (replyToId) form.append("reply_to", replyToId);
        for (const file of files) form.append("files[]", file);
        return postMultipart<MessageItem>(`/v1/messages/conversations/${conversationId}/messages`, form, "Unable to send your message.");
    },
    edit: (id: string, body: string) => api<MessageItem>(`/v1/messages/${id}`, { method: "PATCH", body: { body } }),
    forward: (id: string, conversationId: string, comment?: string) => api<MessageItem>(`/v1/messages/${id}/forward`, { method: "POST", body: { conversation_id: conversationId, ...(comment ? { comment } : {}) } }),
    typing: (conversationId: string) => api<void>(`/v1/messages/conversations/${conversationId}/typing`, { method: "POST" }),
    mute: (conversationId: string, muted: boolean) => api<{ muted: boolean }>(`/v1/messages/conversations/${conversationId}/mute`, { method: "PATCH", body: { muted } }),
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
