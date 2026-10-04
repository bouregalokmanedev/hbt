import { env } from "@/config/env";
import { ApiError } from "@/lib/api/errors";
import { api } from "@/lib/api/client";
import { authStorage } from "@/lib/storage/auth-storage";
import type {
    Course,
} from "@/features/courses/types/course.types";

import type {
    AssessmentMode,
    AvailableAssessmentQuestion,
    AvailableCompetency,
    FlaggedAttempt,
    InstructorAssessment,
    InstructorAttention,
    InstructorCourseAnalytics,
    InstructorCourseCertificates,
    InstructorCourseFeedback,
    InstructorCourseStudent,
    InstructorDashboard,
    InstructorProgression,
    InstructorCourseListResponse,
    InstructorCurriculum,
    InstructorQuiz,
    InstructorSimulatorSessionsParams,
    InstructorStudentListItem,
    InstructorStudentProfile,
    InstructorLessonMedia,
    InstructorTrends,
    PendingReview,
    SimulatorAnalytics,
    SimulatorSessionsPage,
    SimulatorStudentActivity,
} from "../types/instructor";

export interface InstructorCoursesParams {
    search?: string;
    status?: string;
    difficulty?: string;
    free?: boolean;
    page?: number;
    per_page?: number;
}

export interface InstructorStudentsParams {
    page?: number;
    per_page?: number;
}

export interface InstructorCoursePayload {
    title: string;
    slug: string;
    short_description: string;
    description: string;
    language: string;
    difficulty: string;
    duration_minutes: number;
    price: number;
    discount_price: number | null;
    currency: string;
    is_free: boolean;
    visibility: string;
    thumbnail: string | null;
    cover_image: string | null;
    preview_video: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    metadata?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export async function getInstructorDashboard(): Promise<InstructorDashboard> {
    return api<InstructorDashboard>(
        "/v1/instructor/dashboard",
    );
}

export async function getInstructorAttention(): Promise<InstructorAttention> {
    return api<InstructorAttention>("/v1/instructor/attention");
}

export async function getInstructorTrends(
    days = 30,
): Promise<InstructorTrends> {
    return api<InstructorTrends>(`/v1/instructor/trends?days=${days}`);
}

export async function getInstructorProgression(): Promise<InstructorProgression> {
    return api<InstructorProgression>("/v1/instructor/progression");
}

export async function sendInstructorAnnouncement(payload: { course_id?: string; title: string; message: string; action_url?: string; replies_enabled?: boolean; quick_replies?: string[] }) {
    return api(`/v1/instructor/announcements`, { method: "POST", body: payload });
}

export async function getInstructorCourses(
    params: InstructorCoursesParams = {},
): Promise<InstructorCourseListResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
            searchParams.set(
                key,
                typeof value === "boolean"
                    ? (value ? "1" : "0")
                    : String(value),
            );
        }
    });

    const token = authStorage.getToken();
    const response = await fetch(
        `${env.apiUrl}/v1/instructor/courses${
            searchParams.size > 0
                ? `?${searchParams.toString()}`
                : ""
        }`,
        {
            headers: {
                Accept: "application/json",
                ...(token
                    ? {
                        Authorization: `Bearer ${token}`,
                    }
                    : {}),
            },
        },
    );

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
        const message =
            payload &&
            typeof payload === "object" &&
            "message" in payload &&
            typeof payload.message === "string"
                ? payload.message
                : "Unable to load your courses.";

        throw new ApiError(message, response.status);
    }

    return payload as InstructorCourseListResponse;
}

export async function getInstructorCourse(
    courseId: string,
): Promise<Course> {
    return api<Course>(`/v1/instructor/courses/${courseId}`);
}

export async function createInstructorCourse(
    payload: InstructorCoursePayload,
): Promise<Course> {
    return api<Course>("/v1/instructor/courses", {
        method: "POST",
        body: payload,
    });
}

export async function updateInstructorCourse(
    courseId: string,
    payload: InstructorCoursePayload,
): Promise<Course> {
    return api<Course>(`/v1/instructor/courses/${courseId}`, {
        method: "PATCH",
        body: payload,
    });
}

