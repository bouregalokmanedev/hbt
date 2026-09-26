<?php

namespace App\Domains\StudentAssessments\Actions;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\StudentAssessments\Services\AssessmentResultService;
use App\Models\User;

final class ReviewAssessmentResultAction
{
    public function __construct(private readonly AssessmentResultService $resultService) {}

    public function execute(AssessmentAttempt $attempt, User $user)
    {
        return $this->resultService->findForAttempt($attempt, $user);
    }
}
