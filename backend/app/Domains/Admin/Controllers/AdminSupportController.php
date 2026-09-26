<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Support\Enums\TicketLevel;
use App\Domains\Support\Enums\TicketStatus;
use App\Domains\Support\Models\SupportTicket;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSupportController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('manage', SupportTicket::class);

        $query = SupportTicket::query()->with(['user:id,first_name,last_name,email', 'assignee:id,first_name,last_name']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($level = $request->query('level')) {
            $query->where('level', $level);
        }
        if ($request->query('assigned') === 'me') {
            $query->where('assigned_to', $request->user()->id);
        } elseif ($request->query('assigned') === 'unassigned') {
            $query->whereNull('assigned_to');
        }
        if ($request->query('overdue') === 'true') {
            $query->whereIn('status', [TicketStatus::OPEN->value, TicketStatus::PENDING->value])
                ->whereNotNull('due_at')
                ->where('due_at', '<', now());
        }
        if ($search = trim((string) $request->query('search', ''))) {
            $needle = '%'.mb_strtolower($search).'%';
            $query->where(function ($builder) use ($needle) {
                $builder->whereRaw('LOWER(subject) LIKE ?', [$needle])
                    ->orWhereHas('user', fn ($users) => $users
                        ->whereRaw('LOWER(email) LIKE ?', [$needle])
                        ->orWhereRaw('LOWER(first_name) LIKE ?', [$needle])
                        ->orWhereRaw('LOWER(last_name) LIKE ?', [$needle]));
            });
        }

        $tickets = $query->latest()->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json([
            'data' => $tickets->getCollection()->map(fn (SupportTicket $ticket) => $this->serialize($ticket)),
            'meta' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
            'summary' => [
                'open' => SupportTicket::query()->where('status', TicketStatus::OPEN->value)->count(),
                'pending' => SupportTicket::query()->where('status', TicketStatus::PENDING->value)->count(),
                'overdue' => SupportTicket::query()
                    ->whereIn('status', [TicketStatus::OPEN->value, TicketStatus::PENDING->value])
                    ->whereNotNull('due_at')
                    ->where('due_at', '<', now())
                    ->count(),
                'unassigned' => SupportTicket::query()
                    ->whereIn('status', [TicketStatus::OPEN->value, TicketStatus::PENDING->value])
                    ->whereNull('assigned_to')
                    ->count(),
            ],
        ]);
    }

    public function show(Request $request, SupportTicket $ticket): JsonResponse
    {
        $this->authorize('manage', SupportTicket::class);

        return response()->json([
            'success' => true,
            'message' => 'Ticket retrieved.',
            'data' => $this->serialize(
                $ticket->load(['user:id,first_name,last_name,email', 'assignee:id,first_name,last_name', 'replies.user:id,uuid,first_name,last_name']),
                true,
            ),
        ]);
    }

    public function reply(Request $request, SupportTicket $ticket, AuditService $audit): JsonResponse
    {
        $this->authorize('manage', SupportTicket::class);
        abort_if($ticket->status === TicketStatus::CLOSED, 422, 'This ticket is closed.');

        $data = $request->validate([
            'message' => ['required', 'string', 'min:1', 'max:5000'],
            'internal' => ['sometimes', 'boolean'],
        ]);

        $reply = $ticket->replies()->create([
            'user_id' => $request->user()->id,
            'body' => $data['message'],
            'internal' => $data['internal'] ?? false,
        ]);

        if (! $reply->internal && $ticket->status === TicketStatus::OPEN) {
            $ticket->update(['status' => TicketStatus::PENDING->value]);
        }

        $audit->log('ticket.replied', $ticket, [], [], ['internal' => $reply->internal]);

        return response()->json([
            'success' => true,
            'message' => $reply->internal ? 'Internal note saved.' : 'Reply sent to the student.',
            'data' => $this->serialize($ticket->fresh()->load(['user:id,first_name,last_name,email', 'assignee:id,first_name,last_name', 'replies.user:id,uuid,first_name,last_name']), true),
        ]);
    }

    public function assign(Request $request, SupportTicket $ticket, AuditService $audit): JsonResponse
    {
        $this->authorize('manage', SupportTicket::class);

        $data = $request->validate([
            'assignee_id' => ['required', 'uuid', 'exists:users,uuid'],
        ]);

        $assignee = User::where('uuid', $data['assignee_id'])->firstOrFail();
        abort_unless(
            $assignee->hasAnyRole([UserRole::SUPPORT->value, UserRole::ADMIN->value, UserRole::SUPER_ADMIN->value]),
            422,
            'Tickets can only be assigned to support staff.',
        );

        $old = $ticket->assignee?->email;
        $ticket->update(['assigned_to' => $assignee->id]);

        $audit->log('ticket.assigned', $ticket, ['assignee' => $old], ['assignee' => $assignee->email]);

        return response()->json([
            'success' => true,
            'message' => "Ticket assigned to {$assignee->full_name}.",
            'data' => $this->serialize($ticket->fresh()),
        ]);
    }

    public function escalate(Request $request, SupportTicket $ticket, AuditService $audit): JsonResponse
    {
        $this->authorize('manage', SupportTicket::class);

        $data = $request->validate([
            'level' => ['required', 'string', 'in:admin,super_admin'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $order = [TicketLevel::SUPPORT->value => 0, TicketLevel::ADMIN->value => 1, TicketLevel::SUPER_ADMIN->value => 2];
        abort_if(
            ($order[$ticket->level->value] ?? 0) >= ($order[$data['level']] ?? 0),
            422,
            'Tickets can only be escalated upward.',
        );

        if ($data['level'] === TicketLevel::SUPER_ADMIN->value) {
            abort_unless($request->user()->hasAnyRole([UserRole::ADMIN->value, UserRole::SUPER_ADMIN->value]), 403, 'Only admins can escalate to Super Admin.');
        }

        $old = $ticket->level->value;
        $ticket->update(['level' => $data['level'], 'assigned_to' => null]);

        if (! empty($data['note'])) {
            $ticket->replies()->create([
                'user_id' => $request->user()->id,
                'body' => 'Escalation note: '.$data['note'],
                'internal' => true,
            ]);
        }

        $audit->log('ticket.escalated', $ticket, ['level' => $old], ['level' => $data['level']]);

        return response()->json([
            'success' => true,
            'message' => 'Ticket escalated.',
            'data' => $this->serialize($ticket->fresh()),
        ]);
    }

    public function resolve(Request $request, SupportTicket $ticket, AuditService $audit): JsonResponse
    {
        $this->authorize('manage', SupportTicket::class);
        abort_if($ticket->status === TicketStatus::CLOSED, 422, 'This ticket is closed.');

        $ticket->update([
            'status' => TicketStatus::RESOLVED->value,
            'resolved_at' => now(),
        ]);

        $audit->log('ticket.resolved', $ticket);

        return response()->json([
            'success' => true,
            'message' => 'Ticket marked as resolved.',
            'data' => $this->serialize($ticket->fresh()),
        ]);
    }

    public function close(Request $request, SupportTicket $ticket, AuditService $audit): JsonResponse
    {
        $this->authorize('manage', SupportTicket::class);

        $ticket->update([
            'status' => TicketStatus::CLOSED->value,
            'closed_at' => now(),
        ]);

        $audit->log('ticket.closed', $ticket);

        return response()->json([
            'success' => true,
            'message' => 'Ticket closed.',
            'data' => $this->serialize($ticket->fresh()),
        ]);
    }

    private function serialize(SupportTicket $ticket, bool $verbose = false): array
    {
        $payload = [
            'id' => $ticket->id,
            'subject' => $ticket->subject,
            'category' => $ticket->category,
            'priority' => $ticket->priority->value,
            'status' => $ticket->status->value,
            'level' => $ticket->level->value,
            'user' => $ticket->user?->full_name,
            'email' => $ticket->user?->email,
            'assignee' => $ticket->assignee?->full_name,
            'due_at' => $ticket->due_at?->toISOString(),
            'overdue' => $ticket->isOverdue(),
            'created_at' => $ticket->created_at?->toISOString(),
        ];

        if ($verbose) {
            $payload['replies'] = $ticket->replies->sortBy('created_at')->values()->map(fn ($reply) => [
                'id' => $reply->id,
                'author' => $reply->user?->full_name,
                'author_id' => $reply->user_id,
                'author_uuid' => $reply->user?->uuid,
                'body' => $reply->body,
                'internal' => (bool) $reply->internal,
                'created_at' => $reply->created_at?->toISOString(),
            ]);
        }

        return $payload;
    }
}
