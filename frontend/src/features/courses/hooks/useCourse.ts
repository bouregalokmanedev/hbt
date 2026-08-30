import { useCallback, useEffect, useState } from "react";

import {
    getCourse,
} from "../api/courses.api";

import type {
    Course,
} from "../types/course.types";


interface UseCourseResult {
    course: Course | null;
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}


export function useCourse(
    courseId: string | undefined,
): UseCourseResult {
    const [course, setCourse] =
        useState<Course | null>(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);


    const loadCourse =
        useCallback(async () => {
            if (!courseId) {
                setCourse(null);
                setError(
                    "Course ID is missing.",
                );
                setIsLoading(false);

                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const data =
                    await getCourse(courseId);

                setCourse(data);
            } catch (err) {
                setCourse(null);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load course.",
                );
            } finally {
                setIsLoading(false);
            }
        }, [courseId]);


    useEffect(() => {
        void loadCourse();
    }, [loadCourse]);


    return {
        course,
        isLoading,
        error,
        reload: loadCourse,
    };
}