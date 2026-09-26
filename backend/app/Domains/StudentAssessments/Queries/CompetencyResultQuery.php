<?php

namespace App\Domains\StudentAssessments\Queries;

use App\Domains\StudentAssessments\Models\StudentCompetencyResult;
use App\Models\User;

final class CompetencyResultQuery
{
    public function forStudent(User $user, ?string $competencyName = null)
    {
        $q = StudentCompetencyResult::whereHas('attempt', fn ($qq) => $qq->where('user_id', $user->id));
        if ($competencyName) {
            $q->where('competency_name', $competencyName);
        }

        return $q->latest()->get();
    }

    public function competencySummary(User $user): array
    {
        $results = $this->forStudent($user);
        return [
            'strong' => $results->where('strength_level', 'strong')->values(),
            'weak' => $results->where('strength_level', 'weak')->values(),
            'developing' => $results->where('strength_level', 'developing')->values(),
        ];
    }
}
