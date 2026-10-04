<?php

namespace App\Domains\Messaging\Policies;

use App\Domains\Messaging\Models\MessageConversation;
use App\Models\User;

final class MessageConversationPolicy
{
    public function view(User $user, MessageConversation $conversation): bool
    {
        return $conversation->participants()->whereKey($user->id)->exists();
    }

    public function send(User $user, MessageConversation $conversation): bool
    {
        return $conversation->status === 'active' && $this->view($user, $conversation);
    }

    public function update(User $user, MessageConversation $conversation): bool
    {
        return $conversation->created_by === $user->id;
    }

    /**
     * Closing a thread is the author's call, plus either side of a 1:1 so a
     * conversation you did not start can still be dismissed. Groups, the staff
     * room and announcements stay with their author — `status` is global, so
     * letting any member flip it would silence everyone.
     */
    public function archive(User $user, MessageConversation $conversation): bool
    {
        if ($conversation->type === 'direct') {
            return $this->view($user, $conversation);
        }

        return (int) $conversation->created_by === (int) $user->id;
    }
}
