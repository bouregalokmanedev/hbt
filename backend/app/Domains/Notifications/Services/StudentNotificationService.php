<?php

namespace App\Domains\Notifications\Services;

use App\Domains\Notifications\Models\StudentNotification;
use App\Models\User;

class StudentNotificationService
{
    public function send(User $user, string $type, string $title, string $message, ?string $actionUrl = null, ?string $dedupeKey = null, ?string $broadcastId = null, ?string $conversationId = null): bool
    {
        if ($user->studentNotificationSetting?->in_app_enabled === false) {
            return false;
        }

        $notification = StudentNotification::query()->firstOrCreate(
            ['user_id' => $user->id, 'dedupe_key' => $dedupeKey],
            [
                'admin_broadcast_id' => $broadcastId,
                'message_conversation_id' => $conversationId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'action_url' => $actionUrl,
            ],
        );

        return $notification->wasRecentlyCreated;
    }
}
