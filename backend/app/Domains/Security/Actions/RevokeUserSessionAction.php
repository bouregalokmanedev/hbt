<?php

namespace App\Domains\Security\Actions;

use App\Domains\Security\Enums\SecurityEventType;
use App\Domains\Security\Services\SecurityEventService;
use App\Models\UserSession;
use App\Services\Audit\AuditService;

final class RevokeUserSessionAction
{
    public function __construct(
        private SecurityEventService $securityEvents,
        private AuditService $audit,
    ) {}

    public function execute(UserSession $session, string $reason = 'admin_revoked'): UserSession
    {
        if ($session->logged_out_at !== null) {
            return $session;
        }

        $session->update([
            'logged_out_at' => now(),
            'is_current' => false,
        ]);

        $session->user?->tokens()->where('id', $session->token_id)->delete();

        $this->securityEvents->record(
            type: SecurityEventType::SESSION_REVOKED,
            target: $session,
            success: true,
            metadata: ['reason' => $reason, 'session_id' => $session->id],
        );

        $this->audit->log(
            event: 'session.revoked',
            model: $session,
            old: ['active' => true],
            new: ['active' => false],
            metadata: ['reason' => $reason],
        );

        return $session;
    }
}
