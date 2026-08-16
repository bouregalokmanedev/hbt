import { api } from "@/lib/api/client";

import type { Enrollment } from "../types/enrollment.types";

export const enrollmentsApi = {
    async list() {
        return api<{
            data: Enrollment[];
        }>("/v1/enrollments");
    },

    async create(courseId: string) {
        return api<Enrollment>(
            "/v1/enrollments",
            {
                method: "POST",
                body: {
                    course_id: courseId,
                },
            },
        );
    },

    async complete(enrollmentId: string) {
        return api<Enrollment>(
            `/v1/enrollments/${enrollmentId}/complete`,
            {
                method: "POST",
            },
        );
    },

    async cancel(enrollmentId: string) {
        return api<Enrollment>(
            `/v1/enrollments/${enrollmentId}/cancel`,
            {
                method: "POST",
            },
        );
    },
};