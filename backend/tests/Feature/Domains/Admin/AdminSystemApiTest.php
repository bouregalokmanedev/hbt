<?php

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Admin', 'web');
    Role::findOrCreate('Student', 'web');
});

function systemAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    return $admin;
}

it('returns operational health without exposing secrets', function () {
    $admin = systemAdmin();

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/system/health')
        ->assertOk()
        ->assertJsonPath('data.checks.database.status', 'operational')
        ->assertJsonStructure([
            'data' => [
                'status',
                'application' => ['name', 'environment', 'laravel_version', 'php_version', 'timezone'],
                'checks' => ['database', 'cache', 'queue', 'storage', 'mail'],
                'checked_at',
            ],
        ])
        ->assertJsonMissingPath('data.database.password');
});

it('returns record statistics only for available platform tables', function () {
    $admin = systemAdmin();
    User::factory()->count(2)->create();

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/system/statistics')
        ->assertOk()
        ->assertJsonPath('data.records.users', 3)
        ->assertJsonStructure(['data' => ['records', 'generated_at']]);
});

it('summarizes audit logs by their recorded event', function () {
    $admin = systemAdmin();
    AuditLog::query()->create([
        'user_id' => $admin->id,
        'event' => 'course.published',
        'auditable_type' => User::class,
        'auditable_id' => 'record-id',
        'ip_address' => '127.0.0.1',
        'user_agent' => 'Pest',
    ]);

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/system/audit-log')
        ->assertOk()
        ->assertJsonPath('data.summary.total', 1)
        ->assertJsonPath('data.summary.today', 1)
        ->assertJsonPath('data.events.0.event', 'course.published')
        ->assertJsonPath('data.events.0.total', 1);
});

it('does not expose system administration to students', function () {
    $student = User::factory()->create();
    $student->assignRole('Student');

    $this->actingAs($student)
        ->getJson('/api/v1/admin/system/health')
        ->assertForbidden();
});
