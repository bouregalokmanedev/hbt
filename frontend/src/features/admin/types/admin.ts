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
    governance: {
        staff: { super_admins: number; admins: number; support: number; instructors: number };
        escalations: number;
        failed_webhooks: number;
        recent_privileged_actions: Array<{ event: string; subject: string; at: string | null }>;
    } | null;
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

export interface AdminStudent {
    id: string;
    name: string;
    email: string;
    enrollments_count: number;
    completed_count: number;
    certificates_count: number;
    last_active_at: string | null;
}

export interface AdminInstructor {
    id: string;
    name: string;
    email: string;
    courses_count: number;
    students_taught: number;
    average_rating: number | null;
    verified: boolean;
    status: string;
}

export interface AdminQuiz {
    id: string;
    title: string;
    pass_percentage: number;
    course: string | null;
    status: string;
    questions_count: number;
    attempts_count: number;
    pass_rate: number | null;
}

export interface AdminAssessment {
    id: string;
    title: string;
    course: string | null;
    status: string;
    minimum_score: number | null;
    attempts_count: number;
    pass_rate: number | null;
    is_required: boolean;
}

export interface AdminDiagnosticAnalytics {
    total_scenarios: number;
    total_attempts: number;
    avg_score: number | null;
    pass_rate: number | null;
}

export interface AdminDiagnosticRow {
    id: string;
    title: string;
    version: number;
    status: string;
    course: string | null;
    steps_count: number;
    attempts_count: number;
    pass_rate: number | null;
}

export interface AdminDiagnosticStep {
    id: string;
    position: number;
    title: string;
    action_type: string;
    is_required: boolean;
    is_terminal: boolean;
}

export interface AdminDiagnosticCriterion {
    id: string;
    key: string;
    title: string;
    points: number;
    evaluation_type: string;
}

export interface AdminDiagnosticHint {
    id: string;
    level: number;
    title: string;
    content: string;
    penalty_points: number;
}

export interface AdminDiagnosticAssignment {
    id: string;
    course: { title: string } | null;
    min_score: number | null;
    max_attempts: number | null;
}

export interface AdminDiagnosticScenarioDetail {
    id: string;
    title: string;
    version: number;
    status: string;
    steps: AdminDiagnosticStep[];
    scoring_criteria: AdminDiagnosticCriterion[];
    hints: AdminDiagnosticHint[];
    assignments: AdminDiagnosticAssignment[];
}

export interface AdminQuizQuestionOption {
    id: string;
    option: string;
    is_correct: boolean;
}

export interface AdminQuizQuestion {
    id: string;
    position: number;
    question: string;
    type: string;
    points: number;
    options: AdminQuizQuestionOption[];
}

export interface AdminQuizAttempt {
    id: string;
    student: string;
    email: string;
    score: number;
    total_points: number;
    percentage: number;
    attempt_number: number;
    tab_switch_count: number;
    passed: boolean;
    answers: Array<{ question: string; is_correct: boolean }>;
}

export interface AdminQuizDetail {
    id: string;
    title: string;
    description: string | null;
    status: string;
    course: string | null;
    section: string | null;
    pass_percentage: number;
    max_attempts: number | null;
    time_limit: number | null;
    stats: { questions_count: number; attempts_count: number; pass_rate: number | null; average_percentage: number | null };
    questions: AdminQuizQuestion[];
}

export interface AdminAssessmentAttempt {
    id: string;
    student: string;
    email: string;
    score: number;
    result_score: number;
    attempt_number: number;
    tab_switch_count: number;
    passed: boolean;
    result_passed: boolean;
    answers: Array<{ question: string; is_correct: boolean }>;
}

export interface AdminAssessmentDetail {
    id: string;
    title: string;
    description: string | null;
    status: string;
    course: string | null;
    is_required: boolean;
    minimum_score: number | null;
    max_attempts: number | null;
    stats: { attempts_count: number; pass_rate: number | null; results_count: number };
}

export interface AdminSupportReply {
    id: string;
    body: string;
    internal: boolean;
    author: string;
    created_at: string;
}

export interface AdminSupportTicketDetail {
    id: string;
    subject: string;
    status: string;
    priority: string;
    level: string;
    category: string;
    user: string;
    email: string;
    assignee: string | null;
    due_at: string | null;
    overdue: boolean;
    replies: AdminSupportReply[];
}

export interface InstructorDetailData {
    performance: { courses_count: number; students_taught: number; average_rating: number | null; reviews_count: number; total_enrollments: number };
    courses: Array<{ id: string; title: string; status: string; enrollments_count: number }>;
    recent_feedback: Array<{ rating: number; reviewer: string; comment: string; course: string; created_at: string }>;
}

export interface RiskDashboardData {
    by_level: { critical: number; high: number; medium: number; low: number };
    by_status: { open: number };
    overdue_reviews: number;
    failed_controls: number;
}

export interface RiskRow {
    id: string;
    title: string;
    level: string;
    score: number;
    status: string;
}

export interface RiskOverdueRow {
    id: string;
    title: string;
    next_review_at: string | null;
}

