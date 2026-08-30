<?php

namespace Database\Factories\Domains\Quizzes;

use App\Domains\Quizzes\Models\QuizAttempt;
use App\Domains\Quizzes\Models\QuizAttemptAnswer;
use App\Domains\Quizzes\Models\QuizQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizAttemptAnswer>
 */
final class QuizAttemptAnswerFactory extends Factory
{
    protected $model = QuizAttemptAnswer::class;

    public function definition(): array
    {
        return [
            'attempt_id' => QuizAttempt::factory(),
            'question_id' => QuizQuestion::factory(),
            'is_correct' => false,
            'points_earned' => 0,
        ];
    }

    public function correct(): static
    {
        return $this->state(fn () => [
            'is_correct' => true,
        ]);
    }
}