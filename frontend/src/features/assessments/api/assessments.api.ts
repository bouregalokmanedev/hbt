import { api } from "@/lib/api/client";

export type AssessmentQuestionType =
    | "single_choice"
    | "multiple_choice"
    | "true_false"
    | "short_answer"
    | "numeric"
    | "ordering"
    | "matching"
    | "long_answer";

export interface AssessmentOption {
    id: string;
    option: string;
}

export interface AssessmentQuestion {
    id: string;
    question: string;
    type: AssessmentQuestionType;
    points: number;
    required: boolean;
    options: AssessmentOption[];
    matching: { left: string[]; right: string[] } | null;
}

export interface AssessmentAttemptSummary {
    id: string;
    attempt_number: number;
    status: string;
    score: number | null;
    passed: boolean;
    started_at: string | null;
    completed_at: string | null;
}

export interface AssessmentAttemptHistory {
    attempts_count: number;
    best_score: number | null;
    passed: boolean;
    remaining_attempts: number | null;
    in_progress_attempt_id: string | null;
    cooldown_until: string | null;
    can_start: boolean;
    latest: AssessmentAttemptSummary | null;
}

export interface Assessment {
    id: string;
    title: string;
    description: string | null;
    course_title: string | null;
    minimum_score: number;
    max_attempts: number | null;
    time_limit_minutes: number | null;
    questions_count: number;
    eligibility: {
        eligible: boolean;
        lessons: { required: number; completed: number };
        quizzes: { required: number; completed: number; required_score: number };
        scenarios: { required: number; completed: number };
    };
    attempt_history: AssessmentAttemptHistory | null;
}

export interface SavedAssessmentAnswer {
    question_id: string;
    answer: Record<string, unknown> | null;
    selected_option_ids: string[];
    confidence_level?: string | null;
    is_correct?: boolean | null;
    points_earned?: number | null;
}

export interface AssessmentAttempt {
    id: string;
    assessment_id: string;
    attempt_number: number;
    status: string;
    score?: number | null;
    passed?: boolean | null;
    expires_at?: string | null;
    tab_switch_count?: number;
    blocked_at?: string | null;
    answers?: SavedAssessmentAnswer[];
    assessment?: {
        id: string;
        title: string;
        minimum_score: number;
        time_limit_minutes?: number | null;
        questions: AssessmentQuestion[];
    };
}

export interface AssessmentResult {
    score: number;
    passed: boolean;
    attempt_number: number;
    completed_at: string | null;
    assessment_attempt_id?: string;
}

export interface AssessmentAnswerPayload {
    question_id: string;
    option_ids?: string[];
    value?: string | number | null;
    ordered_ids?: string[];
    matches?: Record<string, string> | Array<{ left: string; right: string }>;
    confidence_level?: string | null;
}

export interface SaveAnswerPayload {
    option_ids?: string[];
    value?: string | number | null;
    ordered_ids?: string[];
    matches?: Record<string, string> | Array<{ left: string; right: string }>;
    confidence_level?: string | null;
}

export async function getAssessments(): Promise<Assessment[]> {
    return api<Assessment[]>("/v1/assessments");
}

export const assessmentAttemptsApi = {
    start: (assessmentId: string) =>
        api<AssessmentAttempt>(`/v1/assessments/${assessmentId}/attempts`, { method: "POST", body: {} }),
    saveAnswer: (
        assessmentId: string,
        attemptId: string,
        questionId: string,
        payload: SaveAnswerPayload,
    ) =>
        api<{ saved: boolean; question_id: string; answer: Record<string, unknown> | null }>(
            `/v1/assessments/${assessmentId}/attempts/${attemptId}/answers/${questionId}`,
            { method: "PUT", body: payload },
        ),
    submit: (assessmentId: string, attemptId: string, answers: AssessmentAnswerPayload[]) =>
        api<AssessmentResult>(`/v1/assessments/${assessmentId}/attempts/${attemptId}/submit`, {
            method: "POST",
            body: { answers },
        }),
    expire: (assessmentId: string, attemptId: string) =>
        api<unknown>(`/v1/assessments/${assessmentId}/attempts/${attemptId}/expire`, { method: "POST", body: {} }),
    tabSwitch: (assessmentId: string, attemptId: string) =>
        api<{ blocked?: boolean }>(`/v1/assessments/${assessmentId}/attempts/${attemptId}/tab-switch`, {
            method: "POST",
            body: {},
        }),
    result: (assessmentId: string, attemptId: string) =>
        api<AssessmentResult>(`/v1/assessments/${assessmentId}/attempts/${attemptId}/result`),
};
