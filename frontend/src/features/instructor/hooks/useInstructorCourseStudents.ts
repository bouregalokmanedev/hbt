import { useQuery } from "@tanstack/react-query";

import {
    getInstructorCourseStudents,
} from "../api/instructorApi";

interface Options {
    page?: number;
    perPage?: number;
}

export function useInstructorCourseStudents(
    courseId: string,
    options: Options = {},
) {
    const {
        page = 1,
        perPage = 20,
    } = options;

    return useQuery({
        queryKey: [
            "instructor",
            "course",
            courseId,
            "students",
            {
                page,
                perPage,
            },
        ],
        queryFn: () =>
            getInstructorCourseStudents(
                courseId,
                {
                    page,
                    per_page: perPage,
                },
            ),
        enabled: Boolean(courseId),
        staleTime: 30_000,
    });
}