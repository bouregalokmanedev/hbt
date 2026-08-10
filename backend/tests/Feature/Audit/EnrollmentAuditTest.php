<?php

use App\Domains\Enrollments\Events\EnrollmentCancelled;
use App\Domains\Enrollments\Events\EnrollmentCompleted;
use App\Domains\Enrollments\Events\EnrollmentCreated;
use App\Domains\Enrollments\Listeners\RecordEnrollmentCancelledAudit;
use App\Domains\Enrollments\Listeners\RecordEnrollmentCompletedAudit;
use App\Domains\Enrollments\Listeners\RecordEnrollmentCreatedAudit;
use App\Models\AuditLog;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('records an audit log when an enrollment is created', function () {
    $user = User::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
    ]);

    $this->actingAs($user);

    app(RecordEnrollmentCreatedAudit::class)
        ->handle(new EnrollmentCreated($enrollment));

    $audit = AuditLog::query()
        ->where('event', 'enrollment.created')
        ->where(
            'auditable_id',
            (string) $enrollment->getKey()
        )
        ->first();

    expect($audit)->not->toBeNull()
        ->and($audit->user_id)->toBe($user->id)
        ->and($audit->auditable_type)->toBe(Enrollment::class)
        ->and($audit->new_values)->toBe(
            $enrollment->toArray()
        );
});

it('records an audit log when an enrollment is completed', function () {
    $user = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
    ]);

    $this->actingAs($user);

    app(RecordEnrollmentCompletedAudit::class)
        ->handle(new EnrollmentCompleted($enrollment));

    expect(
        AuditLog::query()
            ->where('event', 'enrollment.completed')
            ->where(
                'auditable_id',
                $enrollment->getKey()
            )
            ->exists()
    )->toBeTrue();
});

it('records an audit log when an enrollment is cancelled', function () {
    $user = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
    ]);

    $this->actingAs($user);

    app(RecordEnrollmentCancelledAudit::class)
        ->handle(new EnrollmentCancelled($enrollment));

    expect(
        AuditLog::query()
            ->where('event', 'enrollment.cancelled')
            ->where(
                'auditable_id',
                $enrollment->getKey()
            )
            ->exists()
    )->toBeTrue();
});
