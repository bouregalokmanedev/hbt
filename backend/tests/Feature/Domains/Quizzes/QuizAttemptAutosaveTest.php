<?php

namespace Tests\Feature\Domains\Quizzes;

use App\Domains\Quizzes\Enums\QuizAttemptStatus;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Enums\QuizStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Domains\Quizzes\Models\QuizAttemptAnswer;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

final class QuizAttemptAutosaveTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Quiz $quiz;

    private QuizAttempt $attempt;

    private QuizQuestion $question;

    private QuizQuestionOption $correctOption;

    private QuizQuestionOption $otherOption;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $this->quiz = Quiz::factory()->create([
            'status' => QuizStatus::PUBLISHED,
        ]);

        $this->attempt = QuizAttempt::factory()->create([
            'quiz_id' => $this->quiz->id,
            'user_id' => $this->user->id,
            'status' => QuizAttemptStatus::IN_PROGRESS,
            'expires_at' => null,
        ]);

        $this->question = QuizQuestion::factory()->create([
            'quiz_id' => $this->quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'position' => 1,
        ]);

        $this->correctOption = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $this->question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $this->otherOption = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $this->question->id,
            'is_correct' => false,
            'position' => 2,
        ]);
    }

    private function autosave(array $body, ?User $user = null): TestResponse
    {
        return $this
            ->actingAs($user ?? $this->user, 'sanctum')
            ->putJson(
                "/api/v1/quizzes/{$this->quiz->id}/attempts/{$this->attempt->id}/answers/{$this->question->id}",
                $body
            );
    }

    public function test_saving_a_selection_persists_an_ungraded_draft(): void
    {
        $this->autosave(['option_ids' => [$this->correctOption->id]])
            ->assertSuccessful()
            ->assertJsonPath('data.saved', true);

        $answer = QuizAttemptAnswer::query()
            ->where('attempt_id', $this->attempt->id)
            ->where('question_id', $this->question->id)
            ->first();

        $this->assertNotNull($answer);

        // Ungraded until submit runs.
        $this->assertNull($answer->getRawOriginal('is_correct'));

        $this->assertSame(
            [$this->correctOption->id],
            $answer->selectedOptions()->pluck('option_id')->all()
        );
    }

    public function test_saving_without_options_clears_the_draft(): void
    {
        $this->autosave(['option_ids' => [$this->correctOption->id]])
            ->assertSuccessful();

        $this->autosave([])->assertSuccessful();

        $this->assertDatabaseMissing('quiz_attempt_answers', [
            'attempt_id' => $this->attempt->id,
            'question_id' => $this->question->id,
        ]);
    }

    public function test_saving_replaces_the_previous_selection(): void
    {
        $this->autosave(['option_ids' => [$this->correctOption->id]]);
        $this->autosave(['option_ids' => [$this->otherOption->id]]);

        $answer = QuizAttemptAnswer::query()
            ->where('attempt_id', $this->attempt->id)
            ->where('question_id', $this->question->id)
            ->first();

        $this->assertSame(
            [$this->otherOption->id],
            $answer->selectedOptions()->pluck('option_id')->all()
        );
    }

    public function test_autosaved_answers_are_returned_when_the_attempt_is_resumed(): void
    {
        $this->autosave(['option_ids' => [$this->correctOption->id]])
            ->assertSuccessful();

        $this
            ->actingAs($this->user, 'sanctum')
            ->getJson(
                "/api/v1/quizzes/{$this->quiz->id}/attempts/{$this->attempt->id}"
            )
            ->assertSuccessful()
            ->assertJsonPath('data.answers.0.question_id', $this->question->id)
            ->assertJsonPath(
                'data.answers.0.selected_options.0.option_id',
                $this->correctOption->id
            )
            // The verdict stays hidden while the attempt is still running.
            ->assertJsonPath('data.answers.0.is_correct', null);
    }

    public function test_options_from_another_question_are_rejected(): void
    {
        $foreignOption = QuizQuestionOption::factory()->create([
            'quiz_question_id' => QuizQuestion::factory()->create([
                'quiz_id' => $this->quiz->id,
                'position' => 2,
            ])->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $this->autosave(['option_ids' => [$foreignOption->id]])
            ->assertStatus(422);

        $this->assertDatabaseMissing('quiz_attempt_answers', [
            'attempt_id' => $this->attempt->id,
            'question_id' => $this->question->id,
        ]);
    }

    public function test_a_question_from_another_quiz_is_not_found(): void
    {
        $foreignQuestion = QuizQuestion::factory()->create([
            'quiz_id' => Quiz::factory()->create()->id,
            'position' => 1,
        ]);

        $this
            ->actingAs($this->user, 'sanctum')
            ->putJson(
                "/api/v1/quizzes/{$this->quiz->id}/attempts/{$this->attempt->id}/answers/{$foreignQuestion->id}",
                ['option_ids' => []]
            )
            ->assertNotFound();
    }

    public function test_another_user_cannot_autosave_an_attempt(): void
    {
        $stranger = User::factory()->create();

        $this->autosave(
            ['option_ids' => [$this->correctOption->id]],
            $stranger
        )->assertNotFound();
    }

    public function test_an_expired_attempt_cannot_be_autosaved(): void
    {
        $this->attempt->update([
            'expires_at' => now()->subMinute(),
        ]);

        $this->autosave(['option_ids' => [$this->correctOption->id]])
            ->assertStatus(422);

        $this->assertSame(
            QuizAttemptStatus::EXPIRED,
            $this->attempt->fresh()->status
        );
    }

    public function test_a_submitted_attempt_cannot_be_autosaved(): void
    {
        $this->attempt->update(['status' => QuizAttemptStatus::SUBMITTED]);

        $this->autosave(['option_ids' => [$this->correctOption->id]])
            ->assertStatus(422);
    }
}
