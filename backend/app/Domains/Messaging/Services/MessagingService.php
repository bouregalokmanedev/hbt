<?php

namespace App\Domains\Messaging\Services;

use App\Domains\Messaging\Models\Message;
use App\Domains\Messaging\Models\MessageConversation;
use App\Domains\Messaging\Models\MessageParticipant;
use App\Models\User;
use App\Enums\UserRole;
use App\Models\Course;
use Illuminate\Support\Facades\DB;

final class MessagingService
{
    public function conversationsFor(User $user): \Illuminate\Database\Eloquent\Collection
    {
        return MessageConversation::query()
            ->whereHas('participants', fn ($query) => $query->whereKey($user->id))
            ->with(['participants:id,uuid,first_name,last_name,email', 'messages' => fn ($query) => $query->latest()->limit(1)])
            ->orderByDesc('last_message_at')
            ->get();
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
            return $conversation->load('participants:id,uuid,first_name,last_name,email');
        });
    }

    public function contactsFor(User $user): \Illuminate\Database\Eloquent\Collection
    {
        $contacts = User::query()->where('status', 'active')->where('id', '!=', $user->id);
        if ($user->hasAnyRole([UserRole::ADMIN->value, UserRole::SUPER_ADMIN->value])) return $contacts->orderBy('first_name')->limit(250)->get();
        if ($user->hasRole(UserRole::INSTRUCTOR->value)) {
            return $contacts->where(function ($query) use ($user): void {
                $query->whereHas('roles', fn ($roles) => $roles->whereIn('name', [UserRole::ADMIN->value, UserRole::SUPER_ADMIN->value]))
                    ->orWhereHas('enrollments.course', fn ($courses) => $courses->where('instructor_id', $user->id));
            })->orderBy('first_name')->limit(250)->get();
        }
        $instructorIds = Course::query()
            ->whereHas('enrollments', fn ($enrollments) => $enrollments->where('user_id', $user->id))
            ->pluck('instructor_id');
        return $contacts->where(function ($query) use ($instructorIds): void {
            $query->whereHas('roles', fn ($roles) => $roles->whereIn('name', [UserRole::ADMIN->value, UserRole::SUPER_ADMIN->value]))
                ->orWhereIn('id', $instructorIds);
        })->orderBy('first_name')->limit(250)->get();
    }

    public function canContact(User $sender, User $recipient): bool
    {
        return $this->contactsFor($sender)->contains('id', $recipient->id);
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
            MessageParticipant::insert([
                ['conversation_id' => $conversation->id, 'user_id' => $administrator->id, 'created_at' => now(), 'updated_at' => now()],
                ['conversation_id' => $conversation->id, 'user_id' => $recipient->id, 'created_at' => now(), 'updated_at' => now()],
            ]);
            $this->send($administrator, $conversation, $body, 'announcement');
            $conversation->setAttribute('quick_replies', $quickReplies);
            return $conversation;
        });
    }

    public function send(User $sender, MessageConversation $conversation, string $body, string $type = 'text'): Message
    {
        return DB::transaction(function () use ($sender, $conversation, $body, $type): Message {
            $message = $conversation->messages()->create([
                'sender_id' => $sender->id,
                'message_type' => $type,
                'body' => trim($body),
            ]);
            $conversation->forceFill(['last_message_at' => now()])->save();
            return $message->load('sender:id,uuid,first_name,last_name');
        });
    }

    public function markRead(User $user, MessageConversation $conversation): void
    {
        MessageParticipant::query()->where('conversation_id', $conversation->id)->where('user_id', $user->id)->update(['last_read_at' => now()]);
    }
}
