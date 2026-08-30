import { env } from "@/config/env";
import { ApiError } from "@/lib/api/errors";
import { api } from "@/lib/api/client";
import { authStorage } from "@/lib/storage/auth-storage";
import type { MentorConversation, MentorMessage, MentorToolResult } from "../types/mentor";

export const mentorApi = {
    list: () => api<MentorConversation[]>("/mentor/conversations"),
    create: (payload: { title?: string; course_id?: string; lesson_id?: string }) =>
        api<MentorConversation>("/mentor/conversations", { method: "POST", body: payload }),
    get: (conversationId: string) =>
        api<MentorConversation>(`/mentor/conversations/${conversationId}`),
    archive: (conversationId: string) =>
        api<void>(`/mentor/conversations/${conversationId}`, { method: "DELETE" }),
    feedback: (messageId: string, rating: "positive" | "negative") =>
        api(`/mentor/messages/${messageId}/feedback`, {
            method: "POST",
            body: { rating, reason: rating === "positive" ? "helpful" : "incorrect" },
        }),
    voltageDrop: (sourceVoltage: number, loadVoltage: number) =>
        api<MentorToolResult>("/mentor/tools/voltage-drop", {
            method: "POST",
            body: { source_voltage: sourceVoltage, load_voltage: loadVoltage },
        }),
    checklist: (symptom: string) =>
        api<MentorToolResult>("/mentor/tools/diagnostic-checklist", {
            method: "POST",
            body: { symptom },
        }),
};

/** Read the API's POST SSE response and expose text tokens to the chat surface. */
export async function streamMentorMessage(
    conversationId: string,
    message: string,
    onChunk: (chunk: string) => void,
): Promise<void> {
    const headers = new Headers({
        Accept: "text/event-stream",
        "Content-Type": "application/json",
    });
    const token = authStorage.getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(
        `${env.apiUrl}/mentor/conversations/${conversationId}/messages/stream`,
        { method: "POST", headers, body: JSON.stringify({ message }) },
    );

    if (!response.ok || !response.body) {
        let messageText = "The AI Mentor could not respond right now.";
        try {
            const payload = await response.json() as { message?: string };
            messageText = payload.message ?? messageText;
        } catch {
            // Keep the clear fallback when an upstream service returns no JSON.
        }
        throw new ApiError(messageText, response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const consumeEvent = (event: string) => {
        const line = event.split(/\r?\n/).find((item) => item.startsWith("data:"));
        if (!line) return;
        try {
            const payload = JSON.parse(line.slice(5).trim()) as { type?: string; content?: string };
            if (payload.type === "chunk" && payload.content) onChunk(payload.content);
        } catch {
            // Ignore malformed individual SSE events; the completed history is reloaded below.
        }
    };

    while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

        let separator = buffer.search(/\r?\n\r?\n/);
        while (separator >= 0) {
            const event = buffer.slice(0, separator);
            const separatorLength = buffer.startsWith("\r\n\r\n", separator) ? 4 : 2;
            buffer = buffer.slice(separator + separatorLength);
            consumeEvent(event);
            separator = buffer.search(/\r?\n\r?\n/);
        }
        if (done) break;
    }
    if (buffer.trim()) consumeEvent(buffer);
}
