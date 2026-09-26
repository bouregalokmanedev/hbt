import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    getLesson,
} from "../api/lessons.api";

import type {
    Lesson,
    LessonProgress,
} from "../types/lesson.types";

export function useLesson(
    lessonId: string | undefined,
) {
    const [lesson, setLesson] =
        useState<Lesson | null>(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const loadLesson =
        useCallback(async () => {
            if (!lessonId) {
                setError(
                    "Lesson ID is missing.",
                );

                setIsLoading(false);

                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const data =
                    await getLesson(
                        lessonId,
                    );

                setLesson(data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load lesson.",
                );
            } finally {
                setIsLoading(false);
            }
        }, [lessonId]);

    useEffect(() => {
        void loadLesson();
    }, [loadLesson]);

    /*
     * Merge server-confirmed progress into the current lesson so the
     * session header and sidebar reflect reality immediately instead of
     * waiting for a full reload. Only applies to the loaded lesson —
     * never touches other lessons' state.
     */
    const applyProgress = useCallback((progress: LessonProgress) => {
        setLesson((current) => {
            if (!current || current.id !== progress.lesson_id) {
                return current;
            }

            return {
                ...current,
                progress: {
                    ...progress,
                    is_completed:
                        progress.is_completed ||
                        progress.completed_at != null,
                },
            };
        });
    }, []);

    return {
        lesson,
        isLoading,
        error,
        reload: loadLesson,
        applyProgress,
    };
}