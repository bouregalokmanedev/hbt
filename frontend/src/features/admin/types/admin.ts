export interface AdminDashboard {
    administrator: {
        uuid: string;
        name: string;
        email: string;
        roles: string[];
    };
    modules: string[];
    statistics: {
        users: Record<string, number>;
        courses: Record<string, number>;
        enrollments: Record<string, number>;
        learning: Record<string, number>;
    };
    meta: { phase: string; api_version: string; generated_at: string };
}

export interface PageMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface Paginated<T> {
    data: T[];
    meta: PageMeta;
    links: { prev: string | null; next: string | null };
}

export interface AdminUser {
    id: string;
    first_name: string;
    last_name: string;
    username: string | null;
    email: string;
    email_verified_at: string | null;
    status: string;
    roles: string[];
    created_at: string;
}

export interface AdminCourse {
    id: string;
    title: string;
    slug: string;
    short_description: string;
    status: string;
    visibility: string;
    difficulty: string;
    language: string;
    is_free: boolean;
    price: number;
    currency: string;
    enrollments_count: number;
    instructor: { id: string; name: string; email: string } | null;
    categories: Array<{ id: string; name: string; slug: string }>;
    published_at: string | null;
    updated_at: string;
}

export interface AdminEnrollment {
    id: string;
    status: string;
    enrolled_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;
    progress_percentage: number;
    student: { id: string; name: string; email: string } | null;
    course: { id: string; title: string; slug: string; status: string } | null;
}

export interface AdminActivity {
    id: string;
    event: string;
    actor: { id: string; name: string; email: string } | null;
    target: { type: string; id: string };
    changes: { old: Record<string, unknown> | null; new: Record<string, unknown> | null };
    metadata: Record<string, unknown> | null;
    ip_address: string | null;
    occurred_at: string | null;
}

export interface AnalyticsResponse {
    period?: { from: string; to: string };
    summary?: Record<string, number>;
    series?: Array<Record<string, string | number>>;
    created_series?: Array<Record<string, string | number>>;
    published_series?: Array<Record<string, string | number>>;
    enrollment_series?: Array<Record<string, string | number>>;
    completion_series?: Array<Record<string, string | number>>;
    by_course?: Array<{ course_id: string; course_title: string; learners_count: number; average_progress: number; completions_count: number }>;
}

export interface SystemHealth {
    status: string;
    application: Record<string, string>;
    checks: Record<string, { status: string; driver?: string; connection?: string }>;
    checked_at: string;
}

export interface SystemStatistics {
    records: Record<string, number | null>;
    generated_at: string;
}

export interface AuditSummary {
    summary: Record<string, number>;
    events: Array<{ event: string; total: number }>;
    generated_at: string;
}

export interface AdminBroadcast {
    id: string;
    audience: string;
    type: string;
    title: string;
    message: string;
    action_url: string | null;
    delivery: { recipients: number; delivered: number; failed: number; read: number };
    administrator: { id: string; name: string; email: string } | null;
    delivered_at: string | null;
    created_at: string;
}
