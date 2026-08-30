<?php

namespace Database\Factories\Domains\Quizzes;

use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuizQuestionFactory extends Factory
{
    protected $model = QuizQuestion::class;

    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'question' => fake()->sentence(),
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'position' => 1,
            'points' => 1,
            'required' => true,
        ];
    }

    public function singleChoice(): static
    {
        return $this->state(fn () => [
            'type' => QuizQuestionType::SINGLE_CHOICE,
        ]);
    }

    public function multipleChoice(): static
    {
        return $this->state(fn () => [
            'type' => QuizQuestionType::MULTIPLE_CHOICE,
        ]);
    }
}