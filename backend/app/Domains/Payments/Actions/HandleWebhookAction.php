<?php

namespace App\Domains\Payments\Actions;

use App\Domains\Payments\Models\WebhookEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final readonly class HandleWebhookAction
{
    public function execute(string $provider, string $eventId, string $eventType, array $payload): WebhookEvent
    {
        return DB::transaction(function () use ($provider, $eventId, $eventType, $payload) {
            $existing = WebhookEvent::where('provider', $provider)->where('event_id', $eventId)->first();
            if ($existing) {
                return $existing;
            }

            return WebhookEvent::create([
                'provider' => $provider,
                'event_id' => $eventId,
                'event_type' => $eventType,
                'payload' => $payload,
                'status' => 'pending',
            ]);
        });
    }

    public function markProcessed(WebhookEvent $event): void
    {
        $event->markProcessed();
    }

    public function markFailed(WebhookEvent $event, string $error): void
    {
        $event->markFailed($error);
    }
}
