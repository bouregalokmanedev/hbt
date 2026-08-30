<?php

use App\Domains\AI\Models\MentorAIUsage;
use App\Domains\AI\Services\MentorUsageLimitService;
use App\Domains\AI\Services\MentorUsageService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function usageLimitService(): MentorUsageLimitService
{
    return app(MentorUsageLimitService::class);
}

function createUsage(
    User $user,
    int $totalTokens = 100,
    ?Carbon\CarbonInterface $createdAt = null,
): MentorAIUsage {
    $usage = MentorAIUsage::factory()->create([
        'user_id' => $user->id,
        'input_tokens' => $totalTokens,
        'output_tokens' => 0,
        'total_tokens' => $totalTokens,
    ]);

    if ($createdAt !== null) {
        $usage->created_at = $createdAt;
        $usage->updated_at = $createdAt;
        $usage->save();
    }

    return $usage;
}
it('allows a user below the daily request limit', function () {
    config([
        'ai.limits.daily_requests' => 3,
    ]);

    $user = User::factory()->create();

    createUsage($user);
    createUsage($user);

    expect(
        usageLimitService()->remainingDailyRequests($user)
    )->toBe(1);

    expect(
        usageLimitService()->canMakeRequest($user)
    )->toBeTrue();
});
it('blocks a user at the daily request limit', function () {
    config([
        'ai.limits.daily_requests' => 2,
    ]);

    $user = User::factory()->create();

    createUsage($user);
    createUsage($user);

    expect(
        usageLimitService()->remainingDailyRequests($user)
    )->toBe(0);

    expect(
        usageLimitService()->canMakeRequest($user)
    )->toBeFalse();
});
it('blocks a user at the monthly request limit', function () {
    config([
        'ai.limits.monthly_requests' => 2,
    ]);

    $user = User::factory()->create();

    createUsage($user);
    createUsage($user);

    expect(
        usageLimitService()->remainingMonthlyRequests($user)
    )->toBe(0);

    expect(
        usageLimitService()->canMakeRequest($user)
    )->toBeFalse();
});
it('calculates remaining daily tokens', function () {
    config([
        'ai.limits.daily_tokens' => 1000,
    ]);

    $user = User::factory()->create();

    createUsage($user, 300);
    createUsage($user, 200);

    expect(
        usageLimitService()->remainingDailyTokens($user)
    )->toBe(500);
});
it('blocks when the daily token limit is reached', function () {
    config([
        'ai.limits.daily_tokens' => 500,
    ]);

    $user = User::factory()->create();

    createUsage($user, 300);
    createUsage($user, 200);

    expect(
        usageLimitService()->remainingDailyTokens($user)
    )->toBe(0);

    expect(
        usageLimitService()->canMakeRequest($user)
    )->toBeFalse();
});
it('calculates remaining monthly tokens', function () {
    config([
        'ai.limits.monthly_tokens' => 1000,
    ]);

    $user = User::factory()->create();

    createUsage($user, 250);
    createUsage($user, 150);

    expect(
        usageLimitService()->remainingMonthlyTokens($user)
    )->toBe(600);
});
it('ignores usage from another user', function () {
    config([
        'ai.limits.daily_requests' => 2,
    ]);

    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    createUsage($otherUser);
    createUsage($otherUser);

    expect(
        usageLimitService()->remainingDailyRequests($user)
    )->toBe(2);

    expect(
        usageLimitService()->canMakeRequest($user)
    )->toBeTrue();
});
it('ignores usage from previous days', function () {
    config([
        'ai.limits.daily_requests' => 2,
    ]);

    $user = User::factory()->create();

    createUsage(
        $user,
        100,
        now()->subDay()->setTime(12, 0)
    );

    expect(
        usageLimitService()->remainingDailyRequests($user)
    )->toBe(2);
});
it('ignores usage from previous months', function () {
    config([
        'ai.limits.monthly_requests' => 2,
    ]);

    $user = User::factory()->create();

    createUsage(
        $user,
        100,
        now()->subMonth()->setTime(12, 0)
    );

    expect(
        usageLimitService()->remainingMonthlyRequests($user)
    )->toBe(2);
});