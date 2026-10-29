<?php

namespace App\Domains\Payments\Actions;

use App\Domains\Payments\Exceptions\InvalidPaymentProviderException;
use App\Domains\Payments\Models\Payment;
use App\Domains\Payments\Services\PaymentService;
use App\Domains\Payments\Services\SubscriptionService;

/**
 * Turns a verified provider event into canonical payment/subscription state.
 * Both the HTTP webhook endpoint and the admin replay path use this action so
 * they cannot drift apart.
 */
final readonly class ProcessWebhookEventAction
{
    public function __construct(
        private PaymentService $payments,
        private SubscriptionService $subscriptions,
    ) {}

    public function execute(string $provider, string $eventType, array $payload): void
    {
        match ($provider) {
            'stripe' => $this->processStripe($eventType, $payload),
            'paypal' => $this->processPayPal($eventType, $payload),
            default => throw new InvalidPaymentProviderException("Unknown payment provider: {$provider}."),
        };
    }

    private function processStripe(string $eventType, array $payload): void
    {
        $object = $payload['data']['object'] ?? $payload['object'] ?? [];

        // charge.* events carry the payment intent in a sibling field while
        // checkout.session.completed carries it alongside the session id.
        $candidates = array_values(array_filter([
            $object['payment_intent'] ?? null,
            $object['id'] ?? null,
        ]));

        $payment = $candidates === []
            ? null
            : Payment::query()->whereIn('provider_payment_id', $candidates)->first();

        if (! $payment) {
            $this->subscriptions->handleWebhook('stripe', $eventType, $payload);

            return;
        }

        match ($eventType) {
            'payment_intent.succeeded', 'checkout.session.completed', 'charge.succeeded' => $this->payments->markSucceeded($payment, ['webhook' => $eventType]),
            'payment_intent.payment_failed', 'charge.failed' => $this->payments->markFailed(
                $payment,
                'payment_failed',
                $object['failure_message'] ?? 'Payment failed.',
            ),
            default => $this->subscriptions->handleWebhook('stripe', $eventType, $payload),
        };
    }

    private function processPayPal(string $eventType, array $payload): void
    {
        $object = $payload['resource'] ?? $payload['data']['object'] ?? [];
        $providerPaymentId = $object['id'] ?? null;

        $payment = $providerPaymentId
            ? Payment::query()->where('provider_payment_id', $providerPaymentId)->first()
            : null;

        if (! $payment) {
            $this->subscriptions->handleWebhook('paypal', $eventType, $payload);

            return;
        }

        if (str_contains($eventType, 'COMPLETED')) {
            $this->payments->markSucceeded($payment, ['webhook' => $eventType]);

            return;
        }

        if (str_contains($eventType, 'FAILED') || str_contains($eventType, 'DENIED')) {
            $this->payments->markFailed($payment, 'paypal_failed', 'PayPal payment failed.');

            return;
        }

        $this->subscriptions->handleWebhook('paypal', $eventType, $payload);
    }
}