export type InstructorCourseLifecycleAction =
    | "publish"
    | "unpublish"
    | "submit-review"
    | "archive"
    | "restore";

export async function runInstructorCourseAction(
    courseId: string,
    action: InstructorCourseLifecycleAction,
): Promise<Course> {
    return api<Course>(
        `/v1/instructor/courses/${courseId}/${action}`,
        {
            method: "POST",
        },
    );
}

export async function deleteInstructorCourse(
    courseId: string,
): Promise<void> {
    await api<{ message: string }>(
        `/v1/instructor/courses/${courseId}`,
        {
            method: "DELETE",
        },
    );
}

export async function getInstructorCurriculum(courseId: string): Promise<InstructorCurriculum> {
    return api<InstructorCurriculum>(`/v1/instructor/courses/${courseId}/curriculum`);
}

export async function createInstructorSection(courseId: string, payload: { title: string; slug: string; description?: string | null }): Promise<void> {
    await api(`/v1/instructor/courses/${courseId}/sections`, { method: "POST", body: payload });
}

export async function updateInstructorSection(sectionId: string, payload: { title?: string; slug?: string; description?: string | null }): Promise<void> {
    await api(`/v1/instructor/sections/${sectionId}`, { method: "PATCH", body: payload });
}

export async function runInstructorSectionAction(sectionId: string, action: "publish" | "unpublish" | "reorder", payload?: { position: number }): Promise<void> {
    await api(`/v1/instructor/sections/${sectionId}/${action}`, { method: "POST", body: payload });
}

export async function deleteInstructorSection(sectionId: string): Promise<void> {
    await api(`/v1/instructor/sections/${sectionId}`, { method: "DELETE" });
}

export async function createInstructorLesson(sectionId: string, payload: { title: string; slug: string; description?: string | null; content?: string | null; duration_minutes?: number | null; is_preview?: boolean }): Promise<void> {
    await api(`/v1/instructor/sections/${sectionId}/lessons`, { method: "POST", body: payload });
}

export async function updateInstructorLesson(lessonId: string, payload: { title?: string; slug?: string; description?: string | null; content?: string | null; duration_minutes?: number | null; is_preview?: boolean }): Promise<void> {
    await api(`/v1/instructor/lessons/${lessonId}`, { method: "PATCH", body: payload });
}

export async function runInstructorLessonAction(lessonId: string, action: "publish" | "unpublish" | "reorder", payload?: { position: number }): Promise<void> {
    await api(`/v1/instructor/lessons/${lessonId}/${action}`, { method: "POST", body: payload });
}

export async function deleteInstructorLesson(lessonId: string): Promise<void> {
    await api(`/v1/instructor/lessons/${lessonId}`, { method: "DELETE" });
}

export async function uploadInstructorLessonMedia(
    lessonId: string,
    file: File,
): Promise<InstructorLessonMedia> {
    const data = new FormData();
    data.append("file", file);
    data.append("mediable_type", "App\\Models\\Lesson");
    data.append("mediable_id", lessonId);

    const token = authStorage.getToken();
    const response = await fetch(`${env.apiUrl}/v1/media`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: data,
    });
    const payload = await response.json().catch(() => null) as { data?: InstructorLessonMedia; message?: string } | InstructorLessonMedia | null;

    if (!response.ok) {
        throw new ApiError(payload && typeof payload === "object" && "message" in payload && payload.message ? payload.message : "Unable to upload this lesson resource.", response.status);
    }

    return payload && typeof payload === "object" && "data" in payload && payload.data
        ? payload.data
        : payload as InstructorLessonMedia;
}

export async function deleteInstructorLessonMedia(mediaId: string): Promise<void> {
    await api(`/v1/media/${mediaId}`, { method: "DELETE" });
}

export async function getInstructorQuizzes(courseId: string): Promise<InstructorQuiz[]> {
    return api<InstructorQuiz[]>(`/v1/instructor/courses/${courseId}/quizzes`);
}

