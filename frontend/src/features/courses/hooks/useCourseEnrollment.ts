
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import { enrollmentsApi } from "../../enrollments/api/enrollments.api";

import type { Enrollment } from "../../enrollments/types/enrollment.types";

interface UseCourseEnrollmentResult {
    enrollment: Enrollment | null;

    isLoading: boolean;
    isEnrolling: boolean;

    error: string | null;

    enroll: () => Promise<Enrollment | null>;

    reload: () => Promise<void>;
}

export function useCourseEnrollment(
    courseId: string | undefined,
    initialEnrollment: Enrollment | null = null,
    enabled = true,
): UseCourseEnrollmentResult {
    const [
        enrollment,
        setEnrollment,
    ] = useState<Enrollment | null>(
        initialEnrollment,
    );

    const [
        isLoading,
        setIsLoading,
    ] = useState(false);

    const [
        isEnrolling,
        setIsEnrolling,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    useEffect(() => {
        setEnrollment(
            initialEnrollment,
        );
    }, [initialEnrollment]);

    const enroll =
        useCallback(
            async (): Promise<Enrollment | null> => {
                if (
                    !courseId ||
                    !enabled ||
                    isEnrolling
                ) {
                    return null;
                }

                try {
                    setIsEnrolling(true);
                    setError(null);

                    const created =
                        await enrollmentsApi.create(
                            courseId,
                        );

                    setEnrollment(
                        created,
                    );

                    return created;
                } catch (err) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to enroll in this course.",
                    );

                    return null;
                } finally {
                    setIsEnrolling(false);
                }
            },
            [
                courseId,
                enabled,
                isEnrolling,
            ],
        );

    const reload =
        useCallback(
            async () => {
                if (!courseId || !enabled) {
                    return;
                }

                try {
                    setIsLoading(true);
                    setError(null);

                    const response =
                        await enrollmentsApi.list();

                    const current =
                        response.data.find(
                            (item) =>
                                item.course_id ===
                                    courseId &&
                                item.status !==
                                    "cancelled",
                        ) ?? null;

                    setEnrollment(
                        current,
                    );
                } catch (err) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load enrollment.",
                    );
                } finally {
                    setIsLoading(false);
                }
            },
            [courseId, enabled],
        );

    useEffect(() => {
        void reload();
    }, [reload]);

    return {
        enrollment,
        isLoading,
        isEnrolling,
        error,
        enroll,
        reload,
    };
}
