<?php

namespace Tests\Feature;

use App\Domains\Quizzes\Actions\CreateQuizAction;
use App\Domains\Quizzes\Actions\DeleteQuizAction;
use App\Domains\Quizzes\Actions\PublishQuizAction;
use App\Domains\Quizzes\Actions\UpdateQuizAction;
use App\Domains\Quizzes\DTOs\CreateQuizData;
use App\Domains\Quizzes\DTOs\UpdateQuizData;
use App\Domains\Quizzes\Enums\QuizStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_quiz_action_creates_quiz(): void
    {
        $section = Section::factory()->create();

        $data = new CreateQuizData(
            sectionId: $section->id,
            title: 'Engine Diagnostics Quiz',
            position: 1,
        );

        $quiz = app(CreateQuizAction::class)->execute($data);

        $this->assertInstanceOf(Quiz::class, $quiz);

        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz->id,
            'section_id' => $section->id,
            'title' => 'Engine Diagnostics Quiz',
            'status' => QuizStatus::DRAFT->value,
        ]);
    }

    public function test_update_quiz_action_updates_quiz(): void
    {
        $quiz = Quiz::factory()->create();

        $data = new UpdateQuizData(
            title: 'Updated Quiz',
            passPercentage: 80,
        );

        $quiz = app(UpdateQuizAction::class)->execute(
            $quiz,
            $data
        );

        $this->assertSame('Updated Quiz', $quiz->title);
        $this->assertSame(80, $quiz->pass_percentage);
    }

    public function test_publish_quiz_action_publishes_quiz(): void
    {
        $quiz = Quiz::factory()->create([
            'status' => QuizStatus::DRAFT,
        ]);

        $quiz = app(PublishQuizAction::class)->execute($quiz);

        $this->assertSame(
            QuizStatus::PUBLISHED,
            $quiz->status
        );
    }

    public function test_delete_quiz_action_deletes_quiz(): void
    {
        $quiz = Quiz::factory()->create();

        app(DeleteQuizAction::class)->execute($quiz);

        $this->assertDatabaseMissing('quizzes', [
            'id' => $quiz->id,
        ]);
    }
}