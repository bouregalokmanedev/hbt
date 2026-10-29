<?php

namespace App\Domains\Payments\Http\Controllers;

use App\Domains\Payments\Actions\HandleWebhookAction;
use App\Domains\Payments\Actions\ProcessWebhookEventAction;
use App\Domains\Payments\Models\WebhookEvent;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function stripe(
        Request $request,
        HandleWebhookAction $webhooks,
        ProcessWebhookEventAction $processor,
    ): JsonResponse {
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

        $data = json_decode($payload, true);
        if (! is_array($data)) {
            return response()->json(['success' => false, 'message' => 'Invalid webhook payload.'], 400);
        }

        $eventId = $data['id'] ?? null;
        if (! is_string($eventId) || $eventId === '') {
            return response()->json(['success' => false, 'message' => 'Missing webhook event id.'], 400);
        }

        $eventType = (string) ($data['type'] ?? 'unknown');
        $claim = $webhooks->claim('stripe', $eventId, $eventType, $data);

        if (! $claim['claimed']) {
            return $this->claimConflict($claim['event']);
        }

        try {
            $processor->execute('stripe', $eventType, $data);
            $webhooks->markProcessed($claim['event']);
        } catch (\Throwable $exception) {
            $webhooks->markFailed($claim['event'], $exception->getMessage());
            Log::error('Stripe webhook processing failed.', [
                'event_id' => $eventId,
                'event_type' => $eventType,
                'error' => $exception->getMessage(),
            ]);

            return response()->json(['success' => false, 'message' => 'Webhook processing failed.'], 422);
        }

        return response()->json(['success' => true, 'message' => 'Webhook processed.']);
    }

    public function paypal(
        Request $request,
        HandleWebhookAction $webhooks,
        ProcessWebhookEventAction $processor,
    ): JsonResponse {
        if (! $this->paypalSignatureIsValid($request)) {
            return response()->json(['success' => false, 'message' => 'Invalid PayPal webhook signature.'], 400);
        }

        $data = $request->all();
        $eventId = $data['id'] ?? null;
        if (! is_string($eventId) || $eventId === '') {
            return response()->json(['success' => false, 'message' => 'Missing webhook event id.'], 400);
        }

        $eventType = (string) ($data['event_type'] ?? 'unknown');
        $claim = $webhooks->claim('paypal', $eventId, $eventType, $data);

        if (! $claim['claimed']) {
            return $this->claimConflict($claim['event']);
        }

        try {
            $processor->execute('paypal', $eventType, $data);
            $webhooks->markProcessed($claim['event']);
        } catch (\Throwable $exception) {
            $webhooks->markFailed($claim['event'], $exception->getMessage());
            Log::error('PayPal webhook processing failed.', [
                'event_id' => $eventId,
                'event_type' => $eventType,
                'error' => $exception->getMessage(),
            ]);

            return response()->json(['success' => false, 'message' => 'Webhook processing failed.'], 422);
        }

        return response()->json(['success' => true, 'message' => 'PayPal webhook recorded.']);
    }

    private function claimConflict(WebhookEvent $event): JsonResponse
    {
        if ($event->status === WebhookEvent::STATUS_PROCESSED) {
            return response()->json(['success' => true, 'message' => 'Already processed.']);
        }

        return response()->json([
            'success' => false,
            'message' => 'Webhook is already being processed.',
        ], 409);
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
}
