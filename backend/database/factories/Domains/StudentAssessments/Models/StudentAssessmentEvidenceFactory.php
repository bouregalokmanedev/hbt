<?php

namespace Database\Factories\Domains\StudentAssessments\Models;

use App\Domains\StudentAssessments\Models\StudentAssessmentEvidence;
use Illuminate\Database\Eloquent\Factories\Factory;

final class StudentAssessmentEvidenceFactory extends Factory
{
    protected $model = StudentAssessmentEvidence::class;

    public function definition(): array
    {
        return [
            'attempt_id' => \App\Domains\Assessments\Models\AssessmentAttempt::factory(),
            'result_id' => \App\Domains\StudentAssessments\Models\StudentAssessmentResult::factory(),
            'question_id' => \App\Domains\Quizzes\Models\QuizQuestion::factory(),
            'competency_id' => \App\Domains\Assessments\Models\Competency::factory(),
            'evidence_type' => 'question_response',
            'response' => ['selected_option_ids' => []],
            'expected_behavior' => 'Correct answer',
            'observed_behavior' => 'Student response',
            'points' => fake()->numberBetween(0, 10),
            'quality_score' => fake()->randomFloat(2, 0, 100),
        ];
    }
}