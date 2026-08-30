<?php

namespace Tests\Feature\Domains\Quizzes;

use App\Domains\Quizzes\Actions\CreateQuizQuestionAction;
use App\Domains\Quizzes\Actions\DeleteQuizQuestionAction;
use App\Domains\Quizzes\Actions\UpdateQuizQuestionAction;
use App\Domains\Quizzes\DTOs\CreateQuizQuestionData;
use App\Domains\Quizzes\DTOs\UpdateQuizQuestionData;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizQuestion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizQuestionActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_quiz_question_action_creates_question(): void
    {
        $quiz = Quiz::factory()->create();

       $data = new CreateQuizQuestionData(
    quizId: $quiz->id,
    question: 'What is the function of an oxygen sensor?',
    type: QuizQuestionType::SINGLE_CHOICE,
    position: 1,
    points: 2,
    required: true,
);

        $question = app(CreateQuizQuestionAction::class)->execute(
            quiz: $quiz,
            data: $data,
        );

        $this->assertInstanceOf(QuizQuestion::class, $question);

        $this->assertDatabaseHas('quiz_questions', [
            'id' => $question->id,
            'quiz_id' => $quiz->id,
            'question' => 'What is the function of an oxygen sensor?',
            'type' => QuizQuestionType::SINGLE_CHOICE->value,
            'position' => 1,
            'points' => 2,
            'required' => true,
        ]);
    }

    public function test_update_quiz_question_action_updates_question(): void
    {
        $question = QuizQuestion::factory()->create([
            'question' => 'Old question',
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'position' => 1,
            'points' => 1,
            'required' => true,
        ]);

        $data = new UpdateQuizQuestionData(
            question: 'Updated question',
            type: QuizQuestionType::MULTIPLE_CHOICE,
            position: 2,
            points: 5,
            required: false,
        );

        $updatedQuestion = app(UpdateQuizQuestionAction::class)->execute(
            question: $question,
            data: $data,
        );

        $this->assertSame(
            'Updated question',
            $updatedQuestion->question
        );

        $this->assertSame(
            QuizQuestionType::MULTIPLE_CHOICE,
            $updatedQuestion->type
        );

        $this->assertSame(2, $updatedQuestion->position);
        $this->assertSame(5, $updatedQuestion->points);
        $this->assertFalse($updatedQuestion->required);

        $this->assertDatabaseHas('quiz_questions', [
            'id' => $question->id,
            'question' => 'Updated question',
            'type' => QuizQuestionType::MULTIPLE_CHOICE->value,
            'position' => 2,
            'points' => 5,
            'required' => false,
        ]);
    }

    public function test_delete_quiz_question_action_deletes_question(): void
    {
        $question = QuizQuestion::factory()->create();

        $questionId = $question->id;

        app(DeleteQuizQuestionAction::class)->execute($question);

        $this->assertDatabaseMissing('quiz_questions', [
            'id' => $questionId,
        ]);
    }

    public function test_create_quiz_question_action_creates_question_with_correct_type(): void
    {
        $quiz = Quiz::factory()->create();
$data = new CreateQuizQuestionData(
    question: 'Which sensors can affect engine fueling?',
    type: QuizQuestionType::MULTIPLE_CHOICE,
    position: 1,
    points: 1,
    required: true,
    quizId: $quiz->id,
);

        $question = app(CreateQuizQuestionAction::class)->execute(
            quiz: $quiz,
            data: $data,
        );

        $this->assertSame(
            QuizQuestionType::MULTIPLE_CHOICE,
            $question->type
        );

        $this->assertDatabaseHas('quiz_questions', [
            'id' => $question->id,
            'type' => QuizQuestionType::MULTIPLE_CHOICE->value,
        ]);
    }
}