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
): UseCourseEnrollmentResult {
    const [enrollment, setEnrollment] =
        useState<Enrollment | null>(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [isEnrolling, setIsEnrolling] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const loadEnrollment =
        useCallback(async () => {
            if (!courseId) {
                setEnrollment(null);
                setError("Course ID is missing.");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const response =
                    await enrollmentsApi.list();

                const currentEnrollment =
                    response.data.find(
                        (item) =>
                            item.course_id === courseId &&
                            item.status !== "cancelled",
                    ) ?? null;

                setEnrollment(
                    currentEnrollment,
                );
            } catch (err) {
                setEnrollment(null);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load enrollment.",
                );
            } finally {
                setIsLoading(false);
            }
        }, [courseId]);

    useEffect(() => {
        void loadEnrollment();
    }, [loadEnrollment]);

    const enroll = useCallback(
        async (): Promise<Enrollment | null> => {
            if (!courseId) {
                return null;
            }

            try {
                setIsEnrolling(true);
                setError(null);

                const created = await enrollmentsApi.create(courseId);

                setEnrollment(created);

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
        [courseId],
    );

    return {
        enrollment,
        isLoading,
        isEnrolling,
        error,
        enroll,
        reload: loadEnrollment,
    };
}