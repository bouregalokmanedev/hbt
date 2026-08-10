<?php

use App\Domains\Lessons\Actions\PublishLessonAction;
use App\Domains\Lessons\Actions\UnpublishLessonAction;
use App\Enums\LessonStatus;
use App\Models\Lesson;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('cannot publish an already published lesson', function () {
    $lesson = Lesson::factory()->create([
        'status' => LessonStatus::PUBLISHED,
        'title' => 'Published lesson',
        'slug' => 'published-lesson',
        'content' => 'Content',
        'position' => 1,
    ]);

    expect(fn () =>
        app(PublishLessonAction::class)->execute($lesson)
    )->toThrow(
        DomainException::class,
        'Lesson is already published.'
    );
});

it('cannot unpublish a draft lesson', function () {
    $lesson = Lesson::factory()->create([
        'status' => LessonStatus::DRAFT,
        'position' => 1,
    ]);

    expect(fn () =>
        app(UnpublishLessonAction::class)->execute($lesson)
    )->toThrow(
        DomainException::class,
        'Lesson is already a draft.'
    );
});

it('publishes a valid lesson', function () {

    $lesson = Lesson::factory()->create([
        'title' => 'Introduction',
        'slug' => 'introduction',
        'content' => 'Lesson content',
        'position' => 1,
        'status' => LessonStatus::DRAFT,
    ]);

    $action = app(PublishLessonAction::class);

    $result = $action->execute($lesson);

    expect($result->status)
        ->toBe(LessonStatus::PUBLISHED);

    expect($lesson->fresh()->status)
        ->toBe(LessonStatus::PUBLISHED);
});

it('rejects publishing without a title', function () {

    $lesson = Lesson::factory()->create([
        'title' => null,
        'slug' => 'introduction',
        'content' => 'Lesson content',
        'position' => 1,
        'status' => LessonStatus::DRAFT,
    ]);

    $action = app(PublishLessonAction::class);

    expect(fn () =>
        $action->execute($lesson)
    )->toThrow(DomainException::class);

    expect($lesson->fresh()->status)
        ->toBe(LessonStatus::DRAFT);
});

it('rejects publishing without a slug', function () {

    $lesson = Lesson::factory()->create([
        'title' => 'Introduction',
        'slug' => null,
        'content' => 'Lesson content',
        'position' => 1,
        'status' => LessonStatus::DRAFT,
    ]);

    $action = app(PublishLessonAction::class);

    expect(fn () =>
        $action->execute($lesson)
    )->toThrow(DomainException::class);

    expect($lesson->fresh()->status)
        ->toBe(LessonStatus::DRAFT);
});

it('rejects publishing without content', function () {

    $lesson = Lesson::factory()->create([
        'title' => 'Introduction',
        'slug' => 'introduction',
        'content' => null,
        'position' => 1,
        'status' => LessonStatus::DRAFT,
    ]);

    $action = app(PublishLessonAction::class);

    expect(fn () =>
        $action->execute($lesson)
    )->toThrow(DomainException::class);

    expect($lesson->fresh()->status)
        ->toBe(LessonStatus::DRAFT);
});

it('unpublishes a published lesson', function () {

    $lesson = Lesson::factory()->create([
        'title' => 'Introduction',
        'slug' => 'introduction',
        'content' => 'Lesson content',
        'position' => 1,
        'status' => LessonStatus::PUBLISHED,
    ]);

    $action = app(UnpublishLessonAction::class);

    $result = $action->execute($lesson);

    expect($result->status)
        ->toBe(LessonStatus::DRAFT);

    expect($lesson->fresh()->status)
        ->toBe(LessonStatus::DRAFT);
});