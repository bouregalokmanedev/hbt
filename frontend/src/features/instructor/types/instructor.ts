import type {
    Course,
} from "@/features/courses/types/course.types";

export interface InstructorLessonMedia {
    id: string;
    original_name: string;
    mime_type: string;
    size: number;
    type: "video" | "image" | "document" | string;
    url: string;
}

export interface InstructorDashboard {
    statistics: {
        total: number;
        draft: number;
        review: number;
        published: number;
        archived: number;
    };

    students: {
        total: number;
        active: number;
        new_this_month: number;
        completed: number;
        in_progress: number;
    };

    progress: {
        average_percentage: number;
        completed: number;
        in_progress: number;
    };

    learning: {
        total_time_seconds: number;
        total_time_hours: number;
        average_quiz_score: number;
    };

    overview: {
        total_courses: number;
        total_students: number;
        new_students_this_month: number;
        average_progress: number;
        completion_rate: number;
        average_quiz_score: number;
    };

    recent_activity: InstructorActivity[];
}

export interface InstructorActivity {
    type:
        | "enrollment"
        | "course_completed"
        | "quiz_passed"
        | "quiz_submitted";
    student_name: string;
    course_title: string;
    description: string;
    score?: number;
    occurred_at: string | null;
}

export interface InstructorCourseAnalytics {
    course: {
        id: string;
        title: string;
        slug: string;
        status: string;
        sections_count: number;
        lessons_count: number;
    };

    students: {
        enrolled: number;
        started: number;
        in_progress: number;
        completed: number;
        average_progress: number;
        completion_rate: number;
    };

    learning: {
        total_time_seconds: number;
        total_time_hours: number;
    };

    lessons: {
        started: number;
        completed: number;
    };

    enrollment: {
        new_this_month: number;
        last_7_days: Array<{
            date: string;
            enrollments: number;
        }>;
    };

    sections: Array<{
        id: string;
        title: string;
        position: number;
        lessons_count: number;
        average_progress: number;
        completed_lessons: number;
    }>;

    lesson_performance: Array<{
        id: string;
        section_id: string;
        title: string;
        position: number;
        started_students: number;
        completed_students: number;
        average_progress: number;
    }>;

    quizzes: Array<{
        id: string;
        title: string;
        section_id: string;
        attempts: number;
        unique_students: number;
        average_score: number;
        pass_rate: number;
    }>;

    engagement: {
        active_last_7_days: number;
        active_last_30_days: number;
        inactive_over_14_days: number;
        at_risk_students: Array<{
            student_id: number;
            name: string;
            email: string;
            progress: number;
            enrolled_at: string | null;
            last_activity_at: string | null;
        }>;
    };
}

export interface InstructorCourseStudent {
    student: {
        id: number;
        name: string;
        email: string;
    };

    enrollment: {
        id: string;
        status: string;
        enrolled_at: string | null;
        completed_at: string | null;
    };

    progress: {
        percentage: number;
        time_spent: number;
        completed_at: string | null;
    };

    lessons: {
        completed: number;
        total: number;
    };

    last_activity_at: string | null;
}

export interface InstructorCoursesParams {
    search?: string;
    status?: string;
    difficulty?: string;
    free?: boolean;
    page?: number;
    per_page?: number;
}

export interface InstructorStudentsParams {
    page?: number;
    per_page?: number;
}

export interface InstructorPagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface InstructorCourseListResponse {
    data: Course[];
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
    meta: InstructorPagination;
}

export interface InstructorCurriculum {
    course: {
        id: string;
        title: string;
        slug: string;
        status: string;
    };
    sections: InstructorSection[];
}

export interface InstructorSection {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    position: number;
    status: "draft" | "published" | string;
    lessons: InstructorLesson[];
    quizzes: Array<{
        id: string;
        title: string;
        status?: string;
    }>;
}

export interface InstructorLesson {
    id: string;
    section_id: string;
    title: string;
    slug: string;
    description: string | null;
    content: string | null;
    position: number;
    status: "draft" | "published" | string;
    duration_minutes: number | null;
    is_preview: boolean;
    media: InstructorLessonMedia[];
}

export interface InstructorQuiz {
    id: string;
    section_id: string;
    title: string;
    slug: string | null;
    description: string | null;
    position: number;
    status: "draft" | "published" | "archived" | string;
    pass_percentage: number;
    max_attempts: number | null;
    time_limit: number | null;
    questions: InstructorQuizQuestion[];
}

export interface InstructorQuizQuestion {
    id: string;
    quiz_id: string;
    question: string;
    type: "single_choice" | "multiple_choice" | "true_false" | string;
    position: number;
    points: number;
    required: boolean;
    options: InstructorQuizOption[];
}

