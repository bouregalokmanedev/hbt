import { useQuery } from "@tanstack/react-query";

import { getInstructorTrends } from "../api/instructorApi";

/** Enrollments and completions, bucketed per day for the requested window. */
export function useInstructorTrends(days = 30) {
    return useQuery({
        queryKey: ["instructor", "trends", days],
        queryFn: () => getInstructorTrends(days),
        staleTime: 60_000,
    });
}
