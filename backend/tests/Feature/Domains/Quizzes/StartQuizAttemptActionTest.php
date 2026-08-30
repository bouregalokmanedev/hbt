<?php

namespace Tests\Feature\Domains\Quizzes;

use App\Domains\Quizzes\Actions\StartQuizAttemptAction;
use App\Domains\Quizzes\Enums\QuizAttemptStatus;
use App\Domains\Quizzes\Enums\QuizStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class StartQuizAttemptActionTest extends TestCase
{
    use RefreshDatabase;

    private StartQuizAttemptAction $action;

    protected function setUp(): void
    {
        parent::setUp();

        $this->action = app(StartQuizAttemptAction::class);
    }

    public function test_creates_first_attempt(): void
    {
        $user = User::factory()->create();

        $quiz = Quiz::factory()->create([
            'status' => QuizStatus::PUBLISHED,
            'max_attempts' => 3,
        ]);

        $attempt = $this->action->execute(
            quiz: $quiz,
            user: $user,
        );

        $this->assertInstanceOf(
            QuizAttempt::class,
            $attempt
        );

        $this->assertSame(
            $quiz->id,
            $attempt->quiz_id
        );

        $this->assertSame(
            $user->id,
            $attempt->user_id
        );

        $this->assertSame(
            1,
            $attempt->attempt_number
        );

        $this->assertSame(
            QuizAttemptStatus::IN_PROGRESS,
            $attempt->status
        );

        $this->assertNotNull(
            $attempt->started_at
        );

        $this->assertDatabaseHas('quiz_attempts', [
            'id' => $attempt->id,
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'attempt_number' => 1,
        ]);
    }

    public function test_increments_attempt_number(): void
    {
        $user = User::factory()->create();

        $quiz = Quiz::factory()->create([
            'status' => QuizStatus::PUBLISHED,
            'max_attempts' => 3,
        ]);

        QuizAttempt::factory()
            ->submitted()
            ->create([
                'quiz_id' => $quiz->id,
                'user_id' => $user->id,
                'attempt_number' => 1,
            ]);

        $attempt = $this->action->execute(
            quiz: $quiz,
            user: $user,
        );

        $this->assertSame(
            2,
            $attempt->attempt_number
        );

        $this->assertSame(
            QuizAttemptStatus::IN_PROGRESS,
            $attempt->status
        );

        $this->assertDatabaseCount(
            'quiz_attempts',
            2
        );
    }

    public function test_cannot_start_when_max_attempts_reached(): void
    {
        $user = User::factory()->create();

        $quiz = Quiz::factory()->create([
            'status' => QuizStatus::PUBLISHED,
            'max_attempts' => 2,
        ]);

        QuizAttempt::factory()
            ->submitted()
            ->create([
                'quiz_id' => $quiz->id,
                'user_id' => $user->id,
                'attempt_number' => 1,
            ]);

        QuizAttempt::factory()
            ->submitted()
            ->create([
                'quiz_id' => $quiz->id,
                'user_id' => $user->id,
                'attempt_number' => 2,
            ]);

        $this->expectException(
            ValidationException::class
        );

        $this->action->execute(
            quiz: $quiz,
            user: $user,
        );
    }

    public function test_returns_existing_in_progress_attempt(): void
    {
        $user = User::factory()->create();

        $quiz = Quiz::factory()->create([
            'status' => QuizStatus::PUBLISHED,
            'max_attempts' => 1,
        ]);

        $existingAttempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'attempt_number' => 1,
            'status' => QuizAttemptStatus::IN_PROGRESS,
        ]);

        $attempt = $this->action->execute(
            quiz: $quiz,
            user: $user,
        );

        $this->assertSame(
            $existingAttempt->id,
            $attempt->id
        );

        $this->assertDatabaseCount(
            'quiz_attempts',
            1
        );
    }

    public function test_cannot_start_unpublished_quiz(): void
    {
        $user = User::factory()->create();

        $quiz = Quiz::factory()->create([
            'status' => QuizStatus::DRAFT,
            'max_attempts' => 3,
        ]);

        $this->expectException(
            ValidationException::class
        );

        $this->action->execute(
            quiz: $quiz,
            user: $user,
        );

        $this->assertDatabaseCount(
            'quiz_attempts',
            0
        );
    }
  public function test_max_attempts_prevents_new_attempt(): void
{
    $user = User::factory()->create();

    $quiz = Quiz::factory()->create([
        'status' => QuizStatus::PUBLISHED,
        'max_attempts' => 2,
    ]);

    QuizAttempt::factory()
        ->submitted()
        ->create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'attempt_number' => 1,
        ]);

    QuizAttempt::factory()
        ->submitted()
        ->create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'attempt_number' => 2,
        ]);

    $this->expectException(
        ValidationException::class
    );

    $this->action->execute(
        quiz: $quiz,
        user: $user,
    );
}

public function test_null_max_attempts_allows_unlimited_attempts(): void
{
    $user = User::factory()->create();

    $quiz = Quiz::factory()->create([
        'status' => QuizStatus::PUBLISHED,
        'max_attempts' => null,
    ]);

    QuizAttempt::factory()
        ->submitted()
        ->create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'attempt_number' => 1,
        ]);

    $attempt = $this->action->execute(
        quiz: $quiz,
        user: $user,
    );

    $this->assertSame(
        2,
        $attempt->attempt_number
    );

    $this->assertSame(
        QuizAttemptStatus::IN_PROGRESS,
        $attempt->status
    );
}
    
}