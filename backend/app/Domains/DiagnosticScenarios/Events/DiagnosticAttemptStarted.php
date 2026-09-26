<?php

namespace App\Domains\DiagnosticScenarios\Events;

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class DiagnosticAttemptStarted
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public DiagnosticScenarioAttempt $attempt,
    ) {}
}
