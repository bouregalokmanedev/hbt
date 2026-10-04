<?php

namespace App\Domains\Messaging\Events;

use App\Domains\Messaging\Models\Message;
use App\Domains\Messaging\Models\MessageConversation;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a message has been committed. Other domains (notifications,
 * moderation, analytics) subscribe instead of being called from inside
 * `MessagingService::send()`, so the messaging core does not have to know
 * who is listening.
 *
 * Dispatched after `send()`'s write transaction commits, never inside it: a
 * listener that fails must not roll the message back.
 */
final class MessageSent
{
    use Dispatchable;

    public function __construct(
        public readonly Message $message,
        public readonly MessageConversation $conversation,
        public readonly User $sender,
    ) {}
}
