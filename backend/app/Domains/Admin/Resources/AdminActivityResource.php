<?php

namespace App\Domains\Admin\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AdminActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event' => $this->event,
            'actor' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->uuid,
                'name' => $this->user->full_name,
                'email' => $this->user->email,
            ] : null),
            'target' => [
                'type' => class_basename($this->auditable_type),
                'id' => $this->auditable_id,
            ],
            'changes' => [
                'old' => $this->old_values,
                'new' => $this->new_values,
            ],
            'metadata' => $this->metadata,
            'ip_address' => $this->ip_address,
            'occurred_at' => $this->created_at?->toISOString(),
        ];
    }
}
