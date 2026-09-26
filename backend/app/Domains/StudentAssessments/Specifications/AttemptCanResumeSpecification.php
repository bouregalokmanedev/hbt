<?php

namespace App\Domains\StudentAssessments\Specifications;

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Models\User;

final class AttemptCanResumeSpecification
{
    public function isSatisfiedBy(AssessmentAttempt $attempt, User $user): bool
    {
        if ($attempt->user_id !== $user->id) {
            return false;
        }

        if ($attempt->status !== AssessmentAttemptStatus::IN_PROGRESS) {
            return false;
        }

        if ($attempt->expires_at && $attempt->expires_at->isPast()) {
            return false;
        }

        if ($attempt->blocked_at !== null) {
            return false;
        }

        return true;
    }

    public function reason(AssessmentAttempt $attempt, User $user): ?string
    {
        if ($attempt->user_id !== $user->id) {
            return 'Attempt does not belong to user.';
        }
        if ($attempt->status !== AssessmentAttemptStatus::IN_PROGRESS) {
            return 'Attempt is not in progress.';
        }
        if ($attempt->expires_at && $attempt->expires_at->isPast()) {
            return 'Attempt has expired.';
        }
        if ($attempt->blocked_at !== null) {
            return 'Attempt is blocked.';
        }

        return null;
    }
}
