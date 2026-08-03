<?php

use App\Domains\Lessons\Services\LessonService;
use App\Enums\LessonStatus;
use App\Models\Lesson;

it('accepts a valid position', function () {

    $service = new LessonService();

    expect(
        fn () => $service->validatePosition(1)
    )->not->toThrow(Throwable::class);
});

it('rejects position zero', function () {

    $service = new LessonService();

    expect(
        fn () => $service->validatePosition(0)
    )->toThrow(DomainException::class);
});

it('rejects a negative position', function () {

    $service = new LessonService();

    expect(
        fn () => $service->validatePosition(-1)
    )->toThrow(DomainException::class);
});

it('rejects publishing without a title', function () {

    $service = new LessonService();

    $lesson = Lesson::factory()->make([
        'title' => null,
        'slug' => 'lesson-one',
        'content' => 'Content',
        'position' => 1,
    ]);

    expect(
        fn () => $service->validatePublishable($lesson)
    )->toThrow(DomainException::class);
});

it('rejects publishing without a slug', function () {

    $service = new LessonService();

    $lesson = Lesson::factory()->make([
        'title' => 'Lesson One',
        'slug' => null,
        'content' => 'Content',
        'position' => 1,
    ]);

    expect(
        fn () => $service->validatePublishable($lesson)
    )->toThrow(DomainException::class);
});

it('rejects publishing without content', function () {

    $service = new LessonService();

    $lesson = Lesson::factory()->make([
        'title' => 'Lesson One',
        'slug' => 'lesson-one',
        'content' => null,
        'position' => 1,
    ]);

    expect(
        fn () => $service->validatePublishable($lesson)
    )->toThrow(DomainException::class);
});

it('accepts a publishable lesson', function () {

    $service = new LessonService();

    $lesson = Lesson::factory()->make([
        'title' => 'Lesson One',
        'slug' => 'lesson-one',
        'content' => 'Lesson content',
        'position' => 1,
    ]);

    expect(
        fn () => $service->validatePublishable($lesson)
    )->not->toThrow(Throwable::class);
});

it('publishes a valid lesson', function () {

    $service = new LessonService();

    $lesson = Lesson::factory()->make([
        'title' => 'Lesson One',
        'slug' => 'lesson-one',
        'content' => 'Lesson content',
        'position' => 1,
        'status' => LessonStatus::DRAFT,
    ]);

    $result = $service->publish($lesson);

    expect($result->status)
        ->toBe(LessonStatus::PUBLISHED);
});

it('unpublishes a lesson', function () {

    $service = new LessonService();

    $lesson = Lesson::factory()->make([
        'title' => 'Lesson One',
        'slug' => 'lesson-one',
        'content' => 'Lesson content',
        'position' => 1,
        'status' => LessonStatus::PUBLISHED,
    ]);

    $result = $service->unpublish($lesson);

    expect($result->status)
        ->toBe(LessonStatus::DRAFT);
});