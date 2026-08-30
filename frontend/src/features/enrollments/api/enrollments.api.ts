
import { env } from "@/config/env";
import { authStorage } from "@/lib/storage/auth-storage";

import type { Enrollment } from "../types/enrollment.types";

interface EnrollmentResponse {
    data: Enrollment;
}

interface EnrollmentListResponse {
    data: Enrollment[];
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const token =
        authStorage.getToken();

    const headers =
        new Headers(options.headers);

    headers.set(
        "Accept",
        "application/json",
    );

    if (options.body !== undefined) {
        headers.set(
            "Content-Type",
            "application/json",
        );
    }

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`,
        );
    }

    const response =
        await fetch(
            `${env.apiUrl}${endpoint}`,
            {
                ...options,
                headers,
            },
        );

    let payload: any = null;

    try {
        payload =
            await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok) {
        const message =
            payload?.message ??
            "Unable to process enrollment.";

        throw new Error(message);
    }

    return payload as T;
}

export const enrollmentsApi = {
    async list(): Promise<EnrollmentListResponse> {
        return request<EnrollmentListResponse>(
            "/v1/enrollments",
        );
    },

    async create(
        courseId: string,
    ): Promise<Enrollment> {
        const response =
            await request<EnrollmentResponse>(
                "/v1/enrollments",
                {
                    method: "POST",

                    body: JSON.stringify({
                        course_id: courseId,
                    }),
                },
            );

        return response.data;
    },

    async complete(
        enrollmentId: string,
    ): Promise<Enrollment> {
        const response =
            await request<EnrollmentResponse>(
                `/v1/enrollments/${enrollmentId}/complete`,
                {
                    method: "POST",
                },
            );

        return response.data;
    },

    async cancel(
        enrollmentId: string,
    ): Promise<Enrollment> {
        const response =
            await request<EnrollmentResponse>(
                `/v1/enrollments/${enrollmentId}/cancel`,
                {
                    method: "POST",
                },
            );

        return response.data;
    },
};