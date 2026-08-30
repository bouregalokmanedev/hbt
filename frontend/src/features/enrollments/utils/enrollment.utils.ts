import type {
    Enrollment,
} from "../types/enrollment.types";

export function getEnrollmentForCourse(
    enrollments: Enrollment[],
    courseId: string,
): Enrollment | null {
    return (
        enrollments.find(
            (enrollment) =>
                enrollment.course_id === courseId &&
                enrollment.status !== "cancelled",
        ) ?? null
    );
}

export function isCourseEnrolled(
    enrollments: Enrollment[],
    courseId: string,
): boolean {
    return Boolean(
        getEnrollmentForCourse(
            enrollments,
            courseId,
        ),
    );
}