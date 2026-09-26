<?php

namespace App\Domains\StudentAssessments\Repositories;

use App\Domains\Assessments\Models\AssessmentAttempt;

final class EloquentAssessmentAttemptRepository implements AssessmentAttemptRepositoryInterface
{
    public function find(string $id): ?AssessmentAttempt
    {
        return AssessmentAttempt::with(['result', 'assessment.questions.options'])->find($id);
    }

    public function activeFor(string $assessmentId, string $userId): ?AssessmentAttempt
    {
        return AssessmentAttempt::where('assessment_id', $assessmentId)
            ->where('user_id', $userId)
            ->where('status', 'in_progress')
            ->first();
    }
}