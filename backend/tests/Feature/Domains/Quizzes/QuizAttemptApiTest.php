<?php

namespace Tests\Feature\Domains\Quizzes;

use App\Domains\Quizzes\Enums\QuizAttemptStatus;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Enums\QuizStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class QuizAttemptApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_start_quiz(): void
    {
        $user = User::factory()->create();

        $quiz = Quiz::factory()->create([
            'status' => QuizStatus::PUBLISHED,
            'max_attempts' => 3,
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson(
                "/api/v1/quizzes/{$quiz->id}/attempts"
            );

        $response
            ->assertSuccessful()
            ->assertJsonPath(
                'data.quiz_id',
                $quiz->id
            )
            ->assertJsonPath(
                'data.user_id',
                $user->id
            )
            ->assertJsonPath(
                'data.attempt_number',
                1
            )
            ->assertJsonPath(
                'data.status',
                QuizAttemptStatus::IN_PROGRESS->value
            );

        $this->assertDatabaseHas('quiz_attempts', [
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'attempt_number' => 1,
        ]);
    }

    public function test_unauthenticated_user_cannot_start_quiz(): void
    {
        $quiz = Quiz::factory()->create([
            'status' => QuizStatus::PUBLISHED,
        ]);

        $this
            ->postJson(
                "/api/v1/quizzes/{$quiz->id}/attempts"
            )
            ->assertUnauthorized();
    }

    public function test_existing_in_progress_attempt_is_returned(): void
    {
        $user = User::factory()->create();

        $quiz = Quiz::factory()->create([
            'status' => QuizStatus::PUBLISHED,
            'max_attempts' => 3,
        ]);

        $existingAttempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'attempt_number' => 1,
            'status' => QuizAttemptStatus::IN_PROGRESS,
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson(
                "/api/v1/quizzes/{$quiz->id}/attempts"
            );

        $response
            ->assertSuccessful()
            ->assertJsonPath(
                'data.id',
                $existingAttempt->id
            );

        $this->assertDatabaseCount(
            'quiz_attempts',
            1
        );
    }

    public function test_user_can_get_attempt(): void
    {
        $user = User::factory()->create();

        $quiz = Quiz::factory()->create([
            'status' => QuizStatus::PUBLISHED,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'status' => QuizAttemptStatus::IN_PROGRESS,
        ]);

        $this
            ->actingAs($user, 'sanctum')
            ->getJson(
                "/api/v1/quizzes/{$quiz->id}/attempts/{$attempt->id}"
            )
            ->assertSuccessful()
            ->assertJsonPath(
                'data.id',
                $attempt->id
            );
    }

    public function test_user_cannot_access_another_users_attempt(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        $quiz = Quiz::factory()->create([
            'status' => QuizStatus::PUBLISHED,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $owner->id,
        ]);

        $this
            ->actingAs($otherUser, 'sanctum')
            ->getJson(
                "/api/v1/quizzes/{$quiz->id}/attempts/{$attempt->id}"
            )
            ->assertNotFound();
    }

   public function test_user_can_list_their_attempts(): void
{
    $user = User::factory()->create();

    $quiz = Quiz::factory()->create([
        'status' => QuizStatus::PUBLISHED,
        'max_attempts' => 5,
    ]);

    // User's attempt #1
    QuizAttempt::factory()->create([
        'quiz_id' => $quiz->id,
        'user_id' => $user->id,
        'attempt_number' => 1,
        'status' => QuizAttemptStatus::IN_PROGRESS,
    ]);

    // User's attempt #2
    QuizAttempt::factory()->create([
        'quiz_id' => $quiz->id,
        'user_id' => $user->id,
        'attempt_number' => 2,
        'status' => QuizAttemptStatus::SUBMITTED,
    ]);

    // User's attempt #3
    QuizAttempt::factory()->create([
        'quiz_id' => $quiz->id,
        'user_id' => $user->id,
        'attempt_number' => 3,
        'status' => QuizAttemptStatus::SUBMITTED,
    ]);

    // Another user should NOT see their own attempt
    $otherUser = User::factory()->create();

    QuizAttempt::factory()->create([
        'quiz_id' => $quiz->id,
        'user_id' => $otherUser->id,
        'attempt_number' => 1,
        'status' => QuizAttemptStatus::SUBMITTED,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson(
            "/api/v1/quizzes/{$quiz->id}/attempts"
        );

    $response
        ->assertSuccessful()
        ->assertJsonCount(3, 'data');

    $response->assertJsonPath(
        'data.0.user_id',
        $user->id
    );

    $response->assertJsonPath(
        'data.1.user_id',
        $user->id
    );

    $response->assertJsonPath(
        'data.2.user_id',
        $user->id
    );

    $this->assertDatabaseCount(
        'quiz_attempts',
        4
    );
}

    public function test_user_can_submit_attempt(): void
    {
        $user = User::factory()->create();

        $quiz = Quiz::factory()->create([
            'status' => QuizStatus::PUBLISHED,
            'pass_percentage' => 70,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 10,
            'required' => true,
        ]);

        $correct = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => false,
            'position' => 2,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'status' => QuizAttemptStatus::IN_PROGRESS,
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson(
                "/api/v1/quizzes/{$quiz->id}/attempts/{$attempt->id}/submit",
                [
                    'answers' => [
                        $question->id => [
                            $correct->id,
                        ],
                    ],
                ]
            );

        $response
            ->assertSuccessful()
            ->assertJsonPath(
                'data.status',
                QuizAttemptStatus::SUBMITTED->value
            )
            ->assertJsonPath(
                'data.score',
                10
            )
            ->assertJsonPath(
                'data.percentage',
                100
            )
            ->assertJsonPath(
                'data.passed',
                true
            );
    }

    public function test_user_cannot_submit_another_users_attempt(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        $quiz = Quiz::factory()->create([
            'status' => QuizStatus::PUBLISHED,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $owner->id,
            'status' => QuizAttemptStatus::IN_PROGRESS,
        ]);

        $this
            ->actingAs($otherUser, 'sanctum')
            ->postJson(
                "/api/v1/quizzes/{$quiz->id}/attempts/{$attempt->id}/submit",
                [
                    'answers' => [],
                ]
            )
            ->assertNotFound();
    }

    public function test_user_can_get_submitted_result(): void
    {
        $user = User::factory()->create();

        $quiz = Quiz::factory()->create([
            'status' => QuizStatus::PUBLISHED,
        ]);

        $attempt = QuizAttempt::factory()->submitted()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'score' => 8,
            'total_points' => 10,
            'percentage' => 80,
            'passed' => true,
        ]);

        $this
            ->actingAs($user, 'sanctum')
            ->getJson(
                "/api/v1/quizzes/{$quiz->id}/attempts/{$attempt->id}/result"
            )
            ->assertSuccessful()
            ->assertJsonPath(
                'data.score',
                8
            )
            ->assertJsonPath(
                'data.total_points',
                10
            )
            ->assertJsonPath(
                'data.percentage',
                80
            )
            ->assertJsonPath(
                'data.passed',
                true
            );
    }
    public function test_user_cannot_get_result_for_in_progress_attempt(): void
{
    $user = User::factory()->create();

    $quiz = Quiz::factory()->create([
        'status' => QuizStatus::PUBLISHED,
    ]);

    $attempt = QuizAttempt::factory()->create([
        'quiz_id' => $quiz->id,
        'user_id' => $user->id,
        'attempt_number' => 1,
        'status' => QuizAttemptStatus::IN_PROGRESS,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson(
            "/api/v1/quizzes/{$quiz->id}/attempts/{$attempt->id}/result"
        );

    $response->assertStatus(409);
}
public function test_user_can_get_result_for_submitted_attempt(): void
{
    $user = User::factory()->create();

    $quiz = Quiz::factory()->create([
        'status' => QuizStatus::PUBLISHED,
    ]);

    $attempt = QuizAttempt::factory()->submitted()->create([
        'quiz_id' => $quiz->id,
        'user_id' => $user->id,
        'attempt_number' => 1,
    ]);

    $response = $this
        ->actingAs($user, 'sanctum')
        ->getJson(
            "/api/v1/quizzes/{$quiz->id}/attempts/{$attempt->id}/result"
        );

    $response
        ->assertSuccessful()
        ->assertJsonPath(
            'data.status',
            QuizAttemptStatus::SUBMITTED->value
        );
}
}