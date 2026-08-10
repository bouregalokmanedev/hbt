<?php

use App\Domains\Enrollments\Actions\EnrollStudentAction;
use App\Domains\Enrollments\Exceptions\AlreadyEnrolledException;
use App\Domains\Enrollments\Exceptions\CourseNotAvailableForEnrollment;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\EnrollmentStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('enrolls a student in a published public course', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    $enrollment = app(EnrollStudentAction::class)
        ->execute($user, $course);

    expect($enrollment)
        ->toBeInstanceOf(Enrollment::class)
        ->and($enrollment->user_id)
        ->toBe($user->id)
        ->and($enrollment->course_id)
        ->toBe($course->id)
        ->and($enrollment->status)
        ->toBe(EnrollmentStatus::ACTIVE)
        ->and($enrollment->enrolled_at)
        ->not->toBeNull();

    expect(
        Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->count()
    )->toBe(1);
});

it('rejects enrollment into an unpublished course', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::DRAFT,
        'visibility' => Visibility::PUBLIC,
    ]);

    expect(fn () =>
        app(EnrollStudentAction::class)
            ->execute($user, $course)
    )->toThrow(CourseNotAvailableForEnrollment::class);

    expect(
        Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->exists()
    )->toBeFalse();
});

it('rejects enrollment into a private course', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PRIVATE,
    ]);

    expect(fn () =>
        app(EnrollStudentAction::class)
            ->execute($user, $course)
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
        app(EnrollStudentAction::class)
            ->execute($user, $course)
    )->toThrow(AlreadyEnrolledException::class);

    expect(
        Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->count()
    )->toBe(1);
});
