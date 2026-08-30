<?php

namespace App\Domains\AI\Http\Controllers;

use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Services\MentorConversationAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

final class MentorConversationAnalyticsController
{
    public function __construct(
        private readonly MentorConversationAnalyticsService $analyticsService,
    ) {
    }

    public function show(
        MentorConversation $conversation,
    ): JsonResponse {
        Gate::authorize('view', $conversation);

        return response()->json([
            'data' => $this->analyticsService->calculate($conversation),
        ]);
    }
}