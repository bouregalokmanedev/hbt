<?php

namespace Database\Factories\Domains\Assessments\Models;

use App\Domains\Assessments\Models\AssessmentAttemptAnswer;
use App\Domains\Assessments\Models\AssessmentAttemptAnswerOption;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use Illuminate\Database\Eloquent\Factories\Factory;

final class AssessmentAttemptAnswerOptionFactory extends Factory
{
    protected $model = AssessmentAttemptAnswerOption::class;

    public function definition(): array
    {
        return [
            'answer_id' => AssessmentAttemptAnswer::factory(),
            'option_id' => QuizQuestionOption::factory(),
        ];
    }
}