export async function createInstructorQuiz(courseId: string, payload: { section_id: string; title: string; slug: string; description?: string | null; pass_percentage?: number; max_attempts?: number | null; time_limit?: number | null }): Promise<void> {
    await api(`/v1/instructor/courses/${courseId}/quizzes`, { method: "POST", body: payload });
}

export async function updateInstructorQuiz(quizId: string, payload: { title?: string; slug?: string; description?: string | null; pass_percentage?: number; max_attempts?: number | null; time_limit?: number | null; position?: number }): Promise<void> {
    await api(`/v1/instructor/quizzes/${quizId}`, { method: "PATCH", body: payload });
}

export async function runInstructorQuizAction(quizId: string, action: "publish" | "unpublish"): Promise<void> {
    await api(`/v1/instructor/quizzes/${quizId}/${action}`, { method: "POST" });
}

export async function deleteInstructorQuiz(quizId: string): Promise<void> {
    await api(`/v1/instructor/quizzes/${quizId}`, { method: "DELETE" });
}

export async function createInstructorQuizQuestion(quizId: string, payload: { question: string; type: string; points?: number; required?: boolean }): Promise<void> {
    await api(`/v1/instructor/quizzes/${quizId}/questions`, { method: "POST", body: payload });
}

export async function updateInstructorQuizQuestion(questionId: string, payload: { question?: string; type?: string; points?: number; required?: boolean; position?: number }): Promise<void> {
    await api(`/v1/instructor/quiz-questions/${questionId}`, { method: "PATCH", body: payload });
}

export async function deleteInstructorQuizQuestion(questionId: string): Promise<void> {
    await api(`/v1/instructor/quiz-questions/${questionId}`, { method: "DELETE" });
}

export async function createInstructorQuizOption(questionId: string, payload: { option: string; is_correct?: boolean }): Promise<void> {
    await api(`/v1/instructor/quiz-questions/${questionId}/options`, { method: "POST", body: payload });
}

export async function updateInstructorQuizOption(optionId: string, payload: { option?: string; is_correct?: boolean; position?: number }): Promise<void> {
    await api(`/v1/instructor/quiz-options/${optionId}`, { method: "PATCH", body: payload });
}

export async function deleteInstructorQuizOption(optionId: string): Promise<void> {
    await api(`/v1/instructor/quiz-options/${optionId}`, { method: "DELETE" });
}

export async function getInstructorStudents(search?: string): Promise<InstructorStudentListItem[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return api<InstructorStudentListItem[]>(`/v1/instructor/students${query}`);
}

export async function getInstructorStudent(studentId: number): Promise<InstructorStudentProfile> {
    return api<InstructorStudentProfile>(`/v1/instructor/students/${studentId}`);
}

export async function getInstructorSimulatorAnalytics(): Promise<SimulatorAnalytics> {
    return api<SimulatorAnalytics>("/v1/instructor/simulator/analytics");
}

export async function getInstructorSimulatorSessions(
    params: InstructorSimulatorSessionsParams = {},
): Promise<SimulatorSessionsPage> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
            searchParams.set(key, String(value));
        }
    });
    const query = searchParams.toString();
    const token = authStorage.getToken();
    const response = await fetch(
        `${env.apiUrl}/v1/instructor/simulator/sessions${query ? `?${query}` : ""}`,
        {
            headers: {
                Accept: "application/json",
                ...(token
                    ? {
                        Authorization: `Bearer ${token}`,
                    }
                    : {}),
            },
        },
    );

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
        const message =
            payload &&
            typeof payload === "object" &&
            "message" in payload &&
            typeof payload.message === "string"
                ? payload.message
                : "Unable to load simulator sessions.";

        throw new ApiError(message, response.status);
    }

    return payload as SimulatorSessionsPage;
}

export async function getInstructorStudentSimulator(
    studentId: number,
): Promise<SimulatorStudentActivity> {
    return api<SimulatorStudentActivity>(
        `/v1/instructor/students/${studentId}/simulator`,
    );
}

export async function getInstructorCourseAnalytics(
    courseId: string,
): Promise<InstructorCourseAnalytics> {
    return api<InstructorCourseAnalytics>(
        `/v1/instructor/courses/${courseId}/analytics`,
    );
}

