<?php

namespace App\Domains\AI\Services;

use App\Models\User;
use Carbon\CarbonInterface;

final class MentorUsageLimitService
{
    public function __construct(
        private readonly MentorUsageService $usageService,
    ) {
    }

    public function canMakeRequest(User $user): bool
    {
        return $this->remainingDailyRequests($user) > 0
            && $this->remainingMonthlyRequests($user) > 0
            && $this->remainingDailyTokens($user) > 0
            && $this->remainingMonthlyTokens($user) > 0;
    }

    public function remainingDailyRequests(User $user): int
    {
        $limit = $this->dailyRequestLimit();

        $used = $this->usageService->requestCount(
            $user,
            from: now()->startOfDay(),
            until: now()->endOfDay(),
        );

        return max(0, $limit - $used);
    }

    public function remainingMonthlyRequests(User $user): int
    {
        $limit = $this->monthlyRequestLimit();

        $used = $this->usageService->requestCount(
            $user,
            from: now()->startOfMonth(),
            until: now()->endOfMonth(),
        );

        return max(0, $limit - $used);
    }

    public function remainingDailyTokens(User $user): int
    {
        $limit = $this->dailyTokenLimit();

        $used = $this->usageService->totalTokens(
            $user,
            from: now()->startOfDay(),
            until: now()->endOfDay(),
        );

        return max(0, $limit - $used);
    }

    public function remainingMonthlyTokens(User $user): int
    {
        $limit = $this->monthlyTokenLimit();

        $used = $this->usageService->totalTokens(
            $user,
            from: now()->startOfMonth(),
            until: now()->endOfMonth(),
        );

        return max(0, $limit - $used);
    }

    public function dailyRequestLimit(): int
    {
        return max(
            0,
            (int) config('ai.limits.daily_requests', 100)
        );
    }

    public function monthlyRequestLimit(): int
    {
        return max(
            0,
            (int) config('ai.limits.monthly_requests', 2000)
        );
    }

    public function dailyTokenLimit(): int
    {
        return max(
            0,
            (int) config('ai.limits.daily_tokens', 100_000)
        );
    }

    public function monthlyTokenLimit(): int
    {
        return max(
            0,
            (int) config('ai.limits.monthly_tokens', 1_000_000)
        );
    }
}