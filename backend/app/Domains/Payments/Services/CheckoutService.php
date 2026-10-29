<?php

namespace App\Domains\Payments\Services;

use App\Domains\Payments\DTOs\CreatePaymentData;
use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Models\Order;
use App\Domains\Payments\Models\Payment;
use Throwable;

class CheckoutService
{
    public function __construct(
        private PaymentGatewayRegistry $gateways,
    ) {}

    public function createCheckout(Order $order, string $provider, ?string $paymentMethodId = null): Payment
    {
        $this->gateways->assertCanProcess($provider, $order->currency);

        // The key is deterministic so a retried request can never create a
        // second provider charge for the same order.
        $key = 'checkout:'.$order->id.':'.$provider;

        $payment = Payment::query()->createOrFirst(
            ['idempotency_key' => $key],
            [
                'order_id' => $order->id,
                'user_id' => $order->user_id,
                'provider' => $provider,
                'payment_method_type' => 'card',
                'amount' => $order->total,
                'currency' => $order->currency,
                'status' => PaymentStatus::PENDING->value,
                'metadata' => ['order_id' => $order->id],
            ],
        );

        if ($payment->provider_payment_id) {
            return $payment;
        }

        try {
            $result = $this->gateways
                ->gateway($provider)
                ->createPayment(new CreatePaymentData(
                    orderId: $order->id,
                    userId: (string) $order->user_id,
                    amount: $order->total,
                    currency: $order->currency,
                    provider: $provider,
                    paymentMethodType: 'card',
                    idempotencyKey: $key,
                    paymentMethodId: $paymentMethodId,
                ));
        } catch (Throwable $exception) {
            $payment->update([
                'status' => PaymentStatus::FAILED->value,
                'failed_at' => now(),
                'failure_code' => 'gateway_error',
                'failure_message' => $exception->getMessage(),
            ]);

            throw $exception;
        }

        $metadata = array_merge($payment->metadata ?? [], $result->raw);
        if ($result->clientSecret) {
            $metadata['client_secret'] = $result->clientSecret;
        }
        if ($result->checkoutUrl) {
            $metadata['checkout_url'] = $result->checkoutUrl;
        }

        $payment->update([
            'provider_payment_id' => $result->providerPaymentId,
            'status' => $result->status,
            'metadata' => $metadata,
        ]);

        return $payment->fresh();
    }
}
