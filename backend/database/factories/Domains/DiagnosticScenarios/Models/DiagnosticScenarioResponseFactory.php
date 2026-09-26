<?php

namespace Database\Factories\Domains\DiagnosticScenarios\Models;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticTool;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioResponse;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DiagnosticScenarioResponse>
 */
final class DiagnosticScenarioResponseFactory extends Factory
{
    protected $model = DiagnosticScenarioResponse::class;

    public function definition(): array
    {
        return [
            'diagnostic_scenario_id' => DiagnosticScenario::factory(),
            'diagnostic_scenario_attempt_id' => DiagnosticScenarioAttempt::factory(),
            'diagnostic_scenario_step_id' => DiagnosticScenarioStep::factory(),
            'user_id' => User::factory(),
            'response_number' => 1,
            'tool' => fake()->randomElement(DiagnosticTool::cases()),
            'payload' => ['action' => 'inspect'],
            'points_earned' => 0,
            'points_possible' => 10,
            'is_correct' => false,
            'submitted_at' => now(),
        ];
    }
}
