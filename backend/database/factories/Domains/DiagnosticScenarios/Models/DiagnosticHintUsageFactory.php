<?php

namespace Database\Factories\Domains\DiagnosticScenarios\Models;

use App\Domains\DiagnosticScenarios\Models\DiagnosticHintUsage;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioHint;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DiagnosticHintUsage>
 */
final class DiagnosticHintUsageFactory extends Factory
{
    protected $model = DiagnosticHintUsage::class;

    public function definition(): array
    {
        return [
            'diagnostic_scenario_id' => DiagnosticScenario::factory(),
            'diagnostic_scenario_attempt_id' => DiagnosticScenarioAttempt::factory(),
            'diagnostic_scenario_hint_id' => DiagnosticScenarioHint::factory(),
            'user_id' => User::factory(),
            'penalty_applied' => 5,
            'used_at' => now(),
        ];
    }
}
