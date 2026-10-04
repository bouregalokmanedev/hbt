<?php

namespace App\Domains\Messaging\Policies;

use App\Domains\Messaging\Models\Message;
use App\Domains\Messaging\Services\MessagingService;
use App\Models\User;

/**
 * Who may act on a single message. Membership of the conversation is the gate
 * for reading, reacting, forwarding and deleting-for-me; writing rights stay
 * with the sender, and announcements are additionally immutable because they
 * are the platform's broadcast record.
 *
 * The edit and recall rules also carry distinct HTTP statuses (403 for someone
 * else's message, 404 once it is a tombstone, 422 for an announcement), so the
 * decision is exposed as a *denial* rather than a bare boolean: the controller
 * reuses the reason instead of re-deriving it, and `edit()` stays available for
 * callers that only need a yes/no.
 */
final class MessagePolicy
{
    public function view(User $user, Message $message): bool
    {
        // A tombstone has no body left to show, but it still occupies a slot
        // in the thread, so membership — not content — is what grants access.
        return app(MessageConversationPolicy::class)->view($user, $message->conversation);
    }

    public function react(User $user, Message $message): bool
    {
        return $this->view($user, $message);
    }

    public function forward(User $user, Message $message): bool
    {
        return ! $message->isDeletedForAll() && $this->view($user, $message);
    }

    public function delete(User $user, Message $message): bool
    {
        return $this->view($user, $message);
    }

    /**
     * @return array{0: int, 1: string}|null [status, reason] when refused
     */
    public function editDenial(User $user, Message $message): ?array
    {
        if ((int) $message->sender_id !== (int) $user->id) {
            return [403, 'Only the sender can edit a message.'];
        }

        if ($message->isDeletedForAll()) {
            return [404, 'This message has been deleted.'];
        }

        if ($message->message_type === 'announcement') {
            return [422, 'Announcements cannot be edited.'];
        }

        return null;
    }

    public function edit(User $user, Message $message): bool
    {
        return $this->editDenial($user, $message) === null;
    }

    /**
     * @return array{0: int, 1: string}|null [status, reason] when refused
     */
    public function deleteForEveryoneDenial(User $user, Message $message): ?array
    {
        if ((int) $message->sender_id !== (int) $user->id) {
            return [403, 'Only the sender can delete a message for everyone.'];
        }

        if (! $message->created_at->isAfter(now()->subMinutes(MessagingService::DELETE_FOR_ALL_MINUTES))) {
            return [
                403,
                sprintf('Messages can only be deleted for everyone within %d minutes of sending.', MessagingService::DELETE_FOR_ALL_MINUTES),
            ];
        }

        return null;
    }

    public function deleteForEveryone(User $user, Message $message): bool
    {
        return $this->deleteForEveryoneDenial($user, $message) === null;
    }
}
