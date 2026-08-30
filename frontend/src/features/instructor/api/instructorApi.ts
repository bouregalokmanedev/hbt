import { env } from "@/config/env";
import { ApiError } from "@/lib/api/errors";
import { api } from "@/lib/api/client";
import { authStorage } from "@/lib/storage/auth-storage";
import type {
    Course,
} from "@/features/courses/types/course.types";

import type {
    InstructorCourseAnalytics,
    InstructorCourseCertificates,
    InstructorCourseFeedback,
    InstructorCourseStudent,
    InstructorDashboard,
    InstructorCourseListResponse,
    InstructorCurriculum,
    InstructorQuiz,
    InstructorStudentListItem,
    InstructorStudentProfile,
    InstructorLessonMedia,
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
