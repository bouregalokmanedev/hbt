<?php

use App\Domains\Lessons\Repositories\EloquentLessonRepository;
use App\Enums\LessonStatus;
use App\Models\Lesson;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('finds a lesson', function () {
    $repository = new EloquentLessonRepository();

    $lesson = Lesson::factory()->create();

    $result = $repository->find($lesson->id);

    expect($result?->is($lesson))
        ->toBeTrue();
});

it('returns null for an unknown lesson', function () {
    $repository = new EloquentLessonRepository();

    $result = $repository->find(
        '00000000-0000-0000-0000-000000000000'
    );

    expect($result)
        ->toBeNull();
});

it('finds a lesson or fails', function () {
    $repository = new EloquentLessonRepository();

    $lesson = Lesson::factory()->create();

    expect(
        $repository->findOrFail($lesson->id)->is($lesson)
    )->toBeTrue();
});

it('throws when finding an unknown lesson', function () {
    $repository = new EloquentLessonRepository();

    expect(fn () =>
        $repository->findOrFail(
            '00000000-0000-0000-0000-000000000000'
        )
    )->toThrow(
        \Illuminate\Database\Eloquent\ModelNotFoundException::class
    );
});

it('finds lessons by section in position order', function () {
    $repository = new EloquentLessonRepository();

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

    $result = $repository->findBySection(
        $section->id
    );

    expect($result->pluck('id')->all())
        ->toBe([
            $first->id,
            $second->id,
            $third->id,
        ]);
});

it('finds a lesson by section and position', function () {
    $repository = new EloquentLessonRepository();

    $section = Section::factory()->create();

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 2,
    ]);

    $result = $repository->findBySectionAndPosition(
        $section->id,
        2
    );

    expect($result?->is($lesson))
        ->toBeTrue();
});

it('creates a lesson', function () {
    $repository = new EloquentLessonRepository();

    $section = Section::factory()->create();

    $lesson = $repository->create([
        'section_id' => $section->id,
        'title' => 'Introduction',
        'slug' => 'introduction',
        'description' => 'Introduction',
        'content' => 'Lesson content',
        'position' => 1,
        'status' => LessonStatus::DRAFT,
    ]);

    expect($lesson)
        ->toBeInstanceOf(Lesson::class);

    expect($lesson->section_id)
        ->toBe($section->id);
});

it('updates a lesson', function () {
    $repository = new EloquentLessonRepository();

    $lesson = Lesson::factory()->create([
        'title' => 'Old title',
    ]);

    $result = $repository->update(
        $lesson,
        [
            'title' => 'New title',
        ]
    );

    expect($result->title)
        ->toBe('New title');

    expect($lesson->fresh()->title)
        ->toBe('New title');
});

it('deletes a lesson', function () {
    $repository = new EloquentLessonRepository();

    $lesson = Lesson::factory()->create();

    $repository->delete($lesson);

    expect(
        Lesson::query()->find($lesson->id)
    )->toBeNull();
});

it('shifts lessons down when moving up', function () {
    $repository = new EloquentLessonRepository();

    $section = Section::factory()->create();

    $lesson1 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 1,
    ]);

    $lesson2 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 2,
    ]);

    $lesson3 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 3,
    ]);

    $repository->shiftPositions(
        $section->id,
        3,
        1
    );

    expect($lesson1->fresh()->position)->toBe(2);
    expect($lesson2->fresh()->position)->toBe(3);
    expect($lesson3->fresh()->position)->toBe(1);
});

it('shifts lessons up when moving down', function () {
    $repository = new EloquentLessonRepository();

    $section = Section::factory()->create();

    $lesson1 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 1,
    ]);

    $lesson2 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 2,
    ]);

    $lesson3 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 3,
    ]);

    $repository->shiftPositions(
        $section->id,
        1,
        3
    );

    expect($lesson1->fresh()->position)->toBe(3);
    expect($lesson2->fresh()->position)->toBe(1);
    expect($lesson3->fresh()->position)->toBe(2);
});