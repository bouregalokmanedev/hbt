<?php

namespace App\Domains\StudentAssessments\Specifications;

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Models\User;

final class AttemptCanSubmitSpecification
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

        if ($attempt->result()->exists()) {
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
            return 'Attempt already submitted.';
        }
        if ($attempt->expires_at && $attempt->expires_at->isPast()) {
            return 'Time expired.';
        }
        if ($attempt->result()->exists()) {
            return 'Result already exists.';
        }

        return null;
    }
}
