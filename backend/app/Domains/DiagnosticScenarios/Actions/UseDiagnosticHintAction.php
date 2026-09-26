<?php

namespace App\Domains\DiagnosticScenarios\Actions;

use App\Domains\DiagnosticScenarios\Events\DiagnosticHintUsed;
use App\Domains\DiagnosticScenarios\Models\DiagnosticHintUsage;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioHint;
use App\Domains\DiagnosticScenarios\Services\DiagnosticHintService;
use App\Models\User;

/**
 * Student uses a diagnostic hint. Penalty is recorded now and applied
 * to the score at result generation. Hints never reveal the answer
 * directly beyond their authored progressive level.
 */
final class UseDiagnosticHintAction
{
    public function __construct(
        private readonly DiagnosticHintService $hints,
    ) {}

    /**
     * @return array{usage: DiagnosticHintUsage, hint: DiagnosticScenarioHint, hints_used: int, penalty_total: int}
     */
    public function execute(
        DiagnosticScenarioAttempt $attempt,
        User $user,
        DiagnosticScenarioHint $hint,
    ): array {
        if ($attempt->user_id !== $user->id) {
            abort(404);
        }

        $outcome = $this->hints->useHint($attempt, $hint);

        DiagnosticHintUsed::dispatch($attempt->fresh(), $hint, $outcome['usage']);

        return [
            'usage' => $outcome['usage'],
            'hint' => $hint,
            'hints_used' => $outcome['hints_used'],
            'penalty_total' => $outcome['penalty_total'],
        ];
    }
}