export async function getInstructorCourseFeedback(
    courseId: string,
): Promise<InstructorCourseFeedback> {
    return api<InstructorCourseFeedback>(
        `/v1/instructor/courses/${courseId}/feedback`,
    );
}

export async function getInstructorCourseCertificates(
    courseId: string,
): Promise<InstructorCourseCertificates> {
    return api<InstructorCourseCertificates>(
        `/v1/instructor/courses/${courseId}/certificates`,
    );
}

export async function getInstructorCourseStudents(
    courseId: string,
    params: InstructorStudentsParams = {},
): Promise<PaginatedResponse<InstructorCourseStudent>> {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined) {
        searchParams.set(
            "page",
            String(params.page),
        );
    }

    if (params.per_page !== undefined) {
        searchParams.set(
            "per_page",
            String(params.per_page),
        );
    }

    const query = searchParams.toString();

    return api<PaginatedResponse<InstructorCourseStudent>>(
        `/v1/instructor/courses/${courseId}/students${
            query ? `?${query}` : ""
        }`,
    );
}

export interface InstructorDiagnosticAttempt {
    id: string;
    scenario_id: string;
    scenario?: { id: string; title: string } | null;
    attempt_number?: number | null;
    scenario_version?: number | null;
    status?: string | null;
    passed: boolean;
    score?: number | null;
    hints_used?: number | null;
    submitted_at?: string | null;
    started_at?: string | null;
    student?: { id?: string; name: string; email: string } | null;
}

export interface InstructorDiagnosticResultDetail {
    id: string;
    attempt_id: string;
    scenario_id: string;
    score: number | null;
    accuracy?: number | null;
    process_score?: number | null;
    points_earned?: number | null;
    points_possible?: number | null;
    passed: boolean;
    strengths?: string[];
    weaknesses?: string[];
    breakdown?: Record<string, { step_id: string; title: string; points_earned: number; points_possible: number; is_correct: boolean }>;
    generated_at?: string | null;
}

export interface InstructorDiagnosticScenario {
    id: string;
    title: string;
    slug: string;
    version: number;
    status: string;
    course: { id: string; title: string } | null;
    customer_complaint?: string | null;
    fault_codes?: string[];
    system_tag?: string | null;
    data_pack_id?: string | null;
    max_hints?: number;
    passing_score: number;
    is_required: boolean;
    steps_count: number;
    hints_count: number;
    assignments_count: number;
    attempts_count: number;
    pass_rate: number | null;
    updated_at?: string | null;
}

export interface InstructorDiagnosticVehicle {
    label: string | null;
    make: string | null;
    model: string | null;
    variant: string;
    engine_code: string | null;
    vin?: string | null;
    odometer_km?: number | null;
    pack_version?: string | null;
}

export interface InstructorDiagnosticScoringCriterion {
    id: string;
    step_id: string | null;
    key: string;
    title: string;
    description?: string | null;
    points: number;
    evaluation_type: string;
    rules?: Record<string, unknown> | null;
    is_required?: boolean;
    position?: number;
}

export interface InstructorDiagnosticHint {
    id: string;
    step_id: string | null;
    level: number;
    title: string | null;
    content: string;
    penalty_points: number;
    position?: number;
}

export interface InstructorDiagnosticStep {
    id: string;
    position: number;
    title: string;
    description?: string | null;
    action_type: string;
    tool?: string | null;
    configuration?: Record<string, unknown> | null;
    evidence?: Record<string, unknown> | null;
    duration_seconds?: number | null;
    discipline?: string | null;
    is_required: boolean;
    is_terminal: boolean;
}

export interface InstructorDiagnosticScenarioDetail {
    id: string;
    title: string;
    description?: string | null;
    customer_complaint?: string | null;
    fault_codes?: string[];
    system_tag?: string | null;
    data_pack_id?: string | null;
    vehicle?: InstructorDiagnosticVehicle | null;
    slug: string;
    version: number;
    status: string;
    course: { id: string; title: string } | null;
    passing_score: number;
    time_limit?: number | null;
    max_hints?: number;
    is_required: boolean;
    position?: number | null;
    steps: InstructorDiagnosticStep[];
    scoring_criteria?: InstructorDiagnosticScoringCriterion[];
    hints?: InstructorDiagnosticHint[];
    recent_attempts?: { id: string; student?: string | null; score?: number | null; passed?: boolean | null; status?: string | null }[];
}

