<?php

namespace Database\Factories\Domains\StudentAssessments\Models;

use App\Domains\StudentAssessments\Models\StudentAssessmentResponse;
use Illuminate\Database\Eloquent\Factories\Factory;

final class StudentAssessmentResponseFactory extends Factory
{
    protected $model = StudentAssessmentResponse::class;

    public function definition(): array
    {
        return [
            'attempt_id' => \App\Domains\Assessments\Models\AssessmentAttempt::factory(),
            'question_id' => \App\Domains\Quizzes\Models\QuizQuestion::factory(),
            'response_type' => 'multiple_choice',
            'answer' => ['selected_option_ids' => []],
            'confidence_level' => 'confident',
            'is_flagged' => false,
            'status' => 'answered',
            'points_awarded' => fake()->numberBetween(0, 10),
            'is_correct' => fake()->boolean(),
            'evaluation_status' => 'pending',
            'time_spent_seconds' => fake()->numberBetween(10, 120),
        ];
    }
}