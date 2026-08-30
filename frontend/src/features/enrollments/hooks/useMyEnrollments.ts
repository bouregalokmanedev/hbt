
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import { enrollmentsApi } from "../api/enrollments.api";

import type { Enrollment } from "../types/enrollment.types";

import { authStorage } from "@/lib/storage/auth-storage";

interface UseMyEnrollmentsResult {
    enrollments: Enrollment[];
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function useMyEnrollments(): UseMyEnrollmentsResult {
    const [enrollments, setEnrollments] =
        useState<Enrollment[]>([]);

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const loadEnrollments = useCallback(async () => {
        const token = authStorage.getToken();

        if (!token) {
            setEnrollments([]);
            setError(null);
            setIsLoading(false);

            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const response = await enrollmentsApi.list();

            setEnrollments(response.data);
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

    return {
        enrollments,
        isLoading,
        error,
        reload: loadEnrollments,
    };
}