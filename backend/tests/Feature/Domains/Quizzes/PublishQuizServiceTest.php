<?php

namespace Tests\Feature\Domains\Quizzes;
use Database\Factories\Domains\Quizzes;
use App\Domains\Quizzes\Actions\PublishQuizAction;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Enums\QuizStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Domains\Quizzes\Services\PublishQuizService;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class PublishQuizServiceTest extends TestCase
{
    use RefreshDatabase;

    private function createQuiz(): Quiz
    {
        $section = Section::factory()->create();

        return Quiz::factory()->create([
            'section_id' => $section->id,
            'status' => QuizStatus::DRAFT,
        ]);
    }

    private function createValidQuestion(Quiz $quiz): QuizQuestion
    {
        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'position' => 1,
        ]);

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'option' => 'Correct answer',
            'is_correct' => true,
            'position' => 1,
        ]);

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'option' => 'Wrong answer',
            'is_correct' => false,
            'position' => 2,
        ]);

        return $question;
    }

    public function test_publishes_valid_quiz(): void
    {
        $quiz = $this->createQuiz();

        $this->createValidQuestion($quiz);

        $published = app(PublishQuizService::class)->execute($quiz);

        $this->assertSame(
            QuizStatus::PUBLISHED,
            $published->status
        );

        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz->id,
            'status' => QuizStatus::PUBLISHED->value,
        ]);
    }

    public function test_cannot_publish_quiz_without_questions(): void
    {
        $quiz = $this->createQuiz();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage(
            'A quiz must contain at least one question.'
        );

        app(PublishQuizService::class)->execute($quiz);
    }

    public function test_cannot_publish_question_without_options(): void
    {
        $quiz = $this->createQuiz();

        QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'position' => 1,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage(
            'Every quiz question must contain at least one option.'
        );

        app(PublishQuizService::class)->execute($quiz);
    }

    public function test_single_choice_question_requires_correct_option(): void
    {
        $quiz = $this->createQuiz();

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'position' => 1,
        ]);

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => false,
            'position' => 1,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage(
            'Every choice question must contain at least one correct option.'
        );

        app(PublishQuizService::class)->execute($quiz);
    }

    public function test_multiple_choice_question_requires_correct_option(): void
    {
        $quiz = $this->createQuiz();

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::MULTIPLE_CHOICE,
            'position' => 1,
        ]);

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => false,
            'position' => 1,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage(
            'Every choice question must contain at least one correct option.'
        );

        app(PublishQuizService::class)->execute($quiz);
    }

    public function test_cannot_publish_already_published_quiz(): void
    {
        $quiz = $this->createQuiz();

        $this->createValidQuestion($quiz);

        $quiz->update([
            'status' => QuizStatus::PUBLISHED,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage(
            'Quiz is already published.'
        );

        app(PublishQuizService::class)->execute($quiz);
    }

    public function test_returns_quiz_with_questions_and_options_loaded(): void
    {
        $quiz = $this->createQuiz();

        $this->createValidQuestion($quiz);

        $published = app(PublishQuizService::class)->execute($quiz);

        $this->assertTrue(
            $published->relationLoaded('questions')
        );

        $this->assertTrue(
            $published->questions->first()->relationLoaded('options')
        );
    }
}