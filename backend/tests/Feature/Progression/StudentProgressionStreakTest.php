<?php

use App\Domains\Progression\Models\StudentProgressionProfile;
use App\Domains\Progression\Models\StudentXpTransaction;
use App\Domains\Progression\Services\StudentProgressionService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(RefreshDatabase::class);

describe('StudentProgressionService streak', function () {
    it('starts a streak at 1 on first activity', function () {
        $user = User::factory()->create();
        $service = app(StudentProgressionService::class);

        $service->award($user, 'lesson_completed', 10, 10, 'lesson:1');

        $profile = StudentProgressionProfile::where('user_id', $user->id)->firstOrFail();
        expect($profile->current_streak)->toBe(1);
        expect($profile->last_activity_date?->toDateString())->toBe(now()->toDateString());
        expect($service->effectiveStreak($profile))->toBe(1);
    });

    it('does not increment twice on the same calendar day', function () {
        $user = User::factory()->create();
        $service = app(StudentProgressionService::class);

        $service->award($user, 'lesson_completed', 10, 10, 'lesson:1');
        $service->award($user, 'lesson_completed', 10, 10, 'lesson:2');

        $profile = StudentProgressionProfile::where('user_id', $user->id)->firstOrFail();
        expect($profile->current_streak)->toBe(1);
    });

    it('ignores a duplicate dedupe key entirely', function () {
        $user = User::factory()->create();
        $service = app(StudentProgressionService::class);

        $first = $service->award($user, 'lesson_completed', 10, 10, 'lesson:1');
        $second = $service->award($user, 'lesson_completed', 10, 10, 'lesson:1');

        expect($first)->not->toBeNull();
        expect($second)->toBeNull();
        expect(StudentXpTransaction::where('user_id', $user->id)->count())->toBe(1);
    });

    it('increments when last activity was exactly yesterday', function () {
        $user = User::factory()->create();
        $service = app(StudentProgressionService::class);
        $profile = StudentProgressionProfile::firstOrCreate(['user_id' => $user->id]);
        $profile->forceFill([
            'current_streak' => 3,
            'last_activity_date' => now()->subDay()->toDateString(),
        ])->save();

        $service->award($user, 'lesson_completed', 10, 10, 'lesson:2');
        $profile->refresh();

        expect($profile->current_streak)->toBe(4);
        expect($service->effectiveStreak($profile))->toBe(4);
    });

    it('resets to 1 after a gap of 2 or more days', function () {
        $user = User::factory()->create();
        $service = app(StudentProgressionService::class);
        $profile = StudentProgressionProfile::firstOrCreate(['user_id' => $user->id]);
        $profile->forceFill([
            'current_streak' => 9,
            'longest_streak' => 9,
            'last_activity_date' => now()->subDays(5)->toDateString(),
        ])->save();

        $service->award($user, 'simulator_completed', 10, 10, 'simulator-session:1');
        $profile->refresh();

        expect($profile->current_streak)->toBe(1);
        expect($profile->longest_streak)->toBeGreaterThanOrEqual(9);
    });

    it('reports 0 from effectiveStreak when the streak is broken', function () {
        $user = User::factory()->create();
        $profile = StudentProgressionProfile::firstOrCreate(['user_id' => $user->id]);
        $profile->forceFill([
            'current_streak' => 12,
            'last_activity_date' => now()->subDays(3)->toDateString(),
        ])->save();
        $profile->refresh();

        $service = app(StudentProgressionService::class);
        expect($service->effectiveStreak($profile))->toBe(0);

        $profile->forceFill(['last_activity_date' => now()->subDay()->toDateString()])->save();
        $profile->refresh();
        expect($service->effectiveStreak($profile))->toBe(12);

        $profile->forceFill(['last_activity_date' => now()->toDateString()])->save();
        $profile->refresh();
        expect($service->effectiveStreak($profile))->toBe(12);

        $profile->forceFill(['last_activity_date' => null, 'current_streak' => 0])->save();
        $profile->refresh();
        expect($service->effectiveStreak($profile))->toBe(0);
    });

    it('awards a streak bonus once per day at streak >= 3', function () {
        $user = User::factory()->create();
        $service = app(StudentProgressionService::class);
        $profile = StudentProgressionProfile::firstOrCreate(['user_id' => $user->id]);
        $profile->forceFill([
            'current_streak' => 2,
            'last_activity_date' => now()->subDay()->toDateString(),
        ])->save();

        $service->award($user, 'diagnostic_completed', 15, 30, 'diagnostic-attempt:1');
        $profile->refresh();

        expect($profile->current_streak)->toBe(3);
        expect(
            StudentXpTransaction::where('user_id', $user->id)->where('event', 'streak_bonus')->count()
        )->toBe(1);

        $service->award($user, 'simulator_completed', 10, 18, 'simulator-session:1');
        expect(
            StudentXpTransaction::where('user_id', $user->id)->where('event', 'streak_bonus')->count()
        )->toBe(1);
    });

    it('counts diagnostic and simulator completions as learning days', function () {
        $user = User::factory()->create();
        $service = app(StudentProgressionService::class);

        $service->award($user, 'diagnostic_completed', 15, 30, 'diagnostic-attempt:1');
        $summary = $service->summaryFor($user);

        expect($summary['current_streak'])->toBe(1);
        $todayActive = collect($summary['learning_days'])->firstWhere('date', now()->toDateString());
        expect($todayActive['active'])->toBeTrue();
        expect($summary['learning_days'])->toHaveCount(7);

        // Derived events alone never fabricate a learning day.
        StudentXpTransaction::create([
            'user_id' => $user->id,
            'event' => 'streak_bonus',
            'xp' => 5,
            'dedupe_key' => 'streak-day-only',
            'metadata' => [],
        ]);
        expect($service->summaryFor($user)['learning_days'])->toHaveCount(7);
    });

    it('summaryFor returns 7 learning day slots and 0 streak for a new user', function () {
        $user = User::factory()->create();
        $summary = app(StudentProgressionService::class)->summaryFor($user);

        expect($summary['learning_days'])->toHaveCount(7);
        expect($summary['current_streak'])->toBe(0);
        expect($summary['longest_streak'])->toBe(0);
    });
});
