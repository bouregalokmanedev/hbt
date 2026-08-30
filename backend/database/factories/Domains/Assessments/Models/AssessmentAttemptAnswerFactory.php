<?php

namespace Database\Factories\Domains\Assessments\Models;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentAttemptAnswer;
use App\Domains\Quizzes\Models\QuizQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

final class AssessmentAttemptAnswerFactory extends Factory
{
    protected $model = AssessmentAttemptAnswer::class;

    public function definition(): array
    {
        return [
            'assessment_attempt_id' => AssessmentAttempt::factory(),
            'question_id' => QuizQuestion::factory(),
            'is_correct' => false,
            'points_earned' => 0,
        ];
    }
}