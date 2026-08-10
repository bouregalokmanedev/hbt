<?php

use App\Domains\Courses\Events\CourseCreated;
use App\Domains\Courses\Listeners\RecordCourseCreatedAudit;
use App\Models\AuditLog;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('records an audit log when a course is created', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $this->actingAs($user);

    $event = new CourseCreated($course);

    app(RecordCourseCreatedAudit::class)->handle($event);

    $audit = AuditLog::query()
        ->where('event', 'course.created')
        ->where('auditable_id', (string) $course->getKey())
        ->first();

    expect($audit)->not->toBeNull()
        ->and($audit->user_id)->toBe($user->id)
        ->and($audit->auditable_type)->toBe(Course::class)
        ->and($audit->new_values)->toBe($course->toArray());
});
it('records an audit log when a course is updated', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $this->actingAs($user);

    app(\App\Domains\Courses\Listeners\RecordCourseUpdatedAudit::class)
        ->handle(new \App\Domains\Courses\Events\CourseUpdated($course));

    expect(
        AuditLog::where('event', 'course.updated')
            ->where('auditable_id', $course->getKey())
            ->exists()
    )->toBeTrue();
});

it('records an audit log when a course is published', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $this->actingAs($user);

    app(\App\Domains\Courses\Listeners\RecordCoursePublishedAudit::class)
        ->handle(new \App\Domains\Courses\Events\CoursePublished($course));

    expect(
        AuditLog::where('event', 'course.published')
            ->where('auditable_id', $course->getKey())
            ->exists()
    )->toBeTrue();
});

it('records an audit log when a course is submitted for review', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $this->actingAs($user);

    app(\App\Domains\Courses\Listeners\RecordCourseSubmittedForReviewAudit::class)
        ->handle(new \App\Domains\Courses\Events\CourseSubmittedForReview($course));

    expect(
        AuditLog::where('event', 'course.submitted_for_review')
            ->where('auditable_id', $course->getKey())
            ->exists()
    )->toBeTrue();
});

it('records an audit log when a course is archived', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $this->actingAs($user);

    app(\App\Domains\Courses\Listeners\RecordCourseArchivedAudit::class)
        ->handle(new \App\Domains\Courses\Events\CourseArchived($course));

    expect(
        AuditLog::where('event', 'course.archived')
            ->where('auditable_id', $course->getKey())
            ->exists()
    )->toBeTrue();
});

it('records an audit log when a course is restored', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $this->actingAs($user);

    app(\App\Domains\Courses\Listeners\RecordCourseRestoredAudit::class)
        ->handle(new \App\Domains\Courses\Events\CourseRestored($course));

    expect(
        AuditLog::where('event', 'course.restored')
            ->where('auditable_id', $course->getKey())
            ->exists()
    )->toBeTrue();
});

it('records an audit log when a course is deleted', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $this->actingAs($user);

    app(\App\Domains\Courses\Listeners\RecordCourseDeletedAudit::class)
        ->handle(new \App\Domains\Courses\Events\CourseDeleted($course));

    expect(
        AuditLog::where('event', 'course.deleted')
            ->where('auditable_id', $course->getKey())
            ->exists()
    )->toBeTrue();
});