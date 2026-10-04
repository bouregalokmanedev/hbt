<?php

use App\Domains\Achievements\Models\UserAchievement;
use App\Domains\Progression\Models\StudentProgressionProfile;
use App\Domains\Progression\Models\StudentXpTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Student', 'web');
});

it('returns avatar and last badges for the podium', function () {
    $leader = User::factory()->create(['first_name' => 'Sara', 'last_name' => 'Ali', 'avatar' => 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=']);
    $leader->assignRole('Student');
    StudentProgressionProfile::create(['user_id' => $leader->id, 'total_xp' => 500, 'level' => 3]);
    UserAchievement::create(['user_id' => $leader->id, 'badge' => 'member', 'earned_at' => now()->subDays(3)]);
    UserAchievement::create(['user_id' => $leader->id, 'badge' => 'learner', 'earned_at' => now()->subDays(2)]);
    UserAchievement::create(['user_id' => $leader->id, 'badge' => 'scholar', 'earned_at' => now()->subDay()]);

    $viewer = User::factory()->create(['email_verified_at' => now()]);

    $response = $this->actingAs($viewer)->getJson('/api/v1/leaderboard?limit=10')->assertOk();

    $entry = collect($response->json('data.top'))->firstWhere('user_id', $leader->id);

    expect($entry)->not->toBeNull();
    expect($entry['avatar'])->toBe($leader->avatar);
    expect($entry['badges'])->toHaveCount(3);
    expect($entry['badges'][0]['id'])->toBe('scholar');
});

it('sends peer bonus xp to another student', function () {
    $giver = User::factory()->create(['email_verified_at' => now()]);
    $target = User::factory()->create();

    $response = $this->actingAs($giver)
        ->postJson('/api/v1/leaderboard/bonus', ['target_user_id' => $target->id])
        ->assertOk()
        ->assertJsonPath('success', true);

    expect($response->json('xp'))->toBeGreaterThanOrEqual(5);
    expect(StudentXpTransaction::query()->where('user_id', $target->id)->where('event', 'peer_bonus')->exists())->toBeTrue();

    $profile = StudentProgressionProfile::where('user_id', $target->id)->firstOrFail();
    expect($profile->total_xp)->toBeGreaterThanOrEqual(5);
});

it('rejects a bonus to yourself', function () {
    $giver = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($giver)
        ->postJson('/api/v1/leaderboard/bonus', ['target_user_id' => $giver->id])
        ->assertStatus(422);
});

it('allows only one bonus per student per day', function () {
    $giver = User::factory()->create(['email_verified_at' => now()]);
    $target = User::factory()->create();

    $this->actingAs($giver)
        ->postJson('/api/v1/leaderboard/bonus', ['target_user_id' => $target->id])
        ->assertOk();

    $this->actingAs($giver)
        ->postJson('/api/v1/leaderboard/bonus', ['target_user_id' => $target->id])
        ->assertStatus(409);
});

it('rejects bonus xp from guests', function () {
    $target = User::factory()->create();

    $this->postJson('/api/v1/leaderboard/bonus', ['target_user_id' => $target->id])
        ->assertUnauthorized();
});
