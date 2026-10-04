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
    
    try {
        $message = $this->sendMessage->execute(
            conversation: $conversation,
            user: $request->user(),
            message: $validated['message'],
        );
    } catch (\RuntimeException $e) {
        // abort() also throws a RuntimeException subclass — those carry a
        // status and copy we already want the client to see.
        if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
            throw $e;
        }

        // Provider outages, rate limits and bad upstream payloads all arrive
        // here; the detail belongs in the log, not in the student's chat.
        report($e);

        return response()->json([
            'success' => false,
            'message' => 'The AI mentor is unavailable right now. Please try again in a moment.',
        ], 503);
    }

    return response()->json([
        'data' => new MentorMessageResource($message),
    ], 201);
}
}
