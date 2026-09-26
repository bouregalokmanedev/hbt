<?php

namespace App\Domains\DiagnosticScenarios\Events;

use App\Domains\DiagnosticScenarios\Models\DiagnosticHintUsage;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioHint;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class DiagnosticHintUsed
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public DiagnosticScenarioAttempt $attempt,
        public DiagnosticScenarioHint $hint,
        public DiagnosticHintUsage $usage,
    ) {}
}
