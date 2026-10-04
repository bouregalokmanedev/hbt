<?php

namespace App\Domains\Messaging\Controllers;

use App\Domains\Admin\Resources\AdminBroadcastResource;
use App\Domains\Admin\Services\AdminBroadcastService;
use App\Domains\Messaging\Resources\ConversationResource;
use App\Domains\Messaging\Services\MessagingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class StaffHubController
{
    /**
     * Ensure the shared staff room exists and that this user is a member of
     * it, then hand it back. Creating it is idempotent, so the frontend can
     * call this on every visit to the Hub.
     */
    public function room(Request $request, MessagingService $messaging): JsonResponse
    {
        $conversation = $messaging->staffRoomFor($request->user());

        $conversation->load(['broadcast', 'participants' => $messaging->participantsLoader()]);

        // This GET may create the room on first call, which would otherwise be
        // reported as 201. It is an idempotent read, so always answer 200.
        return (new ConversationResource($conversation))
            ->toResponse($request)
            ->setStatusCode(Response::HTTP_OK);
    }

    /**
     * Publish news to every member of staff. Available to Admin, Super Admin,
     * Support and Instructor alike — the audience is always forced to `staff`
     * so this endpoint can never be used to reach students.
     */
    public function storeNews(Request $request, AdminBroadcastService $broadcasts): AdminBroadcastResource
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            'action_url' => ['nullable', 'string', 'max:2048'],
            'replies_enabled' => ['nullable', 'boolean'],
            'quick_replies' => ['nullable', 'array', 'max:4'],
            'quick_replies.*' => ['string', 'max:100'],
        ]);

        return new AdminBroadcastResource(
            $broadcasts->send($request->user(), [
                ...$data,
                'audience' => 'staff',
                'type' => 'announcement',
            ]),
        );
    }
}
