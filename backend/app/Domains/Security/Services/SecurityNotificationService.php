<?php

namespace App\Domains\Security\Services;

use App\Domains\Notifications\Services\StudentNotificationService;
use App\Models\User;

class SecurityNotificationService
{
    public function __construct(
        private StudentNotificationService $notifications,
    ) {}

    public function notifyPasswordChanged(User $user): void
    {
        $this->notifications->send($user, 'security', 'Password changed', 'Your password was changed. If this was not you, secure your account immediately.', '/settings', 'pwd:'.now()->toDateString());
    }

    public function notifyMfaChanged(User $user, bool $enabled): void
    {
        $this->notifications->send(
            $user,
            'security',
            $enabled ? 'Two-factor enabled' : 'Two-factor disabled',
            $enabled ? 'MFA was enabled on your account.' : 'MFA was disabled on your account.',
            '/settings',
            'mfa:'.$user->id
        );
    }

    public function notifySuspiciousLogin(User $user, string $ip): void
    {
        $this->notifications->send($user, 'security', 'Suspicious sign-in detected', "A sign-in from {$ip} was flagged as suspicious.", '/settings', 'suspicious:'.$ip);
    }
}
