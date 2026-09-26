<?php

namespace Database\Factories\Domains\StudentAssessments\Models;

use App\Domains\StudentAssessments\Models\StudentCompetencyResult;
use App\Domains\StudentAssessments\Enums\ProficiencyLevel;
use Illuminate\Database\Eloquent\Factories\Factory;

final class StudentCompetencyResultFactory extends Factory
{
    protected $model = StudentCompetencyResult::class;

    public function definition(): array
    {
        $percentage = fake()->randomFloat(2, 0, 100);
        return [
            'attempt_id' => \App\Domains\Assessments\Models\AssessmentAttempt::factory(),
            'result_id' => \App\Domains\StudentAssessments\Models\StudentAssessmentResult::factory(),
            'competency_id' => \App\Domains\Assessments\Models\Competency::factory(),
            'competency_name' => fake()->words(2, true),
            'score' => fake()->randomFloat(2, 0, 100),
            'percentage' => $percentage,
            'proficiency_level' => ProficiencyLevel::fromPercentage($percentage),
            'evidence_count' => fake()->numberBetween(1, 10),
            'strength_level' => fake()->randomElement(['strong', 'developing', 'weak']),
        ];
    }
}