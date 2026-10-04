<?php

namespace App\Domains\Support\Controllers;

use App\Domains\Notifications\Services\StudentNotificationService;
use App\Domains\Support\Actions\CreateTicketAction;
use App\Domains\Support\Enums\TicketStatus;
use App\Domains\Support\Models\SupportTicket;
use App\Http\Controllers\Controller;
use App\Models\User;
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

        $this->notifyAssignee($ticket, (int) $request->user()->id, $data['message']);

        return response()->json([
            'success' => true,
            'message' => 'Reply sent.',
            'data' => $this->serialize($ticket->fresh()->load(['replies.user:id,uuid,first_name,last_name']), true),
        ]);
    }

    /**
     * Nudge the assigned agent when the student replies (in-app + email via
     * the shared notification service; failures never fail the reply).
     */
    private function notifyAssignee(SupportTicket $ticket, int $replierId, string $message): void
    {
        if ($ticket->assigned_to === null || (int) $ticket->assigned_to === $replierId) {
            return;
        }

        $assignee = User::query()->find($ticket->assigned_to);

        if ($assignee === null) {
            return;
        }

        try {
            app(StudentNotificationService::class)->send(
                $assignee,
                'support',
                'New reply on ticket #'.substr((string) $ticket->id, 0, 8),
                \Illuminate\Support\Str::limit(trim($message), 160),
                '/support-desk/tickets/'.$ticket->id,
                'ticket:'.$ticket->id.':student-reply',
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Support assignee notification failed: '.$e->getMessage(), [
                'ticket_id' => $ticket->id,
            ]);
        }
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

    /**
     * POST /support/tickets/{ticket}/rating
     * CSAT score from the ticket owner once the ticket is resolved or closed.
     */
    public function rating(Request $request, SupportTicket $ticket): JsonResponse
    {
        abort_unless($ticket->user_id === $request->user()->id, 403, 'Only the ticket owner can rate it.');
        abort_unless(
            in_array($ticket->status, [TicketStatus::RESOLVED, TicketStatus::CLOSED], true),
            422,
            'This ticket can be rated once it has been resolved.'
        );

        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $ticket->update([
            'rating' => (int) $data['rating'],
            'rating_comment' => $data['comment'] ?? null,
            'rated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thanks for your feedback.',
            'data' => $this->serialize($ticket->fresh()),
        ]);
    }

    /**
     * GET /support/tickets/{ticket}/status?email=...
     * Public status lookup (no session): the UUID alone is not enough, the
     * requester must also know the address the ticket was filed with.
     */
    public function status(Request $request, SupportTicket $ticket): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $owner = $ticket->user()->first();

        abort_if(
            $owner === null || strcasecmp((string) $owner->email, strtolower(trim($data['email']))) !== 0,
            404,
            'No ticket found for that reference and email address.'
        );

        return response()->json([
            'success' => true,
            'message' => 'Ticket status retrieved.',
            'data' => $this->serialize($ticket->load(['replies.user:id,uuid,first_name,last_name']), true),
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
            'rating' => $ticket->rating !== null ? (int) $ticket->rating : null,
            'rating_comment' => $ticket->rating_comment,
            'rated_at' => $ticket->rated_at?->toISOString(),
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
