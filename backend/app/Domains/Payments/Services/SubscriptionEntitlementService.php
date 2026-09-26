<?php

namespace App\Domains\Payments\Services;

use App\Domains\Payments\Enums\SubscriptionStatus;
use App\Domains\Payments\Models\Subscription;
use App\Domains\Payments\Models\SubscriptionFeature;
use App\Models\User;

class SubscriptionEntitlementService
{
    /**
     * Sessions per calendar month for learners without an active
     * subscription (the "free" tier). Paid plans are unlimited unless
     * their max_simulator_sessions_monthly feature overrides it.
     */
    public const FREE_SIMULATOR_SESSIONS_MONTHLY = 5;


    /**
     * Does the user hold an entitlement for the given feature key?
     *
     * Features are defined in subscription_features + subscription_plan_features.
     * If the user has no active subscription, only `free` defaults apply.
     */
    public function hasFeature(User $user, string $featureKey): bool
    {
        $subscription = $this->activeSubscription($user);
        if (! $subscription) {
            return false;
        }

        return \DB::table('subscription_plan_features')
            ->join('subscription_features', 'subscription_features.id', '=', 'subscription_plan_features.subscription_feature_id')
            ->where('subscription_plan_features.subscription_plan_id', $subscription->plan_id)
            ->where('subscription_features.key', $featureKey)
            ->where('subscription_plan_features.value', '!=', 'false')
            ->where('subscription_plan_features.value', '!=', '0')
            ->exists();
    }

    public function featureValue(User $user, string $featureKey): ?string
    {
        $subscription = $this->activeSubscription($user);
        if (! $subscription) {
            return null;
        }

        return \DB::table('subscription_plan_features')
            ->join('subscription_features', 'subscription_features.id', '=', 'subscription_plan_features.subscription_feature_id')
            ->where('subscription_plan_features.subscription_plan_id', $subscription->plan_id)
            ->where('subscription_features.key', $featureKey)
            ->value('subscription_plan_features.value');
    }

    private function activeSubscription(User $user): ?Subscription
    {
        return Subscription::where('user_id', $user->id)
            ->whereIn('status', [SubscriptionStatus::TRIAL->value, SubscriptionStatus::ACTIVE->value])
            ->latest()
            ->first();
    }

    /**
     * Simulator sessions the user may start this calendar month.
     *
     * null  = unlimited (paid plan, or a plan that does not cap them)
     * int   = hard monthly cap (free tier defaults to 5)
     */
    public function simulatorSessionMonthlyLimit(User $user): ?int
    {
        if (! $this->activeSubscription($user)) {
            return self::FREE_SIMULATOR_SESSIONS_MONTHLY;
        }

        $value = $this->featureValue($user, 'max_simulator_sessions_monthly');

        if ($value === null || trim($value) === '' || strtolower(trim($value)) === 'unlimited') {
            return null;
        }

        return max(0, (int) $value);
    }

    public function hasActiveSubscription(User $user): bool
    {
        return $this->activeSubscription($user) !== null;
    }
}
