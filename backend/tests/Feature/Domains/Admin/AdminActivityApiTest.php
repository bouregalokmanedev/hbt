<?php

use App\Models\AuditLog;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['Admin', 'Instructor', 'Student'] as $role) {
        Role::findOrCreate($role, 'web');
    }
});

function activityAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    return $admin;
}

function recordActivity(User $actor, string $event, string $type, string $targetId): AuditLog
{
    return AuditLog::query()->create([
        'user_id' => $actor->id,
        'event' => $event,
        'auditable_type' => $type,
        'auditable_id' => $targetId,
        'old_values' => ['status' => 'review'],
        'new_values' => ['status' => 'published'],
        'metadata' => ['reason' => 'Approved after review'],
        'ip_address' => '127.0.0.1',
        'user_agent' => 'Pest',
    ]);
}

it('lists filterable audit activities with actor and target context', function () {
    $admin = activityAdmin();
    $instructor = User::factory()->create(['first_name' => 'Farah']);
    $instructor->assignRole('Instructor');
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);
    $wanted = recordActivity($admin, 'course.published', Course::class, $course->id);
    recordActivity($instructor, 'enrollment.created', Enrollment::class, 'other-enrollment');

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/activity?event=course.published&target_type=course&per_page=1')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $wanted->id)
        ->assertJsonPath('data.0.actor.id', $admin->uuid)
        ->assertJsonPath('data.0.target.type', 'Course')
        ->assertJsonPath('data.0.changes.new.status', 'published')
        ->assertJsonPath('data.0.metadata.reason', 'Approved after review');
});

it('returns a single audit activity record', function () {
    $admin = activityAdmin();
    $activity = recordActivity($admin, 'user.role_updated', User::class, 'user-id');

    $this->actingAs($admin)
        ->getJson("/api/v1/admin/activity/{$activity->id}")
        ->assertOk()
        ->assertJsonPath('data.event', 'user.role_updated')
        ->assertJsonPath('data.target.type', 'User');
});

it('does not expose audit logs to students', function () {
    $student = User::factory()->create();
    $student->assignRole('Student');

    $this->actingAs($student)
        ->getJson('/api/v1/admin/activity')
        ->assertForbidden();
});
