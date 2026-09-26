<?php

namespace App\Domains\StudentAssessments\Repositories;

use App\Domains\StudentAssessments\Models\StudentCompetencyResult;
use Illuminate\Support\Collection;

final class EloquentCompetencyResultRepository implements CompetencyResultRepositoryInterface
{
    public function forStudent(string $userId): Collection
    {
        return StudentCompetencyResult::whereHas('attempt', fn ($q) => $q->where('user_id', $userId))
            ->with(['attempt', 'result'])
            ->latest()
            ->get();
    }

    public function forAttempt(string $attemptId): Collection
    {
        return StudentCompetencyResult::where('attempt_id', $attemptId)
            ->with('competency')
            ->get();
    }
}