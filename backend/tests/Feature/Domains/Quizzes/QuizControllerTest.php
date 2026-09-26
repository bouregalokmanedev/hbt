<?php

namespace Tests\Feature\Domains\Quizzes;

use App\Models\Course;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;


class QuizControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $instructor;

    protected function setUp(): void
    {
        parent::setUp();

        Role::findOrCreate('Instructor', 'web');

        $this->instructor = User::factory()->create();
        $this->instructor->assignRole('Instructor');
    }

    private function ownedSection(): Section
    {
        $course = Course::factory()->create([
            'instructor_id' => $this->instructor->id,
        ]);

        return Section::factory()->create([
            'course_id' => $course->id,
        ]);
    }

    public function test_rejects_unauthenticated_quiz_creation(): void
    {
        $section = $this->ownedSection();

        $this
            ->postJson('/api/v1/quizzes', [
                'section_id' => $section->id,
                'title' => 'Diagnostic Quiz',
                'position' => 1,
                'questions' => [],
            ])
            ->assertUnauthorized();
    }

    public function test_rejects_non_instructor_quiz_creation(): void
    {
        $section = $this->ownedSection();
        $student = User::factory()->create();

        $this
            ->actingAs($student)
            ->postJson('/api/v1/quizzes', [
                'section_id' => $section->id,
                'title' => 'Diagnostic Quiz',
                'position' => 1,
                'questions' => [],
            ])
            ->assertForbidden();
    }

    public function test_can_create_quiz_with_questions_and_options(): void
    {
        $section = $this->ownedSection();

        $response = $this
            ->actingAs($this->instructor)
            ->postJson('/api/v1/quizzes', [
                'section_id' => $section->id,
                'title' => 'Engine Management Diagnostic Quiz',
                'slug' => 'engine-management-diagnostic-quiz',
                'description' => 'Test engine management diagnostic knowledge.',
                'position' => 1,
                'pass_percentage' => 70,
                'questions' => [
                    [
                        'question' => 'What should be checked first?',
                        'type' => 'single_choice',
                        'position' => 1,
                        'points' => 2,
                        'required' => false,
                        'options' => [
                            [
                                'option' => 'Battery voltage',
                                'position' => 1,
                                'is_correct' => true,
                            ],
                            [
                                'option' => 'Paint condition',
                                'position' => 2,
                                'is_correct' => false,
                            ],
                        ],
                    ],
                ],
            ]);

        $response
            ->assertSuccessful()
            ->assertJsonPath(
                'data.title',
                'Engine Management Diagnostic Quiz'
            );

        $this->assertDatabaseHas('quizzes', [
            'section_id' => $section->id,
            'title' => 'Engine Management Diagnostic Quiz',
        ]);

        $this->assertDatabaseHas('quiz_questions', [
            'question' => 'What should be checked first?',
        ]);

        $this->assertDatabaseHas('quiz_question_options', [
            'option' => 'Battery voltage',
            'is_correct' => true,
        ]);

        $this->assertDatabaseHas('quiz_question_options', [
            'option' => 'Paint condition',
            'is_correct' => false,
        ]);
    }

    public function test_create_quiz_returns_questions_and_options(): void
    {
        $section = $this->ownedSection();

        $response = $this
            ->actingAs($this->instructor)
            ->postJson('/api/v1/quizzes', [
                'section_id' => $section->id,
                'title' => 'Diagnostic Quiz',
                'position' => 1,
                'questions' => [
                    [
                        'question' => 'Question one',
                        'type' => 'single_choice',
                        'position' => 1,
                        'options' => [
                            [
                                'option' => 'Answer one',
                                'position' => 1,
                                'is_correct' => true,
                            ],
                        ],
                    ],
                ],
            ]);

        $response
            ->assertSuccessful()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'section_id',
                    'title',
                    'questions' => [
                        '*' => [
                            'id',
                            'question',
                            'type',
                            'position',
                            'points',
                            'required',
                            'options' => [
                                '*' => [
                                    'id',
                                    'option',
                                    'position',
                                ],
                            ],
                        ],
                    ],
                ],
            ]);
    }

    public function test_create_quiz_requires_title(): void
    {
        $section = $this->ownedSection();

        $response = $this
            ->actingAs($this->instructor)
            ->postJson('/api/v1/quizzes', [
                'section_id' => $section->id,
                'position' => 1,
                'questions' => [],
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'title',
            ]);
    }

    public function test_create_quiz_requires_section(): void
    {
        $response = $this
            ->actingAs($this->instructor)
            ->postJson('/api/v1/quizzes', [
                'title' => 'Diagnostic Quiz',
                'position' => 1,
                'questions' => [],
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'section_id',
            ]);
    }

    public function test_create_quiz_rejects_invalid_question_type(): void
    {
        $section = $this->ownedSection();

        $response = $this
            ->actingAs($this->instructor)
            ->postJson('/api/v1/quizzes', [
                'section_id' => $section->id,
                'title' => 'Diagnostic Quiz',
                'position' => 1,
                'questions' => [
                    [
                        'question' => 'Invalid question',
                        'type' => 'invalid_type',
                        'position' => 1,
                        'options' => [],
                    ],
                ],
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'questions.0.type',
            ]);
    }

    public function test_create_quiz_rejects_invalid_pass_percentage(): void
    {
        $section = $this->ownedSection();

        $response = $this
            ->actingAs($this->instructor)
            ->postJson('/api/v1/quizzes', [
                'section_id' => $section->id,
                'title' => 'Diagnostic Quiz',
                'position' => 1,
                'pass_percentage' => 101,
                'questions' => [],
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'pass_percentage',
            ]);
    }

    public function test_rejects_unauthenticated_quiz_show(): void
    {
        $quiz = Quiz::factory()->published()->create([
            'section_id' => $this->ownedSection()->id,
        ]);

        $this
            ->getJson("/api/v1/quizzes/{$quiz->id}")
            ->assertUnauthorized();
    }

    public function test_hides_draft_quizzes_from_non_owners(): void
    {
        $quiz = Quiz::factory()->draft()->create([
            'section_id' => $this->ownedSection()->id,
        ]);

        $other = User::factory()->create();

        $this
            ->actingAs($other)
            ->getJson("/api/v1/quizzes/{$quiz->id}")
            ->assertNotFound();
    }

    public function test_can_show_quiz_with_questions_and_options(): void
    {
        $section = $this->ownedSection();

        $quiz = Quiz::factory()->create([
            'section_id' => $section->id,
            'title' => 'Engine Management Diagnostic Quiz',
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'question' => 'What does an oxygen sensor measure?',
            'position' => 1,
        ]);

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'option' => 'Oxygen content in exhaust gases',
            'position' => 1,
            'is_correct' => true,
        ]);

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'option' => 'Engine RPM',
            'position' => 2,
            'is_correct' => false,
        ]);

        $response = $this
            ->actingAs($this->instructor)
            ->getJson("/api/v1/quizzes/{$quiz->id}");

        $response
            ->assertSuccessful()
            ->assertJsonPath(
                'data.id',
                $quiz->id
            )
            ->assertJsonPath(
                'data.title',
                'Engine Management Diagnostic Quiz'
            )
            ->assertJsonPath(
                'data.questions.0.question',
                'What does an oxygen sensor measure?',
            )
            ->assertJsonCount(
                2,
                'data.questions.0.options'
            );
    }
}
