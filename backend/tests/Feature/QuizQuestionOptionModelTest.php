<?php

namespace Tests\Feature;

use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizQuestionOptionModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_option_belongs_to_question(): void
    {
        $question = QuizQuestion::factory()->create();

        $option = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
        ]);

        $this->assertTrue(
            $option->question->is($question)
        );
    }

    public function test_correct_option_is_cast_to_boolean(): void
    {
        $option = QuizQuestionOption::factory()
            ->correct()
            ->create();

        $this->assertIsBool(
            $option->is_correct
        );

        $this->assertTrue(
            $option->is_correct
        );
    }

    public function test_incorrect_option_is_cast_to_boolean(): void
    {
        $option = QuizQuestionOption::factory()
            ->incorrect()
            ->create();

        $this->assertIsBool(
            $option->is_correct
        );

        $this->assertFalse(
            $option->is_correct
        );
    }

    public function test_options_are_ordered_by_position(): void
    {
        $question = QuizQuestion::factory()->create();

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'position' => 3,
        ]);

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'position' => 1,
        ]);

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'position' => 2,
        ]);

        $positions = $question->options
            ->pluck('position')
            ->values()
            ->all();

        $this->assertSame(
            [1, 2, 3],
            $positions
        );
    }
}