
import { env } from "@/config/env";
import { handleUnauthorizedResponse } from "@/lib/api/unauthorized";
import { authStorage } from "@/lib/storage/auth-storage";

import type { Enrollment } from "../types/enrollment.types";

interface EnrollmentResponse {
    data: Enrollment;
}

interface EnrollmentListResponse {
    data: Enrollment[];
    meta?: {
        current_page?: number;
        last_page?: number;
        per_page?: number;
        total?: number;
    };
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
        handleUnauthorizedResponse(response.status, Boolean(token));

        const message =
            payload?.message ??
            "Unable to process enrollment.";

        throw new Error(message);
    }

    return payload as T;
}

export const enrollmentsApi = {
    async list(): Promise<EnrollmentListResponse> {
        const first = await request<EnrollmentListResponse>(
            "/v1/enrollments?per_page=100",
        );

        const lastPage = first.meta?.last_page ?? 1;

        if (lastPage <= 1) {
            return first;
        }

        // The backend paginates to keep responses bounded. The My Courses
        // page has no pager, so fetch the remaining pages and join them to
        // preserve the complete list the UI already renders.
        const remaining = await Promise.all(
            Array.from({ length: lastPage - 1 }, (_, index) =>
                request<EnrollmentListResponse>(
                    `/v1/enrollments?per_page=100&page=${index + 2}`,
                ),
            ),
        );

        return {
            data: [first, ...remaining].flatMap((page) => page.data),
            meta: first.meta,
        };
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