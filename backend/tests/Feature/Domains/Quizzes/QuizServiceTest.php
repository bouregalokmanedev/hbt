<?php

namespace Tests\Feature\Domains\Quizzes;

use App\Domains\Quizzes\DTOs\CreateQuizData;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Services\CreateQuizService;
use App\Domains\Quizzes\Models\Quiz;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_quiz_service_creates_complete_quiz_structure(): void
    {
        $section = Section::factory()->create();

        $quizData = new CreateQuizData(
            sectionId: $section->id,
            title: 'Engine Management Diagnostic Quiz',
            slug: 'engine-management-diagnostic-quiz',
            description: 'Test engine management diagnostic knowledge.',
            position: 1,
        );

        $quiz = app(CreateQuizService::class)->execute(
            $quizData,
            [
                [
                    'question' => 'What should be checked first?',
                    'type' => QuizQuestionType::SINGLE_CHOICE,
                    'position' => 1,
                    'points' => 2,
                    'required' => true,
                    'options' => [
                        [
                            'option' => 'Battery voltage',
                            'is_correct' => true,
                            'position' => 1,
                        ],
                        [
                            'option' => 'Paint condition',
                            'is_correct' => false,
                            'position' => 2,
                        ],
                    ],
                ],
            ]
        );

        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz->id,
            'section_id' => $section->id,
            'title' => 'Engine Management Diagnostic Quiz',
        ]);

        $this->assertCount(1, $quiz->questions);

        $question = $quiz->questions->first();

        $this->assertSame(
            'What should be checked first?',
            $question->question
        );

        $this->assertCount(2, $question->options);

        $this->assertTrue(
            $question->options
                ->where('option', 'Battery voltage')
                ->first()
                ->is_correct
        );
    }

    public function test_create_quiz_service_returns_quiz_with_questions_and_options(): void
    {
        $section = Section::factory()->create();

        $quizData = new CreateQuizData(
            sectionId: $section->id,
            title: 'Diagnostic Quiz',
            position: 1,
        );

        $quiz = app(CreateQuizService::class)->execute(
            $quizData,
            [
                [
                    'question' => 'Question one',
                    'type' => QuizQuestionType::SINGLE_CHOICE,
                    'position' => 1,
                    'options' => [
                        [
                            'option' => 'Answer one',
                            'is_correct' => true,
                            'position' => 1,
                        ],
                    ],
                ],
            ]
        );

        $this->assertTrue(
            $quiz->relationLoaded('questions')
        );

        $this->assertTrue(
            $quiz->questions->first()->relationLoaded('options')
        );
    }
}