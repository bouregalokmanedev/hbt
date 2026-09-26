<?php

namespace App\Domains\StudentAssessments\Repositories;

use Illuminate\Support\Collection;

interface CompetencyResultRepositoryInterface
{
    public function forStudent(string $userId): Collection;
    public function forAttempt(string $attemptId): Collection;
}
