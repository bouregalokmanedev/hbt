<?php

namespace App\Domains\Support\Controllers;

use App\Domains\Support\Actions\CreateTicketAction;
use App\Domains\Support\Enums\TicketStatus;
use App\Domains\Support\Models\SupportTicket;
use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SupportTicket::class);

        $tickets = SupportTicket::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json([
            'success' => true,
            'message' => 'Tickets retrieved.',
            'data' => [
                'items' => $tickets->getCollection()->map(fn (SupportTicket $ticket) => $this->serialize($ticket)),
                'meta' => [
                    'current_page' => $tickets->currentPage(),
                    'last_page' => $tickets->lastPage(),
                    'per_page' => $tickets->perPage(),
                    'total' => $tickets->total(),
                ],
            ],
        ]);
    }

    public function show(Request $request, SupportTicket $ticket): JsonResponse
    {
        $this->authorize('view', $ticket);

        return response()->json([
            'success' => true,
            'message' => 'Ticket retrieved.',
            'data' => $this->serialize($ticket->load(['replies.user:id,uuid,first_name,last_name']), true),
        ]);
    }

    public function store(Request $request, CreateTicketAction $create): JsonResponse
    {
        $this->authorize('create', SupportTicket::class);

        $data = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'category' => ['sometimes', 'string', 'in:general,courses,certification,simulator,technical,billing,account,other'],
            'priority' => ['sometimes', 'string', 'in:low,normal,high,urgent'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
        ]);

        $ticket = $create->execute($request->user(), $data);

        return response()->json([
            'success' => true,
            'message' => 'Ticket created. Our support team will reply soon.',
            'data' => $this->serialize($ticket),
        ], 201);
    }

    public function reply(Request $request, SupportTicket $ticket): JsonResponse
    {
        $this->authorize('reply', $ticket);

        $data = $request->validate([
            'message' => ['required', 'string', 'min:1', 'max:5000'],
        ]);

        $ticket->replies()->create([
            'user_id' => $request->user()->id,
            'body' => $data['message'],
            'internal' => false,
        ]);

        if ($ticket->status === TicketStatus::RESOLVED) {
            $ticket->update(['status' => TicketStatus::OPEN->value, 'resolved_at' => null]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Reply sent.',
            'data' => $this->serialize($ticket->fresh()->load(['replies.user:id,uuid,first_name,last_name']), true),
        ]);
    }

    public function close(Request $request, SupportTicket $ticket): JsonResponse
    {
        $this->authorize('reply', $ticket);

        $ticket->update([
            'status' => TicketStatus::CLOSED->value,
            'closed_at' => now(),
        ]);

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
            'due_at' => $ticket->due_at?->toISOString(),
            'resolved_at' => $ticket->resolved_at?->toISOString(),
            'created_at' => $ticket->created_at?->toISOString(),
            'replies_count' => $ticket->replies()->count(),
        ];

        if ($verbose) {
            $payload['replies'] = $ticket->replies->sortBy('created_at')->values()->map(fn ($reply) => [
                'id' => $reply->id,
                'author' => $reply->user?->full_name,
                'author_id' => $reply->user_id,
                'author_uuid' => $reply->user?->uuid,
                'body' => $reply->internal ? null : $reply->body,
                'internal' => (bool) $reply->internal,
                'created_at' => $reply->created_at?->toISOString(),
            ])->filter(fn ($reply) => ! $reply['internal'])->values();
        }

        return $payload;
    }
}
