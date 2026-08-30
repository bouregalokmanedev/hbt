<?php

namespace Tests\Feature;

use App\Domains\Quizzes\Enums\QuizStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_quiz_belongs_to_a_section(): void
    {
        $section = Section::factory()->create();

        $quiz = Quiz::factory()->create([
            'section_id' => $section->id,
        ]);

        $this->assertTrue(
            $quiz->section->is($section)
        );
    }

    public function test_section_has_many_quizzes(): void
    {
        $section = Section::factory()->create();

        $quiz1 = Quiz::factory()->create([
            'section_id' => $section->id,
            'position' => 1,
        ]);

        $quiz2 = Quiz::factory()->create([
            'section_id' => $section->id,
            'position' => 2,
        ]);

        $this->assertCount(2, $section->quizzes);

        $this->assertTrue(
            $section->quizzes->contains($quiz1)
        );

        $this->assertTrue(
            $section->quizzes->contains($quiz2)
        );
    }

    public function test_quiz_status_is_cast_to_enum(): void
    {
        $quiz = Quiz::factory()->create([
            'status' => QuizStatus::PUBLISHED,
        ]);

        $this->assertInstanceOf(
            QuizStatus::class,
            $quiz->status
        );

        $this->assertSame(
            QuizStatus::PUBLISHED,
            $quiz->status
        );
    }

    public function test_quiz_defaults_to_draft(): void
    {
        $quiz = Quiz::factory()->create();

        $this->assertSame(
            QuizStatus::DRAFT,
            $quiz->status
        );
    }

    public function test_quizzes_are_ordered_by_position(): void
    {
        $section = Section::factory()->create();

        Quiz::factory()->create([
            'section_id' => $section->id,
            'position' => 3,
        ]);

        Quiz::factory()->create([
            'section_id' => $section->id,
            'position' => 1,
        ]);

        Quiz::factory()->create([
            'section_id' => $section->id,
            'position' => 2,
        ]);

        $positions = $section->quizzes
            ->pluck('position')
            ->values()
            ->all();

        $this->assertSame(
            [1, 2, 3],
            $positions
        );
    }
}