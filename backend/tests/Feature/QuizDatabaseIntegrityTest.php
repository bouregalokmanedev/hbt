<?php

namespace Tests\Feature;

use App\Domains\Quizzes\Models;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Models\Section;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizDatabaseIntegrityTest extends TestCase
{
    use RefreshDatabase;

    public function test_quiz_position_must_be_unique_within_section(): void
    {
        $section = Section::factory()->create();

        Quiz::factory()->create([
            'section_id' => $section->id,
            'position' => 1,
        ]);

        $this->expectException(QueryException::class);

        Quiz::factory()->create([
            'section_id' => $section->id,
            'position' => 1,
        ]);
    }

    public function test_same_quiz_position_can_exist_in_different_sections(): void
    {
        $section1 = Section::factory()->create();
        $section2 = Section::factory()->create();

        $quiz1 = Quiz::factory()->create([
            'section_id' => $section1->id,
            'position' => 1,
        ]);

        $quiz2 = Quiz::factory()->create([
            'section_id' => $section2->id,
            'position' => 1,
        ]);

        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz1->id,
            'section_id' => $section1->id,
            'position' => 1,
        ]);

        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz2->id,
            'section_id' => $section2->id,
            'position' => 1,
        ]);
    }

    public function test_question_position_must_be_unique_within_quiz(): void
    {
        $quiz = Quiz::factory()->create();

        QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'position' => 1,
        ]);

        $this->expectException(QueryException::class);

        QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'position' => 1,
        ]);
    }

    public function test_same_question_position_can_exist_in_different_quizzes(): void
    {
        $quiz1 = Quiz::factory()->create();
        $quiz2 = Quiz::factory()->create();

        $question1 = QuizQuestion::factory()->create([
            'quiz_id' => $quiz1->id,
            'position' => 1,
        ]);

        $question2 = QuizQuestion::factory()->create([
            'quiz_id' => $quiz2->id,
            'position' => 1,
        ]);

        $this->assertDatabaseHas('quiz_questions', [
            'id' => $question1->id,
            'quiz_id' => $quiz1->id,
            'position' => 1,
        ]);

        $this->assertDatabaseHas('quiz_questions', [
            'id' => $question2->id,
            'quiz_id' => $quiz2->id,
            'position' => 1,
        ]);
    }

    public function test_option_position_must_be_unique_within_question(): void
    {
        $question = QuizQuestion::factory()->create();

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'position' => 1,
        ]);

        $this->expectException(QueryException::class);

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'position' => 1,
        ]);
    }

    public function test_same_option_position_can_exist_in_different_questions(): void
    {
        $question1 = QuizQuestion::factory()->create();
        $question2 = QuizQuestion::factory()->create();

        $option1 = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question1->id,
            'position' => 1,
        ]);

        $option2 = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question2->id,
            'position' => 1,
        ]);

        $this->assertDatabaseHas('quiz_question_options', [
            'id' => $option1->id,
            'quiz_question_id' => $question1->id,
            'position' => 1,
        ]);

        $this->assertDatabaseHas('quiz_question_options', [
            'id' => $option2->id,
            'quiz_question_id' => $question2->id,
            'position' => 1,
        ]);
    }
    public function test_deleting_section_deletes_its_quizzes(): void
{
    $section = Section::factory()->create();

    $quiz = Quiz::factory()->create([
        'section_id' => $section->id,
    ]);

    $section->delete();

    $this->assertDatabaseMissing('quizzes', [
        'id' => $quiz->id,
    ]);
}

public function test_deleting_quiz_deletes_its_questions(): void
{
    $quiz = Quiz::factory()->create();

    $question = QuizQuestion::factory()->create([
        'quiz_id' => $quiz->id,
    ]);

    $quiz->delete();

    $this->assertDatabaseMissing('quiz_questions', [
        'id' => $question->id,
    ]);
}

public function test_deleting_question_deletes_its_options(): void
{
    $question = QuizQuestion::factory()->create();

    $option = QuizQuestionOption::factory()->create([
        'quiz_question_id' => $question->id,
    ]);

    $question->delete();

    $this->assertDatabaseMissing('quiz_question_options', [
        'id' => $option->id,
    ]);
}

public function test_deleting_quiz_cascades_through_questions_to_options(): void
{
    $quiz = Quiz::factory()->create();

    $question = QuizQuestion::factory()->create([
        'quiz_id' => $quiz->id,
    ]);

    $option = QuizQuestionOption::factory()->create([
        'quiz_question_id' => $question->id,
    ]);

    $quiz->delete();

    $this->assertDatabaseMissing('quiz_questions', [
        'id' => $question->id,
    ]);

    $this->assertDatabaseMissing('quiz_question_options', [
        'id' => $option->id,
    ]);
}
}
