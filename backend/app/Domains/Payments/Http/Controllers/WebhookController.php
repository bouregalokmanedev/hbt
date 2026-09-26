<?php

namespace App\Domains\Payments\Http\Controllers;

use App\Domains\Payments\Actions\HandleWebhookAction;
use App\Domains\Payments\Models\Payment;
use App\Domains\Payments\Services\PaymentService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WebhookController extends Controller
{
    public function stripe(Request $request, HandleWebhookAction $webhooks, PaymentService $payments): \Illuminate\Http\JsonResponse
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature', '');
        $secret = config('services.stripe.webhook_secret');

        // Fail closed in production: a missing secret must never accept events.
        if (! $secret) {
            if (app()->environment('production')) {
                Log::error('Stripe webhook rejected: STRIPE_WEBHOOK_SECRET is not configured.');

                return response()->json(['success' => false, 'message' => 'Webhook not configured.'], 503);
            }

            Log::warning('Stripe webhook accepted without signature (local development only).');
        } else {
            if (blank($sigHeader)) {
                return response()->json(['success' => false, 'message' => 'Missing Stripe signature.'], 400);
            }

            try {
                \Stripe\Webhook::constructEvent($payload, $sigHeader, $secret);
            } catch (\Throwable $exception) {
                return response()->json(['success' => false, 'message' => 'Invalid Stripe signature.'], 400);
            }
        }

        $data = json_decode($payload, true) ?? $request->all();
        $eventId = $data['id'] ?? (string) Str::uuid();
        $eventType = $data['type'] ?? 'unknown';
        $event = $webhooks->execute('stripe', $eventId, $eventType, $data);

        if ($event->wasRecentlyCreated === false && $event->status === 'processed') {
            return response()->json(['success' => true, 'message' => 'Already processed.']);
        }

        try {
            $this->handleStripeEvent($eventType, $data, $payments);
            $webhooks->markProcessed($event);
        } catch (\Throwable $exception) {
            $webhooks->markFailed($event, $exception->getMessage());

            return response()->json(['success' => false, 'message' => $exception->getMessage()], 422);
        }

        return response()->json(['success' => true, 'message' => 'Webhook processed.']);
    }

    public function paypal(Request $request, HandleWebhookAction $webhooks): \Illuminate\Http\JsonResponse
    {
        if (! $this->paypalSignatureIsValid($request)) {
            return response()->json(['success' => false, 'message' => 'Invalid PayPal webhook signature.'], 400);
        }

        $data = $request->all();
        $eventId = $data['id'] ?? (string) Str::uuid();
        $eventType = $data['event_type'] ?? 'unknown';
        $event = $webhooks->execute('paypal', $eventId, $eventType, $data);

        if ($event->wasRecentlyCreated === false && $event->status === 'processed') {
            return response()->json(['success' => true, 'message' => 'Already processed.']);
        }

        try {
            $object = $data['resource'] ?? $data['data']['object'] ?? [];
            $paypalId = $object['id'] ?? $data['resource']['id'] ?? null;
            if ($paypalId) {
                $payment = Payment::where('provider_payment_id', $paypalId)->first();
                if ($payment) {
                    if (str_contains($eventType, 'COMPLETED')) {
                        app(PaymentService::class)->markSucceeded($payment, ['webhook' => $eventType]);
                    } elseif (str_contains($eventType, 'FAILED')) {
                        app(PaymentService::class)->markFailed($payment, 'paypal_failed', 'PayPal payment failed.');
                    }
                } else {
                    app(\App\Domains\Payments\Services\SubscriptionService::class)->handleWebhook('paypal', $eventType, $data);
                }
            } else {
                app(\App\Domains\Payments\Services\SubscriptionService::class)->handleWebhook('paypal', $eventType, $data);
            }
            $webhooks->markProcessed($event);
        } catch (\Throwable $exception) {
            $webhooks->markFailed($event, $exception->getMessage());

            return response()->json(['success' => false, 'message' => $exception->getMessage()], 422);
        }

        return response()->json(['success' => true, 'message' => 'PayPal webhook recorded.']);
    }

    /**
     * Verify the PayPal webhook via their verify-webhook-signature API.
     * Local development without credentials is allowed; production always verifies.
     */
    private function paypalSignatureIsValid(Request $request): bool
    {
        $webhookId = config('services.paypal.webhook_id');
        $clientId = config('services.paypal.client_id');
        $secret = config('services.paypal.secret');
        $mode = config('services.paypal.mode', 'sandbox');

        if (! $webhookId || ! $clientId || ! $secret) {
            if (app()->environment('production')) {
                Log::error('PayPal webhook rejected: PayPal credentials/webhook_id are not configured.');

                return false;
            }

            Log::warning('PayPal webhook accepted without verification (local development only).');

            return true;
        }

        $baseUrl = $mode === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        try {
            $tokenResponse = Http::withBasicAuth($clientId, $secret)
                ->asForm()
                ->post($baseUrl.'/v1/oauth2/token', ['grant_type' => 'client_credentials']);

            if ($tokenResponse->failed()) {
                Log::error('PayPal webhook rejected: unable to obtain access token.');

                return false;
            }

            $accessToken = $tokenResponse->json('access_token');
            $headers = $request->headers;

            $verifyResponse = Http::withToken($accessToken)
                ->post($baseUrl.'/v1/notifications/verify-webhook-signature', [
                    'auth_algo' => $headers->get('PAYPAL-AUTH-ALGO', ''),
                    'cert_url' => $headers->get('PAYPAL-CERT-URL', ''),
                    'transmission_id' => $headers->get('PAYPAL-TRANSMISSION-ID', ''),
                    'transmission_sig' => $headers->get('PAYPAL-TRANSMISSION-SIG', ''),
                    'transmission_time' => $headers->get('PAYPAL-TRANSMISSION-TIME', ''),
                    'webhook_id' => $webhookId,
                    'webhook_event' => $request->all(),
                ]);

            if ($verifyResponse->failed()) {
                Log::error('PayPal webhook rejected: verification request failed.');

                return false;
            }

            $verified = $verifyResponse->json('verification_status') === 'SUCCESS';
            if (! $verified) {
                Log::error('PayPal webhook rejected: signature verification failed.');
            }

            return $verified;
        } catch (\Throwable $exception) {
            Log::error('PayPal webhook rejected: '.$exception->getMessage());

            return false;
        }
    }

    private function handleStripeEvent(string $type, array $data, PaymentService $payments): void
    {
        $object = $data['data']['object'] ?? $data['object'] ?? [];

        $providerPaymentId = $object['id'] ?? null;
        if (! $providerPaymentId) {
            app(\App\Domains\Payments\Services\SubscriptionService::class)->handleWebhook('stripe', $type, $data);

            return;
        }

        $payment = Payment::where('provider_payment_id', $providerPaymentId)->first();
        if (! $payment) {
            app(\App\Domains\Payments\Services\SubscriptionService::class)->handleWebhook('stripe', $type, $data);

            return;
        }

        match ($type) {
            'payment_intent.succeeded', 'checkout.session.completed', 'charge.succeeded' => $payments->markSucceeded($payment, ['webhook' => $type]),
            'payment_intent.payment_failed', 'charge.failed' => $payments->markFailed($payment, 'payment_failed', $object['failure_message'] ?? 'Payment failed.'),
            default => app(\App\Domains\Payments\Services\SubscriptionService::class)->handleWebhook('stripe', $type, $data),
        };
    }
}
