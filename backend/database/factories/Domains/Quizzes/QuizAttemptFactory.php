<?php

namespace Database\Factories\Domains\Quizzes;

use App\Domains\Quizzes\Enums\QuizAttemptStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizAttempt>
 */
final class QuizAttemptFactory extends Factory
{
    protected $model = QuizAttempt::class;

    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'user_id' => User::factory(),

            'attempt_number' => 1,

            'status' => QuizAttemptStatus::IN_PROGRESS,

            'score' => 0,
            'total_points' => 0,
            'percentage' => 0,
            'passed' => false,

            'started_at' => now(),
            'submitted_at' => null,
        ];
    }

    public function submitted(): static
    {
        return $this->state(fn () => [
            'status' => QuizAttemptStatus::SUBMITTED,
            'submitted_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'status' => QuizAttemptStatus::EXPIRED,
            'submitted_at' => null,
        ]);
    }
}