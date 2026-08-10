<?php

use App\Models\AuditLog;
use App\Models\Course;
use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('persists an audit log with the authenticated user and model changes', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $this->actingAs($user);

    app(AuditService::class)->log(
        event: 'course.updated',
        model: $course,
        old: [
            'title' => 'Old title',
        ],
        new: [
            'title' => 'New title',
        ],
        metadata: [
            'source' => 'test',
        ],
    );

    $audit = AuditLog::query()->first();

    expect($audit)->not->toBeNull()
        ->and($audit->user_id)->toBe($user->id)
        ->and($audit->event)->toBe('course.updated')
        ->and($audit->auditable_type)->toBe(Course::class)
        ->and($audit->auditable_id)->toBe((string) $course->getKey())
        ->and($audit->old_values)->toBe([
            'title' => 'Old title',
        ])
        ->and($audit->new_values)->toBe([
            'title' => 'New title',
        ])
        ->and($audit->metadata)->toBe([
            'source' => 'test',
        ])
        ->and($audit->ip_address)->not->toBeNull()
        ->and($audit->user_agent)->not->toBeNull();
});