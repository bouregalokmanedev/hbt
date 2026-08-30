<?php

namespace App\Domains\Admin\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AdminBroadcastResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'audience' => $this->audience,
            'type' => $this->type,
            'title' => $this->title,
            'message' => $this->message,
            'action_url' => $this->action_url,
            'replies_enabled' => $this->replies_enabled,
            'quick_replies' => $this->quick_replies ?? [],
            'delivery' => [
                'recipients' => $this->recipient_count,
                'delivered' => $this->delivered_count,
                'failed' => $this->failed_count,
                'read' => (int) ($this->read_count ?? 0),
            ],
            'administrator' => $this->whenLoaded('administrator', fn () => $this->administrator ? [
                'id' => $this->administrator->uuid,
                'name' => $this->administrator->full_name,
                'email' => $this->administrator->email,
            ] : null),
            'delivered_at' => $this->delivered_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
