<?php

namespace App\Domains\Messaging\Services;

use App\Domains\Messaging\Events\MessageSent;
use App\Domains\Messaging\Models\Message;
use App\Domains\Messaging\Models\MessageConversation;
use App\Domains\Messaging\Models\MessageParticipant;
use App\Models\User;
use App\Enums\UserRole;
use App\Models\Course;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

final class MessagingService
{
    /**
     * Conversation type used by the shared Staff Hub room. The literal lives on
     * the model (which enforces it on write) — this alias keeps the name the
     * rest of the codebase already uses.
     */
    public const STAFF_ROOM_TYPE = MessageConversation::STAFF_ROOM_TYPE;

    /** Contacts picker is capped for payload size; `canContact` deliberately is not. */
    public const CONTACTS_LIMIT = 250;

    /** The inbox is sorted by `last_message_at`, so a bound keeps the payload sane. */
    public const INBOX_LIMIT = 100;

    /**
     * Ephemeral presence and typing state.
     *
     * This stack has no websocket layer and no queue, so both live in the cache
     * with a short TTL instead of on a connection. They are refreshed by
     * ordinary traffic and expire on their own if the tab goes away.
     */
    public const TYPING_TTL_SECONDS = 6;

    public const PRESENCE_TTL_SECONDS = 60;

    /** @var int maximum attachments accepted on a single message */
    public const ATTACHMENTS_LIMIT = 5;

    /**
     * Contract constants shared with the web client (`messages.api.ts`).
     *
     * `MessagingContractTest` reads the frontend source and asserts the two
     * sides agree, so changing one without the other fails the suite instead
     * of silently disabling "delete for everyone" or rejecting every upload.
     */

    /** Minutes a sender may still delete their own message for everyone. */
    public const DELETE_FOR_ALL_MINUTES = 15;

    /** The only emojis the reaction endpoint accepts. */
    public const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

    /** Attachment size ceiling in kilobytes (mirrors `ATTACHMENT_MAX_BYTES`). */
    public const ATTACHMENT_MAX_KB = 10240;