export async function getInstructorDiagnosticAnalytics(): Promise<{
    total_scenarios: number;
    total_attempts: number;
    avg_score?: number | null;
    pass_rate?: number | null;
}> {
    return api<{
        total_scenarios: number;
        total_attempts: number;
        avg_score?: number | null;
        pass_rate?: number | null;
    }>(`/v1/instructor/diagnostics/analytics`);
}

export async function getInstructorDiagnosticAttempts(params: {
    per_page?: number;
} = {}): Promise<{ items: InstructorDiagnosticAttempt[] }> {
    const searchParams = new URLSearchParams();

    if (params.per_page !== undefined) {
        searchParams.set("per_page", String(params.per_page));
    }

    const query = searchParams.toString();

    const data = await api<InstructorDiagnosticAttempt[]>(
        `/v1/instructor/diagnostics/attempts${query ? `?${query}` : ""}`,
    );

    return { items: data ?? [] };
}

export async function getInstructorDiagnosticResult(
    attemptId: string,
): Promise<InstructorDiagnosticResultDetail> {
    return api<InstructorDiagnosticResultDetail>(
        `/v1/instructor/diagnostics/attempts/${attemptId}/result`,
    );
}

export async function getInstructorDiagnosticScenarios(params: {
    page?: number;
    per_page?: number;
} = {}): Promise<{ data: InstructorDiagnosticScenario[] }> {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined) {
        searchParams.set("page", String(params.page));
    }

    if (params.per_page !== undefined) {
        searchParams.set("per_page", String(params.per_page));
    }

    const query = searchParams.toString();

    const data = await api<InstructorDiagnosticScenario[]>(
        `/v1/instructor/diagnostics${query ? `?${query}` : ""}`,
    );

    return { data };
}

export async function getInstructorDiagnosticScenario(
    scenarioId: string,
): Promise<InstructorDiagnosticScenarioDetail> {
    return api<InstructorDiagnosticScenarioDetail>(
        `/v1/instructor/diagnostics/${scenarioId}`,
    );
}

export async function createInstructorDiagnosticScenario(payload: {
    course_id: string;
    title: string;
    description?: string;
    customer_complaint?: string | null;
    fault_codes?: string[];
    system_tag?: string | null;
    data_pack_id?: string | null;
    passing_score?: number;
    time_limit?: number | null;
    max_hints?: number | null;
    is_required?: boolean;
}): Promise<{ id: string; slug: string; version: number }> {
    return api<{ id: string; slug: string; version: number }>(
        `/v1/instructor/diagnostics`,
        { method: "POST", body: payload },
    );
}

export async function updateInstructorDiagnosticScenario(
    scenarioId: string,
    payload: Record<string, string | number | boolean | null | string[]>,
): Promise<{ id: string }> {
    return api<{ id: string }>(
        `/v1/instructor/diagnostics/${scenarioId}`,
        { method: "PUT", body: payload },
    );
}

export async function publishInstructorDiagnosticScenario(
    scenarioId: string,
): Promise<{ id: string; status: string }> {
    return api<{ id: string; status: string }>(
        `/v1/instructor/diagnostics/${scenarioId}/publish`,
        { method: "POST" },
    );
}

export async function unpublishInstructorDiagnosticScenario(
    scenarioId: string,
): Promise<{ id: string; status: string }> {
    return api<{ id: string; status: string }>(
        `/v1/instructor/diagnostics/${scenarioId}/unpublish`,
        { method: "POST" },
    );
}

export async function archiveInstructorDiagnosticScenario(
    scenarioId: string,
): Promise<{ id: string }> {
    return api<{ id: string }>(
        `/v1/instructor/diagnostics/${scenarioId}/archive`,
        { method: "POST" },
    );
}

