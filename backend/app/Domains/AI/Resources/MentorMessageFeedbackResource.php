<?php

namespace App\Domains\AI\Resources;

use App\Domains\AI\Models\MentorMessageFeedback;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin MentorMessageFeedback */
final class MentorMessageFeedbackResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'mentor_message_id' => $this->mentor_message_id,

            'user_id' => $this->user_id,

            'rating' => $this->rating?->value,

            'reason' => $this->reason?->value,

            'comment' => $this->comment,

            'metadata' => $this->metadata,

            'created_at' => $this->created_at?->toISOString(),

            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}