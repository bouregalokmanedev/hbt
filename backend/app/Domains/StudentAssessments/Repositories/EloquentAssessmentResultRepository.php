<?php

namespace App\Domains\StudentAssessments\Repositories;

use App\Domains\StudentAssessments\Models\StudentAssessmentResult;

final class EloquentAssessmentResultRepository implements AssessmentResultRepositoryInterface
{
    public function findForAttempt(string $attemptId): ?StudentAssessmentResult
    {
        return StudentAssessmentResult::where('attempt_id', $attemptId)->first();
    }
}