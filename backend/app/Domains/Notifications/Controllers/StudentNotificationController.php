<?php

namespace App\Domains\Notifications\Controllers;

use App\Domains\Notifications\Models\StudentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentNotificationController
{
    public function index(Request $request): JsonResponse
    {
        $notifications = StudentNotification::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (StudentNotification $notification) => $this->serialize($notification));

        return response()->json(['data' => ['items' => $notifications, 'unread_count' => $notifications->whereNull('read_at')->count()]]);
    }

    public function read(Request $request, StudentNotification $notification): JsonResponse
    {
        abort_unless($notification->user_id === $request->user()->id, 404);
        $notification->update(['read_at' => now()]);
        return response()->json(['data' => $this->serialize($notification->fresh())]);
    }

    public function readAll(Request $request): JsonResponse
    {
        StudentNotification::query()->where('user_id', $request->user()->id)->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['data' => ['success' => true]]);
    }

    private function serialize(StudentNotification $notification): array
    {
        return ['id' => (string) $notification->id, 'type' => $notification->type, 'title' => $notification->title, 'message' => $notification->message, 'action_url' => $notification->action_url, 'conversation_id' => $notification->message_conversation_id, 'broadcast_id' => $notification->admin_broadcast_id, 'read_at' => $notification->read_at?->toISOString(), 'created_at' => $notification->created_at?->toISOString()];
    }
}
