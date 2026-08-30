import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    getLearningCurriculum,
} from "../api/lessons.api";

import type {
    CourseCurriculum,
} from "@/features/courses/types/course.types";

export function useLearningCurriculum(
    courseId: string | undefined,
) {
    const [curriculum, setCurriculum] =
        useState<CourseCurriculum | null>(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const loadCurriculum =
        useCallback(async () => {
            if (!courseId) {
                setError(
                    "Course ID is missing.",
                );

                setIsLoading(false);

                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const data =
                    await getLearningCurriculum(
                        courseId,
                    );

                setCurriculum(data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load curriculum.",
                );
            } finally {
                setIsLoading(false);
            }
        }, [courseId]);

    useEffect(() => {
        void loadCurriculum();
    }, [loadCurriculum]);

    return {
        curriculum,
        isLoading,
        error,
        reload: loadCurriculum,
    };
}