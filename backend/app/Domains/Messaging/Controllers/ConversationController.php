<?php

namespace App\Domains\Messaging\Controllers;

use App\Domains\Messaging\Models\MessageConversation;
use App\Domains\Messaging\Resources\ConversationResource;
use App\Domains\Messaging\Services\MessagingService;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class ConversationController
{
    public function index(Request $request, MessagingService $messaging)
    {
        return ConversationResource::collection($messaging->conversationsFor($request->user()));
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

    public function show(Request $request, MessageConversation $conversation)
    {
        Gate::authorize('view', $conversation);
        return new ConversationResource($conversation->load(['broadcast', 'participants:id,uuid,first_name,last_name,email', 'messages.sender:id,uuid,first_name,last_name']));
    }

    public function archive(MessageConversation $conversation)
    {
        Gate::authorize('update', $conversation);
        $conversation->update(['status' => 'archived']);
        return response()->noContent();
    }
}
