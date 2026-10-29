<?php

namespace App\Domains\Payments\Gateways\Manual;

use App\Domains\Payments\Contracts\SubscriptionGatewayInterface;
use App\Domains\Payments\Contracts\SubscriptionResult;
use App\Domains\Payments\DTOs\ChangeSubscriptionPlanData;
use App\Domains\Payments\DTOs\CreateSubscriptionData;

/**
 * Offline subscriptions are activated by staff after the agreed payment
 * settles. Nothing here may report an active subscription automatically.
 */
class ManualSubscriptionGateway implements SubscriptionGatewayInterface
{
    public function provider(): string
    {
        return 'manual';
    }

    public function createSubscription(CreateSubscriptionData $data): SubscriptionResult
    {
        return new SubscriptionResult(
            providerSubscriptionId: 'MANUAL-SUB-'.strtoupper(substr(hash('sha256', $data->idempotencyKey), 0, 16)),
            status: 'pending',
            raw: ['manual' => true],
        );
    }

    public function cancel(string $providerSubscriptionId): void
    {
        // Offline subscriptions are cancelled by staff; nothing to call.
    }

    public function cancelAtPeriodEnd(string $providerSubscriptionId): void
    {
        // Offline subscriptions are cancelled by staff; nothing to call.
    }

    public function changePlan(ChangeSubscriptionPlanData $data): void
    {
        // Offline plan changes are applied by staff; nothing to call.
    }
}
