<?php

namespace App\Domains\Payments\Services;

use App\Domains\Payments\Contracts\PaymentGatewayInterface;
use App\Domains\Payments\DTOs\CreatePaymentData;
use App\Domains\Payments\Enums\PaymentProvider;
use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Models\Order;
use App\Domains\Payments\Models\Payment;
use Illuminate\Support\Str;

class CheckoutService
{
    public function __construct(
        private PaymentService $payments,
    ) {}

    public function createCheckout(Order $order, string $provider, ?string $paymentMethodId = null): Payment
    {
        $gateway = $this->gateway($provider);

        $payment = Payment::create([
            'order_id' => $order->id,
            'user_id' => $order->user_id,
            'provider' => $provider,
            'payment_method_type' => 'card',
            'amount' => $order->total,
            'currency' => $order->currency,
            'status' => PaymentStatus::PENDING->value,
            'idempotency_key' => (string) Str::uuid(),
            'metadata' => ['order_id' => $order->id],
        ]);

        $result = $gateway->createPayment(new CreatePaymentData(
            orderId: $order->id,
            userId: (string) $order->user_id,
            amount: $order->total,
            currency: $order->currency,
            provider: $provider,
            paymentMethodType: 'card',
            idempotencyKey: $payment->idempotency_key,
            paymentMethodId: $paymentMethodId,
        ));

        $metadata = array_merge($payment->metadata ?? [], $result->raw);
        if ($result->clientSecret) {
            $metadata['client_secret'] = $result->clientSecret;
        }

        $payment->update([
            'provider_payment_id' => $result->providerPaymentId,
            'status' => $result->status,
            'metadata' => $metadata,
        ]);

        return $payment->fresh();
    }

    private function gateway(string $provider): PaymentGatewayInterface
    {
        return match ($provider) {
            PaymentProvider::STRIPE->value => app(\App\Domains\Payments\Gateways\Stripe\StripePaymentGateway::class),
            PaymentProvider::PAYPAL->value => app(\App\Domains\Payments\Gateways\PayPal\PayPalPaymentGateway::class),
            PaymentProvider::MANUAL->value => app(\App\Domains\Payments\Gateways\PayPal\PayPalPaymentGateway::class),
            default => throw new \App\Domains\Payments\Exceptions\InvalidPaymentProviderException("Unknown provider: {$provider}"),
        };
    }
}
