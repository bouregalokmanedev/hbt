<?php

use App\Domains\Courses\Actions\PublishCourseAction;
use App\Domains\Courses\DTOs\PublishCourseData;
use App\Domains\Courses\Exceptions\CourseAlreadyPublishedException;
use App\Domains\Courses\Exceptions\CourseArchivedException;
use App\Domains\Courses\Exceptions\CourseCannotBePublishedException;
use App\Enums\Courses\CourseStatus;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function publishableCourse(array $overrides = []): Course
{
    return Course::factory()->create(array_merge([
        'status' => CourseStatus::DRAFT,
        'title' => 'Laravel Backend Architecture',
        'description' => 'A complete Laravel backend course.',
        'duration_minutes' => 120,
        'thumbnail' => 'media/course-thumbnail.jpg',
    ], $overrides));
}

it('publishes a valid draft course', function () {
    $instructor = User::factory()->create();

    $course = publishableCourse([
        'instructor_id' => $instructor->id,
    ]);

    $result = app(PublishCourseAction::class)->execute(
        new PublishCourseData(
            courseId: $course->id,
            publisherId: $instructor->id,
        )
    );

    expect($result->status)
        ->toBe(CourseStatus::PUBLISHED);

    expect($result->published_at)
        ->not->toBeNull();

    expect($course->fresh()->status)
        ->toBe(CourseStatus::PUBLISHED);

    expect($course->fresh()->published_at)
        ->not->toBeNull();
});

it('cannot publish an already published course', function () {
    $instructor = User::factory()->create();

    $course = publishableCourse([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::PUBLISHED,
        'published_at' => now(),
    ]);

    app(PublishCourseAction::class)->execute(
        new PublishCourseData(
            courseId: $course->id,
            publisherId: $instructor->id,
        )
    );
})->throws(CourseAlreadyPublishedException::class);

it('cannot publish an archived course', function () {
    $instructor = User::factory()->create();

    $course = publishableCourse([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::ARCHIVED,
    ]);

    app(PublishCourseAction::class)->execute(
        new PublishCourseData(
            courseId: $course->id,
            publisherId: $instructor->id,
        )
    );
})->throws(CourseArchivedException::class);

it('cannot publish a course without a title', function () {
    $instructor = User::factory()->create();

    $course = publishableCourse([
        'instructor_id' => $instructor->id,
        'title' => null,
    ]);

    app(PublishCourseAction::class)->execute(
        new PublishCourseData(
            courseId: $course->id,
            publisherId: $instructor->id,
        )
    );
})->throws(
    CourseCannotBePublishedException::class,
    'Course title is required.'
);

it('cannot publish a course without a description', function () {
    $instructor = User::factory()->create();

    $course = publishableCourse([
        'instructor_id' => $instructor->id,
        'description' => null,
    ]);

    app(PublishCourseAction::class)->execute(
        new PublishCourseData(
            courseId: $course->id,
            publisherId: $instructor->id,
        )
    );
})->throws(
    CourseCannotBePublishedException::class,
    'Course description is required.'
);

it('cannot publish a course without a valid duration', function () {
    $instructor = User::factory()->create();

    $course = publishableCourse([
        'instructor_id' => $instructor->id,
        'duration_minutes' => 0,
    ]);

    app(PublishCourseAction::class)->execute(
        new PublishCourseData(
            courseId: $course->id,
            publisherId: $instructor->id,
        )
    );
})->throws(
    CourseCannotBePublishedException::class,
    'Course duration is required.'
);

it('cannot publish a course without a thumbnail', function () {
    $instructor = User::factory()->create();

    $course = publishableCourse([
        'instructor_id' => $instructor->id,
        'thumbnail' => null,
    ]);

    app(PublishCourseAction::class)->execute(
        new PublishCourseData(
            courseId: $course->id,
            publisherId: $instructor->id,
        )
    );
})->throws(
    CourseCannotBePublishedException::class,
    'Thumbnail is required.'
);

it('leaves an invalid course unpublished', function () {
    $instructor = User::factory()->create();

    $course = publishableCourse([
        'instructor_id' => $instructor->id,
        'thumbnail' => null,
    ]);

    try {
        app(PublishCourseAction::class)->execute(
            new PublishCourseData(
                courseId: $course->id,
                publisherId: $instructor->id,
            )
        );
    } catch (CourseCannotBePublishedException) {
        // Expected.
    }

    expect($course->fresh()->status)
        ->toBe(CourseStatus::DRAFT);

    expect($course->fresh()->published_at)
        ->toBeNull();
});