import { useQuery } from "@tanstack/react-query";

import {
    getInstructorCourseAnalytics,
} from "../api/instructorApi";

export function useInstructorCourseAnalytics(
    courseId: string,
) {
    return useQuery({
        queryKey: [
            "instructor",
            "course",
            courseId,
            "analytics",
        ],
        queryFn: () =>
            getInstructorCourseAnalytics(
                courseId,
            ),
        enabled: Boolean(courseId),
        staleTime: 30_000,
    });
}