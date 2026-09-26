<?php

namespace App\Domains\Payments\Actions;

use App\Domains\Payments\Enums\SubscriptionStatus;
use App\Domains\Payments\Enums\TransactionStatus;
use App\Domains\Payments\Enums\TransactionType;
use App\Domains\Payments\Models\Plan;
use App\Domains\Payments\Models\Subscription;
use App\Domains\Payments\Models\Transaction;
use App\Domains\Payments\Providers\ManualPaymentProvider;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class SubscribeToPlanAction
{
    public function execute(User $user, Plan $plan): Subscription
    {
        return DB::transaction(function () use ($user, $plan) {
            abort_unless($plan->active, 422, 'This plan is not available.');

            $existing = Subscription::query()
                ->where('user_id', $user->id)
                ->where('plan_id', $plan->id)
                ->whereIn('status', [
                    SubscriptionStatus::PENDING->value,
                    SubscriptionStatus::TRIAL->value,
                    SubscriptionStatus::ACTIVE->value,
                    SubscriptionStatus::PAST_DUE->value,
                ])
                ->first();

            abort_if($existing, 422, 'You already hold this subscription.');

            $transaction = Transaction::create([
                'user_id' => $user->id,
                'type' => TransactionType::SUBSCRIPTION->value,
                'status' => TransactionStatus::PENDING->value,
                'amount' => $plan->price,
                'currency' => $plan->currency,
                'provider' => 'manual',
            ]);

            $subscription = Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'provider' => 'manual',
                'status' => SubscriptionStatus::PENDING->value,
            ]);

            $transaction->update(['subscription_id' => $subscription->id]);

            app(ManualPaymentProvider::class)->initiate($transaction);

            return $subscription->fresh();
        });
    }
}
