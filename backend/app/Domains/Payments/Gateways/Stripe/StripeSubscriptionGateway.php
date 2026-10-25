<?php

namespace App\Domains\Payments\Gateways\Stripe;

use App\Domains\Payments\Contracts\SubscriptionGatewayInterface;
use App\Domains\Payments\Contracts\SubscriptionResult;
use App\Domains\Payments\DTOs\ChangeSubscriptionPlanData;
use App\Domains\Payments\DTOs\CreateSubscriptionData;
use App\Domains\Payments\Models\PaymentProviderPlan;
use App\Domains\Payments\Models\Plan;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;

class StripeSubscriptionGateway implements SubscriptionGatewayInterface
{
    public function provider(): string
    {
        return 'stripe';
    }

    public function createSubscription(CreateSubscriptionData $data): SubscriptionResult
    {
        if (! config('services.stripe.secret')) {
            Log::warning('Stripe secret missing — returning stub subscription.');

            return new SubscriptionResult(
                providerSubscriptionId: 'sub_stub_'.substr($data->idempotencyKey, 0, 8),
                status: 'incomplete',
                raw: ['stub' => true],
            );
        }

        $priceId = $this->priceIdFor($data->planId);
        if ($priceId === null) {
            throw new \RuntimeException(
                'No Stripe price is configured for this plan. Add the provider price mapping first.'
            );
        }

        $stripe = new StripeClient(config('services.stripe.secret'));
        $user = User::query()->find($data->userId);

        $customer = $stripe->customers->create([
            'email' => $user?->email,
            'name' => $user?->full_name,
            'metadata' => ['user_id' => $data->userId],
        ], [
            'idempotency_key' => 'customer-'.$data->idempotencyKey,
        ]);

        $subscription = $stripe->subscriptions->create([
            'customer' => $customer->id,
            'items' => [['price' => $priceId]],
            'payment_behavior' => 'default_incomplete',
            'expand' => ['latest_invoice.payment_intent'],
            'metadata' => [
                'idempotency_key' => $data->idempotencyKey,
                'plan_id' => $data->planId,
            ],
        ], [
            'idempotency_key' => $data->idempotencyKey,
        ]);

        $clientSecret = $subscription->latest_invoice?->payment_intent?->client_secret;

        return new SubscriptionResult(
            providerSubscriptionId: $subscription->id,
            status: $subscription->status,
            clientSecret: $clientSecret,
            raw: $subscription->toArray(),
            providerCustomerId: $customer->id,
        );
    }

    public function cancel(string $providerSubscriptionId): void
    {
        if (! config('services.stripe.secret')) {
            return;
        }

        $stripe = new StripeClient(config('services.stripe.secret'));
        $stripe->subscriptions->cancel($providerSubscriptionId);
    }

    public function changePlan(ChangeSubscriptionPlanData $data): void
    {
        if (! config('services.stripe.secret')) {
            return;
        }

        $priceId = $this->priceIdFor($data->newPlanId);
        if ($priceId === null) {
            throw new \RuntimeException(
                'No Stripe price is configured for the new plan. Add the provider price mapping first.'
            );
        }

        $stripe = new StripeClient(config('services.stripe.secret'));
        $subscription = $stripe->subscriptions->retrieve($data->providerSubscriptionId);
        $itemId = $subscription->items->data[0]->id ?? null;

        if ($itemId === null) {
            throw new \RuntimeException('The Stripe subscription has no billable item to update.');
        }

        $stripe->subscriptions->update($data->providerSubscriptionId, [
            'items' => [['id' => $itemId, 'price' => $priceId]],
            'proration_behavior' => 'create_prorations',
            'metadata' => ['plan_id' => $data->newPlanId],
        ]);
    }

    private function priceIdFor(string $planId): ?string
    {
        $mapped = PaymentProviderPlan::query()
            ->where('subscription_plan_id', $planId)
            ->where('provider', 'stripe')
            ->whereNotNull('external_price_id')
            ->value('external_price_id');

        if (is_string($mapped) && $mapped !== '') {
            return $mapped;
        }

        $plan = Plan::query()->find($planId);
        $legacy = $plan?->getAttribute('stripe_price_id') ?? null;

        return is_string($legacy) && $legacy !== '' ? $legacy : null;
    }
}
