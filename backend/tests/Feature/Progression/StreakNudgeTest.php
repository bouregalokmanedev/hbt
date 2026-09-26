<?php

use App\Domains\Notifications\Models\StudentNotification;
use App\Domains\Progression\Models\StudentProgressionProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('nudges learners whose streak breaks at midnight', function () {
    $user = User::factory()->create(['status' => 'active']);
    StudentProgressionProfile::create([
        'user_id' => $user->id,
        'total_xp' => 120,
        'level' => 2,
        'current_streak' => 5,
        'last_activity_date' => now()->subDay(),
    ]);

    $this->artisan('notifications:streak-nudge')->assertSuccessful();

    $notification = StudentNotification::query()
        ->where('user_id', $user->id)
        ->where('type', 'streak_nudge')
        ->first();

    expect($notification)->not->toBeNull();
    expect($notification->dedupe_key)->toBe('streak-nudge:'.now()->subDay()->toDateString());
    expect($notification->message)->toContain('5');
});

it('sends the nudge only once per day', function () {
    $user = User::factory()->create(['status' => 'active']);
    StudentProgressionProfile::create([
        'user_id' => $user->id,
        'total_xp' => 120,
        'level' => 2,
        'current_streak' => 4,
        'last_activity_date' => now()->subDay(),
    ]);

    $this->artisan('notifications:streak-nudge')->assertSuccessful();
    $this->artisan('notifications:streak-nudge')->assertSuccessful();

    expect(
        StudentNotification::query()
            ->where('user_id', $user->id)
            ->where('type', 'streak_nudge')
            ->count()
    )->toBe(1);
});

it('skips broken streaks, short streaks and inactive learners', function () {
    $broken = User::factory()->create(['status' => 'active']);
    StudentProgressionProfile::create([
        'user_id' => $broken->id,
        'total_xp' => 40,
        'level' => 1,
        'current_streak' => 6,
        'last_activity_date' => now()->subDays(3),
    ]);

    $short = User::factory()->create(['status' => 'active']);
    StudentProgressionProfile::create([
        'user_id' => $short->id,
        'total_xp' => 10,
        'level' => 1,
        'current_streak' => 1,
        'last_activity_date' => now()->subDay(),
    ]);

    $inactive = User::factory()->create(['status' => 'suspended']);
    StudentProgressionProfile::create([
        'user_id' => $inactive->id,
        'total_xp' => 90,
        'level' => 2,
        'current_streak' => 9,
        'last_activity_date' => now()->subDay(),
    ]);

    $this->artisan('notifications:streak-nudge')->assertSuccessful();

    expect(StudentNotification::query()->where('type', 'streak_nudge')->count())->toBe(0);
});
