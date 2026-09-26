<?php

namespace Database\Factories\Domains\DiagnosticScenarios\Models;

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioResult;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DiagnosticScenarioResult>
 */
final class DiagnosticScenarioResultFactory extends Factory
{
    protected $model = DiagnosticScenarioResult::class;

    public function definition(): array
    {
        return [
            'diagnostic_scenario_id' => DiagnosticScenario::factory(),
            'diagnostic_scenario_attempt_id' => DiagnosticScenarioAttempt::factory(),
            'user_id' => User::factory(),
            'score' => fake()->numberBetween(0, 100),
            'accuracy' => fake()->numberBetween(0, 100),
            'process_score' => fake()->numberBetween(0, 100),
            'points_earned' => 0,
            'points_possible' => 0,
            'passed' => false,
            'strengths' => [],
            'weaknesses' => [],
            'breakdown' => [],
            'generated_at' => now(),
        ];
    }
}