    /** Attachment extensions, without dots (mirrors `ATTACHMENT_ACCEPT`). */
    public const ATTACHMENT_MIMES = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];

    /**
     * The participant projection every conversation endpoint shares: the fields
     * the resource reads, roles for labels, and privacy settings so read
     * receipts can be suppressed — all eager loaded so a list of conversations
     * costs a fixed number of queries regardless of size.
     */
    public function participantsLoader(): \Closure
    {
        return fn ($query) => $query
            ->select(['users.id', 'users.uuid', 'users.first_name', 'users.last_name', 'users.email'])
            ->with(['roles:id,name', 'studentPrivacySetting']);
    }

    /** Conversation types the inbox endpoint accepts (`not_announcement` covers the rest). */
    public const INBOX_TYPES = ['direct', 'group', self::STAFF_ROOM_TYPE, 'announcement'];

    public function conversationsFor(User $user, int $limit = self::INBOX_LIMIT, int $offset = 0, ?array $types = null): \Illuminate\Database\Eloquent\Collection
    {
        return MessageConversation::query()
            ->whereHas('participants', fn ($query) => $query->whereKey($user->id))
            ->when($types !== null, fn ($query) => $query->whereIn('type', $types))
            ->with(['participants' => $this->participantsLoader(), 'messages' => fn ($query) => $query->latest()->limit(1)])
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->offset(max(0, $offset))
            ->limit(max(1, min($limit, 200)))
            ->get()
            ->tap(fn () => $this->touchPresence($user));
    }

    public function create(User $creator, User $recipient, ?string $subject = null): MessageConversation
    {
        return DB::transaction(function () use ($creator, $recipient, $subject): MessageConversation {
            $conversation = MessageConversation::create([
                'created_by' => $creator->id,
                'type' => 'direct',
                'subject' => $subject,
            ]);
            MessageParticipant::insert([
                ['conversation_id' => $conversation->id, 'user_id' => $creator->id, 'created_at' => now(), 'updated_at' => now()],
                ['conversation_id' => $conversation->id, 'user_id' => $recipient->id, 'created_at' => now(), 'updated_at' => now()],
            ]);
            return $conversation->load(['participants' => $this->participantsLoader()]);
        });
    }

    public function createGroup(User $creator, array $recipients, string $subject): MessageConversation
    {
        return DB::transaction(function () use ($creator, $recipients, $subject): MessageConversation {
            $conversation = MessageConversation::create([
                'created_by' => $creator->id,
                'type' => 'group',
                'subject' => $subject,
            ]);
            $now = now();
            $rows = [['conversation_id' => $conversation->id, 'user_id' => $creator->id, 'created_at' => $now, 'updated_at' => $now]];
            foreach ($recipients as $recipient) {
                $rows[] = ['conversation_id' => $conversation->id, 'user_id' => $recipient->id, 'created_at' => $now, 'updated_at' => $now];
            }
            MessageParticipant::insert($rows);
            return $conversation->load(['participants' => $this->participantsLoader()]);
        });
    }

    /**
     * The single shared conversation every member of staff belongs to.
     *
     * Created lazily on first access and its membership is reconciled on every
     * call, so joining the staff (or leaving it) takes effect immediately
     * without a queue or a scheduled job.
     */
    public function staffRoomFor(User $user): MessageConversation
    {
        abort_unless($this->isStaff($user), 403, 'Only staff members can open the staff room.');

        // The common case is a room that already exists: serve it without a
        // transaction or a row lock, which would serialise every staff visit.
        $existing = $this->firstStaffRoom();
        if ($existing !== null) {
            $this->syncStaffRoomMembers($existing);

            return $existing;
        }

        // Only the very first visit pays for the lock, and it re-checks inside
        // it so two concurrent first visits cannot both create a room.
        return DB::transaction(function () use ($user): MessageConversation {
            $room = $this->firstStaffRoom(true) ?? MessageConversation::create([
                'created_by' => $user->id,
                'type' => self::STAFF_ROOM_TYPE,
                'subject' => 'Staff Room',
                'status' => 'active',
            ]);

            $this->syncStaffRoomMembers($room);

            return $room;
        });
    }

    /**
     * The canonical staff room, oldest-first so any pre-existing duplicates
     * resolve to one room.
     */
    private function firstStaffRoom(bool $lock = false): ?MessageConversation
    {
        $query = MessageConversation::query()
            ->where('type', self::STAFF_ROOM_TYPE)
            ->orderBy('created_at')
            ->orderBy('id');

        return ($lock ? $query->lockForUpdate() : $query)->first();
    }

    public function isStaff(User $user): bool
    {
        return $user->hasAnyRole(UserRole::staff());
    }

    /**
     * @return list<int>
     */
    public function staffRoomMemberIds(): array
    {
        return User::query()
            ->where('status', 'active')
            ->whereHas('roles', fn ($roles) => $roles->whereIn('name', UserRole::staff()))
            ->pluck('id')
            ->map(fn ($id): int => (int) $id)
            ->all();
    }

    private function syncStaffRoomMembers(MessageConversation $room): void
    {
        $staffIds = $this->staffRoomMemberIds();
        $existingIds = MessageParticipant::query()
            ->where('conversation_id', $room->id)
            ->pluck('user_id')
            ->map(fn ($id): int => (int) $id)
            ->all();

        $toAdd = array_values(array_diff($staffIds, $existingIds));
        $toRemove = array_values(array_diff($existingIds, $staffIds));

        if ($toAdd !== []) {
            $now = now();
            MessageParticipant::insert(array_map(fn (int $id): array => [
                'conversation_id' => $room->id,
                'user_id' => $id,
                'created_at' => $now,
                'updated_at' => $now,
            ], $toAdd));
        }

        if ($toRemove !== []) {
            MessageParticipant::query()
                ->where('conversation_id', $room->id)
                ->whereIn('user_id', $toRemove)
                ->delete();
        }
    }

    /**
     * Who `$user` is allowed to message, as an unbounded query.
     *
     * `contactsFor()` is the display list (capped); `canContact()` must run
     * against this same scope *without* the cap, otherwise a valid recipient
     * becomes unreachable once the user table outgrows `CONTACTS_LIMIT`.
     */
    private function contactsQueryFor(User $user): \Illuminate\Database\Eloquent\Builder
    {
        $contacts = User::query()->where('status', 'active')->where('id', '!=', $user->id);

        if ($user->hasAnyRole([UserRole::ADMIN->value, UserRole::SUPER_ADMIN->value])) {
            return $contacts;
        }

        if ($user->hasRole(UserRole::SUPPORT->value)) {
            // Support agents coordinate with admins and instructors; students
            // reach support through tickets, not direct messages.
            return $contacts->whereHas('roles', fn ($roles) => $roles->whereIn('name', [UserRole::ADMIN->value, UserRole::SUPER_ADMIN->value, UserRole::INSTRUCTOR->value]));
        }

        if ($user->hasRole(UserRole::INSTRUCTOR->value)) {
            return $contacts->where(function ($query) use ($user): void {
                $query->whereHas('roles', fn ($roles) => $roles->whereIn('name', [UserRole::ADMIN->value, UserRole::SUPER_ADMIN->value]))
                    ->orWhereHas('enrollments.course', fn ($courses) => $courses->where('instructor_id', $user->id));
            });
        }

        $instructorIds = Course::query()
            ->whereHas('enrollments', fn ($enrollments) => $enrollments->where('user_id', $user->id))
            ->pluck('instructor_id');

        return $contacts->where(function ($query) use ($instructorIds): void {
            $query->whereHas('roles', fn ($roles) => $roles->whereIn('name', [UserRole::ADMIN->value, UserRole::SUPER_ADMIN->value]))
                ->orWhereIn('id', $instructorIds);
        });
    }

    public function contactsFor(User $user, int $limit = self::CONTACTS_LIMIT): \Illuminate\Database\Eloquent\Collection
    {
        return $this->contactsQueryFor($user)
            ->with('roles:id,name')
            ->orderBy('first_name')
            ->limit(max(1, $limit))
            ->get();
    }

    public function canContact(User $sender, User $recipient): bool
    {
        if ((int) $recipient->id === (int) $sender->id || $recipient->status !== 'active') {
            return false;
        }

        return $this->contactsQueryFor($sender)->whereKey($recipient->id)->exists();
    }

    public function createAnnouncement(User $administrator, User $recipient, string $broadcastId, string $subject, string $body, bool $repliesEnabled, array $quickReplies): MessageConversation
    {
        return DB::transaction(function () use ($administrator, $recipient, $broadcastId, $subject, $body, $repliesEnabled, $quickReplies): MessageConversation {
            $conversation = MessageConversation::create([
                'created_by' => $administrator->id,
                'admin_broadcast_id' => $broadcastId,
                'type' => 'announcement',
                'subject' => $subject,
                'status' => $repliesEnabled ? 'active' : 'archived',
            ]);
            // The author is often part of the audience themselves; dedupe so we
            // never insert the same (conversation, user) row twice.
            $participantIds = array_values(array_unique([
                (int) $administrator->id,
                (int) $recipient->id,
            ]));
            MessageParticipant::insert(array_map(
                fn (int $userId) => [
                    'conversation_id' => $conversation->id,
                    'user_id' => $userId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                $participantIds,
            ));
            $this->send($administrator, $conversation, $body, 'announcement');
            $conversation->setAttribute('quick_replies', $quickReplies);
            return $conversation;
        });
    }

    /**
     * @param  list<array>|array|null  $attachments  one stored attachment or a list of them
     * @param  array|null  $extraMetadata  extra bookkeeping merged into `metadata` (e.g. forward origin)
     */
    public function send(User $sender, MessageConversation $conversation, string $body, string $type = 'text', ?array $attachments = null, ?string $replyToId = null, ?array $extraMetadata = null): Message
    {
        abort_if(
            Message::query()->where('messages.sender_id', $sender->id)->whereDate('messages.created_at', today())->count() >= 200,
            429,
            'Daily message limit reached.'
        );

        $stored = array_values(array_filter(
            array_map(
                fn ($item) => is_array($item) && ! empty($item['path']) ? $item : null,
                (array) ($attachments ?? [])
            ),
            fn ($item) => $item !== null
        ));

        $metadata = $stored === [] ? ($extraMetadata ?: null) : ['attachments' => $stored, ...($extraMetadata ?? [])];

        $message = DB::transaction(function () use ($sender, $conversation, $body, $type, $metadata, $replyToId): Message {
            $message = $conversation->messages()->create([
                'sender_id' => $sender->id,
                'message_type' => $type,
                'body' => trim($body),
                'metadata' => $metadata,
                'reply_to_id' => $replyToId,
            ]);
            $conversation->forceFill(['last_message_at' => now()])->save();
            return $message->load(['sender:id,uuid,first_name,last_name', 'replyTo.sender:id,uuid,first_name,last_name']);
        });

        $this->touchPresence($sender);

        // After the write transaction, never inside it: a listener that fails
        // must not roll the message back.
        event(new MessageSent($message, $conversation, $sender));

        return $message;
    }

    public function markRead(User $user, MessageConversation $conversation): void
    {
        MessageParticipant::query()->where('conversation_id', $conversation->id)->where('user_id', $user->id)->update(['last_read_at' => now()]);
        $this->touchPresence($user);
    }

    /**
     * Copy a message into another conversation the sender may write to.
     *
     * The attachment is referenced in place rather than re-uploaded: downloads
     * authorize against the *copy's* participants, which is exactly what
     * forwarding is meant to grant.
     */
    public function forward(User $sender, Message $source, MessageConversation $target, string $comment): Message
    {
        $origin = [
            'forwarded_from' => [
                'message_id' => $source->id,
                'conversation_id' => $source->conversation_id,
                'sender_name' => $source->sender?->full_name,
                'body_excerpt' => mb_substr((string) ($source->body ?? ''), 0, 120),
            ],
        ];

        $body = trim($comment !== '' ? $comment : (string) ($source->body ?? ''));

        return $this->send($sender, $target, $body, 'text', $source->attachments(), null, $origin);
    }

    public function setMuted(User $user, MessageConversation $conversation, bool $muted): void
    {
        MessageParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->update(['muted_at' => $muted ? now() : null]);
    }

    public function isMuted(User $user, MessageConversation $conversation): bool
    {
        return MessageParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->whereNotNull('muted_at')
            ->exists();
    }

    public function touchPresence(User $user): void
    {
        Cache::put(self::presenceKey($user->id), true, now()->addSeconds(self::PRESENCE_TTL_SECONDS));
    }

    public function isOnline(User $user): bool
    {
        return Cache::has(self::presenceKey($user->id));
    }

    public function touchTyping(User $user, MessageConversation $conversation): void
    {
        Cache::put(self::typingKey($conversation->id, $user->id), true, now()->addSeconds(self::TYPING_TTL_SECONDS));
    }

    /**
     * @return list<string> uuids of the *other* participants typing right now
     */
    public function typingUserIds(MessageConversation $conversation, User $viewer): array
    {
        if (! $conversation->relationLoaded('participants')) {
            return [];
        }

        $typing = [];
        foreach ($conversation->participants as $participant) {
            if ((int) $participant->id === (int) $viewer->id) {
                continue;
            }
            if (Cache::has(self::typingKey($conversation->id, $participant->id))) {
                $typing[] = $participant->uuid;
            }
        }

        return $typing;
    }

    /**
     * The oldest message from someone else that the viewer has not read yet,
     * or null when the thread is fully read. Used to jump straight to the
     * unread marker instead of making the reader scroll for it.
     */
    public function firstUnreadAt(User $user, MessageConversation $conversation): ?string
    {
        $readAt = MessageParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->value('last_read_at');

        $query = $conversation->messages()->reorder()
            ->where('messages.sender_id', '!=', $user->id)
            ->where(fn ($where) => $where
                ->whereNull('messages.metadata')
                ->orWhere('messages.metadata->deleted_for_all', null));

        if ($readAt !== null && $readAt !== '') {
            $query->where('messages.created_at', '>', $readAt);
        }

        $createdAt = $query->orderBy('messages.created_at')->orderBy('messages.id')->value('messages.created_at');

        return $createdAt === null ? null : \Illuminate\Support\Carbon::parse($createdAt)->toISOString();
    }

    private static function presenceKey($userId): string
    {
        return 'messaging:presence:' . $userId;
    }

    private static function typingKey($conversationId, $userId): string
    {
        return 'messaging:typing:' . $conversationId . ':' . $userId;
    }
}
