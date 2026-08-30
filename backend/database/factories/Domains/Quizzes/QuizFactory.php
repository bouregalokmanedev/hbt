<?php

namespace Database\Factories\Domains\Quizzes;

use App\Domains\Quizzes\Models\Quiz;
use App\Models\Section;
use App\Domains\Quizzes\Enums\QuizStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuizFactory extends Factory
{
    protected $model = Quiz::class;

    public function definition(): array
    {
        return [
            'section_id' => Section::factory(),
            'title' => fake()->sentence(4),
            'slug' => fake()->unique()->slug(),
            'description' => fake()->paragraph(),
            'position' => 1,
            'status' => QuizStatus::DRAFT,
            'pass_percentage' => 70,
            'max_attempts' => null,
            'time_limit' => null,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => [
            'status' => QuizStatus::DRAFT,
        ]);
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status' => QuizStatus::PUBLISHED,
        ]);
    }
}