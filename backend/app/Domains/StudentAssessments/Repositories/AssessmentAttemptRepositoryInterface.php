<?php

namespace App\Domains\StudentAssessments\Repositories;

use App\Domains\Assessments\Models\AssessmentAttempt;

interface AssessmentAttemptRepositoryInterface
{
    public function find(string $id): ?AssessmentAttempt;
    public function activeFor(string $assessmentId, string $userId): ?AssessmentAttempt;
}
