<?php

namespace App\Domains\DiagnosticScenarios\Actions;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticTool;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Domains\DiagnosticScenarios\Services\DiagnosticExecutionService;
use App\Models\User;

final class AnswerDiagnosticScenarioStepAction
{
    public function __construct(
        private readonly DiagnosticExecutionService $execution,
    ) {}

    /**
     * Record (or re-record) one step answer. Autosave semantics — the
     * attempt stays IN_PROGRESS so the student can resume.
     *
     * Delegates to DiagnosticExecutionService so responses + step results
     * are persisted in normalized tables (evidence blob dual-written for BC).
     *
     * @return array{attempt: DiagnosticScenarioAttempt, next_step: ?DiagnosticScenarioStep, scenario_complete: bool, points_earned: int}
     */
    public function execute(
        DiagnosticScenarioAttempt $attempt,
        User $user,
        DiagnosticScenarioStep $step,
        array $choice,
        ?DiagnosticTool $tool = null,
    ): array {
        if ($attempt->user_id !== $user->id) {
            abort(404);
        }

        $outcome = $this->execution->submitStep($attempt, $step, $choice, $tool);

        return [
            'attempt' => $outcome['attempt'],
            'next_step' => $outcome['next_step'],
            'scenario_complete' => $outcome['scenario_complete'],
            'points_earned' => (int) $outcome['step_result']->points_earned,
        ];
    }
}
