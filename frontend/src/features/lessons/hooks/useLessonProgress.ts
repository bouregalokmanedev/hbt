import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    getLessonProgress,
} from "../api/lessons.api";

import type {
    LessonProgress,
} from "../types/lesson.types";

export function useLessonProgress(
    lessonId: string | undefined,
    enabled = true,
) {
    const [progress, setProgress] =
        useState<LessonProgress | null>(null);

    const [isLoading, setIsLoading] =
        useState(enabled);

    const [error, setError] =
        useState<string | null>(null);

    const loadProgress =
        useCallback(async () => {
            if (!enabled) {
                setIsLoading(false);
                return;
            }

            if (!lessonId) {
                setError("Lesson ID is missing.");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const data =
                    await getLessonProgress(
                        lessonId,
                    );

                setProgress(data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load lesson progress.",
                );
            } finally {
                setIsLoading(false);
            }
        }, [
            lessonId,
            enabled,
        ]);

    useEffect(() => {
        void loadProgress();
    }, [loadProgress]);

    return {
        progress,
        isLoading,
        error,
        reload: loadProgress,
    };

}