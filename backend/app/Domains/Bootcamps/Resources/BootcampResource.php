<?php

namespace App\Domains\Bootcamps\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

final class BootcampResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'description' => $this->description,

            'duration_value' => $this->duration_value,
            'duration_unit' => $this->duration_unit->value,

            'location' => $this->location,
            'price' => (float) $this->price,
            'currency' => $this->currency,
            'level' => $this->level->value,

            'includes' => $this->normalisedIncludes(),

            'status' => $this->status->value,

            'thumbnail' => $this->mediaUrl($this->thumbnail),
            'cover_image' => $this->mediaUrl($this->cover_image),
            'preview_video' => $this->mediaUrl($this->preview_video),

            'brochure_available' => filled($this->brochure_path),
            'brochure_name' => $this->brochure_original_name,

            'published_at' => $this->published_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            'registered_count' => (int) ($this->registrations_count ?? 0),

            'instructor' => $this->whenLoaded('instructor', fn () => [
                'id' => $this->instructor->uuid,
                'first_name' => $this->instructor->first_name,
                'last_name' => $this->instructor->last_name,
                'username' => $this->instructor->username,
                'avatar' => $this->instructor->avatar,
                'bio' => $this->instructor->bio,
            ]),

            'schedules' => BootcampScheduleResource::collection(
                $this->whenLoaded('schedules', fn () => $this->schedules, [])
            ),

            'sections' => BootcampSectionResource::collection(
                $this->whenLoaded('sections', fn () => $this->sections, [])
            ),
        ];
    }

    private function mediaUrl(?string $path): ?string
    {
        if (blank($path)) {
            return null;
        }

        return Storage::disk('public')->url($path);
    }
}
