<?php

namespace App\Domains\Security\Services;

use App\Domains\Security\Enums\SecurityEventType;
use App\Domains\Security\Models\RiskSignal;
use App\Models\AuthenticationLog;
use Illuminate\Http\Request;

class BruteForceDetectionService
{
    public function __construct(
        private SecurityEventService $events,
    ) {}

    public function evaluate(Request $request, string $email, bool $successful): ?RiskSignal
    {
        if ($successful) {
            return null;
        }

        $ip = $request->ip();
        $recentByIp = AuthenticationLog::where('ip_address', $ip)
            ->where('successful', false)
            ->where('created_at', '>=', now()->subMinutes(10))
            ->count();

        $recentByEmail = AuthenticationLog::where('email', $email)
            ->where('successful', false)
            ->where('created_at', '>=', now()->subMinutes(10))
            ->count();

        if ($recentByIp >= 5 || $recentByEmail >= 5) {
            $severity = $recentByIp >= 10 || $recentByEmail >= 10 ? 'high' : 'medium';
            $score = $recentByIp >= 10 ? 80 : 50;

            $signal = RiskSignal::create([
                'tenant_id' => $request->user()?->tenant_id,
                'type' => 'brute_force',
                'severity' => $severity,
                'user_id' => null,
                'ip_address' => $ip,
                'event_type' => SecurityEventType::LOGIN_FAILED->value,
                'score' => $score,
                'context' => ['email' => $email, 'by_ip' => $recentByIp, 'by_email' => $recentByEmail],
            ]);

            $this->events->record(
                type: SecurityEventType::SUSPICIOUS_LOGIN,
                severity: \App\Domains\Security\Enums\SecuritySeverity::HIGH,
                success: false,
                failureReason: "Brute force: {$recentByIp} by IP, {$recentByEmail} by email",
                metadata: ['risk_signal' => $signal->id, 'email' => $email],
                request: $request,
            );

            return $signal;
        }

        return null;
    }
}