export interface FailedControlRow {
    id: string;
    name: string;
    risk: string;
}

export interface IncidentRow {
    id: string;
    incident_number: string;
    title: string;
    severity: string;
}

export interface CommerceOverview {
    gross_revenue: number;
    currency: string;
    net_revenue: number;
    refunded: number;
    active_subscriptions: number;
    purchases: number;
    pending_transactions: number;
    failed_transactions: number;
    revenue_14d: Array<{ date: string; total: number }>;
    recent_transactions: Array<{ id: string; user: string; course: string; kind: string; provider_ref: string; amount: number; currency: string; status: string }>;
}

export interface CommerceTransactionRow {
    id: string;
    user: string;
    provider_ref: string;
    course: string;
    kind: string;
    amount: number;
    currency: string;
    status: string;
}

export interface CommerceSubscriptionRow {
    id: string;
    user: string;
    email: string;
    plan: string;
    status: string;
    current_period_ends_at: string | null;
}

export interface CommerceRefundRow {
    id: string;
    user: string;
    amount: number;
    currency: string;
    reason: string;
    created_at: string;
    status: string;
}

export interface CommercePayoutRow {
    id: string;
    instructor: string;
    amount: number;
    currency: string;
    period: string;
    note: string;
    status: string;
}

export interface CommerceOrderRow {
    id: string;
    user: string;
    email: string;
    status: string;
    total: number;
    currency: string;
}

export interface CommerceInvoiceRow {
    id: string;
    number: string;
    user: string;
    status: string;
    total: number;
    currency: string;
}

export interface CommerceWebhookRow {
    id: string;
    provider: string;
    event_type: string;
    status: string;
}

export interface FailedPaymentRow {
    id: string;
    user: string;
    amount: number;
    currency: string;
    failure_code: string;
    failure_message: string;
}

export interface SecurityAuthLogRow {
    id: string;
    email: string;
    user: { name: string };
    browser: string;
    event: string;
    successful: boolean;
    failure_reason: string | null;
    ip_address: string;
    created_at: string;
}

export interface SecuritySessionRow {
    id: string;
    user: { name: string; email: string };
    browser: string;
    platform: string;
    ip_address: string;
    active: boolean;
}

export interface AdminSupportTicket {
    id: string;
    subject: string;
    category: string;
    user: string;
    priority: string;
    status: string;
    level: string;
    assignee: string | null;
    overdue: boolean;
}

export interface JourneyEnrollment {
    enrollment_id: string;
    course: { title: string };
    enrollment_status: string;
    progress: { progress_percentage: number };
    sections: Array<{
        id: string;
        position: number;
        title: string;
        is_completed: boolean;
        progress_percentage: number;
        lessons: Array<{ id: string; title: string; is_completed: boolean; progress_percentage: number }>;
    }>;
}

export interface AdminSimulatorSessionResult {
    id?: string;
    outcome: string | null;
    verdict: string | null;
    score: number | null;
    attempts: number | null;
    hints_used: number | null;
    duration_seconds: number | null;
    created_at: string | null;
}

export interface AdminSimulatorSessionRow {
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
    result: AdminSimulatorSessionResult | null;
}

export interface AdminSimulatorActivitySummary {
    sessions: number;
    completed: number;
    results: number;
    average_score: number;
    pass_rate: number;
    average_hints: number;
    average_duration_seconds: number;
}

export interface AdminSimulatorAnalyticsTotals extends AdminSimulatorActivitySummary {
    active: number;
    students: number;
    total_duration_seconds: number;
}

export interface AdminSimulatorToolAnalytics {
    tool: string;
    sessions: number;
    completed: number;
    results: number;
    average_score: number;
    pass_rate: number;
    average_hints: number;
    average_duration_seconds: number;
}

export interface AdminSimulatorAnalytics {
    totals: AdminSimulatorAnalyticsTotals;
    by_tool: AdminSimulatorToolAnalytics[];
    by_vehicle?: Array<{ vehicle_key: string; sessions: number; label?: string | null }>;
}

export interface AdminSimulatorSessionsPage {
    data: AdminSimulatorSessionRow[];
    meta: PageMeta;
}

export interface AdminStudentJourney {
    summary: {
        enrollments: number;
        completed: number;
        certificates: number;
        quiz_attempts: number;
        assessment_attempts: number;
        simulator_sessions: number;
    };
    simulator?: {
        summary: AdminSimulatorActivitySummary;
        sessions: AdminSimulatorSessionRow[];
    };
    journey: JourneyEnrollment[];
    quiz_attempts: Array<{ id: string; quiz: string; score: number; total_points: number; percentage: number; submitted_at: string; passed: boolean }>;
    assessment_attempts: Array<{ id: string; assessment: string; result_score: number; score: number; submitted_at: string; passed: boolean; result_passed: boolean }>;
    certificates: Array<{ id: string; course_title: string; certificate_number: string; issued_at: string }>;
    activity: Array<{ event: string; ip_address: string | null; created_at: string; successful: boolean }>;
}
