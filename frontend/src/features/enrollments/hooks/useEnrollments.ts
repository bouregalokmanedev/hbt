import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { enrollmentsApi } from "../api/enrollments.api";

import type {
    Enrollment,
} from "../types/enrollment.types";

interface UseEnrollmentsResult {
    enrollments: Enrollment[];
    isLoading: boolean;
    error: string | null;

    isEnrolled: (
        courseId: string,
    ) => boolean;

    getEnrollment: (
        courseId: string,
    ) => Enrollment | null;

    reload: () => Promise<void>;
}

export function useEnrollments(): UseEnrollmentsResult {
    const [
        enrollments,
        setEnrollments,
    ] = useState<Enrollment[]>([]);

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    const loadEnrollments =
        useCallback(async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response =
                    await enrollmentsApi.list();

                setEnrollments(
                    response.data ?? [],
                );
            } catch (err) {
                setEnrollments([]);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load enrollments.",
                );
            } finally {
                setIsLoading(false);
            }
        }, []);

    useEffect(() => {
        void loadEnrollments();
    }, [loadEnrollments]);

    const enrollmentMap = useMemo(() => {
        return new Map(
            enrollments.map(
                (enrollment) => [
                    enrollment.course_id,
                    enrollment,
                ],
            ),
        );
    }, [enrollments]);

    const isEnrolled = useCallback(
        (courseId: string): boolean => {
            const enrollment =
                enrollmentMap.get(courseId);

            return (
                enrollment !== undefined &&
                enrollment.status === "active"
            );
        },
        [enrollmentMap],
    );

    const getEnrollment =
        useCallback(
            (
                courseId: string,
            ): Enrollment | null => {
                return (
                    enrollmentMap.get(
                        courseId,
                    ) ?? null
                );
            },
            [enrollmentMap],
        );

    return {
        enrollments,
        isLoading,
        error,
        isEnrolled,
        getEnrollment,
        reload: loadEnrollments,
    };
}