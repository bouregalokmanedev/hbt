<?php

namespace App\Domains\AI\Resources;

use App\Domains\AI\Models\MentorConversation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin MentorConversation */
final class MentorConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'user_id' => $this->user_id,
            'course_id' => $this->course_id,
            'lesson_id' => $this->lesson_id,

            'title' => $this->title,

            'context' => $this->context,

            'status' => $this->status?->value,
            'last_message_at' => $this->last_message_at?->toISOString(),

            'messages' => MentorMessageResource::collection(
                $this->whenLoaded('messages')
            ),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
