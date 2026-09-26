export const TOOL_LABELS: Record<DiagnosticTool, string> = {
    scanner: "Scanner",
    multimeter: "Multimeter",
    oscilloscope: "Oscilloscope",
    location: "Location",
    schematic: "Schematic",
};

export type DiagnosticState = "available" | "in_progress" | "completed";

export type DiagnosticTool =
    | "scanner"
    | "multimeter"
    | "oscilloscope"
    | "location"
    | "schematic";

export interface DiagnosticCourseRef {
    id: string;
    title: string;
}

export interface DiagnosticHubItem {
    id: string;
    title: string;
    description: string | null;
    version: number;
    course: DiagnosticCourseRef | null;
    passing_score: number;
    time_limit: number | null;
    is_required: boolean;
    min_score: number;
    max_attempts: number | null;
    attempts_used: number;
    steps_count: number;
    completed: boolean;
    best_score: number | null;
    in_progress_attempt_id: string | null;
    state: DiagnosticState;
}

export interface DiagnosticStep {
    id: string;
    position: number;
    title: string;
    description: string | null;
    action_type: string;
    tool: DiagnosticTool | null;
    duration_seconds: number | null;
    discipline: string | null;
    evidence: Record<string, unknown> | null;
    /** Safe bench focus only (e.g. multimeter component_ref) — never expected answers. */
    bench?: { component_ref?: string | null } | null;
    is_required: boolean;
    is_terminal: boolean;
    criteria_points: number;
    answered: boolean;
}

export interface DiagnosticVehicleInfo {
    label: string | null;
    make: string | null;
    model: string | null;
    variant: string;
    engine_code: string | null;
    fuel_type?: string | null;
    transmission?: string | null;
    year_from?: number | null;
    year_to?: number | null;
    vin?: string | null;
    odometer_km?: number | null;
    pack_version?: string | null;
}

export interface DiagnosticScenarioDetail {
    id: string;
    title: string;
    description: string | null;
    customer_complaint: string | null;
    fault_codes: string[];
    system_tag: string | null;
    vehicle: DiagnosticVehicleInfo | null;
    passing_score: number;
    time_limit: number | null;
    max_hints: number;
    in_progress_attempt_id: string | null;
    current_step_id: string | null;
    steps: DiagnosticStep[];
}

export interface AttemptStep extends DiagnosticStep {
    choice: Record<string, unknown> | null;
}

export interface DiagnosticAttempt {
    id: string;
    scenario_id: string;
    scenario?: {
        id: string;
        title: string;
        description?: string | null;
        customer_complaint?: string | null;
        fault_codes?: string[];
        system_tag?: string | null;
        passing_score?: number;
        time_limit?: number | null;
        max_hints?: number;
        vehicle?: DiagnosticVehicleInfo | null;
    } | null;
    attempt_number: number;
    scenario_version?: number;
    status: string;
    score?: number | null;
    passed?: boolean;
    started_at?: string | null;
    submitted_at?: string | null;
    steps: AttemptStep[];
}

export interface StepAnswerOutcome {
    points_earned: number;
    scenario_complete: boolean;
    next_step: DiagnosticStep | null;
}

export interface DiagnosticHint {
    id: string;
    step_id: string | null;
    level: number;
    title: string | null;
    content?: string;
    penalty_points: number;
    revealed: boolean;
}

export interface HintsState {
    hints: DiagnosticHint[];
    hints_used: number;
    hints_remaining: number;
    penalty_total: number;
}

export interface DiagnosticResult {
    id: string;
    attempt_id: string;
    scenario_id: string;
    score: number;
    accuracy: number | null;
    process_score: number | null;
    points_earned: number;
    points_possible: number;
    passed: boolean;
    strengths: string[];
    weaknesses: string[];
    breakdown: Record<string, {
        step_id: string;
        title: string;
        points_earned: number;
        points_possible: number;
        is_correct: boolean;
    }>;
    generated_at: string | null;
}
