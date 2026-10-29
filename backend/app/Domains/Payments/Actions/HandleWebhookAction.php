<?php

namespace App\Domains\Payments\Actions;

use App\Domains\Payments\Models\WebhookEvent;
use Illuminate\Support\Facades\DB;

final class HandleWebhookAction
{
    /**
     * Atomically claim a provider event for processing.
     *
     * Exactly one caller may claim an event, even when the provider delivers
     * it concurrently. A stale claim (crashed worker) becomes claimable after
     * the configured lease.
     *
     * @return array{event: WebhookEvent, claimed: bool}
     */
    public function claim(string $provider, string $eventId, string $eventType, array $payload): array
    {
        $event = WebhookEvent::query()->createOrFirst(
            ['provider' => $provider, 'event_id' => $eventId],
            [
                'event_type' => $eventType,
                'payload' => $payload,
                'status' => WebhookEvent::STATUS_PENDING,
            ],
        );

        $claimed = $this->claimEvent($event->id);

        return [
            'event' => $event->fresh(),
            'claimed' => $claimed,
        ];    }

    /**
     * Claim an existing event for an admin replay.
     */
    public function claimExisting(WebhookEvent $event): bool
    {
        return $this->claimEvent($event->id);
    }

    public function markProcessed(WebhookEvent $event): void
    {
        $event->markProcessed();
    }

    public function markFailed(WebhookEvent $event, string $error): void
    {
        $event->markFailed($error);
    }

    private function claimEvent(string $eventId): bool
    {
        $staleBefore = now()->subSeconds(
            max(30, (int) config('payments.webhook_claim_ttl', 300))
        );

        $updated = WebhookEvent::query()
            ->whereKey($eventId)
            ->where('status', '!=', WebhookEvent::STATUS_PROCESSED)
            ->where(function ($query) use ($staleBefore): void {
                $query->whereNull('claimed_at')
                    ->orWhere('claimed_at', '<=', $staleBefore);
            })
            ->update([
                'status' => WebhookEvent::STATUS_PROCESSING,
                'claimed_at' => now(),
                'failed_at' => null,
                'error_message' => null,
                'attempts' => DB::raw('attempts + 1'),
                'updated_at' => now(),
            ]);

        return $updated === 1;
    }
}
