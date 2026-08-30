<?php

namespace Tests\Feature\Domains\Quizzes;

use App\Domains\Quizzes\Enums\QuizAttemptStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizAttemptTest extends TestCase
{
    use RefreshDatabase;

    public function test_quiz_attempt_can_be_created(): void
    {
        $quiz = Quiz::factory()->create();
        $user = User::factory()->create();

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'attempt_number' => 1,
        ]);

        $this->assertDatabaseHas('quiz_attempts', [
            'id' => $attempt->id,
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'attempt_number' => 1,
            'status' => QuizAttemptStatus::IN_PROGRESS->value,
        ]);
    }

    public function test_quiz_attempt_belongs_to_quiz(): void
    {
        $attempt = QuizAttempt::factory()->create();

        $this->assertTrue(
            $attempt->quiz->is($attempt->quiz)
        );
    }

    public function test_quiz_attempt_belongs_to_user(): void
    {
        $attempt = QuizAttempt::factory()->create();

        $this->assertTrue(
            $attempt->user->is($attempt->user)
        );
    }

    public function test_quiz_has_attempts(): void
    {
        $quiz = Quiz::factory()->create();

        QuizAttempt::factory()->count(2)->create([
            'quiz_id' => $quiz->id,
        ]);

        $this->assertCount(
            2,
            $quiz->attempts
        );
    }
}