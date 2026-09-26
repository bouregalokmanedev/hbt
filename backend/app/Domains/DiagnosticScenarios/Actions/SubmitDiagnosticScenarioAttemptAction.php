<?php

namespace App\Domains\DiagnosticScenarios\Actions;

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Models\User;

final class SubmitDiagnosticScenarioAttemptAction
{
    public function __construct(
        private readonly CompleteDiagnosticAttemptAction $completer,
    ) {}

    public function execute(DiagnosticScenarioAttempt $attempt, User $user): DiagnosticScenarioAttempt
    {
        $this->completer->execute($attempt, $user);

        return $attempt->fresh();
    }
}
