<?php

namespace Database\Factories\Domains\Quizzes\Models;

use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizQuestionOption>
 */
final class QuizQuestionOptionFactory extends Factory
{
    protected $model = QuizQuestionOption::class;

    public function definition(): array
    {
        return [
            'quiz_question_id' => QuizQuestion::factory(),
            'option' => fake()->sentence(),
            'is_correct' => false,
            'position' => 1,
        ];
    }

    public function correct(): static
    {
        return $this->state([
            'is_correct' => true,
        ]);
    }

    public function incorrect(): static
    {
        return $this->state([
            'is_correct' => false,
        ]);
    }
}