import { env } from "@/config/env";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { authStorage } from "@/lib/storage/auth-storage";

import type {
    DiagnosticAttempt,
    DiagnosticHint,
    DiagnosticHubItem,
    DiagnosticResult,
    DiagnosticScenarioDetail,
    DiagnosticStep,
    DiagnosticTool,
    HintsState,
    StepAnswerOutcome,
} from "../types/diagnostic.types";

/**
 * Raw fetch for endpoints returning `{ data, meta }` — the api() helper
 * unwraps `data` and would drop `meta`.
 */
async function rawApi<T>(endpoint: string, init?: RequestInit, body?: unknown): Promise<T> {
    const token = authStorage.getToken();
    const headers = new Headers({ Accept: "application/json" });

    if (body !== undefined) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${env.apiUrl}${endpoint}`, {
        ...init,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let payload: unknown = null;

    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok) {
        const message =
            typeof payload === "object" && payload !== null && "message" in payload && typeof payload.message === "string"
                ? payload.message
                : "Something went wrong.";

        throw new ApiError(message, response.status);
    }

    return payload as T;
}

export async function getDiagnostics(courseId?: string): Promise<DiagnosticHubItem[]> {
    const suffix = courseId ? `?course=${encodeURIComponent(courseId)}` : "";
    return api<DiagnosticHubItem[]>(`/v1/student/scenarios${suffix}`);
}

export async function getDiagnosticScenario(scenarioId: string): Promise<DiagnosticScenarioDetail> {
    return api<DiagnosticScenarioDetail>(`/v1/student/scenarios/${scenarioId}`);
}

export async function startDiagnosticAttempt(scenarioId: string, courseId?: string): Promise<DiagnosticAttempt> {
    return api<DiagnosticAttempt>(`/v1/student/scenarios/${scenarioId}/attempts`, {
        method: "POST",
        body: courseId ? { course_id: courseId } : {},
    });
}

export async function resumeDiagnosticAttempt(attemptId: string): Promise<DiagnosticAttempt> {
    return api<DiagnosticAttempt>(`/v1/student/scenario-attempts/${attemptId}`);
}

export async function answerDiagnosticStep(
    attemptId: string,
    stepId: string,
    payload: Record<string, unknown>,
    tool?: DiagnosticTool,
): Promise<StepAnswerOutcome> {
    return api<StepAnswerOutcome>(`/v1/student/scenario-attempts/${attemptId}/steps/${stepId}`, {
        method: "PUT",
        body: tool ? { payload, tool } : { payload },
    });
}

export async function getDiagnosticHints(attemptId: string): Promise<HintsState> {
    const response = await rawApi<{ data: DiagnosticHint[]; meta: Omit<HintsState, "hints"> }>(
        `/v1/student/scenario-attempts/${attemptId}/hints`,
    );

    return {
        hints: response.data,
        hints_used: response.meta.hints_used,
        hints_remaining: response.meta.hints_remaining,
        penalty_total: response.meta.penalty_total,
    };
}

export async function revealDiagnosticHint(
    attemptId: string,
    hintId: string,
): Promise<{ hint: DiagnosticHint; hints_used: number; penalty_total: number }> {
    return api(`/v1/student/scenario-attempts/${attemptId}/hints`, {
        method: "POST",
        body: { hint_id: hintId },
    });
}

export interface SubmittedAttempt {
    id: string;
    scenario_id: string;
    attempt_number: number;
    scenario_version: number;
    status: string;
    score: number | null;
    passed: boolean;
}

export async function submitDiagnosticAttempt(attemptId: string): Promise<SubmittedAttempt> {
    return api<SubmittedAttempt>(`/v1/student/scenario-attempts/${attemptId}/submit`, {
        method: "POST",
    });
}

export async function getDiagnosticResult(attemptId: string): Promise<DiagnosticResult> {
    return api<DiagnosticResult>(`/v1/student/scenario-attempts/${attemptId}/result`);
}

export async function getDiagnosticHistory(scenarioId?: string): Promise<DiagnosticAttempt[]> {
    const query = scenarioId ? `?scenario_id=${scenarioId}` : "";

    const response = await rawApi<{ data: DiagnosticAttempt[] }>(
        `/v1/student/scenario-attempts/history${query}`,
    );

    return response.data;
}

export type { DiagnosticStep };
