<?php

namespace App\Domains\Payments\Gateways\Stripe;

use App\Domains\Payments\Contracts\SubscriptionGatewayInterface;
use App\Domains\Payments\Contracts\SubscriptionResult;
use App\Domains\Payments\DTOs\ChangeSubscriptionPlanData;
use App\Domains\Payments\DTOs\CreateSubscriptionData;
use Illuminate\Support\Facades\Log;

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

        $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));

        // Real implementation would create/find Stripe Customer + Subscription with price
        // For now, create a stub that webhooks will activate
        $sub = $stripe->subscriptions->create([
            'customer' => $data->userId, // placeholder — real flow resolves Stripe customer first
            'items' => [['price' => 'price_stub']],
            'metadata' => ['idempotency_key' => $data->idempotencyKey],
        ], ['idempotency_key' => $data->idempotencyKey]);

        return new SubscriptionResult(
            providerSubscriptionId: $sub->id,
            status: $sub->status,
            raw: $sub->toArray(),
        );
    }

    public function cancel(string $providerSubscriptionId): void
    {
        if (! config('services.stripe.secret')) {
            return;
        }
        $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));
        $stripe->subscriptions->cancel($providerSubscriptionId);
    }

    public function changePlan(ChangeSubscriptionPlanData $data): void
    {
        if (! config('services.stripe.secret')) {
            return;
        }
        // Real: retrieve subscription, update items with new price
        Log::info('Stripe changePlan stub', ['sub' => $data->providerSubscriptionId, 'plan' => $data->newPlanId]);
    }
}
