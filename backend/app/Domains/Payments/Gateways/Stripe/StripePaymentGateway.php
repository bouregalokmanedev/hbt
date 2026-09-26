<?php

namespace App\Domains\Payments\Gateways\Stripe;

use App\Domains\Payments\Contracts\PaymentGatewayInterface;
use App\Domains\Payments\Contracts\PaymentResult;
use App\Domains\Payments\Contracts\RefundResult;
use App\Domains\Payments\DTOs\CreatePaymentData;
use App\Domains\Payments\DTOs\RefundPaymentData;
use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Models\Payment;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;

class StripePaymentGateway implements PaymentGatewayInterface
{
    public function provider(): string
    {
        return 'stripe';
    }

    public function createPayment(CreatePaymentData $data): PaymentResult
    {
        if (! config('services.stripe.secret')) {
            Log::warning('Stripe secret missing — returning stub payment intent.');
            return new PaymentResult(
                providerPaymentId: 'pi_stub_'.substr($data->idempotencyKey, 0, 8),
                status: PaymentStatus::REQUIRES_ACTION->value,
                clientSecret: 'pi_stub_secret',
                raw: ['stub' => true],
            );
        }

        $stripe = new StripeClient(config('services.stripe.secret'));

        $intent = $stripe->paymentIntents->create([
            'amount' => $data->amount,
            'currency' => strtolower($data->currency),
            'automatic_payment_methods' => ['enabled' => true],
            'metadata' => ['order_id' => $data->orderId, 'idempotency_key' => $data->idempotencyKey],
        ], [
            'idempotency_key' => $data->idempotencyKey,
        ]);

        return new PaymentResult(
            providerPaymentId: $intent->id,
            status: $intent->status === 'succeeded' ? PaymentStatus::SUCCEEDED->value : PaymentStatus::REQUIRES_ACTION->value,
            clientSecret: $intent->client_secret,
            raw: $intent->toArray(),
        );
    }

    public function capture(Payment $payment): PaymentResult
    {
        return new PaymentResult(
            providerPaymentId: $payment->provider_payment_id ?? $payment->id,
            status: PaymentStatus::SUCCEEDED->value,
        );
    }

    public function refund(Payment $payment, RefundPaymentData $data): RefundResult
    {
        if (! config('services.stripe.secret')) {
            return new RefundResult(providerRefundId: 're_stub_'.substr($data->idempotencyKey, 0, 8), status: 'succeeded', raw: ['stub' => true]);
        }

        $stripe = new StripeClient(config('services.stripe.secret'));

        $refund = $stripe->refunds->create([
            'payment_intent' => $payment->provider_payment_id,
            'amount' => $data->amount,
        ], [
            'idempotency_key' => $data->idempotencyKey,
        ]);

        return new RefundResult(
            providerRefundId: $refund->id,
            status: $refund->status,
            raw: $refund->toArray(),
        );
    }

    public function cancel(Payment $payment): void
    {
        if (! config('services.stripe.secret') || ! $payment->provider_payment_id) {
            return;
        }

        $stripe = new StripeClient(config('services.stripe.secret'));
        $stripe->paymentIntents->cancel($payment->provider_payment_id);
    }
}
