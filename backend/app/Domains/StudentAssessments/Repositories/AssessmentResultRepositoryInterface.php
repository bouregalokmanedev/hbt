<?php

namespace App\Domains\StudentAssessments\Repositories;

use App\Domains\StudentAssessments\Models\StudentAssessmentResult;

interface AssessmentResultRepositoryInterface
{
    public function findForAttempt(string $attemptId): ?StudentAssessmentResult;
}
