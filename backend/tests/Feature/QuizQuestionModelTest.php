<?php

namespace Tests\Feature;

use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizQuestionModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_question_belongs_to_quiz(): void
    {
        $quiz = Quiz::factory()->create();

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
        ]);

        $this->assertTrue(
            $question->quiz->is($quiz)
        );
    }

    public function test_quiz_has_many_questions(): void
    {
        $quiz = Quiz::factory()->create();

        $question1 = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'position' => 1,
        ]);

        $question2 = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'position' => 2,
        ]);

        $this->assertCount(2, $quiz->questions);

        $this->assertTrue(
            $quiz->questions->contains($question1)
        );

        $this->assertTrue(
            $quiz->questions->contains($question2)
        );
    }

    public function test_question_type_is_cast_to_enum(): void
    {
        $question = QuizQuestion::factory()->create([
            'type' => QuizQuestionType::MULTIPLE_CHOICE,
        ]);

        $this->assertInstanceOf(
            QuizQuestionType::class,
            $question->type
        );

        $this->assertSame(
            QuizQuestionType::MULTIPLE_CHOICE,
            $question->type
        );
    }

    public function test_question_has_many_options(): void
    {
        $question = QuizQuestion::factory()->create();

        $option1 = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'position' => 1,
        ]);

        $option2 = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'position' => 2,
        ]);

        $this->assertCount(2, $question->options);

        $this->assertTrue(
            $question->options->contains($option1)
        );

        $this->assertTrue(
            $question->options->contains($option2)
        );
    }

    public function test_questions_are_ordered_by_position(): void
    {
        $quiz = Quiz::factory()->create();

        QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'position' => 3,
        ]);

        QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'position' => 1,
        ]);

        QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'position' => 2,
        ]);

        $positions = $quiz->questions
            ->pluck('position')
            ->values()
            ->all();

        $this->assertSame(
            [1, 2, 3],
            $positions
        );
    }
}