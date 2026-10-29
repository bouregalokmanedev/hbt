<?php

namespace App\Domains\Payments\Gateways\Stripe;

use App\Domains\Payments\Contracts\PaymentGatewayInterface;
use App\Domains\Payments\Contracts\PaymentResult;
use App\Domains\Payments\Contracts\RefundResult;
use App\Domains\Payments\DTOs\CreatePaymentData;
use App\Domains\Payments\DTOs\RefundPaymentData;
use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Exceptions\PaymentGatewayConfigurationException;
use App\Domains\Payments\Exceptions\UnsupportedCurrencyException;
use App\Domains\Payments\Models\Payment;
use App\Support\Money;
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
        if (! $this->isConfigured()) {
            $this->assertConfigured('create');

            Log::warning('Stripe secret missing — returning stub payment intent.');

            return new PaymentResult(
                providerPaymentId: 'pi_stub_'.substr($data->idempotencyKey, 0, 8),
                status: PaymentStatus::REQUIRES_ACTION->value,
                clientSecret: 'pi_stub_secret',
                raw: ['stub' => true],
            );
        }

        $this->assertCurrencySupported($data->currency);

        $stripe = new StripeClient(config('services.stripe.secret'));

        $intent = $stripe->paymentIntents->create([
            // Internal amounts are major units; Stripe expects the smallest
            // currency unit. This is the only conversion point.
            'amount' => Money::toMinorUnits($data->amount, $data->currency),
            'currency' => strtolower($data->currency),
            // Dynamic payment methods. Stripe no longer accepts an explicit
            // payment_method_types list here, so which methods actually
            // surface (cards, Apple Pay, Google Pay, ...) is controlled from
            // the Stripe Dashboard -> Settings -> Payment methods.
            'automatic_payment_methods' => ['enabled' => true],
            'metadata' => ['order_id' => $data->orderId, 'idempotency_key' => $data->idempotencyKey],
        ], [
            'idempotency_key' => $data->idempotencyKey,
        ]);

        return new PaymentResult(
            providerPaymentId: $intent->id,
            status: $this->mapStatus((string) $intent->status),
            clientSecret: $intent->client_secret,
            raw: $intent->toArray(),
        );
    }

    public function capture(Payment $payment): PaymentResult
    {
        $this->assertConfigured('capture');

        if (! $payment->provider_payment_id) {
            throw new PaymentGatewayConfigurationException('Stripe payment has no provider payment id to capture.');
        }

        $stripe = new StripeClient(config('services.stripe.secret'));
        $intent = $stripe->paymentIntents->capture($payment->provider_payment_id);

        return new PaymentResult(
            providerPaymentId: $intent->id,
            status: $this->mapStatus((string) $intent->status),
            raw: $intent->toArray(),
        );
    }

    public function refund(Payment $payment, RefundPaymentData $data): RefundResult
    {
        if (! $this->isConfigured()) {
            $this->assertConfigured('refund');

            return new RefundResult(
                providerRefundId: 're_stub_'.substr($data->idempotencyKey, 0, 8),
                status: 'succeeded',
                raw: ['stub' => true],
            );
        }

        if (! $payment->provider_payment_id) {
            throw new PaymentGatewayConfigurationException('Stripe payment has no provider payment id to refund.');
        }

        $this->assertCurrencySupported($payment->currency);

        $stripe = new StripeClient(config('services.stripe.secret'));

        $refund = $stripe->refunds->create([
            'payment_intent' => $payment->provider_payment_id,
            'amount' => Money::toMinorUnits($data->amount, $payment->currency),
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
        $this->assertConfigured('cancel');

        if (! $payment->provider_payment_id) {
            return;
        }

        $stripe = new StripeClient(config('services.stripe.secret'));
        $stripe->paymentIntents->cancel($payment->provider_payment_id);
    }

    private function isConfigured(): bool
    {
        return filled(config('services.stripe.secret'));
    }

    private function assertConfigured(string $operation): void
    {
        if ($this->isConfigured()) {
            return;
        }

        if (app()->environment('production')) {
            throw new PaymentGatewayConfigurationException(
                "Stripe is not configured; cannot {$operation} payments."
            );
        }
    }

    private function assertCurrencySupported(string $currency): void
    {
        $currency = Money::normalizeCurrency($currency);
        $supported = array_map('strtoupper', (array) config('payments.providers.stripe.currencies', []));

        if (! in_array($currency, $supported, true)) {
            throw new UnsupportedCurrencyException("Stripe does not support {$currency} payments.");
        }
    }

    private function mapStatus(string $status): string
    {
        return match ($status) {
            'succeeded' => PaymentStatus::SUCCEEDED->value,
            'processing' => PaymentStatus::PROCESSING->value,
            'canceled' => PaymentStatus::CANCELLED->value,
            default => PaymentStatus::REQUIRES_ACTION->value,
        };
    }
}
