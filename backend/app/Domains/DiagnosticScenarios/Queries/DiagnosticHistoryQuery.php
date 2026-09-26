<?php

namespace App\Domains\DiagnosticScenarios\Queries;

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class DiagnosticHistoryQuery
{
    public function forStudent(
        User $user,
        ?string $scenarioId = null,
        int $perPage = 15,
    ): LengthAwarePaginator {
        return DiagnosticScenarioAttempt::query()
            ->with(['scenario:id,title', 'result'])
            ->withCount('hintUsages')
            ->where('user_id', $user->id)
            ->when($scenarioId, fn ($q) => $q->where('diagnostic_scenario_id', $scenarioId))
            ->orderByDesc('created_at')
            ->paginate(min(max($perPage, 1), 100));
    }
}
