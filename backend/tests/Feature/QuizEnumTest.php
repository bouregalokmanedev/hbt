<?php

namespace Tests\Feature;

use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Enums\QuizStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizQuestion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizEnumTest extends TestCase
{
    use RefreshDatabase;

    public function test_quiz_can_be_draft(): void
    {
        $quiz = Quiz::factory()->draft()->create();

        $this->assertSame(
            QuizStatus::DRAFT,
            $quiz->status
        );
    }

    public function test_quiz_can_be_published(): void
    {
        $quiz = Quiz::factory()->published()->create();

        $this->assertSame(
            QuizStatus::PUBLISHED,
            $quiz->status
        );
    }

    public function test_question_supports_single_choice(): void
    {
        $question = QuizQuestion::factory()
            ->singleChoice()
            ->create();

        $this->assertSame(
            QuizQuestionType::SINGLE_CHOICE,
            $question->type
        );
    }

    public function test_question_supports_multiple_choice(): void
    {
        $question = QuizQuestion::factory()
            ->multipleChoice()
            ->create();

        $this->assertSame(
            QuizQuestionType::MULTIPLE_CHOICE,
            $question->type
        );
    }
}