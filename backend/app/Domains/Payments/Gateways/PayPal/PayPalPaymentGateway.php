<?php

namespace App\Domains\Payments\Gateways\PayPal;

use App\Domains\Payments\Contracts\PaymentGatewayInterface;
use App\Domains\Payments\Contracts\PaymentResult;
use App\Domains\Payments\Contracts\RefundResult;
use App\Domains\Payments\DTOs\CreatePaymentData;
use App\Domains\Payments\DTOs\RefundPaymentData;
use App\Domains\Payments\Exceptions\PaymentProviderUnavailableException;
use App\Domains\Payments\Models\Payment;

/**
 * PayPal has no production integration yet. It must never return fake
 * successes or fake checkout URLs: until a real implementation exists, every
 * operation fails closed.
 */
class PayPalPaymentGateway implements PaymentGatewayInterface
{
    public function provider(): string
    {
        return 'paypal';
    }

    public function createPayment(CreatePaymentData $data): PaymentResult
    {
        throw $this->unavailable();
    }

    public function capture(Payment $payment): PaymentResult
    {
        throw $this->unavailable();
    }

    public function refund(Payment $payment, RefundPaymentData $data): RefundResult
    {
        throw $this->unavailable();
    }

    public function cancel(Payment $payment): void
    {
        throw $this->unavailable();
    }

    private function unavailable(): PaymentProviderUnavailableException
    {
        return new PaymentProviderUnavailableException(
            'PayPal payments are not available yet. Please choose another payment method.'
        );
    }
}
