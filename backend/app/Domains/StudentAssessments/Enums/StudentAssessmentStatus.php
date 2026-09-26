<?php

namespace App\Domains\StudentAssessments\Enums;

/**
 * High-level status for the student-facing assessment lifecycle.
 * Maps to AssessmentAttemptStatus but adds ABANDONED / EVALUATING states.
 */
enum StudentAssessmentStatus: string
{
    case NOT_STARTED = 'not_started';
    case IN_PROGRESS = 'in_progress';
    case ABANDONED = 'abandoned';
    case EXPIRED = 'expired';
    case SUBMITTED = 'submitted';
    case EVALUATING = 'evaluating';
    case COMPLETED = 'completed';
    case RESULT_AVAILABLE = 'result_available';
    case EVALUATION_FAILED = 'evaluation_failed';
}
