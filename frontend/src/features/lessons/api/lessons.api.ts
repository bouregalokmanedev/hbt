import { api } from "@/lib/api/api";

import type {
    Lesson,
    LessonProgress,
} from "../types/lesson.types";

import type {
    CourseCurriculum,
} from "@/features/courses/types/course.types";

export async function getLesson(
    lessonId: string,
): Promise<Lesson> {
    return api<Lesson>(
        `/v1/lessons/${lessonId}`,
    );
}

export async function getLessonProgress(
    lessonId: string,
): Promise<LessonProgress> {
    return api<LessonProgress>(
        `/v1/lessons/${lessonId}/progress`,
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

export async function getLearningCurriculum(
    courseId: string,
): Promise<CourseCurriculum> {
    return api<CourseCurriculum>(
        `/v1/courses/${courseId}/curriculum`,
    );
}