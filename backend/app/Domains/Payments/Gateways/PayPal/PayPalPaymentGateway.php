<?php

namespace App\Domains\Payments\Gateways\PayPal;

use App\Domains\Payments\Contracts\PaymentGatewayInterface;
use App\Domains\Payments\Contracts\PaymentResult;
use App\Domains\Payments\Contracts\RefundResult;
use App\Domains\Payments\DTOs\CreatePaymentData;
use App\Domains\Payments\DTOs\RefundPaymentData;
use App\Domains\Payments\Models\Payment;
use Illuminate\Support\Facades\Log;

class PayPalPaymentGateway implements PaymentGatewayInterface
{
    public function provider(): string
    {
        return 'paypal';
    }

    public function createPayment(CreatePaymentData $data): PaymentResult
    {
        Log::info('PayPal gateway stub — createPayment called.', ['order' => $data->orderId]);

        return new PaymentResult(
            providerPaymentId: 'PAYPAL-STUB-'.substr($data->idempotencyKey, 0, 8),
            status: 'requires_action',
            checkoutUrl: null,
            raw: ['stub' => true, 'provider' => 'paypal'],
        );
    }

    public function capture(Payment $payment): PaymentResult
    {
        return new PaymentResult(
            providerPaymentId: $payment->provider_payment_id ?? $payment->id,
            status: 'succeeded',
        );
    }

    public function refund(Payment $payment, RefundPaymentData $data): RefundResult
    {
        return new RefundResult(providerRefundId: 'PAYPAL-RE-'.substr($data->idempotencyKey, 0, 8), status: 'succeeded', raw: ['stub' => true]);
    }

    public function cancel(Payment $payment): void {}
}
