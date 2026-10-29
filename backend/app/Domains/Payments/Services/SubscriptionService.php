<?php

namespace App\Domains\Payments\Services;

use App\Domains\Payments\DTOs\ChangeSubscriptionPlanData;
use App\Domains\Payments\DTOs\CreateSubscriptionData;
use App\Domains\Payments\Enums\SubscriptionStatus;
use App\Domains\Payments\Exceptions\PaymentException;
use App\Domains\Payments\Exceptions\PaymentProviderUnavailableException;
use App\Domains\Payments\Models\Plan;
use App\Domains\Payments\Models\Subscription;
use App\Models\User;
use App\Support\Money;
use Illuminate\Support\Str;
use Throwable;

class SubscriptionService
{
    public function __construct(
        private PaymentGatewayRegistry $gateways,
    ) {}

    public function create(User $user, string $planId, string $provider): Subscription
    {
        $provider = strtolower(trim($provider));
        $plan = Plan::findOrFail($planId);
        $currency = Money::normalizeCurrency($plan->currency);

        // Resolve and validate before creating anything, so a disabled or
        // unsupported provider can never leave a fake pending subscription.
        $this->gateways->assertCanProcess($provider, $currency);
        $gateway = $this->gateways->subscriptionGateway($provider);

        $key = (string) Str::uuid();

        $subscription = Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'provider' => $provider,
            'status' => $plan->trial_days > 0 ? SubscriptionStatus::TRIAL->value : SubscriptionStatus::PENDING->value,
            'currency' => $currency,
            'amount' => $plan->price,
            'billing_interval' => $plan->interval,
            'trial_starts_at' => $plan->trial_days > 0 ? now() : null,
            'trial_ends_at' => $plan->trial_days > 0 ? now()->addDays($plan->trial_days) : null,
            'starts_at' => now(),
            'current_period_start' => now(),
            'current_period_ends_at' => $plan->interval === 'year' ? now()->addYear() : now()->addMonth(),
            'metadata' => ['idempotency_key' => $key],
        ]);

        $subscription->subscriptionItems()->create([
            'subscription_plan_id' => $plan->id,
            'quantity' => 1,
            'unit_amount' => $plan->price,
            'currency' => $currency,
        ]);

        try {
            $result = $gateway->createSubscription(new CreateSubscriptionData(
                userId: (string) $user->id,
                planId: $plan->id,
                provider: $provider,
                idempotencyKey: $key,
            ));
        } catch (Throwable $exception) {
            $subscription->update([
                'status' => SubscriptionStatus::CANCELLED->value,
                'cancelled_at' => now(),
                'ended_at' => now(),
                'metadata' => array_merge($subscription->metadata ?? [], [
                    'gateway_error' => $exception->getMessage(),
                ]),
            ]);

            throw $this->gatewayFailure('start', $exception);
        }

        $subscription->update([
            'provider_subscription_id' => $result->providerSubscriptionId,
            'provider_customer_id' => $result->providerCustomerId,
            'status' => match ($result->status) {
                'active' => SubscriptionStatus::ACTIVE->value,
                'trialing' => SubscriptionStatus::TRIAL->value,
                default => SubscriptionStatus::PENDING->value,
            },
            'metadata' => array_merge($subscription->metadata ?? [], $result->raw),
        ]);

        return $subscription->fresh();
    }

    public function cancel(Subscription $subscription, bool $atPeriodEnd = true): Subscription
    {
        $gateway = $this->gateways->subscriptionGateway((string) $subscription->provider);

        try {
            if ($subscription->provider_subscription_id) {
                if ($atPeriodEnd) {
                    $gateway->cancelAtPeriodEnd($subscription->provider_subscription_id);
                } else {
                    $gateway->cancel($subscription->provider_subscription_id);
                }
            }
        } catch (Throwable $exception) {
            throw $this->gatewayFailure('cancel', $exception);
        }

        if ($atPeriodEnd) {
            $subscription->update(['cancel_at_period_end' => true]);

            return $subscription->fresh();
        }

        $subscription->update([
            'status' => SubscriptionStatus::CANCELLED->value,
            'cancelled_at' => now(),
            'ended_at' => now(),
        ]);

        return $subscription->fresh();
    }

    public function changePlan(Subscription $subscription, string $newPlanId): Subscription
    {
        $plan = Plan::findOrFail($newPlanId);
        $currency = Money::normalizeCurrency($plan->currency);
        $provider = (string) $subscription->provider;

        $this->gateways->assertCanProcess($provider, $currency);
        $gateway = $this->gateways->subscriptionGateway($provider);

        try {
            $gateway->changePlan(new ChangeSubscriptionPlanData(
                providerSubscriptionId: $subscription->provider_subscription_id ?? $subscription->id,
                newPlanId: $newPlanId,
            ));
        } catch (Throwable $exception) {
            throw $this->gatewayFailure('change', $exception);
        }

        $subscription->update([
            'plan_id' => $plan->id,
            'amount' => $plan->price,
            'currency' => $currency,
        ]);

        $subscription->subscriptionItems()->delete();
        $subscription->subscriptionItems()->create([
            'subscription_plan_id' => $plan->id,
            'quantity' => 1,
            'unit_amount' => $plan->price,
            'currency' => $currency,
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
                'current_period_ends_at' => $subscription->billing_interval === 'year' ? now()->addYear() : now()->addMonth(),
            ]),
            'invoice.payment_failed', 'BILLING.SUBSCRIPTION.PAYMENT.FAILED' => $subscription->update(['status' => SubscriptionStatus::PAST_DUE->value]),
            'customer.subscription.deleted', 'BILLING.SUBSCRIPTION.CANCELLED' => $subscription->update([
                'status' => SubscriptionStatus::CANCELLED->value,
                'cancelled_at' => now(),
                'ended_at' => now(),
            ]),
            'customer.subscription.paused', 'BILLING.SUBSCRIPTION.SUSPENDED' => $subscription->update(['status' => SubscriptionStatus::PAUSED->value]),
            default => null,
        };

        if (in_array($eventType, ['invoice.paid', 'customer.subscription.updated', 'BILLING.SUBSCRIPTION.ACTIVATED'], true)) {
            event(new \App\Domains\Payments\Events\SubscriptionActivated($subscription->fresh()));
        }
        if ($eventType === 'invoice.payment_failed' || $eventType === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') {
            event(new \App\Domains\Payments\Events\SubscriptionPaymentFailed($subscription->fresh()));
        }
    }

    private function gatewayFailure(string $operation, Throwable $exception): PaymentException
    {
        if ($exception instanceof PaymentException) {
            return $exception;
        }

        return new PaymentProviderUnavailableException(
            "Unable to {$operation} the subscription with the payment provider.",
            0,
            $exception,
        );
    }
}
