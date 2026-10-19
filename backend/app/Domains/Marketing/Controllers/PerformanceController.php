<?php

namespace App\Domains\Marketing\Controllers;

use App\Http\Controllers\Controller;
use App\Models\SalesQuota;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Rep performance: per-sales-member pipeline stats for the current month
 * plus a simple deal quota (won leads per month) the team sets themselves.
 */
final class PerformanceController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $month = now()->format('Y-m');

        $reps = User::query()
            ->whereHas('roles', fn ($builder) => $builder->whereIn('name', ['Sales', 'Admin', 'Super Admin']))
            ->orderBy('first_name')
            ->get();

        $quotas = SalesQuota::query()
            ->where('year_month', $month)
            ->get()
            ->keyBy('user_id');

        $rows = $reps->map(function (User $rep) use ($quotas) {
            $assigned = fn () => $rep->ownedLeads();

            $won = $assigned()->where('status', 'won')
                ->where('closed_at', '>=', now()->startOfMonth())
                ->count();
            $lost = $assigned()->where('status', 'lost')
                ->where('closed_at', '>=', now()->startOfMonth())
                ->count();

            return [
                'id' => $rep->uuid,
                'name' => trim($rep->first_name.' '.$rep->last_name),
                'email' => $rep->email,
                'open' => $assigned()->whereNotIn('status', ['won', 'lost'])->count(),
                'won_month' => $won,
                'lost_month' => $lost,
                'due_today' => $assigned()->due('today')->count(),
                'overdue' => $assigned()->due('overdue')->count(),
                'quota_target' => (int) ($quotas->get($rep->uuid)?->target ?? 0),
                'quota_progress' => null,
            ];
        })->sortByDesc('won_month')->values();

        return response()->json([
            'data' => [
                'month' => $month,
                'reps' => $rows->map(fn (array $row) => [
                    ...$row,
                    'quota_progress' => $row['quota_target'] > 0
                        ? min(100, (int) round($row['won_month'] / $row['quota_target'] * 100))
                        : null,
                ]),
            ],
        ]);
    }

    /** Set the monthly deal quota for a rep (team-visible target). */
    public function setQuota(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'uuid', 'exists:users,uuid'],
            'target' => ['required', 'integer', 'min:0', 'max:999'],
        ]);

        $rep = User::query()->where('uuid', $data['user_id'])->firstOrFail();
        abort_unless(
            $rep->hasAnyRole(['Sales', 'Admin', 'Super Admin']),
            422,
            'Quota targets can only be set for sales team members.'
        );

        $quota = SalesQuota::query()->firstOrNew([
            'user_id' => $rep->uuid,
            'year_month' => now()->format('Y-m'),
        ]);
        $quota->target = (int) $data['target'];
        $quota->save();

        return response()->json([
            'data' => [
                'user_id' => $rep->uuid,
                'year_month' => $quota->year_month,
                'target' => $quota->target,
            ],
        ]);
    }
}
