<?php

namespace App\Domains\Payments\Gateways\Manual;

use App\Domains\Payments\Contracts\PaymentGatewayInterface;
use App\Domains\Payments\Contracts\PaymentResult;
use App\Domains\Payments\Contracts\RefundResult;
use App\Domains\Payments\DTOs\CreatePaymentData;
use App\Domains\Payments\DTOs\RefundPaymentData;
use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Models\Payment;

/**
 * Offline settlement path (bank transfer, cash, local PSP handled by staff).
 *
 * The payment stays pending until an administrator confirms it through the
 * canonical payment service. We deliberately never return "succeeded" from
 * createPayment: only a human or a verified provider webhook may do that.
 */
class ManualPaymentGateway implements PaymentGatewayInterface
{
    public function provider(): string
    {
        return 'manual';
    }

    public function createPayment(CreatePaymentData $data): PaymentResult
    {
        return new PaymentResult(
            providerPaymentId: 'MANUAL-'.strtoupper(substr(hash('sha256', $data->idempotencyKey), 0, 16)),
            status: PaymentStatus::PENDING->value,
            raw: [
                'manual' => true,
                'instructions' => 'Complete the transfer using the payment details provided by support. An administrator will confirm your order once the funds arrive.',
            ],
        );
    }

    public function capture(Payment $payment): PaymentResult
    {
        return new PaymentResult(
            providerPaymentId: $payment->provider_payment_id ?? $payment->id,
            status: PaymentStatus::PENDING->value,
            raw: ['manual' => true],
        );
    }

    public function refund(Payment $payment, RefundPaymentData $data): RefundResult
    {
        return new RefundResult(
            providerRefundId: 'MANUAL-REFUND-'.strtoupper(substr(hash('sha256', $data->idempotencyKey), 0, 16)),
            status: 'succeeded',
            raw: ['manual' => true],
        );
    }

    public function cancel(Payment $payment): void
    {
        // Offline payments are cancelled by staff; nothing to call.
    }
}
