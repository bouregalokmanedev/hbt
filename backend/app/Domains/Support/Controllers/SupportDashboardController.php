<?php

namespace App\Domains\Support\Controllers;

use App\Domains\Support\Enums\TicketStatus;
use App\Domains\Support\Models\SupportTicket;
use App\Http\Controllers\Controller;
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
                'recent' => $recent,
                'my_queue' => $myQueue,
            ],
        ]);
    }
}
