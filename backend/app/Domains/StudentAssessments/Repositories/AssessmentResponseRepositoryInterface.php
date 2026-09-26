<?php

namespace App\Domains\StudentAssessments\Repositories;

use App\Domains\StudentAssessments\Models\StudentAssessmentResponse;

interface AssessmentResponseRepositoryInterface
{
    public function findForAttempt(string $attemptId): \Illuminate\Support\Collection;
    public function save(array $data): StudentAssessmentResponse;
}
