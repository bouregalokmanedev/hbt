<?php

namespace App\Domains\Security\Services;

use App\Domains\Security\Enums\SecurityEventType;
use App\Domains\Security\Enums\SecuritySeverity;
use App\Domains\Security\Models\SecurityEvent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class SecurityEventService
{
    /**
     * Canonical security logger. Never logs secrets — only ids, event_type, and safe metadata.
     *
     * @param array<string,mixed> $metadata
     */
    public function record(
        SecurityEventType|string $type,
        ?SecuritySeverity $severity = null,
        ?Model $target = null,
        ?bool $success = null,
        ?string $failureReason = null,
        array $metadata = [],
        ?Request $request = null,
        ?int $actorId = null,
        ?int $userId = null,
    ): SecurityEvent {
        $request ??= request();
        $typeValue = $type instanceof SecurityEventType ? $type->value : $type;

        $severityValue = $severity?->value ?? $this->inferSeverity($typeValue, $success);

        return SecurityEvent::create([
            'tenant_id' => $request->user()?->tenant_id ?? null,
            'user_id' => $userId ?? $request->user()?->id,
            'actor_id' => $actorId ?? auth()->id(),
            'event_type' => $typeValue,
            'severity' => $severityValue,
            'ip_address' => $request->ip(),
            'user_agent' => $this->safeUserAgent($request->userAgent()),
            'target_type' => $target ? get_class($target) : null,
            'target_id' => $target ? (string) $target->getKey() : null,
            'success' => $success,
            'failure_reason' => $failureReason ? substr($failureReason, 0, 255) : null,
            'metadata' => $this->sanitizeMetadata($metadata),
            'occurred_at' => now(),
        ]);
    }

    private function inferSeverity(string $type, ?bool $success): string
    {
        return match (true) {
            $type === SecurityEventType::LOGIN_FAILED->value => 'medium',
            $type === SecurityEventType::PERMISSION_DENIED->value => 'medium',
            $type === SecurityEventType::ACCOUNT_LOCKED->value => 'high',
            $type === SecurityEventType::SUSPICIOUS_LOGIN->value => 'high',
            $success === false => 'medium',
            default => 'info',
        };
    }

    private function safeUserAgent(?string $value): ?string
    {
        return $value ? substr($value, 0, 512) : null;
    }

    /**
     * @param array<string,mixed> $metadata
     * @return array<string,mixed>
     */
    private function sanitizeMetadata(array $metadata): array
    {
        $blocked = ['password', 'password_confirmation', 'current_password', 'token', 'secret', 'cvc', 'cvv', 'card_number'];
        foreach ($blocked as $key) {
            unset($metadata[$key]);
        }
        return $metadata;
    }
}
