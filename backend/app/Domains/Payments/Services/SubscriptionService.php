<?php

namespace App\Domains\Payments\Services;

use App\Domains\Payments\Contracts\SubscriptionGatewayInterface;
use App\Domains\Payments\DTOs\ChangeSubscriptionPlanData;
use App\Domains\Payments\DTOs\CreateSubscriptionData;
use App\Domains\Payments\Enums\SubscriptionStatus;
use App\Domains\Payments\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Str;

class SubscriptionService
{
    public function create(User $user, string $planId, string $provider): Subscription
    {
        $gateway = $this->gateway($provider);
        $plan = \App\Domains\Payments\Models\Plan::findOrFail($planId);
        $key = (string) Str::uuid();

        $subscription = Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'provider' => $provider,
            'status' => $plan->trial_days > 0 ? SubscriptionStatus::TRIAL->value : SubscriptionStatus::PENDING->value,
            'currency' => $plan->currency,
            'amount' => $plan->price,
            'billing_interval' => $plan->interval,
            'trial_starts_at' => $plan->trial_days > 0 ? now() : null,
            'trial_ends_at' => $plan->trial_days > 0 ? now()->addDays($plan->trial_days) : null,
            'starts_at' => now(),
            'current_period_start' => now(),
            'current_period_end' => $plan->interval === 'year' ? now()->addYear() : now()->addMonth(),
            'metadata' => ['idempotency_key' => $key],
        ]);

        $subscription->subscriptionItems()->create([
            'subscription_plan_id' => $plan->id,
            'quantity' => 1,
            'unit_amount' => $plan->price,
            'currency' => $plan->currency,
        ]);

        try {
            $result = $gateway->createSubscription(new CreateSubscriptionData(
                userId: (string) $user->id,
                planId: $plan->id,
                provider: $provider,
                idempotencyKey: $key,
            ));
            $subscription->update([
                'provider_subscription_id' => $result->providerSubscriptionId,
                'status' => $result->status === 'active' ? SubscriptionStatus::ACTIVE->value : SubscriptionStatus::PENDING->value,
                'metadata' => array_merge($subscription->metadata ?? [], $result->raw),
            ]);
        } catch (\Throwable $e) {
            $subscription->update(['metadata' => array_merge($subscription->metadata ?? [], ['gateway_error' => $e->getMessage()])]);
        }

        return $subscription->fresh();
    }

    public function cancel(Subscription $subscription, bool $atPeriodEnd = true): Subscription
    {
        if ($atPeriodEnd) {
            $subscription->update(['cancel_at_period_end' => true]);
            return $subscription;
        }

        $gateway = $this->gateway($subscription->provider);
        try {
            $gateway->cancel($subscription->provider_subscription_id ?? $subscription->id);
        } catch (\Throwable $e) {
            \Log::warning('Subscription gateway cancel failed', ['id' => $subscription->id, 'error' => $e->getMessage()]);
        }

        $subscription->update([
            'status' => SubscriptionStatus::CANCELLED->value,
            'cancelled_at' => now(),
            'ended_at' => now(),
        ]);

        return $subscription;
    }

    public function changePlan(Subscription $subscription, string $newPlanId): Subscription
    {
        $gateway = $this->gateway($subscription->provider);
        $gateway->changePlan(new ChangeSubscriptionPlanData(
            providerSubscriptionId: $subscription->provider_subscription_id ?? $subscription->id,
            newPlanId: $newPlanId,
        ));

        $plan = \App\Domains\Payments\Models\Plan::findOrFail($newPlanId);
        $subscription->update([
            'plan_id' => $plan->id,
            'amount' => $plan->price,
            'currency' => $plan->currency,
        ]);

        $subscription->subscriptionItems()->delete();
        $subscription->subscriptionItems()->create([
            'subscription_plan_id' => $plan->id,
            'quantity' => 1,
            'unit_amount' => $plan->price,
            'currency' => $plan->currency,
        ]);

        return $subscription->fresh();
    }

    public function handleWebhook(string $provider, string $eventType, array $payload): void
    {
        // Resolve subscription by provider_subscription_id from payload
        $providerId = $payload['id'] ?? $payload['resource']['id'] ?? $payload['data']['object']['id'] ?? null;
        if (! $providerId) {
            return;
        }

        $subscription = Subscription::where('provider_subscription_id', $providerId)
            ->orWhere('provider_ref', $providerId)
            ->first();
        if (! $subscription) {
            return;
        }

        match ($eventType) {
            'customer.subscription.created', 'BILLING.SUBSCRIPTION.CREATED' => $subscription->update(['status' => SubscriptionStatus::PENDING->value]),
            'customer.subscription.updated', 'BILLING.SUBSCRIPTION.ACTIVATED', 'invoice.paid' => $subscription->update([
                'status' => SubscriptionStatus::ACTIVE->value,
                'current_period_start' => now(),
                'current_period_end' => $subscription->billing_interval === 'year' ? now()->addYear() : now()->addMonth(),
            ]),
            'invoice.payment_failed', 'BILLING.SUBSCRIPTION.PAYMENT.FAILED' => $subscription->update(['status' => SubscriptionStatus::PAST_DUE->value]),
            'customer.subscription.deleted', 'BILLING.SUBSCRIPTION.CANCELLED' => $subscription->update([
                'status' => SubscriptionStatus::CANCELLED->value,
                'cancelled_at' => now(),
                'ended_at' => now(),
            ]),
            'customer.subscription.paused', 'BILLING.SUBSCRIPTION.SUSPENDED' => $subscription->update(['status' => SubscriptionStatus::PAUSED->value ?? 'paused']),
            default => null,
        };

        if (in_array($eventType, ['invoice.paid', 'customer.subscription.updated', 'BILLING.SUBSCRIPTION.ACTIVATED'], true)) {
            event(new \App\Domains\Payments\Events\SubscriptionActivated($subscription->fresh()));
        }
        if ($eventType === 'invoice.payment_failed' || $eventType === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') {
            event(new \App\Domains\Payments\Events\SubscriptionPaymentFailed($subscription->fresh()));
        }
    }

    private function gateway(string $provider): SubscriptionGatewayInterface
    {
        return match ($provider) {
            'stripe' => app(\App\Domains\Payments\Gateways\Stripe\StripeSubscriptionGateway::class),
            'paypal' => app(\App\Domains\Payments\Gateways\PayPal\PayPalSubscriptionGateway::class),
            default => app(\App\Domains\Payments\Gateways\PayPal\PayPalSubscriptionGateway::class),
        };
    }
}
