import { api } from "@/lib/api/api"

export interface Lesson {
    course_id: any;
    id: string;
    title: string;
    slug: string;
    description: string | null;
    content: string | null;
    position: number;
    status: string;
    duration_minutes: number;
    is_preview: boolean;
}

export interface LessonProgress {
    id: string;
    lesson_id: string;
    progress_percentage: number;
    time_spent: number;
    completed_at: string | null;
}

export async function getLessonProgress(
    lessonId: string,
): Promise<LessonProgress> {
    return api<LessonProgress>(
        `/v1/lessons/${lessonId}/progress`,
    );
}

export interface LessonProgress {
    id: string;
    lesson_id: string;
    progress_percentage: number;
    time_spent: number;
    completed_at: string | null;
}

export async function getLesson(
    lessonId: string,
): Promise<Lesson> {
    return api<Lesson>(
        `/v1/lessons/${lessonId}`,
    );
}

export async function updateLessonProgress(
    lessonId: string,
    data: {
        progress_percentage?: number;
        time_spent?: number;
    },
): Promise<LessonProgress> {
    return api<LessonProgress>(
        `/v1/lessons/${lessonId}/progress`,
        {
            method: "PATCH",
            body: data,
        },
    );
}

export async function completeLesson(
    lessonId: string,
): Promise<LessonProgress> {
    return api<LessonProgress>(
        `/v1/lessons/${lessonId}/complete`,
        {
            method: "POST",
        },
    );
}