<?php

namespace App\Domains\StudentAssessments\Actions;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\StudentAssessments\Services\AssessmentAttemptService;
use App\Models\User;
use App\Domains\Assessments\Models\AssessmentAttempt;

final class StartAssessmentAction
{
    public function __construct(private readonly AssessmentAttemptService $attemptService) {}

    public function execute(Assessment $assessment, User $user): AssessmentAttempt
    {
        // student_id comes from auth()->id(), never from request
        return $this->attemptService->start($assessment, $user);
    }
}
