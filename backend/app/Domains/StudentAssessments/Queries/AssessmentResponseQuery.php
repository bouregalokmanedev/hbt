<?php

namespace App\Domains\StudentAssessments\Queries;

use App\Domains\StudentAssessments\Models\StudentAssessmentResponse;

final class AssessmentResponseQuery
{
    public function forAttempt(string $attemptId)
    {
        return StudentAssessmentResponse::where('attempt_id', $attemptId)->with('question')->get();
    }
}
