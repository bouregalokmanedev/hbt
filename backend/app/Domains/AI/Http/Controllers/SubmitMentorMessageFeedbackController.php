<?php

namespace App\Domains\AI\Http\Controllers;

use App\Domains\AI\Actions\SubmitMentorMessageFeedbackAction;
use App\Domains\AI\Enums\MentorFeedbackRating;
use App\Domains\AI\Http\Requests\SubmitMentorMessageFeedbackRequest;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Resources\MentorMessageFeedbackResource;
use Illuminate\Http\JsonResponse;

final class SubmitMentorMessageFeedbackController
{
    public function __invoke(
        SubmitMentorMessageFeedbackRequest $request,
        MentorMessage $message,
        SubmitMentorMessageFeedbackAction $action,
    ): JsonResponse {
        $validated = $request->validated();

        $feedback = $action->execute(
            message: $message,
            user: $request->user(),
            rating: MentorFeedbackRating::from($validated['rating']),
            reason: $validated['reason'] ?? null,
            comment: $validated['comment'] ?? null,
        );

        return response()->json([
            'data' => new MentorMessageFeedbackResource($feedback),
        ]);
    }
}