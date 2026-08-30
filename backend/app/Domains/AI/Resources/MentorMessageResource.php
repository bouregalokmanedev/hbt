<?php

namespace App\Domains\AI\Resources;

use App\Domains\AI\Models\MentorMessage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin MentorMessage */
final class MentorMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'mentor_conversation_id' =>
                $this->mentor_conversation_id,

            'role' => $this->role?->value,

            'content' => $this->content,

            'metadata' => $this->metadata,

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}