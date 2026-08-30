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
            'participant' => $participant ? ['id' => $participant->uuid, 'name' => $participant->full_name, 'email' => $participant->email] : null,
            'messages' => MessageResource::collection($this->whenLoaded('messages')),
        ];
    }
}
