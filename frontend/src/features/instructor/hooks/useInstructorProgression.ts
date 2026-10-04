import { useQuery } from "@tanstack/react-query";

import { getInstructorProgression } from "../api/instructorApi";

/**
 * The instructor's teaching XP, level and streak. Cached separately from the
 * dashboard payload so a level-up after publishing doesn't need a full reload.
 */
export function useInstructorProgression() {
    return useQuery({
        queryKey: ["instructor", "progression"],
        queryFn: getInstructorProgression,
        staleTime: 30_000,
    });
}
