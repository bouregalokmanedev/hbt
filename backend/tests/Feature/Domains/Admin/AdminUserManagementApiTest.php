<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['Admin', 'Super Admin', 'Instructor', 'Student'] as $role) {
        Role::findOrCreate($role, 'web');
    }
});

function adminUser(): User
{
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    return $admin;
}

it('lists users with safe filters, sorting, and pagination', function () {
    $admin = adminUser();
    $student = User::factory()->create(['first_name' => 'Amina', 'status' => 'active']);
    $student->assignRole('Student');
    $instructor = User::factory()->unverified()->create(['first_name' => 'Milo', 'status' => 'suspended']);
    $instructor->assignRole('Instructor');

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/users?role=Student&status=active&search=amina&email_verified=true&per_page=1')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $student->uuid)
        ->assertJsonPath('meta.per_page', 1)
        ->assertJsonMissing(['id' => $instructor->uuid]);
});

it('creates, suspends, activates, and deletes a user', function () {
    $admin = adminUser();

    $created = $this->actingAs($admin)->postJson('/api/v1/admin/users', [
        'first_name' => 'New',
        'last_name' => 'Student',
        'username' => 'new-student',
        'email' => 'new.student@example.test',
        'password' => 'A-secure1!',
        'password_confirmation' => 'A-secure1!',
    ])->assertCreated()->json('data');

    $this->assertDatabaseHas('users', ['uuid' => $created['id'], 'status' => 'active']);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$created['id']}/suspend")
        ->assertOk()
        ->assertJsonPath('data.status', 'suspended');

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$created['id']}/activate")
        ->assertOk()
        ->assertJsonPath('data.status', 'active');

    $this->actingAs($admin)
        ->deleteJson("/api/v1/admin/users/{$created['id']}")
        ->assertOk();

    $this->assertSoftDeleted('users', ['uuid' => $created['id']]);
});

it('prevents an administrator from changing a privileged account', function () {
    $admin = adminUser();
    $otherAdmin = User::factory()->create();
    $otherAdmin->assignRole('Admin');

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$otherAdmin->uuid}/suspend")
        ->assertForbidden();

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$otherAdmin->uuid}/role", ['role' => 'Instructor'])
        ->assertForbidden();
});

it('allows only a super administrator to assign a privileged role', function () {
    $admin = adminUser();
    $student = User::factory()->create();
    $student->assignRole('Student');

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$student->uuid}/role", ['role' => 'Admin'])
        ->assertForbidden();

    $superAdmin = User::factory()->create();
    $superAdmin->assignRole('Super Admin');

    $this->actingAs($superAdmin)
        ->patchJson("/api/v1/admin/users/{$student->uuid}/role", ['role' => 'Instructor'])
        ->assertOk()
        ->assertJsonPath('data.roles.0', 'Instructor');
});

it('lets an administrator verify and unverify a user', function () {
    $admin = adminUser();
    $student = User::factory()->unverified()->create(['status' => 'pending']);
    $student->assignRole('Student');

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$student->uuid}/verify")
        ->assertOk()
        ->assertJsonPath('data.status', 'active')
        ->assertJsonPath('data.email_verified_at', fn ($value) => $value !== null);

    expect($student->fresh()->hasVerifiedEmail())->toBeTrue();
    expect($student->fresh()->status)->toBe('active');

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$student->uuid}/unverify")
        ->assertOk()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.email_verified_at', null);

    expect($student->fresh()->hasVerifiedEmail())->toBeFalse();
});

it('lets an administrator move any user to any status', function () {
    $admin = adminUser();
    $student = User::factory()->create(['status' => 'active']);
    $student->assignRole('Student');
    $student->createToken('mobile-device');

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$student->uuid}/status", ['status' => 'inactive'])
        ->assertOk()
        ->assertJsonPath('data.status', 'inactive');

    expect($student->fresh()->status)->toBe('inactive');
    expect($student->tokens()->count())->toBe(0);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$student->uuid}/status", ['status' => 'pending'])
        ->assertOk()
        ->assertJsonPath('data.status', 'pending');

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$student->uuid}/status", ['status' => 'active'])
        ->assertOk()
        ->assertJsonPath('data.status', 'active');
});

it('rejects a status outside the user status enum', function () {
    $admin = adminUser();
    $student = User::factory()->create();
    $student->assignRole('Student');

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$student->uuid}/status", ['status' => 'banned'])
        ->assertUnprocessable();

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$student->uuid}/status", [])
        ->assertUnprocessable();

    expect($student->fresh()->status)->not->toBe('banned');
});

it('prevents an administrator from verifying or restatusing a privileged account', function () {
    $admin = adminUser();
    $otherAdmin = User::factory()->unverified()->create();
    $otherAdmin->assignRole('Admin');

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$otherAdmin->uuid}/verify")
        ->assertForbidden();

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$otherAdmin->uuid}/unverify")
        ->assertForbidden();

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$otherAdmin->uuid}/status", ['status' => 'inactive'])
        ->assertForbidden();
});

it('prevents an administrator from changing their own status or verification', function () {
    $admin = adminUser();

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$admin->uuid}/status", ['status' => 'suspended'])
        ->assertForbidden();

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/users/{$admin->uuid}/unverify")
        ->assertForbidden();

    expect($admin->fresh()->status)->not->toBe('suspended');
});
