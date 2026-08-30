import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    getCourseCurriculum,
} from "../api/courses.api";

import type {
    CourseCurriculum,
} from "../types/course.types";

interface UseCourseCurriculumResult {
    curriculum: CourseCurriculum | null;
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function useCourseCurriculum(
    courseId: string | undefined,
): UseCourseCurriculumResult {
    const [
        curriculum,
        setCurriculum,
    ] = useState<CourseCurriculum | null>(
        null,
    );

    const [
        isLoading,
        setIsLoading,
    ] = useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const loadCurriculum =
        useCallback(async () => {
            if (!courseId) {
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const data =
                    await getCourseCurriculum(
                        courseId,
                    );

                setCurriculum(data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load curriculum.",
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