<?php

namespace Tests\Feature;

use App\Domains\Quizzes\Actions\CreateQuizQuestionOptionAction;
use App\Domains\Quizzes\Actions\DeleteQuizQuestionOptionAction;
use App\Domains\Quizzes\Actions\UpdateQuizQuestionOptionAction;
use App\Domains\Quizzes\DTOs\CreateQuizQuestionOptionData;
use App\Domains\Quizzes\DTOs\UpdateQuizQuestionOptionData;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizQuestionOptionActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_quiz_question_option_action_creates_option(): void
    {
        $question = QuizQuestion::factory()->create();

        $data = new CreateQuizQuestionOptionData(
            questionId: $question->id,
            option: 'The oxygen sensor measures oxygen content in exhaust gases.',
            isCorrect: true,
            position: 1,
        );

        $option = app(CreateQuizQuestionOptionAction::class)->execute($data);

        $this->assertInstanceOf(
            QuizQuestionOption::class,
            $option
        );

        $this->assertDatabaseHas('quiz_question_options', [
            'id' => $option->id,
            'quiz_question_id' => $question->id,
            'option' => 'The oxygen sensor measures oxygen content in exhaust gases.',
            'is_correct' => true,
            'position' => 1,
        ]);
    }

    public function test_update_quiz_question_option_action_updates_option(): void
    {
        $option = QuizQuestionOption::factory()->create([
            'option' => 'Old answer',
            'is_correct' => false,
            'position' => 1,
        ]);

        $data = new UpdateQuizQuestionOptionData(
            option: 'Updated answer',
            isCorrect: true,
            position: 2,
        );

        $updatedOption = app(UpdateQuizQuestionOptionAction::class)->execute(
            option: $option,
            data: $data,
        );

        $this->assertSame(
            'Updated answer',
            $updatedOption->option
        );

        $this->assertTrue(
            $updatedOption->is_correct
        );

        $this->assertSame(
            2,
            $updatedOption->position
        );

        $this->assertDatabaseHas('quiz_question_options', [
            'id' => $option->id,
            'option' => 'Updated answer',
            'is_correct' => true,
            'position' => 2,
        ]);
    }

    public function test_delete_quiz_question_option_action_deletes_option(): void
    {
        $option = QuizQuestionOption::factory()->create();

        $optionId = $option->id;

        app(DeleteQuizQuestionOptionAction::class)->execute($option);

        $this->assertDatabaseMissing('quiz_question_options', [
            'id' => $optionId,
        ]);
    }

    public function test_create_quiz_question_option_action_creates_incorrect_option(): void
    {
        $question = QuizQuestion::factory()->create();

        $data = new CreateQuizQuestionOptionData(
            questionId: $question->id,
            option: 'The coolant temperature sensor measures fuel pressure.',
            isCorrect: false,
            position: 2,
        );

        $option = app(CreateQuizQuestionOptionAction::class)->execute($data);

        $this->assertFalse(
            $option->is_correct
        );

        $this->assertDatabaseHas('quiz_question_options', [
            'id' => $option->id,
            'quiz_question_id' => $question->id,
            'is_correct' => false,
        ]);
    }
}