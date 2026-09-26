<?php

namespace App\Domains\Admin\Queries;

use App\Models\AuditLog;
use App\Models\AuthenticationLog;
use App\Models\User;
use App\Models\UserSession;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class AdminSecurityQuery
{
    public function overview(): array
    {
        $now = now();
        $dayAgo = $now->copy()->subDay();
        $weekAgo = $now->copy()->subWeek();

        $failedLogins24h = AuthenticationLog::query()
            ->where('successful', false)
            ->where('created_at', '>=', $dayAgo)
            ->count();

        $failedLogins7d = AuthenticationLog::query()
            ->where('successful', false)
            ->where('created_at', '>=', $weekAgo)
            ->count();

        $successfulLogins24h = AuthenticationLog::query()
            ->where('successful', true)
            ->where('event', 'like', 'login.%')
            ->where('created_at', '>=', $dayAgo)
            ->count();

        $activeSessions = Schema::hasTable('user_sessions')
            ? UserSession::query()->whereNull('logged_out_at')->count()
            : 0;

        $totalSessions = Schema::hasTable('user_sessions')
            ? UserSession::query()->count()
            : 0;

        $suspendedAccounts = User::query()->where('status', 'suspended')->count();

        $lockedAccounts = 0;
        if (Schema::hasTable('authentication_logs')) {
            $lockedAccounts = AuthenticationLog::query()
                ->where('event', 'login.failed')
                ->where('created_at', '>=', $weekAgo)
                ->select('email')
                ->groupBy('email')
                ->havingRaw('COUNT(*) >= 5')
                ->get()
                ->count();
        }

        $adminActions24h = AuditLog::query()->where('created_at', '>=', $dayAgo)->count();
        $passwordChanges7d = AuditLog::query()
            ->where('event', 'password.changed')
            ->where('created_at', '>=', $weekAgo)
            ->count();
        $roleChanges7d = AuditLog::query()
            ->where('event', 'role.assigned')
            ->where('created_at', '>=', $weekAgo)
            ->count();

        return [
            'failed_logins_24h' => $failedLogins24h,
            'failed_logins_7d' => $failedLogins7d,
            'successful_logins_24h' => $successfulLogins24h,
            'active_sessions' => $activeSessions,
            'total_sessions' => $totalSessions,
            'suspended_accounts' => $suspendedAccounts,
            'potentially_locked_accounts' => $lockedAccounts,
            'admin_actions_24h' => $adminActions24h,
            'password_changes_7d' => $passwordChanges7d,
            'role_changes_7d' => $roleChanges7d,
        ];
    }

    public function authLogs(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = AuthenticationLog::query()->with('user:id,uuid,first_name,last_name,email');

        if ($event = trim((string) ($filters['event'] ?? ''))) {
            $query->where('event', $event);
        }

        if (isset($filters['successful']) && $filters['successful'] !== '') {
            $query->where('successful', $filters['successful'] === 'true' || $filters['successful'] === '1');
        }

        if ($email = trim((string) ($filters['email'] ?? ''))) {
            $query->whereRaw('LOWER(email) LIKE ?', ['%'.mb_strtolower($email).'%']);
        }

        if ($ip = trim((string) ($filters['ip'] ?? ''))) {
            $query->where('ip_address', 'like', "%{$ip}%");
        }

        if ($search = trim((string) ($filters['search'] ?? ''))) {
            $needle = '%'.mb_strtolower($search).'%';
            $query->where(function ($builder) use ($needle) {
                $builder->whereRaw('LOWER(email) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(event) LIKE ?', [$needle])
                    ->orWhere('ip_address', 'like', "%{$needle}%");
            });
        }

        if ($from = $filters['date_from'] ?? null) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $filters['date_to'] ?? null) {
            $query->whereDate('created_at', '<=', $to);
        }

        return $query
            ->latest('created_at')
            ->paginate(min(max($perPage, 1), 100));
    }

    public function sessions(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = UserSession::query()->with('user:id,uuid,first_name,last_name,email,status');

        if (($filters['active'] ?? '') === 'true') {
            $query->whereNull('logged_out_at');
        } elseif (($filters['active'] ?? '') === 'false') {
            $query->whereNotNull('logged_out_at');
        }

        if ($search = trim((string) ($filters['search'] ?? ''))) {
            $needle = '%'.mb_strtolower($search).'%';
            $query->where(function ($builder) use ($needle) {
                $builder->where('ip_address', 'like', "%{$needle}%")
                    ->orWhere('browser', 'like', "%{$needle}%")
                    ->orWhereHas('user', function ($users) use ($needle) {
                        $users->whereRaw('LOWER(email) LIKE ?', [$needle])
                            ->orWhereRaw('LOWER(first_name) LIKE ?', [$needle]);
                    });
            });
        }

        return $query
            ->latest('last_activity_at')
            ->paginate(min(max($perPage, 1), 100));
    }

    /**
     * Heuristic security alerts derived from auth and audit history.
     *
     * Each alert maps to an actionable admin response so the
     * center is not just observability but triage.
     *
     * @return list<array{severity: string, title: string, detail: string, meta: array}>
     */
    public function alerts(): array
    {
        $alerts = [];
        $now = now();

        // Burst failed logins by IP (potential brute force)
        $burstIps = AuthenticationLog::query()
            ->selectRaw('ip_address, COUNT(*) as total')
            ->where('successful', false)
            ->where('created_at', '>=', $now->copy()->subHour())
            ->whereNotNull('ip_address')
            ->groupBy('ip_address')
            ->havingRaw('COUNT(*) >= 5')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        foreach ($burstIps as $row) {
            $alerts[] = [
                'severity' => $row->total >= 10 ? 'critical' : 'warning',
                'title' => "{$row->total} failed logins from {$row->ip_address} in the last hour",
                'detail' => 'Possible brute-force activity. Consider reviewing sessions or suspending affected accounts.',
                'meta' => ['ip' => $row->ip_address, 'count' => (int) $row->total],
            ];
        }

        // Accounts with repeated failures (potential target)
        $targetedEmails = AuthenticationLog::query()
            ->selectRaw('email, COUNT(*) as total')
            ->where('successful', false)
            ->where('created_at', '>=', $now->copy()->subDay())
            ->whereNotNull('email')
            ->groupBy('email')
            ->havingRaw('COUNT(*) >= 5')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        foreach ($targetedEmails as $row) {
            $alerts[] = [
                'severity' => $row->total >= 10 ? 'critical' : 'warning',
                'title' => "{$row->total} failed sign-ins for {$row->email} in 24h",
                'detail' => 'Account may be under attack or user is locked out. Verify sessions and recent activity.',
                'meta' => ['email' => $row->email, 'count' => (int) $row->total],
            ];
        }

        // Sensitive admin actions burst
        $sensitiveEvents = ['role.assigned', 'permissions.synced', 'user.suspended', 'user.deleted'];
        $burstAdmin = AuditLog::query()
            ->whereIn('event', $sensitiveEvents)
            ->where('created_at', '>=', $now->copy()->subDay())
            ->count();
        if ($burstAdmin >= 5) {
            $alerts[] = [
                'severity' => 'warning',
                'title' => "{$burstAdmin} sensitive admin actions in 24h",
                'detail' => 'Unusual volume of privilege or destructive operations. Review the audit trail.',
                'meta' => ['count' => $burstAdmin],
            ];
        }

        // Stale unresolved security: many suspended accounts
        $suspended = User::query()->where('status', 'suspended')->count();
        if ($suspended >= 5) {
            $alerts[] = [
                'severity' => 'info',
                'title' => "{$suspended} accounts currently suspended",
                'detail' => 'Review suspended accounts for rehabilitation or escalation.',
                'meta' => ['count' => $suspended],
            ];
        }

        // Lock revision: keep sorting by most severe first
        usort($alerts, fn ($a, $b) => ['critical' => 0, 'warning' => 1, 'info' => 2][$a['severity']] <=> ['critical' => 0, 'warning' => 1, 'info' => 2][$b['severity']]);

        return array_slice($alerts, 0, 10);
    }

    public function exportAuditLogs(array $filters): \Illuminate\Support\Collection
    {
        $query = AuditLog::query()->with('user:id,uuid,first_name,last_name,email');

        if ($event = trim((string) ($filters['event'] ?? ''))) {
            $query->where('event', $event);
        }
        if ($from = $filters['date_from'] ?? null) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $filters['date_to'] ?? null) {
            $query->whereDate('created_at', '<=', $to);
        }
        if ($search = trim((string) ($filters['search'] ?? ''))) {
            $query->where('event', 'like', "%{$search}%");
        }

        return $query->latest('created_at')->limit(5000)->get();
    }

    public function exportAuthLogs(array $filters): \Illuminate\Support\Collection
    {
        $query = AuthenticationLog::query();

        if ($event = trim((string) ($filters['event'] ?? ''))) {
            $query->where('event', $event);
        }
        if (isset($filters['successful']) && $filters['successful'] !== '') {
            $query->where('successful', $filters['successful'] === 'true');
        }
        if ($from = $filters['date_from'] ?? null) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $filters['date_to'] ?? null) {
            $query->whereDate('created_at', '<=', $to);
        }

        return $query->latest('created_at')->limit(5000)->get();
    }
}
