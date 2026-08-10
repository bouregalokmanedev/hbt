<?php

use App\Domains\Enrollments\Actions\CancelEnrollmentAction;
use App\Domains\Enrollments\Actions\CompleteEnrollmentAction;
use App\Domains\Enrollments\Actions\CreateEnrollmentAction;
use App\Domains\Enrollments\Events\EnrollmentCancelled;
use App\Domains\Enrollments\Events\EnrollmentCompleted;
use App\Domains\Enrollments\Events\EnrollmentCreated;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\EnrollmentStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

it('dispatches EnrollmentCreated', function () {
    Event::fake([
        EnrollmentCreated::class,
    ]);

    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    $enrollment = app(CreateEnrollmentAction::class)
        ->execute($user->id, $course);

    Event::assertDispatched(
        EnrollmentCreated::class,
        fn (EnrollmentCreated $event) =>
            $event->enrollment->id === $enrollment->id
    );
});

it('dispatches EnrollmentCompleted', function () {
    Event::fake([
        EnrollmentCompleted::class,
    ]);

    $enrollment = Enrollment::factory()->create([
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    app(CompleteEnrollmentAction::class)
        ->execute($enrollment);

    Event::assertDispatched(
        EnrollmentCompleted::class,
        fn (EnrollmentCompleted $event) =>
            $event->enrollment->id === $enrollment->id
    );
});

it('dispatches EnrollmentCancelled', function () {
    Event::fake([
        EnrollmentCancelled::class,
    ]);

    $enrollment = Enrollment::factory()->create([
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    app(CancelEnrollmentAction::class)
        ->execute($enrollment);

    Event::assertDispatched(
        EnrollmentCancelled::class,
        fn (EnrollmentCancelled $event) =>
            $event->enrollment->id === $enrollment->id
    );
});
