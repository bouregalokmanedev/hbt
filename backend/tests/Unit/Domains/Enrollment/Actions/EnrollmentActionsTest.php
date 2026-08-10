<?php

use App\Domains\Enrollments\Actions\CancelEnrollmentAction;
use App\Domains\Enrollments\Actions\CompleteEnrollmentAction;
use App\Domains\Enrollments\Actions\CreateEnrollmentAction;
use App\Domains\Enrollments\Exceptions\AlreadyEnrolledException;
use App\Domains\Enrollments\Exceptions\CourseNotAvailableForEnrollment;
use App\Domains\Enrollments\Exceptions\EnrollmentCannotBeCancelledException;
use App\Domains\Enrollments\Exceptions\EnrollmentCannotBeCompletedException;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\EnrollmentStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('enrolls a user in a published public course', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    $enrollment = app(CreateEnrollmentAction::class)
        ->execute($user->id, $course);

    expect($enrollment->user_id)
        ->toBe($user->id)
        ->and($enrollment->course_id)
        ->toBe($course->id)
        ->and($enrollment->status)
        ->toBe(EnrollmentStatus::ACTIVE)
        ->and($enrollment->enrolled_at)
        ->not->toBeNull();
});

it('rejects enrollment into an unavailable course', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::DRAFT,
        'visibility' => Visibility::PUBLIC,
    ]);

    expect(fn () =>
        app(CreateEnrollmentAction::class)
            ->execute($user->id, $course)
    )->toThrow(CourseNotAvailableForEnrollment::class);
});

it('rejects duplicate active enrollment', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    expect(fn () =>
        app(CreateEnrollmentAction::class)
            ->execute($user->id, $course)
    )->toThrow(AlreadyEnrolledException::class);
});

it('completes an active enrollment', function () {
    $enrollment = Enrollment::factory()->create([
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    $result = app(CompleteEnrollmentAction::class)
        ->execute($enrollment);

    expect($result->status)
        ->toBe(EnrollmentStatus::COMPLETED)
        ->and($result->completed_at)
        ->not->toBeNull()
        ->and($result->cancelled_at)
        ->toBeNull();
});

it('cannot complete a cancelled enrollment', function () {
    $enrollment = Enrollment::factory()->cancelled()->create();

    expect(fn () =>
        app(CompleteEnrollmentAction::class)
            ->execute($enrollment)
    )->toThrow(EnrollmentCannotBeCompletedException::class);
});

it('cancels an active enrollment', function () {
    $enrollment = Enrollment::factory()->create([
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    $result = app(CancelEnrollmentAction::class)
        ->execute($enrollment);

    expect($result->status)
        ->toBe(EnrollmentStatus::CANCELLED)
        ->and($result->cancelled_at)
        ->not->toBeNull()
        ->and($result->completed_at)
        ->toBeNull();
});

it('cannot cancel a completed enrollment', function () {
    $enrollment = Enrollment::factory()->completed()->create();

    expect(fn () =>
        app(CancelEnrollmentAction::class)
            ->execute($enrollment)
    )->toThrow(EnrollmentCannotBeCancelledException::class);
});
