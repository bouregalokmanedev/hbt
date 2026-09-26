<?php

namespace Database\Factories\Domains\DiagnosticScenarios\Models;

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioHint;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DiagnosticScenarioHint>
 */
final class DiagnosticScenarioHintFactory extends Factory
{
    protected $model = DiagnosticScenarioHint::class;

    public function definition(): array
    {
        return [
            'diagnostic_scenario_id' => DiagnosticScenario::factory(),
            'diagnostic_scenario_step_id' => null,
            'level' => 1,
            'title' => fake()->sentence(4),
            'content' => fake()->paragraph(),
            'penalty_points' => 5,
            'position' => fake()->numberBetween(1, 10),
        ];
    }

    public function forStep(DiagnosticScenarioStep $step): static
    {
        return $this->state(fn (): array => [
            'diagnostic_scenario_id' => $step->diagnostic_scenario_id,
            'diagnostic_scenario_step_id' => $step->id,
        ]);
    }

    public function level(int $level): static
    {
        return $this->state(fn (): array => ['level' => $level]);
    }
}
