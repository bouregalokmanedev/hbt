<?php

use App\Domains\Challenges\Models\DailyChallengeAssignment;
use App\Domains\Challenges\Models\DailyChallengeDef;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['Admin', 'Instructor', 'Student', 'Support'] as $role) {
        Role::findOrCreate($role, 'web');
    }
});

function raceUser(string $role, string $name): User
{
    $user = User::factory()->create(['first_name' => $name, 'email_verified_at' => now()]);
    if ($role !== '') {
        $user->assignRole($role);
    }

    return $user;
}

function raceDef(int $index = 1): DailyChallengeDef
{
    return DailyChallengeDef::create([
        'key' => "lesson_complete_{$index}",
        'title' => "Finish a lesson {$index}",
        'action' => 'lesson_complete',
        'xp' => 10,
    ]);
}

function raceFinish(User $user, DailyChallengeDef $def, $completedAt): void
{
    DailyChallengeAssignment::create([
        'user_id' => $user->id,
        'daily_challenge_def_id' => $def->id,
        'date' => today(),
        'status' => 'completed',
        'completed_at' => $completedAt,
        'xp_awarded' => 10,
    ]);
}

it('races students only', function () {
    $student = raceUser('Student', 'Sara');
    $other = raceUser('Student', 'Belal');
    $instructor = raceUser('Instructor', 'Ines');
    $admin = raceUser('Admin', 'Adel');
    $roleless = raceUser('', 'Nadia');

    $def = raceDef();
    // Everyone finished the same challenge; the earliest finish wins the tie.
    raceFinish($instructor, $def, now()->subMinutes(5));
    raceFinish($admin, $def, now()->subMinutes(4));
    raceFinish($roleless, $def, now()->subMinutes(3));
    raceFinish($student, $def, now()->subMinutes(2));
    raceFinish($other, $def, now()->subMinute());

    $data = $this->actingAs($student)
        ->getJson('/api/v1/challenges/leaderboard?limit=50')
        ->assertOk()
        ->json('data');

    $ids = collect($data['top'])->pluck('user_id')->map(fn ($id) => (string) $id)->all();

    expect($ids)->toBe([(string) $student->id, (string) $other->id])
        ->and($ids)->not->toContain((string) $instructor->id, (string) $admin->id, (string) $roleless->id)
        ->and($data['me']['user_id'])->toBe((string) $student->id);
});

it('gives staff viewers no rank row', function () {
    $instructor = raceUser('Instructor', 'Ines');
    $student = raceUser('Student', 'Sara');

    $def = raceDef();
    raceFinish($instructor, $def, now()->subMinutes(5));
    raceFinish($student, $def, now()->subMinutes(4));

    $data = $this->actingAs($instructor)
        ->getJson('/api/v1/challenges/leaderboard')
        ->assertOk()
        ->json('data');

    expect($data['me'])->toBeNull()
        ->and(collect($data['top'])->pluck('user_id')->map(fn ($id) => (string) $id)->all())
        ->toBe([(string) $student->id]);
});
