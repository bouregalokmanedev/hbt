<?php

use App\Domains\Enrollments\Exceptions\AlreadyEnrolledException;
use App\Domains\Enrollments\Exceptions\CourseNotAvailableForEnrollment;
use App\Domains\Enrollments\Exceptions\EnrollmentCannotBeCancelledException;
use App\Domains\Enrollments\Exceptions\EnrollmentCannotBeCompletedException;
use App\Domains\Enrollments\Services\EnrollmentService;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\EnrollmentStatus;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows published public courses', function () {
    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    app(EnrollmentService::class)
        ->validateCourse($course);

    expect(true)->toBeTrue();
});

it('rejects draft courses', function () {
    $course = Course::factory()->create([
        'status' => CourseStatus::DRAFT,
        'visibility' => Visibility::PUBLIC,
    ]);

    expect(fn () =>
        app(EnrollmentService::class)
            ->validateCourse($course)
    )->toThrow(CourseNotAvailableForEnrollment::class);
});

it('rejects private courses', function () {
    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PRIVATE,
    ]);

    expect(fn () =>
        app(EnrollmentService::class)
            ->validateCourse($course)
    )->toThrow(CourseNotAvailableForEnrollment::class);
});

it('rejects an active duplicate enrollment', function () {
    $enrollment = Enrollment::factory()->create([
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    expect(fn () =>
        app(EnrollmentService::class)
            ->validateNotAlreadyEnrolled($enrollment)
    )->toThrow(AlreadyEnrolledException::class);
});

it('allows completing an active enrollment', function () {
    $enrollment = Enrollment::factory()->create([
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    app(EnrollmentService::class)
        ->validateCanComplete($enrollment);

    expect(true)->toBeTrue();
});

it('rejects completing a cancelled enrollment', function () {
    $enrollment = Enrollment::factory()->cancelled()->create();

    expect(fn () =>
        app(EnrollmentService::class)
            ->validateCanComplete($enrollment)
    )->toThrow(EnrollmentCannotBeCompletedException::class);
});

it('allows cancelling an active enrollment', function () {
    $enrollment = Enrollment::factory()->create([
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    app(EnrollmentService::class)
        ->validateCanCancel($enrollment);

    expect(true)->toBeTrue();
});

it('rejects cancelling a completed enrollment', function () {
    $enrollment = Enrollment::factory()->completed()->create();

    expect(fn () =>
        app(EnrollmentService::class)
            ->validateCanCancel($enrollment)
    )->toThrow(EnrollmentCannotBeCancelledException::class);
});
