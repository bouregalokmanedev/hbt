<?php

namespace Database\Factories\Domains\DiagnosticScenarios\Models;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticActionType;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DiagnosticScenarioStep>
 */
final class DiagnosticScenarioStepFactory extends Factory
{
    protected $model = DiagnosticScenarioStep::class;

    public function definition(): array
    {
        return [
            'diagnostic_scenario_id' => DiagnosticScenario::factory(),

            'position' => fake()->numberBetween(1, 20),

            'title' => fake()->sentence(4),

            'description' => fake()->paragraph(),

            'action_type' => fake()->randomElement(
                DiagnosticActionType::cases()
            ),

            'configuration' => [
                'required' => true,
            ],

            'evidence' => [],

            'is_required' => true,

            'is_terminal' => false,
        ];
    }
}