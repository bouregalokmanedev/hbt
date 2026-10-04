<?php

namespace App\Domains\Messaging\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

final class ConversationResource extends JsonResource
{
    public function toArray($request): array
    {
        $viewerId = (int) $request->user()->id;
        $participant = $this->participants->first(fn ($user) => (int) $user->id !== $viewerId);
        $viewer = $this->participants->first(fn ($user) => (int) $user->id === $viewerId);

        return [
            'id' => $this->id,
            'type' => $this->type,
            'subject' => $this->subject,
            'status' => $this->status,
            'broadcast_id' => $this->admin_broadcast_id,
            'replies_enabled' => $this->broadcast?->replies_enabled ?? $this->status === 'active',
            'quick_replies' => $this->broadcast?->quick_replies ?? [],
            'last_message_at' => $this->last_message_at?->toISOString(),
            'participant' => $participant ? [
                'id' => $participant->uuid,
                'user_id' => (int) $participant->id,
                'name' => $participant->full_name,
                'email' => $participant->email,
                'role' => $participant->relationLoaded('roles') ? $participant->getRoleNames()->first() : null,
                'last_read_at' => self::pivotReadAt($participant),
                // Computed on single-thread reads only; null means "unknown".
                'online' => $this->resource->getAttribute('participant_online'),
            ] : null,
            'unread_count' => $this->unreadCountFor($request->user()),
            'member_count' => $this->relationLoaded('participants') ? $this->participants->count() : $this->participants()->count(),
            // Closing a thread is the author's call (and anyone's for a 1:1);
            // exposing the rule lets the UI hide the button instead of 403ing.
            'can_archive' => $this->type === 'direct' || (int) $this->created_by === $viewerId,
            'muted' => ($viewer?->pivot?->muted_at ?? null) !== null,
            'typing_user_ids' => $this->resource->getAttribute('typing_user_ids'),
            'first_unread_at' => $this->resource->getAttribute('first_unread_at'),
            'participants' => $this->whenLoaded('participants', fn () => $this->participants->map(fn ($member) => [
                'id' => $member->uuid,
                'name' => $member->full_name,
                // Only when roles were eager loaded — avoids an N+1 on lists.
                'role' => $member->relationLoaded('roles') ? $member->getRoleNames()->first() : null,
                // Per-participant receipts power group read ticks.
                'last_read_at' => self::pivotReadAt($member),
            ])->values()),
            'messages' => MessageResource::collection($this->whenLoaded('messages')),
        ];
    }

    /**
     * The counterpart's `last_read_at`, suppressed when they opted out of
     * read receipts — the row still exists internally (it drives unread
     * counts), it just must never be visible to anyone else.
     */
    private static function pivotReadAt($participant): ?string
    {
        if (($participant->studentPrivacySetting?->send_read_receipts ?? true) === false) {
            return null;
        }

        $value = $participant->pivot->last_read_at ?? null;
        if ($value instanceof \DateTimeInterface) return $value->format(\DateTimeInterface::ATOM);
        if (is_string($value) && $value !== '') {
            try {
                return \Illuminate\Support\Carbon::parse($value)->toISOString();
            } catch (\Throwable) {
                return null;
            }
        }
        return null;
    }
}
