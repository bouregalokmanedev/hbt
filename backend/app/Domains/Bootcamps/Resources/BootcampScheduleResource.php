<?php

namespace App\Domains\Bootcamps\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class BootcampScheduleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'bootcamp_id' => $this->bootcamp_id,
            'starts_at' => $this->starts_at?->toDateString(),
            'ends_at' => $this->ends_at?->toDateString(),
            'is_available' => $this->ends_at
                ? $this->ends_at->greaterThanOrEqualTo(today())
                : false,

            'bootcamp' => $this->whenLoaded('bootcamp', fn () => [
                'id' => $this->bootcamp->id,
                'title' => $this->bootcamp->title,
                'slug' => $this->bootcamp->slug,
                'location' => $this->bootcamp->location,
                'price' => (float) $this->bootcamp->price,
                'currency' => $this->bootcamp->currency,
                'level' => $this->bootcamp->level->value,
                'duration_value' => $this->bootcamp->duration_value,
                'duration_unit' => $this->bootcamp->duration_unit->value,
            ]),
        ];
    }
}