export async function forkInstructorDiagnosticScenario(
    scenarioId: string,
): Promise<{ id: string }> {
    return api<{ id: string }>(
        `/v1/instructor/diagnostics/${scenarioId}/fork`,
        { method: "POST" },
    );
}

export interface InstructorDiagnosticStepPayload {
    title: string;
    description?: string | null;
    action_type: string;
    tool?: string | null;
    configuration?: Record<string, unknown> | null;
    evidence?: Record<string, unknown> | null;
    duration_seconds?: number | null;
    discipline?: string | null;
    is_required?: boolean;
    is_terminal?: boolean;
}

export async function createInstructorDiagnosticStep(
    scenarioId: string,
    payload: InstructorDiagnosticStepPayload,
): Promise<InstructorDiagnosticStep> {
    return api<InstructorDiagnosticStep>(
        `/v1/instructor/diagnostics/${scenarioId}/steps`,
        { method: "POST", body: payload },
    );
}

export async function updateInstructorDiagnosticStep(
    stepId: string,
    payload: Partial<InstructorDiagnosticStepPayload>,
): Promise<InstructorDiagnosticStep> {
    return api<InstructorDiagnosticStep>(
        `/v1/instructor/diagnostics/steps/${stepId}`,
        { method: "PATCH", body: payload },
    );
}

export async function deleteInstructorDiagnosticStep(stepId: string): Promise<{ success: boolean }> {
    return api<{ success: boolean }>(
        `/v1/instructor/diagnostics/steps/${stepId}`,
        { method: "DELETE" },
    );
}

export async function reorderInstructorDiagnosticSteps(
    scenarioId: string,
    ids: string[],
): Promise<{ success: boolean }> {
    return api<{ success: boolean }>(
        `/v1/instructor/diagnostics/${scenarioId}/steps/reorder`,
        { method: "POST", body: { ids } },
    );
}

export async function createInstructorDiagnosticCriterion(
    scenarioId: string,
    payload: {
        step_id?: string | null;
        key: string;
        title: string;
        description?: string | null;
        points: number;
        evaluation_type: string;
        rules?: Record<string, unknown> | null;
        is_required?: boolean;
    },
): Promise<{ id: string }> {
    return api<{ id: string }>(
        `/v1/instructor/diagnostics/${scenarioId}/criteria`,
        { method: "POST", body: payload },
    );
}

export async function updateInstructorDiagnosticCriterion(
    criterionId: string,
    payload: Partial<{
        title: string;
        description: string | null;
        points: number;
        evaluation_type: string;
        rules: Record<string, unknown> | null;
        is_required: boolean;
    }>,
): Promise<{ id: string }> {
    return api<{ id: string }>(
        `/v1/instructor/diagnostics/criteria/${criterionId}`,
        { method: "PATCH", body: payload },
    );
}

export async function deleteInstructorDiagnosticCriterion(criterionId: string): Promise<{ deleted: boolean }> {
    return api<{ deleted: boolean }>(
        `/v1/instructor/diagnostics/criteria/${criterionId}`,
        { method: "DELETE" },
    );
}

export async function createInstructorDiagnosticHint(
    scenarioId: string,
    payload: {
        diagnostic_scenario_step_id?: string | null;
        level?: number;
        title?: string | null;
        content: string;
        penalty_points?: number;
    },
): Promise<{ id: string }> {
    return api<{ id: string }>(
        `/v1/instructor/diagnostics/${scenarioId}/hints`,
        { method: "POST", body: payload },
    );
}

export async function updateInstructorDiagnosticHint(
    hintId: string,
    payload: Partial<{
        level: number;
        title: string | null;
        content: string;
        penalty_points: number;
    }>,
): Promise<{ id: string }> {
    return api<{ id: string }>(
        `/v1/instructor/diagnostics/hints/${hintId}`,
        { method: "PATCH", body: payload },
    );
}

export async function deleteInstructorDiagnosticHint(hintId: string): Promise<{ deleted: boolean }> {
    return api<{ deleted: boolean }>(
        `/v1/instructor/diagnostics/hints/${hintId}`,
        { method: "DELETE" },
    );
}

