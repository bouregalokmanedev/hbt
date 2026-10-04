<?php

namespace App\Domains\Messaging\Controllers;

use App\Domains\Messaging\Models\MessageConversation;
use App\Domains\Messaging\Resources\ConversationResource;
use App\Domains\Messaging\Services\MessagingService;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

final class ConversationController
{
    public function index(Request $request, MessagingService $messaging)
    {
        $data = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:200'],
            'offset' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'type' => ['nullable', Rule::in([...MessagingService::INBOX_TYPES, 'not_announcement'])],
        ]);

        $type = $data['type'] ?? null;
        $types = match ($type) {
            null => null,
            'not_announcement' => ['direct', 'group', MessagingService::STAFF_ROOM_TYPE],
            default => [$type],
        };

        return ConversationResource::collection(
            $messaging->conversationsFor($request->user(), (int) ($data['limit'] ?? MessagingService::INBOX_LIMIT), (int) ($data['offset'] ?? 0), $types)
        );
    }

    public function contacts(Request $request, MessagingService $messaging)
    {
        return response()->json(['data' => $messaging->contactsFor($request->user())->map(fn (User $user) => [
            'id' => $user->uuid,
            'name' => $user->full_name,
            'email' => $user->email,
            'role' => $user->getRoleNames()->first(),
        ])->values()]);
    }

    public function store(Request $request, MessagingService $messaging)
    {
        if ($request->has('recipient_ids')) {
            return $this->storeGroup($request, $messaging);
        }
        $data = $request->validate([
            'recipient_id' => ['required', 'uuid', 'exists:users,uuid'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:5000'],
        ]);
        $recipient = User::query()->where('uuid', $data['recipient_id'])->where('status', 'active')->firstOrFail();
        abort_if((int) $recipient->id === (int) $request->user()->id, 422, 'You cannot start a conversation with yourself.');
        abort_unless($messaging->canContact($request->user(), $recipient), 403, 'You cannot contact this account.');
        $conversation = $messaging->create($request->user(), $recipient, $data['subject'] ?? null);
        if (!empty($data['message'])) $messaging->send($request->user(), $conversation, $data['message']);
        return new ConversationResource($conversation->fresh(['participants']));
    }

    private function storeGroup(Request $request, MessagingService $messaging)
    {
        $data = $request->validate([
            'recipient_ids' => ['required', 'array', 'min:2', 'max:8', 'distinct'],
            'recipient_ids.*' => ['uuid', 'exists:users,uuid'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:5000'],
        ]);
        $recipients = User::query()->whereIn('uuid', $data['recipient_ids'])->where('status', 'active')->get();
        abort_if($recipients->count() !== count($data['recipient_ids']), 422, 'One or more recipients could not be found.');
        abort_if($recipients->contains(fn (User $user) => (int) $user->id === (int) $request->user()->id), 422, 'You cannot start a group conversation with yourself.');
        foreach ($recipients as $recipient) {
            abort_unless($messaging->canContact($request->user(), $recipient), 403, 'You cannot contact this account.');
        }
        $conversation = $messaging->createGroup($request->user(), $recipients->all(), $data['subject']);
        if (!empty($data['message'])) $messaging->send($request->user(), $conversation, $data['message']);
        return new ConversationResource($conversation->fresh(['participants']));
    }

    public function show(Request $request, MessageConversation $conversation, MessagingService $messaging)
    {
        Gate::authorize('view', $conversation);
        $conversation->load(['broadcast', 'participants' => $messaging->participantsLoader()]);
        $viewer = $request->user();

        // Single-thread reads are also the only place these are meaningful:
        // typing state and presence are per-thread, and the unread marker
        // costs a query — neither belongs on the inbox list.
        $conversation->setAttribute('typing_user_ids', $messaging->typingUserIds($conversation, $viewer));
        $conversation->setAttribute('first_unread_at', $messaging->firstUnreadAt($viewer, $conversation));
        $participant = $conversation->participants->first(fn (User $member) => (int) $member->id !== (int) $viewer->id);
        $conversation->setAttribute('participant_online', $participant !== null && $messaging->isOnline($participant));

        $messages = $conversation->messages()->reorder()
            ->with(['sender:id,uuid,first_name,last_name', 'replyTo.sender:id,uuid,first_name,last_name'])
            ->orderByDesc('messages.created_at')->orderByDesc('messages.id')->limit(30)->get()
            ->reverse()->values();
        $conversation->setRelation('messages', $messages);
        return new ConversationResource($conversation);
    }

    public function archive(MessageConversation $conversation)
    {
        Gate::authorize('archive', $conversation);
        $conversation->update(['status' => 'archived']);
        return response()->noContent();
    }

    /**
     * Muting is per participant — unlike `status`, it must never affect anyone
     * else in the conversation. A muted thread stops contributing to the
     * sidebar badge but stays in the inbox and stays readable.
     */
    public function mute(Request $request, MessageConversation $conversation, MessagingService $messaging)
    {
        Gate::authorize('view', $conversation);

        $data = $request->validate(['muted' => ['required', 'boolean']]);
        $muted = (bool) $data['muted'];
        $messaging->setMuted($request->user(), $conversation, $muted);

        return response()->json(['data' => ['muted' => $muted]]);
    }
}
