import { api } from "@/lib/api/client";

export function submitCourseFeedback(
    courseId: string,
    data: { lesson_id?: string; rating: number; comment?: string },
) {
    return api(`/v1/courses/${courseId}/feedback`, {
        method: "POST",
        body: data,
    });
}
