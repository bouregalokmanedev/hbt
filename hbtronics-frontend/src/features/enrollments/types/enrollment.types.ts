export type EnrollmentStatus =
    | string;

export interface Enrollment {
    id: number;

    user_id: number;
    course_id: string;

    status: EnrollmentStatus;

    enrolled_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;

    created_at: string | null;
    updated_at: string | null;
}