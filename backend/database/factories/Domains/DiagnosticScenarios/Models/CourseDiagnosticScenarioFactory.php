<?php

namespace Database\Factories\Domains\DiagnosticScenarios\Models;

use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CourseDiagnosticScenario>
 */
final class CourseDiagnosticScenarioFactory extends Factory
{
    protected $model = CourseDiagnosticScenario::class;

    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),
            'diagnostic_scenario_id' => DiagnosticScenario::factory(),
            'position' => fake()->unique()->numberBetween(1, 9999),
            'is_required' => true,
            'min_score' => 70,
            'max_attempts' => null,
            'available_from' => null,
            'available_until' => null,
        ];
    }
}
