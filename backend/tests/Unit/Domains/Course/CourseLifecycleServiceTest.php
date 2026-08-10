<?php

use App\Domains\Courses\DTOs\UpdateCourseData;
use App\Domains\Courses\Exceptions\CourseAlreadyArchivedException;
use App\Domains\Courses\Exceptions\CourseArchivedException;
use App\Domains\Courses\Exceptions\CourseReviewStateException;
use App\Domains\Courses\Listeners\RecordCourseSubmittedForReviewAudit;
use App\Domains\Courses\Services\CourseService;
use App\Enums\Courses\CourseStatus;
use App\Models\Course;
use App\Enums\Courses\Difficulty;
use App\Enums\Courses\Visibility;

it('archives a published course', function () {
    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
    ]);

    app(CourseService::class)->archive($course);

    expect($course->refresh()->status)
        ->toBe(CourseStatus::ARCHIVED);
});

it('cannot archive an already archived course', function () {
    $course = Course::factory()->create([
        'status' => CourseStatus::ARCHIVED,
    ]);

    app(CourseService::class)->archive($course);
})->throws(CourseAlreadyArchivedException::class);

it('restores an archived course to draft', function () {
    $course = Course::factory()->create([
        'status' => CourseStatus::ARCHIVED,
    ]);

    app(CourseService::class)->restore($course);

    expect($course->refresh()->status)
        ->toBe(CourseStatus::DRAFT);
});

it('cannot restore a non archived course', function () {
    $course = Course::factory()->create([
        'status' => CourseStatus::DRAFT,
    ]);

    app(CourseService::class)->restore($course);
})->throws(CourseReviewStateException::class);

it('submits a draft course for review', function () {
    $course = Course::factory()->create([
        'status' => CourseStatus::DRAFT,
    ]);

    app(CourseService::class)->submitForReview($course);

    expect($course->refresh()->status)
        ->toBe(CourseStatus::REVIEW);
});

it('cannot submit a published course for review', function () {
    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
    ]);

    app(CourseService::class)->submitForReview($course);
})->throws(CourseReviewStateException::class);

it('cannot update an archived course', function () {
    $course = Course::factory()->create([
        'status' => CourseStatus::ARCHIVED,
    ]);

    $dto = new UpdateCourseData(
    courseId: $course->id,
    title: 'Updated Course',
    slug: 'updated-course',
    shortDescription: 'Updated short description',
    description: 'Updated description',
    language: 'en',
    difficulty: Difficulty::BEGINNER,
    durationMinutes: 60,
    price: 100,
    discountPrice: null,
    currency: 'USD',
    isFree: false,
    visibility: Visibility::PUBLIC,
    thumbnail: null,
    coverImage: null,
    previewVideo: null,
    metaTitle: null,
    metaDescription: null,
    metadata: [],
);

    app(CourseService::class)->update($dto);
})->throws(CourseArchivedException::class);

it('deletes a course', function () {
    $course = Course::factory()->create();

    app(CourseService::class)->delete($course);

    expect(
        Course::withTrashed()->find($course->id)
    )->not->toBeNull();

    expect(
        Course::find($course->id)
    )->toBeNull();
});
