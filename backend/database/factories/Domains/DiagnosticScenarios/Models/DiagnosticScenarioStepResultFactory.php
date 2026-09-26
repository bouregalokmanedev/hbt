<?php

namespace Database\Factories\Domains\DiagnosticScenarios\Models;

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStepResult;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DiagnosticScenarioStepResult>
 */
final class DiagnosticScenarioStepResultFactory extends Factory
{
    protected $model = DiagnosticScenarioStepResult::class;

    public function definition(): array
    {
        return [
            'diagnostic_scenario_id' => DiagnosticScenario::factory(),
            'diagnostic_scenario_attempt_id' => DiagnosticScenarioAttempt::factory(),
            'diagnostic_scenario_step_id' => DiagnosticScenarioStep::factory(),
            'points_earned' => fake()->numberBetween(0, 10),
            'points_possible' => 10,
            'is_correct' => false,
            'criteria_breakdown' => [],
            'graded_at' => now(),
        ];
    }
}
