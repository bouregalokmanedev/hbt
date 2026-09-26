<?php

namespace App\Domains\DiagnosticScenarios\Events;

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioResponse;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class DiagnosticResponseSubmitted
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public DiagnosticScenarioResponse $response,
    ) {}
}
