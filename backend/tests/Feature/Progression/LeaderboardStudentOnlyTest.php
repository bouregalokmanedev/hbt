<?php

use App\Domains\Progression\Models\StudentProgressionProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['Admin', 'Instructor', 'Student', 'Support'] as $role) {
        Role::findOrCreate($role, 'web');
    }
});

/**
 * A user holding the given role plus a progression profile, so they show up
 * on the board if the role filter is ever dropped.
 */
function rankedUser(string $role, int $xp, string $name): User
{
    $user = User::factory()->create(['first_name' => $name, 'email_verified_at' => now()]);
    $user->assignRole($role);
    StudentProgressionProfile::create(['user_id' => $user->id, 'total_xp' => $xp, 'level' => 1]);

    return $user;
}

it('lists only students on the leaderboard', function () {
    $student = rankedUser('Student', 500, 'Sara');
    $instructor = rankedUser('Instructor', 900, 'Ines');
    $admin = rankedUser('Admin', 700, 'Adel');
    $support = rankedUser('Support', 600, 'Sami');
    $otherStudent = rankedUser('Student', 300, 'Belal');

    $response = $this->actingAs($student)
        ->getJson('/api/v1/leaderboard?limit=50')
        ->assertOk();

    $ids = collect($response->json('data.top'))->pluck('user_id');

    expect($ids->all())->toBe([$student->id, $otherStudent->id])
        ->and($ids->all())->not->toContain($instructor->id, $admin->id, $support->id);
});

it('keeps staff viewers off the board and does not create a profile for them', function () {
    $instructor = rankedUser('Instructor', 900, 'Ines');
    $admin = User::factory()->create(['first_name' => 'Adel', 'email_verified_at' => now()]);
    $admin->assignRole('Admin');

    $profilesBefore = StudentProgressionProfile::query()->count();

    $response = $this->actingAs($instructor)
        ->getJson('/api/v1/leaderboard?limit=50')
        ->assertOk();

    expect($response->json('data.me'))->toBeNull();
    expect(collect($response->json('data.top'))->pluck('user_id')->all())
        ->not->toContain($instructor->id, $admin->id);

    // Merely opening the leaderboard must not add a profile row.
    expect(StudentProgressionProfile::query()->count())->toBe($profilesBefore)
        ->and(StudentProgressionProfile::query()->where('user_id', $admin->id)->exists())->toBeFalse();
});

it('ranks a student against students only', function () {
    rankedUser('Admin', 900, 'Adel');
    rankedUser('Instructor', 700, 'Ines');
    rankedUser('Support', 650, 'Sami');
    rankedUser('Student', 500, 'Sara');
    $viewer = rankedUser('Student', 300, 'Belal');

    $response = $this->actingAs($viewer)
        ->getJson('/api/v1/leaderboard')
        ->assertOk();

    // Only Sara is ahead of Belal — the three staff rows must not push him down.
    expect($response->json('data.me.rank'))->toBe(2)
        ->and($response->json('data.me.user_id'))->toBe($viewer->id)
        ->and($response->json('data.me.total_xp'))->toBe(300);
});
