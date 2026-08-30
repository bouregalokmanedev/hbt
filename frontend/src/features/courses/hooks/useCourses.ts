import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    coursesApi,
    type CourseListParams,
    type CoursePaginationMeta,
} from "../api/courses.api";

import type {
    Course,
} from "../types/course.types";

export function useCourses(
    params: CourseListParams = {},
) {
    const stableParams =
        useMemo(
            () => params,
            [
                params.search,
                params.difficulty,
                params.free,
                params.language,
                params.category,
                params.page,
                params.per_page,
            ],
        );

    const [
        courses,
        setCourses,
    ] = useState<Course[]>([]);

    const [
        pagination,
        setPagination,
    ] =
        useState<CoursePaginationMeta | null>(
            null,
        );

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] =
        useState<string | null>(
            null,
        );

    const loadCourses =
        useCallback(
            async () => {
                setIsLoading(true);
                setError(null);

                try {
                    const response =
                        await coursesApi.list(
                            stableParams,
                        );

                    setCourses(
                        Array.isArray(
                            response.data,
                        )
                            ? response.data
                            : [],
                    );

                    setPagination(
                        response.meta ??
                            null,
                    );
                } catch (
                    requestError
                ) {
                    setCourses([]);
                    setPagination(null);

                    setError(
                        requestError instanceof
                            Error
                            ? requestError.message
                            : "Unable to load courses.",
                    );
                } finally {
                    setIsLoading(false);
                }
            },
            [stableParams],
        );

    useEffect(() => {
        void loadCourses();
    }, [loadCourses]);

    return {
        courses,
        pagination,

        isLoading,
        error,

        reload:
            loadCourses,
    };
}