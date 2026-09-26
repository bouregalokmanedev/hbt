<?php

namespace App\Domains\Messaging\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

final class ConversationResource extends JsonResource
{
    public function toArray($request): array
    {
        $participant = $this->participants->first(fn ($user) => (int) $user->id !== (int) $request->user()->id);
        return [
            'id' => $this->id,
            'type' => $this->type,
            'subject' => $this->subject,
            'status' => $this->status,
            'broadcast_id' => $this->admin_broadcast_id,
            'replies_enabled' => $this->broadcast?->replies_enabled ?? $this->status === 'active',
            'quick_replies' => $this->broadcast?->quick_replies ?? [],
            'last_message_at' => $this->last_message_at?->toISOString(),
            'participant' => $participant ? ['id' => $participant->uuid, 'user_id' => (int) $participant->id, 'name' => $participant->full_name, 'email' => $participant->email, 'role' => $participant->getRoleNames()->first(), 'last_read_at' => self::pivotReadAt($participant)] : null,
            'unread_count' => $this->unreadCountFor($request->user()),
            'member_count' => $this->relationLoaded('participants') ? $this->participants->count() : $this->participants()->count(),
            'participants' => $this->whenLoaded('participants', fn () => $this->participants->map(fn ($member) => ['id' => $member->uuid, 'name' => $member->full_name])->values()),
            'messages' => MessageResource::collection($this->whenLoaded('messages')),
        ];
    }

    private static function pivotReadAt($participant): ?string
    {
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
