<?php

namespace App\Domains\Support\Controllers;

use App\Domains\Support\Enums\TicketStatus;
use App\Domains\Support\Models\SupportTicket;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class SupportDashboardController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $user = $request->user();

        $open = SupportTicket::query()->where('status', TicketStatus::OPEN->value)->count();
        $pending = SupportTicket::query()->where('status', TicketStatus::PENDING->value)->count();
        $resolved = SupportTicket::query()->where('status', TicketStatus::RESOLVED->value)->count();
        $overdue = SupportTicket::query()
            ->whereIn('status', [TicketStatus::OPEN->value, TicketStatus::PENDING->value])
            ->whereNotNull('due_at')
            ->where('due_at', '<', now())
            ->count();
        $unassigned = SupportTicket::query()
            ->whereIn('status', [TicketStatus::OPEN->value, TicketStatus::PENDING->value])
            ->whereNull('assigned_to')
            ->count();
        $mine = SupportTicket::query()
            ->where('assigned_to', $user->id)
            ->whereIn('status', [TicketStatus::OPEN->value, TicketStatus::PENDING->value])
            ->count();
        $resolvedByMe = SupportTicket::query()
            ->where('assigned_to', $user->id)
            ->where('status', TicketStatus::RESOLVED->value)
            ->count();

        $csat = SupportTicket::query()
            ->whereNotNull('rating')
            ->selectRaw('COALESCE(AVG(rating), 0) AS average, COUNT(*) AS count')
            ->first();

        $recent = SupportTicket::query()
            ->with(['user:id,first_name,last_name,email', 'assignee:id,first_name,last_name'])
            ->latest()
            ->take(8)
            ->get()
            ->map(fn (SupportTicket $ticket) => [
                'id' => $ticket->id,
                'subject' => $ticket->subject,
                'status' => $ticket->status->value,
                'priority' => $ticket->priority->value,
                'user' => $ticket->user?->full_name,
                'assignee' => $ticket->assignee?->full_name,
                'overdue' => $ticket->isOverdue(),
                'created_at' => $ticket->created_at?->toISOString(),
            ]);

        $myQueue = SupportTicket::query()
            ->with(['user:id,first_name,last_name,email'])
            ->where('assigned_to', $user->id)
            ->whereIn('status', [TicketStatus::OPEN->value, TicketStatus::PENDING->value])
            ->latest()
            ->take(8)
            ->get()
            ->map(fn (SupportTicket $ticket) => [
                'id' => $ticket->id,
                'subject' => $ticket->subject,
                'status' => $ticket->status->value,
                'priority' => $ticket->priority->value,
                'user' => $ticket->user?->full_name,
                'overdue' => $ticket->isOverdue(),
                'created_at' => $ticket->created_at?->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Support overview retrieved.',
            'data' => [
                'summary' => compact('open', 'pending', 'resolved', 'overdue', 'unassigned', 'mine', 'resolvedByMe'),
                'csat' => [
                    'average' => round((float) ($csat->average ?? 0), 2),
                    'count' => (int) ($csat->count ?? 0),
                ],
                'recent' => $recent,
                'my_queue' => $myQueue,
            ],
        ]);
    }

    /**
     * Per-agent performance for the team leaderboard: open load, resolved
     * this month, average first-response (hours) and CSAT. Sorted by resolved
     * desc so the top of the list is the most productive agent.
     */
    public function agents(): JsonResponse
    {
        $staff = User::query()
            ->whereHas('roles', fn ($roles) => $roles->whereIn('name', [
                UserRole::SUPPORT->value,
                UserRole::ADMIN->value,
                UserRole::SUPER_ADMIN->value,
            ]))
            ->with('roles:id,name')
            ->get();

        $monthStart = now()->startOfMonth();

        $rows = $staff->map(function (User $agent) use ($monthStart): array {
            $assigned = SupportTicket::query()->where('assigned_to', $agent->id);

            $open = (clone $assigned)
                ->whereIn('status', [TicketStatus::OPEN->value, TicketStatus::PENDING->value])
                ->count();

            $resolvedMonth = (clone $assigned)
                ->where('status', TicketStatus::RESOLVED->value)
                ->where('resolved_at', '>=', $monthStart)
                ->count();

            $csat = (clone $assigned)
                ->whereNotNull('rating')
                ->selectRaw('COALESCE(AVG(rating), 0) AS average, COUNT(*) AS count')
                ->first();

            $firstResponseHours = $this->averageFirstResponseHours($agent->id);

            return [
                'id' => $agent->uuid,
                'name' => $agent->full_name,
                'email' => $agent->email,
                'roles' => $agent->roles->pluck('name')->all(),
                'open' => $open,
                'resolved_month' => $resolvedMonth,
                'csat_average' => round((float) ($csat->average ?? 0), 2),
                'csat_count' => (int) ($csat->count ?? 0),
                'avg_first_response_hours' => $firstResponseHours,
            ];
        })->filter(fn (array $row) => $row['open'] > 0 || $row['resolved_month'] > 0 || $row['csat_count'] > 0)
            ->sortByDesc('resolved_month')
            ->values();

        return response()->json(['data' => $rows]);
    }

    /**
     * Average hours between ticket creation and the agent's first non-internal
     * reply, across the agent's assigned tickets that got a reply. Agents who
     * never replied report null (rendered as "—").
     */
    private function averageFirstResponseHours(int $agentId): ?float
    {
        $tickets = SupportTicket::query()
            ->where('assigned_to', $agentId)
            ->with('replies')
            ->get();

        $durations = $tickets->map(function (SupportTicket $ticket) use ($agentId): ?float {
            $first = $ticket->replies
                ->where('user_id', $agentId)
                ->where('internal', false)
                ->sortBy('created_at')
                ->first();

            if (! $first || ! $ticket->created_at) {
                return null;
            }

            return $ticket->created_at->diffInSeconds($first->created_at) / 3600;
        })->filter()->values();

        if ($durations->isEmpty()) {
            return null;
        }

        return round($durations->avg(), 1);
    }
}
