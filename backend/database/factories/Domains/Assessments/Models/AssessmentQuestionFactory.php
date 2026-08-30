<?php

namespace Database\Factories\Domains\Assessments\Models;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentQuestion;
use App\Domains\Quizzes\Models\QuizQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

final class AssessmentQuestionFactory extends Factory
{
    protected $model = AssessmentQuestion::class;

    public function definition(): array
    {
        return [
            'assessment_id' => Assessment::factory(),
            'quiz_question_id' => QuizQuestion::factory(),
            'position' => 1,
            'points' => 1,
        ];
    }
}