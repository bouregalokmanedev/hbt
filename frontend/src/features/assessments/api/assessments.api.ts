import { api } from "@/lib/api/client";

export interface Assessment {
    id: string; title: string; description: string | null; course_title: string | null;
    minimum_score: number; max_attempts: number | null; questions_count: number;
    eligibility: { eligible: boolean; lessons: { required: number; completed: number }; quizzes: { required: number; completed: number; required_score: number }; scenarios: { required: number; completed: number } };
}

export interface AssessmentAttempt {
    id: string; assessment_id: string; attempt_number: number; status: string;
    expires_at?: string | null;
    assessment?: { title: string; minimum_score: number; questions: Array<{ id: string; question: string; options: Array<{ id: string; option: string }> }> };
}

export interface AssessmentResult {
    score: number; passed: boolean; attempt_number: number; completed_at: string | null;
}

export async function getAssessments(): Promise<Assessment[]> {
    return api<Assessment[]>("/v1/assessments");
}

export const assessmentAttemptsApi = {
    start: (assessmentId: string) =>
        api<AssessmentAttempt>(`/v1/assessments/${assessmentId}/attempts`, { method: "POST", body: {} }),
    submit: (assessmentId: string, attemptId: string, answers: Array<{ question_id: string; option_ids: string[] }>) =>
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
