<?php

use App\Enums\EnrollmentStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\QueryException;

uses(RefreshDatabase::class);

it('creates an active enrollment by default', function () {
    $enrollment = Enrollment::factory()->create();

    expect($enrollment->id)
        ->not->toBeNull()
        ->and($enrollment->status)
        ->toBe(EnrollmentStatus::ACTIVE)
        ->and($enrollment->enrolled_at)
        ->not->toBeNull()
        ->and($enrollment->completed_at)
        ->toBeNull()
        ->and($enrollment->cancelled_at)
        ->toBeNull();
});

it('uses a uuid as its primary key', function () {
    $enrollment = Enrollment::factory()->create();

    expect($enrollment->id)
        ->toBeString()
        ->and(strlen($enrollment->id))
        ->toBe(36);
});

it('belongs to a user', function () {
    $user = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
    ]);

    expect($enrollment->user->is($user))
        ->toBeTrue();
});

it('belongs to a course', function () {
    $course = Course::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'course_id' => $course->id,
    ]);

    expect($enrollment->course->is($course))
        ->toBeTrue();
});

it('casts status to EnrollmentStatus', function () {
    $enrollment = Enrollment::factory()->create([
        'status' => EnrollmentStatus::COMPLETED,
    ]);

    expect($enrollment->status)
        ->toBe(EnrollmentStatus::COMPLETED);
});

it('creates a completed enrollment with the completed factory state', function () {
    $enrollment = Enrollment::factory()
        ->completed()
        ->create();

    expect($enrollment->status)
        ->toBe(EnrollmentStatus::COMPLETED)
        ->and($enrollment->completed_at)
        ->not->toBeNull()
        ->and($enrollment->cancelled_at)
        ->toBeNull();
});

it('creates a cancelled enrollment with the cancelled factory state', function () {
    $enrollment = Enrollment::factory()
        ->cancelled()
        ->create();

    expect($enrollment->status)
        ->toBe(EnrollmentStatus::CANCELLED)
        ->and($enrollment->cancelled_at)
        ->not->toBeNull()
        ->and($enrollment->completed_at)
        ->toBeNull();
});

it('does not allow the same user to enroll in the same course twice', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    expect(fn () => Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]))->toThrow(QueryException::class);
});