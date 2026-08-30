import { useCallback, useEffect, useMemo, useState } from "react";
import { mentorApi, streamMentorMessage } from "../api/mentor-api";
import type { MentorConversation, MentorMessage } from "../types/mentor";

type Context = { title: string; courseId?: string; lessonId?: string };

export function useMentorChat(context: Context, enabled = true) {
    const [conversation, setConversation] = useState<MentorConversation | null>(null);
    const [messages, setMessages] = useState<MentorMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadConversation = useCallback(async (id: string) => {
        const full = await mentorApi.get(id);
        setConversation(full);
        setMessages(full.messages ?? []);
        return full;
    }, []);

    const initialise = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const conversations = await mentorApi.list();
            const existing = conversations.find((item) =>
                item.status === "active"
                && item.course_id === (context.courseId ?? null)
                && item.lesson_id === (context.lessonId ?? null),
            );
            const selected = existing ?? await mentorApi.create({
                title: context.title,
                course_id: context.courseId,
                lesson_id: context.lessonId,
            });
            await loadConversation(selected.id);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Unable to start the AI Mentor.");
        } finally {
            setLoading(false);
        }
    }, [context.courseId, context.lessonId, context.title, enabled, loadConversation]);

    useEffect(() => { void initialise(); }, [initialise]);

    const send = useCallback(async (rawQuestion: string) => {
        const question = rawQuestion.trim();
        if (!question || !conversation || sending) return false;
        setSending(true);
        setError(null);
        const userMessage: MentorMessage = {
            id: `local-user-${Date.now()}`,
            role: "user",
            content: question,
            created_at: new Date().toISOString(),
        };
        const assistantId = `local-assistant-${Date.now()}`;
        setMessages((current) => [...current, userMessage, {
            id: assistantId,
            role: "assistant",
            content: "",
            created_at: new Date().toISOString(),
        }]);
        try {
            await streamMentorMessage(conversation.id, question, (chunk) => {
                setMessages((current) => current.map((item) => item.id === assistantId
                    ? { ...item, content: item.content + chunk }
                    : item));
            });
            await loadConversation(conversation.id);
            return true;
        } catch (cause) {
            setMessages((current) => current.filter((item) => item.id !== assistantId));
            setError(cause instanceof Error ? cause.message : "The AI Mentor could not respond right now.");
            return false;
        } finally {
            setSending(false);
        }
    }, [conversation, loadConversation, sending]);

    const state = useMemo(() => ({ conversation, messages, loading, sending, error }), [conversation, error, loading, messages, sending]);
    return { ...state, send, retry: initialise, loadConversation };
}
