<?php

namespace App\Policies;

use App\Domains\AI\Enums\MentorConversationStatus;
use App\Domains\AI\Models\MentorConversation;
use App\Models\User;

final class MentorConversationPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(
        User $user,
        MentorConversation $conversation,
    ): bool {
        return (int) $conversation->user_id === (int) $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function sendMessage(
        User $user,
        MentorConversation $conversation,
    ): bool {
        return (int) $conversation->user_id === (int) $user->id
            && $conversation->status === MentorConversationStatus::ACTIVE;
    }

    public function update(
        User $user,
        MentorConversation $conversation,
    ): bool {
        return (int) $conversation->user_id === (int) $user->id;
    }

    public function delete(
        User $user,
        MentorConversation $conversation,
    ): bool {
        return (int) $conversation->user_id === (int) $user->id;
    }

    public function restore(
        User $user,
        MentorConversation $conversation,
    ): bool {
        return (int) $conversation->user_id === (int) $user->id;
    }

    public function forceDelete(
        User $user,
        MentorConversation $conversation,
    ): bool {
        return (int) $conversation->user_id === (int) $user->id;
    }
}