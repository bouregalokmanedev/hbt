<?php

namespace Database\Factories\Domains\DiagnosticScenarios\Models;

use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticProgress;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CourseDiagnosticProgress>
 */
final class CourseDiagnosticProgressFactory extends Factory
{
    protected $model = CourseDiagnosticProgress::class;

    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),
            'diagnostic_scenario_id' => DiagnosticScenario::factory(),
            'user_id' => User::factory(),
            'best_score' => null,
            'attempts_count' => 0,
            'passed' => false,
            'completed_at' => null,
        ];
    }
}
