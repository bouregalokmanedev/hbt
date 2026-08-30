<?php

namespace Tests\Feature\Domains\Quizzes;

use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Domains\Quizzes\Services\UpdateQuizService;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpdateQuizServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_updates_quiz_information(): void
    {
        $section = Section::factory()->create();

        $quiz = Quiz::factory()->create([
            'section_id' => $section->id,
            'title' => 'Old Quiz Title',
            'description' => 'Old description',
        ]);

        app(UpdateQuizService::class)->execute(
            $quiz,
            [
                'title' => 'Updated Quiz Title',
                'description' => 'Updated description',
            ]
        );

        $quiz->refresh();

        $this->assertSame(
            'Updated Quiz Title',
            $quiz->title
        );

        $this->assertSame(
            'Updated description',
            $quiz->description
        );
    }

    public function test_adds_new_question(): void
    {
        $quiz = Quiz::factory()->create();

        app(UpdateQuizService::class)->execute(
            $quiz,
            [
                'questions' => [
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
                ],
            ]
        );

        $quiz->refresh()->load('questions.options');

        $this->assertCount(1, $quiz->questions);

        $question = $quiz->questions->first();

        $this->assertSame(
            'What should be checked first?',
            $question->question
        );

        $this->assertCount(2, $question->options);
    }

    public function test_updates_existing_question(): void
    {
        $quiz = Quiz::factory()->create();

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'question' => 'Old question',
            'position' => 1,
        ]);

        app(UpdateQuizService::class)->execute(
            $quiz,
            [
                'questions' => [
                    [
                        'id' => $question->id,
                        'question' => 'Updated question',
                        'type' => QuizQuestionType::MULTIPLE_CHOICE,
                        'position' => 1,
                        'points' => 5,
                        'required' => false,
                    ],
                ],
            ]
        );

        $question->refresh();

        $this->assertSame(
            'Updated question',
            $question->question
        );

        $this->assertSame(
            5,
            $question->points
        );

        $this->assertFalse(
            $question->required
        );

        $this->assertSame(
            QuizQuestionType::MULTIPLE_CHOICE,
            $question->type
        );
    }

    public function test_updates_existing_option(): void
    {
        $quiz = Quiz::factory()->create();

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
        ]);

        $option = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'option' => 'Old answer',
            'is_correct' => false,
            'position' => 1,
        ]);

        app(UpdateQuizService::class)->execute(
            $quiz,
            [
                'questions' => [
                    [
                        'id' => $question->id,
                        'question' => $question->question,
                        'type' => $question->type,
                        'position' => 1,
                        'points' => $question->points,
                        'required' => true,
                        'options' => [
                            [
                                'id' => $option->id,
                                'option' => 'Updated answer',
                                'is_correct' => true,
                                'position' => 1,
                            ],
                        ],
                    ],
                ],
            ]
        );

        $option->refresh();

        $this->assertSame(
            'Updated answer',
            $option->option
        );

        $this->assertTrue(
            $option->is_correct
        );
    }

    public function test_removes_questions_not_present_in_payload(): void
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

        app(UpdateQuizService::class)->execute(
            $quiz,
            [
                'questions' => [
                    [
                        'id' => $question1->id,
                        'question' => $question1->question,
                        'type' => $question1->type,
                        'position' => 1,
                        'points' => $question1->points,
                        'required' => true,
                    ],
                ],
            ]
        );

        $this->assertDatabaseHas(
            'quiz_questions',
            ['id' => $question1->id]
        );

        $this->assertDatabaseMissing(
            'quiz_questions',
            ['id' => $question2->id]
        );
    }

    public function test_returns_quiz_with_questions_and_options_loaded(): void
    {
        $quiz = Quiz::factory()->create();

        app(UpdateQuizService::class)->execute(
            $quiz,
            [
                'questions' => [
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