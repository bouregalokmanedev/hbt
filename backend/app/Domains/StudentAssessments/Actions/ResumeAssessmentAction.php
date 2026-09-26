<?php

namespace App\Domains\StudentAssessments\Actions;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\StudentAssessments\Services\AssessmentAttemptService;
use App\Models\User;

final class ResumeAssessmentAction
{
    public function __construct(private readonly AssessmentAttemptService $attemptService) {}

    public function execute(AssessmentAttempt $attempt, User $user): AssessmentAttempt
    {
        return $this->attemptService->resume($attempt, $user);
    }
}