export interface InstructorQuizOption {
    id: string;
    question_id: string;
    option: string;
    is_correct: boolean;
    position: number;
}

export interface InstructorStudentListItem {
    student: {
        id: number;
        name: string;
        email: string;
        username: string | null;
        avatar: string | null;
        joined_at: string | null;
    };
    courses_count: number;
    completed_courses: number;
    average_progress: number;
    last_activity_at: string | null;
}

export interface InstructorStudentProfile {
    student: InstructorStudentListItem["student"];
    courses: Array<{
        course: { id: string; title: string; slug: string };
        enrollment: { status: string; enrolled_at: string | null; completed_at: string | null };
        progress: { percentage: number; time_spent: number; completed_at: string | null; completed_lessons: number; last_activity_at: string | null };
    }>;
    quiz_attempts: Array<{ id: string; quiz_title: string; course_title: string; score: number; passed: boolean; submitted_at: string | null }>;
    assessment_attempts: Array<{ id: string; assessment_title: string; course_title: string; score: number | null; passed: boolean | null; status: string; submitted_at: string | null }>;
    certificates: Array<{ id: string; course_id: string; course_title: string; certificate_number: string; issued_at: string | null }>;
    activity: Array<{ type: string; title: string; detail: string; occurred_at: string | null }>;
    simulator?: {
        summary: SimulatorActivitySummary;
        sessions: SimulatorSessionRow[];
    };
}

export interface InstructorCourseFeedback {
    summary: {
        total: number;
        average_rating: number;
        rating_distribution: Record<string, number>;
    };
    recent_feedback: Array<{
        id: string;
        student_name: string;
        rating: number;
        comment: string;
        lesson_title: string | null;
        submitted_at: string | null;
    }>;
}

export interface InstructorCourseCertificates {
    summary: {
        issued: number;
        issued_this_month: number;
        completed_students: number;
        issuance_rate: number;
    };
    certificates: Array<{
        id: string;
        certificate_number: string;
        student_id: number;
        student_name: string;
        student_email: string | null;
        issued_at: string | null;
    }>;
}

export type AssessmentMode = "diagnostic" | "formative" | "practice" | "summative" | "final";

export interface InstructorAssessment {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    minimum_score?: number | null;
    max_attempts?: number | null;
    assessment_mode?: AssessmentMode | string;
    is_required?: boolean;
    questions?: Array<{
        question_id: string;
        points: number;
        competency_id?: string | null;
    }>;
    competencies?: Array<{
        id: string;
        code: string;
        name: string;
        pivot: { weight: number };
    }>;
    [key: string]: any;
}

export interface AvailableAssessmentQuestion {
    id: string;
    question: string;
    points?: number | null;
    [key: string]: any;
}

export interface AvailableCompetency {
    id: string;
    code: string;
    name: string;
    [key: string]: any;
}

export interface PendingReview {
    id: string;
    attempt_id: string;
    [key: string]: any;
}

export interface FlaggedAttempt {
    id: string;
    attempt_id: string;
    issues: any[];
    [key: string]: any;
}

export interface SimulatorSessionResult {
    outcome: string | null;
    verdict: string | null;
    score: number | null;
    attempts: number | null;
    hints_used: number | null;
    duration_seconds: number | null;
    created_at: string | null;
}

export interface SimulatorSessionRow {
    id: string;
    student: { id: number; name: string; email: string; avatar: string | null } | null;
    tool: string;
    vehicle_key: string | null;
    scenario_key: string | null;
    status: string;
    score: number | null;
    duration_seconds: number | null;
    started_at: string | null;
    ended_at: string | null;
    result: SimulatorSessionResult | null;
}

export interface SimulatorActivitySummary {
    sessions: number;
    completed: number;
    results: number;
    average_score: number;
    pass_rate: number;
    average_hints: number;
    average_duration_seconds: number;
}

export interface SimulatorAnalyticsTotals extends SimulatorActivitySummary {
    active: number;
    students: number;
    total_duration_seconds: number;
}

export interface SimulatorToolAnalytics {
    tool: string;
    sessions: number;
    completed: number;
    results: number;
    average_score: number;
    pass_rate: number;
    average_hints: number;
    average_duration_seconds: number;
}

export interface SimulatorAnalytics {
    totals: SimulatorAnalyticsTotals;
    by_tool: SimulatorToolAnalytics[];
    by_vehicle?: Array<{ vehicle_key: string; sessions: number; label?: string | null }>;
}

export interface SimulatorStudentActivity {
    student_id: number;
    summary: SimulatorActivitySummary;
    sessions: SimulatorSessionRow[];
}

export interface SimulatorSessionsPage {
    data: SimulatorSessionRow[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface InstructorSimulatorSessionsParams {
    search?: string;
    tool?: string;
    status?: string;
    vehicle?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
}
