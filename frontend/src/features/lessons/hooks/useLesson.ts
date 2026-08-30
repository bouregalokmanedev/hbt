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

    return {
        lesson,
        isLoading,
        error,
        reload: loadLesson,
    };
}