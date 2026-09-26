<?php

namespace App\Domains\DiagnosticScenarios\Actions;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticTool;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioResponse;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStepResult;
use App\Domains\DiagnosticScenarios\Services\DiagnosticExecutionService;
use App\Models\User;

/**
 * Submit a single diagnostic step.
 * Backend verifies: allowed, correct step, probe/tool validity (via payload rules),
 * prior attempts, hint usage (penalties applied at result time), and persists.
 */
final class SubmitDiagnosticStepAction
{
    public function __construct(
        private readonly DiagnosticExecutionService $execution,
    ) {}

    /**
     * @return array{attempt: DiagnosticScenarioAttempt, response: DiagnosticScenarioResponse, step_result: DiagnosticScenarioStepResult, next_step: ?DiagnosticScenarioStep, scenario_complete: bool, progress: int, points_earned: int}
     */
    public function execute(
        DiagnosticScenarioAttempt $attempt,
        User $user,
        DiagnosticScenarioStep $step,
        array $payload,
        ?DiagnosticTool $tool = null,
    ): array {
        if ($attempt->user_id !== $user->id) {
            abort(404);
        }

        $outcome = $this->execution->submitStep($attempt, $step, $payload, $tool);

        return array_merge($outcome, [
            'points_earned' => (int) $outcome['step_result']->points_earned,
        ]);
    }
}
