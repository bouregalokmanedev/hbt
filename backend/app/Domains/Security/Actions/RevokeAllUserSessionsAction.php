<?php

namespace App\Domains\Security\Actions;

use App\Domains\Security\Enums\SecurityEventType;
use App\Domains\Security\Services\SecurityEventService;
use App\Models\User;
use App\Services\Audit\AuditService;

final class RevokeAllUserSessionsAction
{
    public function __construct(
        private SecurityEventService $securityEvents,
        private AuditService $audit,
    ) {}

    /**
     * @return int number of sessions revoked
     */
    public function execute(User $user, ?string $exceptSessionId = null, string $reason = 'admin_revoked_all'): int
    {
        $query = $user->sessions()->whereNull('logged_out_at');
        if ($exceptSessionId !== null) {
            $query->where('id', '!=', $exceptSessionId);
        }

        $count = $query->count();
        if ($count === 0) {
            return 0;
        }

        $query->update(['logged_out_at' => now(), 'is_current' => false]);
        $user->tokens()->delete();

        $this->securityEvents->record(
            type: SecurityEventType::SESSION_REVOKED,
            target: $user,
            success: true,
            metadata: ['reason' => $reason, 'except_session' => $exceptSessionId, 'count' => $count],
        );

        $this->audit->log(
            event: 'sessions.revoked_all',
            model: $user,
            old: ['active_sessions' => $count],
            new: ['active_sessions' => 0],
            metadata: ['reason' => $reason],
        );

        return $count;
    }
}
