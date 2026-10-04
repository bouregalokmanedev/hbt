<?php

use App\Domains\Notifications\Models\StudentNotification;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['Admin', 'Super Admin', 'Instructor', 'Support', 'Student'] as $role) {
        Role::findOrCreate($role, 'web');
    }
});

function notificationAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    return $admin;
}

it('delivers a targeted student announcement and records its delivery history', function () {
    $admin = notificationAdmin();
    $student = User::factory()->create();
    $student->assignRole('Student');
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');

    $broadcast = $this->actingAs($admin)
        ->postJson('/api/v1/admin/notifications/broadcast', [
            'audience' => 'students',
            'title' => 'Platform maintenance',
            'message' => 'Learning services will be updated tonight.',
            'action_url' => '/dashboard',
        ])
        ->assertOk()
        ->assertJsonPath('data.audience', 'students')
        ->assertJsonPath('data.delivery.recipients', 1)
        ->assertJsonPath('data.delivery.delivered', 1)
        ->json('data');

    $this->assertDatabaseHas('student_notifications', [
        'user_id' => $student->id,
        'admin_broadcast_id' => $broadcast['id'],
        'title' => 'Platform maintenance',
    ]);
    $this->assertDatabaseMissing('student_notifications', [
        'user_id' => $instructor->id,
        'admin_broadcast_id' => $broadcast['id'],
    ]);

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/notifications/broadcasts')
        ->assertOk()
        ->assertJsonPath('data.0.id', $broadcast['id'])
        ->assertJsonPath('data.0.delivery.delivered', 1);

    StudentNotification::query()->where('admin_broadcast_id', $broadcast['id'])->update(['read_at' => now()]);

    $this->actingAs($admin)
        ->getJson("/api/v1/admin/notifications/broadcasts/{$broadcast['id']}")
        ->assertOk()
        ->assertJsonPath('data.delivery.read', 1);
});

it('delivers to selected active users only', function () {
    $admin = notificationAdmin();
    $selected = User::factory()->create();
    $selected->assignRole('Student');
    $other = User::factory()->create();
    $other->assignRole('Student');
    $suspended = User::factory()->create(['status' => 'suspended']);
    $suspended->assignRole('Student');

    $response = $this->actingAs($admin)
        ->postJson('/api/v1/admin/notifications/broadcast', [
            'audience' => 'selected',
            'recipient_ids' => [$selected->uuid, $suspended->uuid],
            'title' => 'Your course update',
            'message' => 'A course update is ready for you.',
        ])
        ->assertOk()
        ->assertJsonPath('data.delivery.recipients', 1)
        ->assertJsonPath('data.delivery.delivered', 1);

    $broadcastId = $response->json('data.id');
    $this->assertDatabaseHas('student_notifications', ['user_id' => $selected->id, 'admin_broadcast_id' => $broadcastId]);
    $this->assertDatabaseMissing('student_notifications', ['user_id' => $other->id, 'admin_broadcast_id' => $broadcastId]);
    $this->assertDatabaseMissing('student_notifications', ['user_id' => $suspended->id, 'admin_broadcast_id' => $broadcastId]);
});

it('notifies the instructor when an administrator rejects a course', function () {
    $admin = notificationAdmin();
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => \App\Enums\Courses\CourseStatus::REVIEW,
        'title' => 'Diagnostics Foundation',
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/courses/{$course->id}/reject", [
            'reason' => 'Please publish at least one lesson.',
        ])
        ->assertOk();

    $this->assertDatabaseHas('student_notifications', [
        'user_id' => $instructor->id,
        'type' => 'course_moderation',
        'title' => 'Your course needs updates',
    ]);
});

it('does not allow students to broadcast notifications', function () {
    $student = User::factory()->create();
    $student->assignRole('Student');

    $this->actingAs($student)
        ->postJson('/api/v1/admin/notifications/broadcast', [
            'audience' => 'all',
            'title' => 'Attempt',
            'message' => 'Attempt',
        ])
        ->assertForbidden();
});

it('delivers a staff announcement to every staff role and skips students', function () {
    $admin = notificationAdmin();
    $superAdmin = User::factory()->create();
    $superAdmin->assignRole('Super Admin');
    $support = User::factory()->create();
    $support->assignRole('Support');
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $student = User::factory()->create();
    $student->assignRole('Student');

    $broadcast = $this->actingAs($admin)
        ->postJson('/api/v1/admin/notifications/broadcast', [
            'audience' => 'staff',
            'title' => 'Weekly staff sync',
            'message' => 'Weekly staff sync at 18:00 CET.',
        ])
        ->assertOk()
        ->assertJsonPath('data.audience', 'staff')
        ->assertJsonPath('data.delivery.recipients', 4)
        ->assertJsonPath('data.delivery.delivered', 4)
        ->assertJsonPath('data.delivery.failed', 0)
        ->json('data');

    foreach ([$admin, $superAdmin, $support, $instructor] as $user) {
        $this->assertDatabaseHas('student_notifications', [
            'user_id' => $user->id,
            'admin_broadcast_id' => $broadcast['id'],
        ]);
    }

    $this->assertDatabaseMissing('student_notifications', [
        'user_id' => $student->id,
        'admin_broadcast_id' => $broadcast['id'],
    ]);
});

it('rejects an unknown audience value', function () {
    $admin = notificationAdmin();

    $this->actingAs($admin)
        ->postJson('/api/v1/admin/notifications/broadcast', [
            'audience' => 'everyone',
            'title' => 'Nope',
            'message' => 'Nope',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['audience']);
});
