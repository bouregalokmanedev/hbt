<?php

namespace App\Domains\DiagnosticScenarios\Events;

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioResult;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class DiagnosticResultGenerated
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public DiagnosticScenarioResult $result,
    ) {}
}
