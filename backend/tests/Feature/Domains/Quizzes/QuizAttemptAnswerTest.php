<?php

namespace Tests\Feature\Domains\Quizzes;

use App\Domains\Quizzes\Models\QuizAttempt;
use App\Domains\Quizzes\Models\QuizAttemptAnswer;
use App\Domains\Quizzes\Models\QuizQuestion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizAttemptAnswerTest extends TestCase
{
    use RefreshDatabase;

    public function test_answer_can_be_created(): void
    {
        $attempt = QuizAttempt::factory()->create();

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $attempt->quiz_id,
        ]);

        $answer = QuizAttemptAnswer::factory()->create([
            'attempt_id' => $attempt->id,
            'question_id' => $question->id,
        ]);

        $this->assertDatabaseHas('quiz_attempt_answers', [
            'id' => $answer->id,
            'attempt_id' => $attempt->id,
            'question_id' => $question->id,
        ]);
    }

    public function test_answer_belongs_to_attempt(): void
    {
        $answer = QuizAttemptAnswer::factory()->create();

        $this->assertTrue(
            $answer->attempt->is(
                QuizAttempt::find($answer->attempt_id)
            )
        );
    }

    public function test_answer_belongs_to_question(): void
    {
        $answer = QuizAttemptAnswer::factory()->create();

        $this->assertTrue(
            $answer->question->is(
                QuizQuestion::find($answer->question_id)
            )
        );
    }

    public function test_attempt_has_answers(): void
    {
        $attempt = QuizAttempt::factory()->create();

        QuizAttemptAnswer::factory()->create([
            'attempt_id' => $attempt->id,
        ]);

        QuizAttemptAnswer::factory()->create([
            'attempt_id' => $attempt->id,
            'question_id' => QuizQuestion::factory()->create([
                'quiz_id' => $attempt->quiz_id,
            ])->id,
        ]);

        $this->assertCount(2, $attempt->answers);
    }
}