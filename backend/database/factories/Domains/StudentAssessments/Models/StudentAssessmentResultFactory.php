<?php

namespace Database\Factories\Domains\StudentAssessments\Models;

use App\Domains\StudentAssessments\Models\StudentAssessmentResult;
use App\Domains\StudentAssessments\Enums\ProficiencyLevel;
use Illuminate\Database\Eloquent\Factories\Factory;

final class StudentAssessmentResultFactory extends Factory
{
    protected $model = StudentAssessmentResult::class;

    public function definition(): array
    {
        $score = fake()->randomFloat(2, 0, 100);
        return [
            'attempt_id' => \App\Domains\Assessments\Models\AssessmentAttempt::factory(),
            'student_id' => \App\Models\User::factory(),
            'assessment_id' => \App\Domains\Assessments\Models\Assessment::factory(),
            'score' => $score,
            'percentage' => $score,
            'passed' => $score >= 70,
            'proficiency_level' => ProficiencyLevel::fromPercentage($score),
            'knowledge_score' => $score,
            'started_at' => now()->subHour(),
            'completed_at' => now(),
            'result_status' => 'completed',
            'generated_at' => now(),
        ];
    }
}