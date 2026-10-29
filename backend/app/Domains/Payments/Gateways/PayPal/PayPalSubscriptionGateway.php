<?php

namespace App\Domains\Payments\Gateways\PayPal;

use App\Domains\Payments\Contracts\SubscriptionGatewayInterface;
use App\Domains\Payments\Contracts\SubscriptionResult;
use App\Domains\Payments\DTOs\ChangeSubscriptionPlanData;
use App\Domains\Payments\DTOs\CreateSubscriptionData;
use App\Domains\Payments\Exceptions\PaymentProviderUnavailableException;

/**
 * See PayPalPaymentGateway: no stub subscription may be created before a real
 * PayPal integration is implemented.
 */
class PayPalSubscriptionGateway implements SubscriptionGatewayInterface
{
    public function provider(): string
    {
        return 'paypal';
    }

    public function createSubscription(CreateSubscriptionData $data): SubscriptionResult
    {
        throw $this->unavailable();
    }

    public function cancel(string $providerSubscriptionId): void
    {
        throw $this->unavailable();
    }

    public function cancelAtPeriodEnd(string $providerSubscriptionId): void
    {
        throw $this->unavailable();
    }

    public function changePlan(ChangeSubscriptionPlanData $data): void
    {
        throw $this->unavailable();
    }

    private function unavailable(): PaymentProviderUnavailableException
    {
        return new PaymentProviderUnavailableException(
            'PayPal subscriptions are not available yet. Please choose another payment method.'
        );
    }
}
