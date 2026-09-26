<?php

namespace App\Domains\StudentAssessments\Enums;

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;

/**
 * Student-centric view of AssessmentAttemptStatus.
 * Keeps strict state machine: NOT_STARTED -> IN_PROGRESS -> ABANDONED/EXPIRED -> SUBMITTED -> EVALUATING -> COMPLETED -> RESULT_AVAILABLE
 * Adds ABANDONED and EVALUATING which map to underlying attempt transitions.
 */
enum AttemptStatus: string
{
    case NOT_STARTED = 'not_started';
    case IN_PROGRESS = 'in_progress';
    case ABANDONED = 'abandoned';
    case EXPIRED = 'expired';
    case SUBMITTED = 'submitted';
    case EVALUATING = 'evaluating';
    case PASSED = 'passed';
    case FAILED = 'failed';
    case COMPLETED = 'completed';
    case EVALUATION_FAILED = 'evaluation_failed';

    public static function fromAssessmentAttemptStatus(AssessmentAttemptStatus $status): self
    {
        return match ($status) {
            AssessmentAttemptStatus::IN_PROGRESS => self::IN_PROGRESS,
            AssessmentAttemptStatus::SUBMITTED => self::SUBMITTED,
            AssessmentAttemptStatus::PASSED => self::PASSED,
            AssessmentAttemptStatus::FAILED => self::FAILED,
            AssessmentAttemptStatus::EXPIRED => self::EXPIRED,
        };
    }

    public function toAssessmentAttemptStatus(): ?AssessmentAttemptStatus
    {
        return match ($this) {
            self::IN_PROGRESS => AssessmentAttemptStatus::IN_PROGRESS,
            self::SUBMITTED => AssessmentAttemptStatus::SUBMITTED,
            self::PASSED => AssessmentAttemptStatus::PASSED,
            self::FAILED => AssessmentAttemptStatus::FAILED,
            self::EXPIRED => AssessmentAttemptStatus::EXPIRED,
            self::ABANDONED => AssessmentAttemptStatus::EXPIRED, // abandoned maps to expired storage
            self::EVALUATING => AssessmentAttemptStatus::SUBMITTED,
            default => null,
        };
    }

    public function canResume(): bool
    {
        return $this === self::IN_PROGRESS;
    }

    public function canSubmit(): bool
    {
        return $this === self::IN_PROGRESS;
    }

    public function canAbandon(): bool
    {
        return $this === self::IN_PROGRESS;
    }
}
