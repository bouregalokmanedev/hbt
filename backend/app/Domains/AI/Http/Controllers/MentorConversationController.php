<?php

namespace App\Domains\AI\Http\Controllers;

use App\Domains\AI\Actions\CreateMentorConversationAction;
use App\Domains\AI\Models\MentorConversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Domains\AI\Resources\MentorConversationResource;

final class MentorConversationController
{
    public function __construct(
        private CreateMentorConversationAction $createConversation,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $conversations = MentorConversation::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('last_message_at')
            ->latest()
            ->get();

        return response()->json([
            'data' => MentorConversationResource::collection($conversations),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => ['nullable', 'string'],
            'lesson_id' => ['nullable', 'string'],
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $conversation = $this->createConversation->execute(
                user: $request->user(),
                courseId: $validated['course_id'] ?? null,
                lessonId: $validated['lesson_id'] ?? null,
                title: $validated['title'] ?? null,
            );
        } catch (\LogicException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'data' => new MentorConversationResource($conversation),
        ], 201);
    }

    public function show(
    MentorConversation $conversation,
): JsonResponse {
    Gate::authorize('view', $conversation);
    $conversation->load('messages');

    return response()->json([
        'data' => new MentorConversationResource($conversation),
    ]);
}

    public function update(
        Request $request,
        MentorConversation $conversation,
    ): JsonResponse {
        Gate::authorize('update', $conversation);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:active,archived,closed'],
        ]);

        $conversation->fill($validated)->save();

        return response()->json([
            'data' => new MentorConversationResource($conversation),
        ]);
    }

    /**
     * Archive rather than permanently remove a learner's mentor history.
     */
    public function destroy(MentorConversation $conversation): JsonResponse
    {
        Gate::authorize('delete', $conversation);

        $conversation->update([
            'status' => \App\Domains\AI\Enums\MentorConversationStatus::ARCHIVED,
        ]);

        return response()->json(status: 204);
    }
}