export async function getInstructorAssessments(
    courseId: string,
): Promise<InstructorAssessment[]> {
    return api<InstructorAssessment[]>(
        `/v1/instructor/courses/${courseId}/assessments`,
    );
}

export async function createInstructorAssessment(
    courseId: string,
    payload: {
        title: string;
        assessment_mode: AssessmentMode | string;
        section_id?: string | null;
        lesson_id?: string | null;
    },
): Promise<InstructorAssessment> {
    const response = await api<{ data: InstructorAssessment }>(
        `/v1/instructor/courses/${courseId}/assessments`,
        { method: "POST", body: payload },
    );

    return response.data;
}

export async function updateInstructorAssessment(
    courseId: string,
    assessmentId: string,
    payload: {
        title?: string;
        description?: string | null;
        minimum_score?: number;
        max_attempts?: number | null;
        assessment_mode?: AssessmentMode | string;
        is_required?: boolean;
    },
): Promise<InstructorAssessment> {
    const response = await api<{ data: InstructorAssessment }>(
        `/v1/instructor/courses/${courseId}/assessments/${assessmentId}`,
        { method: "PUT", body: payload },
    );

    return response.data;
}

export async function runInstructorAssessmentAction(
    courseId: string,
    assessmentId: string,
    action: "publish" | "unpublish",
): Promise<InstructorAssessment> {
    const response = await api<{ data: InstructorAssessment }>(
        `/v1/instructor/courses/${courseId}/assessments/${assessmentId}/${action}`,
        { method: "POST" },
    );

    return response.data;
}

export async function deleteInstructorAssessment(
    courseId: string,
    assessmentId: string,
): Promise<void> {
    await api<void>(
        `/v1/instructor/courses/${courseId}/assessments/${assessmentId}`,
        { method: "DELETE" },
    );
}

export async function getAvailableAssessmentQuestions(
    courseId: string,
): Promise<AvailableAssessmentQuestion[]> {
    const data = await api<AvailableAssessmentQuestion[]>(
        `/v1/instructor/courses/${courseId}/assessments/questions/available`,
    );

    return data ?? [];
}

export async function getAvailableCompetencies(
    courseId: string,
): Promise<AvailableCompetency[]> {
    const data = await api<AvailableCompetency[]>(
        `/v1/instructor/courses/${courseId}/assessments/competencies/available`,
    );

    return data ?? [];
}

export async function syncInstructorAssessmentQuestions(
    courseId: string,
    assessmentId: string,
    rows: Array<{
        quiz_question_id: string;
        position: number;
        points: number;
        competency_id?: string | null;
    }>,
): Promise<void> {
    await api<void>(
        `/v1/instructor/courses/${courseId}/assessments/${assessmentId}/questions`,
        { method: "PUT", body: { questions: rows } },
    );
}

export async function syncInstructorAssessmentCompetencies(
    courseId: string,
    assessmentId: string,
    rows: Array<{ competency_id: string; position: number; weight: number }>,
): Promise<void> {
    await api<void>(
        `/v1/instructor/courses/${courseId}/assessments/${assessmentId}/competencies`,
        { method: "PUT", body: { competencies: rows } },
    );
}

export async function getPendingAssessmentReviews(
    courseId: string,
): Promise<PendingReview[]> {
    return api<PendingReview[]>(
        `/v1/instructor/courses/${courseId}/assessments/reviews/pending`,
    );
}

export async function regradeAssessmentAttempt(
    courseId: string,
    attemptId: string,
    grades: Record<string, { points_earned: number; feedback?: string | null }>,
): Promise<void> {
    await api<void>(
        `/v1/instructor/courses/${courseId}/assessments/attempts/${attemptId}/regrade`,
        { method: "POST", body: { grades } },
    );
}

export async function getFlaggedAssessmentAttempts(
    courseId: string,
): Promise<FlaggedAttempt[]> {
    return api<FlaggedAttempt[]>(
        `/v1/instructor/courses/${courseId}/assessments/attempts/flagged`,
    );
}
