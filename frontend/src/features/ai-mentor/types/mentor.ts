export type MentorMessageRole = "user" | "assistant" | "system" | "tool";

export interface MentorMessage {
    id: string;
    mentor_conversation_id?: string;
    role: MentorMessageRole;
    content: string;
    metadata?: Record<string, unknown> | null;
    created_at?: string;
}

export interface MentorConversation {
    id: string;
    title: string | null;
    course_id: string | null;
    lesson_id: string | null;
    status: "active" | "archived" | "closed";
    last_message_at?: string | null;
    updated_at: string;
    messages?: MentorMessage[];
}

export interface MentorToolResult {
    tool: string;
    drop_volts?: number;
    drop_percentage?: number;
    interpretation?: string;
    safety_note: string;
    steps?: string[];
}
