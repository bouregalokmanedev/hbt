<?php

namespace App\Domains\StudentAssessments\Policies;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Models\User;

final class AssessmentResultPolicy
{
    public function view(User $user, AssessmentAttempt $attempt): bool
    {
        return $attempt->user_id === $user->id;
    }
}
