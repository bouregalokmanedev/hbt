<?php

use App\Enums\LessonStatus;
use App\Models\Lesson;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('belongs to a section', function () {

    $section = Section::factory()->create();

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
    ]);

    expect($lesson->section->is($section))
        ->toBeTrue();
});

it('can be retrieved from its section', function () {

    $section = Section::factory()->create();

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
    ]);

    expect(
        $section->lessons->contains($lesson)
    )->toBeTrue();
});

it('orders lessons by position', function () {

    $section = Section::factory()->create();

    $third = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 3,
    ]);

    $first = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 1,
    ]);

    $second = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 2,
    ]);

    expect(
        $section->lessons->pluck('id')->all()
    )->toBe([
        $first->id,
        $second->id,
        $third->id,
    ]);
});

it('defaults to draft status', function () {

    $lesson = Lesson::factory()->create();

    expect($lesson->status)
        ->toBe(LessonStatus::DRAFT);
});

it('does not allow duplicate positions within a section', function () {

    $section = Section::factory()->create();

    Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 1,
    ]);

    try {
        Lesson::factory()->create([
            'section_id' => $section->id,
            'position' => 1,
        ]);

        $this->fail('Expected duplicate lesson position to throw an exception.');
    } catch (Throwable $e) {
        expect($e)->toBeInstanceOf(\Illuminate\Database\QueryException::class);
        expect($e->getMessage())
            ->toContain('UNIQUE constraint failed');
    }
});

it('allows the same position in different sections', function () {

    $sectionA = Section::factory()->create();
    $sectionB = Section::factory()->create();

    $lessonA = Lesson::factory()->create([
        'section_id' => $sectionA->id,
        'position' => 1,
    ]);

    $lessonB = Lesson::factory()->create([
        'section_id' => $sectionB->id,
        'position' => 1,
    ]);

    expect($lessonA->position)
        ->toBe(1);

    expect($lessonB->position)
        ->toBe(1);
});