<?php

namespace Database\Factories\Domains\DiagnosticScenarios\Models;

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioScoringCriterion;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DiagnosticScenarioScoringCriterion>
 */
final class DiagnosticScenarioScoringCriterionFactory extends Factory
{
    protected $model = DiagnosticScenarioScoringCriterion::class;

    public function definition(): array
    {
        return [
            'diagnostic_scenario_id' => DiagnosticScenario::factory(),

            'step_id' => DiagnosticScenarioStep::factory(),

            'key' => fake()->unique()->word(),

            'title' => fake()->sentence(4),

            'description' => fake()->paragraph(),

            'points' => fake()->numberBetween(1, 25),

            'evaluation_type' => 'boolean',

            'rules' => [
                'expected' => true,
            ],

            'is_required' => true,

            'position' => fake()->numberBetween(1, 10),
        ];
    }
}