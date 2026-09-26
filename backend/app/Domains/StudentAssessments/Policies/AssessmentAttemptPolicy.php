<?php

namespace App\Domains\StudentAssessments\Policies;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Models\User;

final class AssessmentAttemptPolicy
{
    public function view(User $user, AssessmentAttempt $attempt): bool
    {
        return $attempt->user_id === $user->id;
    }

    public function resume(User $user, AssessmentAttempt $attempt, Assessment $assessment): bool
    {
        return $attempt->user_id === $user->id && $attempt->assessment_id === $assessment->id;
    }

    public function saveResponse(User $user, AssessmentAttempt $attempt): bool
    {
        return $attempt->user_id === $user->id;
    }

    public function submit(User $user, AssessmentAttempt $attempt, Assessment $assessment): bool
    {
        return $attempt->user_id === $user->id && $attempt->assessment_id === $assessment->id;
    }

    public function abandon(User $user, AssessmentAttempt $attempt): bool
    {
        return $attempt->user_id === $user->id;
    }
}
