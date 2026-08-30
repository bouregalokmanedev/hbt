<?php

namespace App\Domains\Messaging\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

final class MessageResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender' => $this->whenLoaded('sender', fn () => ['id' => $this->sender->uuid, 'name' => $this->sender->full_name]),
            'message_type' => $this->message_type,
            'body' => $this->body,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
