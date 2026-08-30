<?php

namespace App\Policies;

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
}
