<?php

namespace App\Domains\StudentAssessments\Repositories;

use App\Domains\StudentAssessments\Models\StudentAssessmentResponse;
use Illuminate\Support\Collection;

final class EloquentAssessmentResponseRepository implements AssessmentResponseRepositoryInterface
{
    public function findForAttempt(string $attemptId): Collection
    {
        return StudentAssessmentResponse::where('attempt_id', $attemptId)->with('question')->get();
    }

    public function save(array $data): StudentAssessmentResponse
    {
        return StudentAssessmentResponse::updateOrCreate(
            ['attempt_id' => $data['attempt_id'], 'question_id' => $data['question_id']],
            $data
        );
    }
}