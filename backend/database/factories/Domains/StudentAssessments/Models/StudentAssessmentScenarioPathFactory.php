<?php

namespace Database\Factories\Domains\StudentAssessments\Models;

use App\Domains\StudentAssessments\Models\StudentAssessmentScenarioPath;
use Illuminate\Database\Eloquent\Factories\Factory;

final class StudentAssessmentScenarioPathFactory extends Factory
{
    protected $model = StudentAssessmentScenarioPath::class;

    public function definition(): array
    {
        return [
            'attempt_id' => \App\Domains\Assessments\Models\AssessmentAttempt::factory(),
            'scenario_id' => \App\Domains\DiagnosticScenarios\Models\DiagnosticScenario::factory(),
            'step_id' => \App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep::factory(),
            'chosen_option' => ['action' => 'inspect', 'component' => 'fuel_pressure'],
            'next_step_id' => \App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep::factory(),
            'order' => fake()->numberBetween(1, 5),
            'points_earned' => fake()->numberBetween(0, 10),
        ];
    }
}