<?php

namespace App\Domains\Payments\Gateways\PayPal;

use App\Domains\Payments\Contracts\SubscriptionGatewayInterface;
use App\Domains\Payments\Contracts\SubscriptionResult;
use App\Domains\Payments\DTOs\ChangeSubscriptionPlanData;
use App\Domains\Payments\DTOs\CreateSubscriptionData;
use Illuminate\Support\Facades\Log;

class PayPalSubscriptionGateway implements SubscriptionGatewayInterface
{
    public function provider(): string
    {
        return 'paypal';
    }

    public function createSubscription(CreateSubscriptionData $data): SubscriptionResult
    {
        Log::info('PayPal subscription stub — createSubscription called.', ['plan' => $data->planId]);

        return new SubscriptionResult(
            providerSubscriptionId: 'P-PAYPAL-STUB-'.substr($data->idempotencyKey, 0, 8),
            status: 'APPROVAL_PENDING',
            raw: ['stub' => true, 'approval_url' => 'https://www.paypal.com/webapps/hermes/api/approve'],
        );
    }

    public function cancel(string $providerSubscriptionId): void
    {
        Log::info('PayPal subscription stub — cancel called.', ['id' => $providerSubscriptionId]);
    }

    public function changePlan(ChangeSubscriptionPlanData $data): void
    {
        Log::info('PayPal subscription stub — changePlan called.', ['sub' => $data->providerSubscriptionId, 'plan' => $data->newPlanId]);
    }
}
