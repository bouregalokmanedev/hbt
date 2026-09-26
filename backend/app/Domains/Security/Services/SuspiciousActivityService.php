<?php

namespace App\Domains\Security\Services;

use App\Domains\Security\Enums\SecurityEventType;
use App\Domains\Security\Models\RiskSignal;
use App\Models\AuthenticationLog;
use App\Models\User;
use Illuminate\Http\Request;

class SuspiciousActivityService
{
    public function __construct(
        private SecurityEventService $events,
    ) {}

    public function detectImpossibleTravel(User $user, Request $request): ?RiskSignal
    {
        $last = AuthenticationLog::where('user_id', $user->id)
            ->where('successful', true)
            ->whereNotNull('ip_address')
            ->latest('created_at')
            ->first();

        if (! $last || $last->ip_address === $request->ip()) {
            return null;
        }

        // Heuristic: different country in < 1 hour is suspicious (requires geo-IP, simplified to different IP)
        $minutesSinceLast = $last->created_at->diffInMinutes(now());
        if ($minutesSinceLast < 60 && $last->ip_address !== $request->ip()) {
            $signal = RiskSignal::create([
                'tenant_id' => $user->tenant_id,
                'type' => 'impossible_travel',
                'severity' => 'medium',
                'user_id' => $user->id,
                'ip_address' => $request->ip(),
                'event_type' => SecurityEventType::SUSPICIOUS_LOGIN->value,
                'score' => 60,
                'context' => ['previous_ip' => $last->ip_address, 'minutes_since' => $minutesSinceLast],
            ]);

            $this->events->record(
                type: SecurityEventType::SUSPICIOUS_LOGIN,
                severity: \App\Domains\Security\Enums\SecuritySeverity::MEDIUM,
                target: $user,
                success: false,
                failureReason: "Impossible travel: {$last->ip_address} -> {$request->ip()} in {$minutesSinceLast}m",
                request: $request,
            );

            return $signal;
        }

        return null;
    }

    public function detectCredentialStuffing(string $ip): ?RiskSignal
    {
        $distinctEmails = AuthenticationLog::where('ip_address', $ip)
            ->where('successful', false)
            ->where('created_at', '>=', now()->subMinutes(10))
            ->distinct('email')
            ->count('email');

        if ($distinctEmails >= 5) {
            $signal = RiskSignal::create([
                'type' => 'credential_stuffing',
                'severity' => 'high',
                'ip_address' => $ip,
                'event_type' => SecurityEventType::LOGIN_FAILED->value,
                'score' => 85,
                'context' => ['distinct_emails' => $distinctEmails],
            ]);

            $this->events->record(
                type: SecurityEventType::SUSPICIOUS_LOGIN,
                severity: \App\Domains\Security\Enums\SecuritySeverity::HIGH,
                success: false,
                failureReason: "Credential stuffing: {$distinctEmails} emails from {$ip}",
            );

            return $signal;
        }

        return null;
    }
}
