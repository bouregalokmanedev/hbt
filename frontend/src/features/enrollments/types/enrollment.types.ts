export type EnrollmentStatus =
    | "active"
    | "completed"
    | "cancelled"
    | string;

export interface Enrollment {
    id: string;

    user_id: string | number;
    course_id: string;

    status: EnrollmentStatus;

    enrolled_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;

    created_at: string | null;
    updated_at: string | null;

    course?: {
        id: string;
        title: string;
        thumbnail: string | null;
    } | null;

    progress?: {
        progress_percentage: number;
        time_spent: number;
        completed_at: string | null;
    } | null;

    completed_lessons?: number;
    total_lessons?: number;
}
