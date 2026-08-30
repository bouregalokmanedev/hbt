<?php

namespace Tests\Feature\Domains\Quizzes;

use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Enums\QuizStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Domains\Quizzes\Http\Resources\QuizResource;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class QuizResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_quiz_resource_returns_quiz_data(): void
    {
        $section = Section::factory()->create();

        $quiz = Quiz::factory()->create([
            'section_id' => $section->id,
            'title' => 'Engine Diagnostic Quiz',
            'slug' => 'engine-diagnostic-quiz',
            'description' => 'Diagnostic assessment.',
            'position' => 1,
        ]);

        $resource = new QuizResource($quiz);

        $data = $resource
            ->toResponse(
                Request::create('/')
            )
            ->getData(true);

        $this->assertSame(
            $quiz->id,
            $data['data']['id']
        );

        $this->assertSame(
            'Engine Diagnostic Quiz',
            $data['data']['title']
        );

        $this->assertSame(
            'engine-diagnostic-quiz',
            $data['data']['slug']
        );

        $this->assertSame(
            $quiz->status->value,
            $data['data']['status']
        );
    }

    public function test_quiz_resource_includes_questions_when_loaded(): void
    {
        $section = Section::factory()->create();

        $quiz = Quiz::factory()
    ->has(
        QuizQuestion::factory()
            ->has(
                QuizQuestionOption::factory()->state([
                    'position' => 1,
                ]),
                'options'
            )
            ->has(
                QuizQuestionOption::factory()->state([
                    'position' => 2,
                ]),
                'options'
            ),
        'questions'
    )
    ->create([
        'section_id' => $section->id,
    ]);

        $quiz->load('questions.options');

        $resource = new QuizResource($quiz);

        $data = $resource
            ->toResponse(
                Request::create('/')
            )
            ->getData(true);

        $this->assertArrayHasKey(
            'questions',
            $data['data']
        );

        $this->assertCount(
            1,
            $data['data']['questions']
        );

        $this->assertCount(
            2,
            $data['data']['questions'][0]['options']
        );
    }

   public function test_quiz_resource_does_not_force_load_questions(): void
{
    $section = Section::factory()->create();

    $quiz = Quiz::factory()->create([
        'section_id' => $section->id,
    ]);

    $resource = new QuizResource($quiz);

    $data = $resource
        ->toResponse(
            Request::create('/')
        )
        ->getData(true);

    $this->assertArrayNotHasKey(
        'questions',
        $data['data']
    );

    $this->assertFalse(
        $quiz->relationLoaded('questions')
    );
}
}