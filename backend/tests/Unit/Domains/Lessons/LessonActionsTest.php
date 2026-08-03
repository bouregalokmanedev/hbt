<?php

use App\Domains\Lessons\Actions\CreateLessonAction;
use App\Domains\Lessons\Actions\DeleteLessonAction;
use App\Domains\Lessons\Actions\UpdateLessonAction;
use App\Enums\LessonStatus;
use App\Models\Lesson;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates a lesson', function () {
    $section = Section::factory()->create();

    $action = app(CreateLessonAction::class);

    $lesson = $action->execute([
        'section_id' => $section->id,
        'title' => 'Introduction',
        'slug' => 'introduction',
        'description' => 'Introduction lesson',
        'content' => 'Lesson content',
        'position' => 1,
        'status' => LessonStatus::DRAFT,
    ]);

    expect($lesson)
        ->toBeInstanceOf(Lesson::class);

    expect($lesson->section_id)
        ->toBe($section->id);
});

it('rejects an invalid position when creating', function () {
    $section = Section::factory()->create();

    $action = app(CreateLessonAction::class);

    expect(fn () =>
        $action->execute([
            'section_id' => $section->id,
            'title' => 'Introduction',
            'slug' => 'introduction',
            'content' => 'Content',
            'position' => 0,
            'status' => LessonStatus::DRAFT,
        ])
    )->toThrow(DomainException::class);
});

it('updates a lesson', function () {
    $lesson = Lesson::factory()->create([
        'title' => 'Old title',
    ]);

    $action = app(UpdateLessonAction::class);

    $result = $action->execute(
        $lesson,
        [
            'title' => 'New title',
        ]
    );

    expect($result->title)
        ->toBe('New title');
});

it('rejects an invalid position when updating', function () {
    $lesson = Lesson::factory()->create([
        'position' => 1,
    ]);

    $action = app(UpdateLessonAction::class);

    expect(fn () =>
        $action->execute(
            $lesson,
            [
                'position' => 0,
            ]
        )
    )->toThrow(DomainException::class);
});

it('does not allow a normal update to move a lesson between sections', function () {
    $sectionA = Section::factory()->create();
    $sectionB = Section::factory()->create();

    $lesson = Lesson::factory()->create([
        'section_id' => $sectionA->id,
    ]);

    $action = app(UpdateLessonAction::class);

    $result = $action->execute(
        $lesson,
        [
            'title' => 'Updated title',
        ]
    );

    expect($result->section_id)
        ->toBe($sectionA->id);
});

it('deletes a lesson', function () {
    $lesson = Lesson::factory()->create();

    $action = app(DeleteLessonAction::class);

    $action->execute($lesson);

    expect(
        Lesson::query()->find($lesson->id)
    )->toBeNull();
});