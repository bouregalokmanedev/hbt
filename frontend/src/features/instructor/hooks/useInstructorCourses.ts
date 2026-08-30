import {
    useQuery,
} from "@tanstack/react-query";

import {
    getInstructorCourses,
    type InstructorCoursesParams,
} from "../api/instructorApi";

export function useInstructorCourses(
    params: InstructorCoursesParams = {},
) {
    return useQuery({
        queryKey: [
            "instructor",
            "courses",
            params,
        ],
        queryFn: () => getInstructorCourses(params),
        staleTime: 30_000,
    });
}
