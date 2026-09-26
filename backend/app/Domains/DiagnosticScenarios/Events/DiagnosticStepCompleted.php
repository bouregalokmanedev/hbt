<?php

namespace App\Domains\DiagnosticScenarios\Events;

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStepResult;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class DiagnosticStepCompleted
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public DiagnosticScenarioStepResult $stepResult,
    ) {}
}
