<?php

namespace App\Domains\DiagnosticScenarios\Listeners;

use App\Domains\DiagnosticScenarios\Events\DiagnosticAttemptStarted;
use App\Domains\DiagnosticScenarios\Events\DiagnosticAttemptSubmitted;
use App\Domains\DiagnosticScenarios\Events\DiagnosticFailed;
use App\Domains\DiagnosticScenarios\Events\DiagnosticHintUsed;
use App\Domains\DiagnosticScenarios\Events\DiagnosticPassed;
use App\Domains\DiagnosticScenarios\Events\DiagnosticResponseSubmitted;
use App\Domains\DiagnosticScenarios\Events\DiagnosticResultGenerated;
use App\Domains\DiagnosticScenarios\Events\DiagnosticStepCompleted;
use App\Services\Audit\AuditService;

final class RecordDiagnosticAudit
{
    public function __construct(
        private readonly AuditService $audit,
    ) {}

    public function handleAttemptStarted(DiagnosticAttemptStarted $event): void
    {
        $this->audit->log(
            event: 'diagnostic.attempt_started',
            model: $event->attempt,
            new: [
                'scenario_id' => $event->attempt->diagnostic_scenario_id,
                'attempt_number' => $event->attempt->attempt_number,
                'scenario_version' => $event->attempt->scenario_version,
            ],
            metadata: ['user_id' => $event->attempt->user_id],
            actorId: $event->attempt->user_id,
        );
    }

    public function handleResponseSubmitted(DiagnosticResponseSubmitted $event): void
    {
        $this->audit->log(
            event: 'diagnostic.response_submitted',
            model: $event->response,
            new: [
                'attempt_id' => $event->response->diagnostic_scenario_attempt_id,
                'step_id' => $event->response->diagnostic_scenario_step_id,
                'tool' => $event->response->tool?->value,
                'is_correct' => $event->response->is_correct,
            ],
            metadata: ['user_id' => $event->response->user_id],
            actorId: $event->response->user_id,
        );
    }

    public function handleStepCompleted(DiagnosticStepCompleted $event): void
    {
        $attempt = $event->stepResult->attempt;

        $this->audit->log(
            event: 'diagnostic.step_completed',
            model: $event->stepResult,
            new: [
                'attempt_id' => $event->stepResult->diagnostic_scenario_attempt_id,
                'step_id' => $event->stepResult->diagnostic_scenario_step_id,
                'points_earned' => $event->stepResult->points_earned,
                'points_possible' => $event->stepResult->points_possible,
            ],
            metadata: ['user_id' => $attempt?->user_id],
            actorId: $attempt?->user_id,
        );
    }

    public function handleHintUsed(DiagnosticHintUsed $event): void
    {
        $this->audit->log(
            event: 'diagnostic.hint_used',
            model: $event->usage,
            new: [
                'attempt_id' => $event->attempt->id,
                'hint_id' => $event->hint->id,
                'penalty_applied' => $event->usage->penalty_applied,
            ],
            metadata: ['user_id' => $event->attempt->user_id],
            actorId: $event->attempt->user_id,
        );
    }

    public function handleAttemptSubmitted(DiagnosticAttemptSubmitted $event): void
    {
        $this->audit->log(
            event: 'diagnostic.attempt_submitted',
            model: $event->attempt,
            new: [
                'score' => $event->attempt->score,
                'passed' => $event->attempt->passed,
            ],
            metadata: ['user_id' => $event->attempt->user_id],
            actorId: $event->attempt->user_id,
        );
    }

    public function handleResultGenerated(DiagnosticResultGenerated $event): void
    {
        $this->audit->log(
            event: 'diagnostic.result_generated',
            model: $event->result,
            new: [
                'attempt_id' => $event->result->diagnostic_scenario_attempt_id,
                'score' => $event->result->score,
                'passed' => $event->result->passed,
            ],
            metadata: ['user_id' => $event->result->user_id],
            actorId: $event->result->user_id,
        );
    }

    public function handlePassed(DiagnosticPassed $event): void
    {
        $this->audit->log(
            event: 'diagnostic.passed',
            model: $event->result,
            new: ['score' => $event->result->score],
            metadata: ['user_id' => $event->result->user_id],
            actorId: $event->result->user_id,
        );
    }

    public function handleFailed(DiagnosticFailed $event): void
    {
        $this->audit->log(
            event: 'diagnostic.failed',
            model: $event->result,
            new: ['score' => $event->result->score],
            metadata: ['user_id' => $event->result->user_id],
            actorId: $event->result->user_id,
        );
    }
}
