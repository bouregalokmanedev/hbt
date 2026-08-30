<?php

namespace Tests\Feature\Domains\Quizzes;

use App\Domains\Quizzes\Http\Requests\CreateQuizRequest;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class CreateQuizRequestTest extends TestCase
{
    use RefreshDatabase;

    private function validate(array $data)
    {
        $request = new CreateQuizRequest();

        return Validator::make(
            $data,
            $request->rules()
        );
    }

    public function test_valid_quiz_data_passes_validation(): void
    {
        $section = Section::factory()->create();

        $validator = $this->validate([
            'section_id' => $section->id,
            'title' => 'Engine Diagnostic Quiz',
            'slug' => 'engine-diagnostic-quiz',
            'description' => 'Diagnostic knowledge assessment.',
            'position' => 1,
            'status' => 'draft',
            'pass_percentage' => 70,
            'max_attempts' => 3,
            'time_limit' => 30,

            'questions' => [
                [
                    'question' => 'What should be checked first?',
                    'type' => 'single_choice',
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
        ]);

        $this->assertFalse($validator->fails());
    }

    public function test_section_id_is_required(): void
    {
        $validator = $this->validate([
            'title' => 'Diagnostic Quiz',
            'position' => 1,
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey(
            'section_id',
            $validator->errors()->toArray()
        );
    }

    public function test_title_is_required(): void
    {
        $section = Section::factory()->create();

        $validator = $this->validate([
            'section_id' => $section->id,
            'position' => 1,
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey(
            'title',
            $validator->errors()->toArray()
        );
    }

    public function test_position_must_be_at_least_one(): void
    {
        $section = Section::factory()->create();

        $validator = $this->validate([
            'section_id' => $section->id,
            'title' => 'Diagnostic Quiz',
            'position' => 0,
        ]);

        $this->assertTrue($validator->fails());
    }

    public function test_invalid_status_is_rejected(): void
    {
        $section = Section::factory()->create();

        $validator = $this->validate([
            'section_id' => $section->id,
            'title' => 'Diagnostic Quiz',
            'position' => 1,
            'status' => 'invalid',
        ]);

        $this->assertTrue($validator->fails());
    }

    public function test_invalid_question_type_is_rejected(): void
    {
        $section = Section::factory()->create();

        $validator = $this->validate([
            'section_id' => $section->id,
            'title' => 'Diagnostic Quiz',
            'position' => 1,

            'questions' => [
                [
                    'question' => 'Test question',
                    'type' => 'invalid_type',
                    'position' => 1,
                    'options' => [],
                ],
            ],
        ]);

        $this->assertTrue($validator->fails());
    }

    public function test_question_options_are_required(): void
    {
        $section = Section::factory()->create();

        $validator = $this->validate([
            'section_id' => $section->id,
            'title' => 'Diagnostic Quiz',
            'position' => 1,

            'questions' => [
                [
                    'question' => 'Test question',
                    'type' => 'single_choice',
                    'position' => 1,
                ],
            ],
        ]);

        $this->assertTrue($validator->fails());
    }
}