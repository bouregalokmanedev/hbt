<?php

namespace App\Domains\AI\Http\Controllers;

use App\Domains\AI\Actions\SendMentorMessageAction;
use App\Domains\AI\Enums\MentorConversationStatus;
use App\Domains\AI\Models\MentorConversation;
use Illuminate\Http\JsonResponse;
use App\Domains\AI\Http\Requests\SendMentorMessageRequest;
use Illuminate\Support\Facades\Gate;
use App\Domains\AI\Resources\MentorMessageResource;

final class SendMentorMessageController
{
    public function __construct(
        private SendMentorMessageAction $sendMessage,
    ) {
    }

    public function __invoke(
    SendMentorMessageRequest $request,
    MentorConversation $conversation,
): JsonResponse {
    Gate::authorize('view', $conversation);

    if ($conversation->status !== MentorConversationStatus::ACTIVE) {
        return response()->json([
            'message' => 'This mentor conversation is inactive.',
        ], 422);
    }

    $validated = $request->validated();
    
    $message = $this->sendMessage->execute(
        conversation: $conversation,
        user: $request->user(),
        message: $validated['message'],
    );

    return response()->json([
        'data' => new MentorMessageResource($message),
    ], 201);
}
}
