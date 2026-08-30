import { api } from "@/lib/api/client";

export interface Contact { id: string; name: string; email: string; role: string | null; }
export interface MessageItem { id: string; conversation_id: string; sender?: { id: string; name: string }; message_type: string; body: string; created_at: string; }
export interface Conversation { id: string; type: "direct" | "announcement"; subject: string | null; status: "active" | "archived"; broadcast_id?: string | null; replies_enabled: boolean; quick_replies: string[]; last_message_at: string | null; participant: Contact | null; messages?: MessageItem[]; }

export const messagesApi = {
    list: () => api<Conversation[]>("/v1/messages/conversations"),
    contacts: () => api<Contact[]>("/v1/messages/contacts"),
    get: (id: string) => api<Conversation>(`/v1/messages/conversations/${id}`),
    create: (data: { recipient_id: string; subject?: string; message?: string }) => api<Conversation>("/v1/messages/conversations", { method: "POST", body: data }),
    send: (conversationId: string, body: string, messageType: "text" | "quick_reply" = "text") => api<MessageItem>(`/v1/messages/conversations/${conversationId}/messages`, { method: "POST", body: { body, message_type: messageType } }),
    read: (conversationId: string) => api<{ success: boolean }>(`/v1/messages/conversations/${conversationId}/read`, { method: "PATCH" }),
    archive: (conversationId: string) => api<void>(`/v1/messages/conversations/${conversationId}/archive`, { method: "PATCH" }),
};
