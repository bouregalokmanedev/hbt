import { useQuery } from "@tanstack/react-query";

import { getInstructorAttention } from "../api/instructorApi";

/**
 * Cross-course work waiting on this instructor. Kept on its own key (and its
 * own endpoint) so the queue can refresh independently of the dashboard's
 * 30-second cache instead of dragging the whole hero payload along.
 */
export function useInstructorAttention() {
    return useQuery({
        queryKey: ["instructor", "attention"],
        queryFn: getInstructorAttention,
        staleTime: 15_000,
    });
}
