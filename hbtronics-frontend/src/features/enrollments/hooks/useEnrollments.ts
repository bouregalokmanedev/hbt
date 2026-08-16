import {
    useCallback,
    useEffect,
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
    reload: () => Promise<void>;
}

export function useEnrollments(): UseEnrollmentsResult {
    const [enrollments, setEnrollments] =
        useState<Enrollment[]>([]);

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response =
                await enrollmentsApi.list();

            setEnrollments(response.data);
        } catch (err) {
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
        void load();
    }, [load]);

    return {
        enrollments,
        isLoading,
        error,
        reload: load,
    };
}