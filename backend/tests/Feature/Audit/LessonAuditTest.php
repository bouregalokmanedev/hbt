<?php

use App\Domains\Lessons\Events\LessonCreated;
use App\Domains\Lessons\Events\LessonDeleted;
use App\Domains\Lessons\Events\LessonPublished;
use App\Domains\Lessons\Events\LessonUnpublished;
use App\Domains\Lessons\Events\LessonUpdated;
use App\Domains\Lessons\Listeners\RecordLessonCreatedAudit;
use App\Domains\Lessons\Listeners\RecordLessonDeletedAudit;
use App\Domains\Lessons\Listeners\RecordLessonPublishedAudit;
use App\Domains\Lessons\Listeners\RecordLessonUnpublishedAudit;
use App\Domains\Lessons\Listeners\RecordLessonUpdatedAudit;
use App\Models\AuditLog;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('records an audit log when a lesson is created', function () {
    $user = User::factory()->create();

    $lesson = Lesson::factory()->create();

    $this->actingAs($user);

    $event = new LessonCreated($lesson);

    app(RecordLessonCreatedAudit::class)->handle($event);

    $audit = AuditLog::query()
        ->where('event', 'lesson.created')
        ->where('auditable_id', (string) $lesson->getKey())
        ->first();

    expect($audit)->not->toBeNull()
        ->and($audit->user_id)->toBe($user->id)
        ->and($audit->auditable_type)->toBe(Lesson::class)
        ->and($audit->new_values)->toBe($lesson->toArray());
});
it('records an audit log when a lesson is updated', function () {
    $user = User::factory()->create();
    $lesson = Lesson::factory()->create();

    $this->actingAs($user);

    app(RecordLessonUpdatedAudit::class)
        ->handle(new LessonUpdated($lesson));

    expect(
        AuditLog::where('event', 'lesson.updated')
            ->where('auditable_id', $lesson->getKey())
            ->exists()
    )->toBeTrue();
});

it('records an audit log when a lesson is published', function () {
    $user = User::factory()->create();
    $lesson = Lesson::factory()->create();

    $this->actingAs($user);

    app(RecordLessonPublishedAudit::class)
        ->handle(new LessonPublished($lesson));

    expect(
        AuditLog::where('event', 'lesson.published')
            ->where('auditable_id', $lesson->getKey())
            ->exists()
    )->toBeTrue();
});

it('records an audit log when a lesson is unpublished', function () {
    $user = User::factory()->create();
    $lesson = Lesson::factory()->create();

    $this->actingAs($user);

    app(RecordLessonUnpublishedAudit::class)
        ->handle(new LessonUnpublished($lesson));

    expect(
        AuditLog::where('event', 'lesson.unpublished')
            ->where('auditable_id', $lesson->getKey())
            ->exists()
    )->toBeTrue();
});

it('records an audit log when a lesson is deleted', function () {
    $user = User::factory()->create();
    $lesson = Lesson::factory()->create();

    $this->actingAs($user);

    app(RecordLessonDeletedAudit::class)
        ->handle(new LessonDeleted($lesson));

    expect(
        AuditLog::where('event', 'lesson.deleted')
            ->where('auditable_id', $lesson->getKey())
            ->exists()
    )->toBeTrue();
});
