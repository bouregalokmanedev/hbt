<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Admin\Queries\AdminSecurityQuery;
use App\Domains\Admin\Resources\AdminActivityResource;
use App\Http\Controllers\Controller;
use App\Models\UserSession;
use App\Services\Audit\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminSecurityController extends Controller
{
    public function overview(Request $request, AdminSecurityQuery $security): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Security overview retrieved.',
            'data' => array_merge($security->overview(), [
                'alerts' => $security->alerts(),
            ]),
        ]);
    }

    public function authLogs(Request $request, AdminSecurityQuery $security): JsonResponse
    {
        $logs = $security->authLogs(
            $request->only(['search', 'event', 'successful', 'email', 'ip', 'date_from', 'date_to']),
            $request->integer('per_page', 25),
        );

        return response()->json([
            'data' => $logs->getCollection()->map(fn ($log) => [
                'id' => $log->id,
                'event' => $log->event,
                'email' => $log->email,
                'successful' => (bool) $log->successful,
                'ip_address' => $log->ip_address,
                'browser' => $log->browser,
                'platform' => $log->platform,
                'device_type' => $log->device_type,
                'failure_reason' => $log->failure_reason,
                'user' => $log->user ? [
                    'id' => $log->user->uuid,
                    'name' => $log->user->full_name,
                    'email' => $log->user->email,
                ] : null,
                'created_at' => $log->created_at?->toISOString(),
            ]),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function sessions(Request $request, AdminSecurityQuery $security): JsonResponse
    {
        $sessions = $security->sessions(
            $request->only(['search', 'active']),
            $request->integer('per_page', 20),
        );

        return response()->json([
            'data' => $sessions->getCollection()->map(fn ($session) => [
                'id' => $session->id,
                'user' => $session->user ? [
                    'id' => $session->user->uuid,
                    'name' => $session->user->full_name,
                    'email' => $session->user->email,
                    'status' => $session->user->status,
                ] : null,
                'device_name' => $session->device_name,
                'browser' => $session->browser,
                'platform' => $session->platform,
                'device_type' => $session->device_type,
                'ip_address' => $session->ip_address,
                'logged_in_at' => $session->logged_in_at?->toISOString(),
                'logged_out_at' => $session->logged_out_at?->toISOString(),
                'last_activity_at' => $session->last_activity_at?->toISOString(),
                'is_current' => (bool) $session->is_current,
                'active' => $session->logged_out_at === null,
            ]),
            'meta' => [
                'current_page' => $sessions->currentPage(),
                'last_page' => $sessions->lastPage(),
                'per_page' => $sessions->perPage(),
                'total' => $sessions->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function revokeSession(Request $request, UserSession $session, AuditService $audit): JsonResponse
    {
        $session->load('user:id,uuid,first_name,last_name,email');

        $session->update(['logged_out_at' => now(), 'is_current' => false]);
        $session->user?->tokens()->delete();

        $audit->log('session.revoked', $session, [], [], [
            'target_user' => $session->user?->email,
            'ip' => $session->ip_address,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Session revoked successfully.',
            'data' => ['id' => $session->id],
        ]);
    }

    public function alerts(AdminSecurityQuery $security): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Security alerts retrieved.',
            'data' => $security->alerts(),
        ]);
    }

    public function exportAuditLogs(Request $request, AdminSecurityQuery $security): StreamedResponse
    {
        $logs = $security->exportAuditLogs($request->only(['search', 'event', 'date_from', 'date_to']));

        return response()->streamDownload(function () use ($logs) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['id', 'event', 'actor', 'actor_email', 'target_type', 'target_id', 'ip', 'occurred_at']);
            foreach ($logs as $log) {
                fputcsv($out, [
                    $log->id,
                    $log->event,
                    $log->user?->full_name ?? 'system',
                    $log->user?->email ?? '',
                    class_basename($log->auditable_type ?? ''),
                    $log->auditable_id ?? '',
                    $log->ip_address ?? '',
                    $log->created_at?->toISOString() ?? '',
                ]);
            }
            fclose($out);
        }, 'audit-export-'.now()->toDateString().'.csv', ['Content-Type' => 'text/csv']);
    }

    public function exportAuthLogs(Request $request, AdminSecurityQuery $security): StreamedResponse
    {
        $logs = $security->exportAuthLogs($request->only(['event', 'successful', 'date_from', 'date_to']));

        return response()->streamDownload(function () use ($logs) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['id', 'event', 'email', 'successful', 'ip', 'browser', 'created_at']);
            foreach ($logs as $log) {
                fputcsv($out, [
                    $log->id,
                    $log->event,
                    $log->email ?? '',
                    $log->successful ? 'yes' : 'no',
                    $log->ip_address ?? '',
                    $log->browser ?? '',
                    $log->created_at?->toISOString() ?? '',
                ]);
            }
            fclose($out);
        }, 'auth-export-'.now()->toDateString().'.csv', ['Content-Type' => 'text/csv']);
    }
}
