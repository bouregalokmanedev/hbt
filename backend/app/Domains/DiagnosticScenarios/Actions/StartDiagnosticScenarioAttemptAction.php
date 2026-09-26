<?php

namespace App\Domains\DiagnosticScenarios\Actions;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioStatus;
use App\Domains\DiagnosticScenarios\Events\DiagnosticAttemptStarted;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Models\User;
use LogicException;

final class StartDiagnosticScenarioAttemptAction
{
    public function execute(DiagnosticScenario $scenario, User $user): DiagnosticScenarioAttempt
    {
        if ($scenario->status !== DiagnosticScenarioStatus::PUBLISHED) {
            throw new LogicException('This scenario is not available.');
        }

        $active = $scenario->attempts()
            ->where('user_id', $user->id)
            ->where('status', DiagnosticScenarioAttemptStatus::IN_PROGRESS)
            ->first();

        if ($active) {
            if ($this->isExpired($scenario, $active)) {
                $active->update(['status' => DiagnosticScenarioAttemptStatus::EXPIRED]);
            } else {
                return $active;
            }
        }

        $attemptNumber = $scenario->attempts()->where('user_id', $user->id)->count() + 1;

        $attempt = $scenario->attempts()->create([
            'user_id' => $user->id,
            'attempt_number' => $attemptNumber,
            'scenario_version' => (int) ($scenario->version ?? 1),
            'score' => 0,
            'passed' => false,
            'status' => DiagnosticScenarioAttemptStatus::IN_PROGRESS,
            'evidence' => ['steps' => []],
            'started_at' => now(),
        ]);

        DiagnosticAttemptStarted::dispatch($attempt);

        return $attempt;
    }

    public function isExpired(DiagnosticScenario $scenario, DiagnosticScenarioAttempt $attempt): bool
    {
        if ($scenario->time_limit === null || $attempt->started_at === null) {
            return false;
        }

        return $attempt->started_at->copy()->addMinutes($scenario->time_limit)->isPast();
    }
}
