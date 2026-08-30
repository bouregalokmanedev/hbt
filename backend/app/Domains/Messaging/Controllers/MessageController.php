<?php

namespace App\Domains\Messaging\Controllers;

use App\Domains\Messaging\Models\MessageConversation;
use App\Domains\Messaging\Resources\MessageResource;
use App\Domains\Messaging\Services\MessagingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class MessageController
{
    public function store(Request $request, MessageConversation $conversation, MessagingService $messaging)
    {
        Gate::authorize('send', $conversation);
        $data = $request->validate([
            'body' => ['required', 'string', 'min:1', 'max:5000'],
            'message_type' => ['nullable', 'in:text,quick_reply'],
        ]);
        return new MessageResource($messaging->send($request->user(), $conversation, $data['body'], $data['message_type'] ?? 'text'));
    }

    public function read(Request $request, MessageConversation $conversation, MessagingService $messaging)
    {
        Gate::authorize('view', $conversation);
        $messaging->markRead($request->user(), $conversation);
        return response()->json(['data' => ['success' => true]]);
    }
}
