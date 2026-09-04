<?php

namespace App\Domains\Courses\Resources;

use App\Enums\EnrollmentStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $enrollment = null;

        if ($request->user() && $this->relationLoaded('enrollments')) {
            $enrollment = $this->enrollments
                ->firstWhere(
                    fn ($item) =>
                        $item->status !== EnrollmentStatus::CANCELLED
                );
        }

        return [
            'id' => $this->id,

            'title' => $this->title,
            'slug' => $this->slug,

            'short_description' => $this->short_description,
            'description' => $this->description,

            'language' => $this->language,
            'difficulty' => $this->difficulty->value,

            'duration_minutes' => $this->duration_minutes,

            'price' => $this->price,
            'discount_price' => $this->discount_price,
            'currency' => $this->currency,
            'is_free' => $this->is_free,

            'status' => $this->status->value,
            'visibility' => $this->visibility->value,

            'thumbnail' => $this->thumbnail,
            'cover_image' => $this->cover_image,
            'preview_video' => $this->preview_video,
            'metadata' => $this->metadata,

            'published_at' => $this->published_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            /*
            |--------------------------------------------------------------------------
            | Current student's enrollment
            |--------------------------------------------------------------------------
            */

            'enrollment' => $enrollment
                ? [
                    'id' => $enrollment->id,
                    'status' => $enrollment->status->value,
                    'enrolled_at' => $enrollment->enrolled_at?->toISOString(),
                    'completed_at' => $enrollment->completed_at?->toISOString(),
                ]
                : null,
        ];
    }
}
