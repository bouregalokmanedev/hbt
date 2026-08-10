<?php

use App\Domains\Lessons\Actions\CreateLessonAction;
use App\Domains\Lessons\Actions\DeleteLessonAction;
use App\Domains\Lessons\Actions\UpdateLessonAction;
use App\Domains\Lessons\Actions\ReorderLessonAction;
use App\Enums\LessonStatus;
use App\Models\Lesson;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns a published lesson to draft when its content is updated', function () {
    $lesson = Lesson::factory()->create([
        'status' => LessonStatus::PUBLISHED,
        'title' => 'Original title',
        'slug' => 'original-title',
        'content' => 'Original content',
        'position' => 1,
    ]);

    $updated = app(UpdateLessonAction::class)->execute(
        $lesson,
        [
            'content' => 'Updated content',
        ]
    );

    expect($updated->status)
        ->toBe(LessonStatus::DRAFT)
        ->and($updated->content)
        ->toBe('Updated content');
});

it('keeps a draft lesson as draft when updated', function () {
    $lesson = Lesson::factory()->create([
        'status' => LessonStatus::DRAFT,
        'position' => 1,
    ]);

    $updated = app(UpdateLessonAction::class)->execute(
        $lesson,
        [
            'title' => 'Updated title',
        ]
    );

    expect($updated->status)
        ->toBe(LessonStatus::DRAFT);
});

it('does not change publication state when a published lesson is reordered', function () {
    $section = Section::factory()->create();

    $lessonOne = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 1,
        'status' => LessonStatus::PUBLISHED,
        'title' => 'Lesson 1',
        'slug' => 'lesson-1',
        'content' => 'Content',
    ]);

    Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 2,
    ]);

    $updated = app(ReorderLessonAction::class)->execute(
        $lessonOne,
        2
    );

    expect($updated->status)
        ->toBe(LessonStatus::PUBLISHED);
});

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