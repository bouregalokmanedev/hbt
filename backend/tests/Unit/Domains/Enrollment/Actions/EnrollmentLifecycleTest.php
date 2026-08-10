<?php

use App\Domains\Enrollments\Actions\CancelEnrollmentAction;
use App\Domains\Enrollments\Actions\CompleteEnrollmentAction;
use App\Domains\Enrollments\Exceptions\EnrollmentCannotBeCancelledException;
use App\Domains\Enrollments\Exceptions\EnrollmentCannotBeCompletedException;
use App\Enums\EnrollmentStatus;
use App\Models\Enrollment;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('completes an active enrollment', function () {
    $enrollment = Enrollment::factory()->create([
        'status' => EnrollmentStatus::ACTIVE,
        'completed_at' => null,
        'cancelled_at' => null,
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

it('cannot complete an already completed enrollment', function () {
    $enrollment = Enrollment::factory()->completed()->create();

    expect(fn () =>
        app(CompleteEnrollmentAction::class)
            ->execute($enrollment)
    )->toThrow(EnrollmentCannotBeCompletedException::class);
});

it('cancels an active enrollment', function () {
    $enrollment = Enrollment::factory()->create([
        'status' => EnrollmentStatus::ACTIVE,
        'completed_at' => null,
        'cancelled_at' => null,
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

it('cannot cancel an already cancelled enrollment', function () {
    $enrollment = Enrollment::factory()->cancelled()->create();

    expect(fn () =>
        app(CancelEnrollmentAction::class)
            ->execute($enrollment)
    )->toThrow(EnrollmentCannotBeCancelledException::class);
});
