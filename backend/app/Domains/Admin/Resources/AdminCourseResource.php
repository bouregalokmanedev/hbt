<?php

namespace App\Domains\Admin\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AdminCourseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'status' => $this->status->value,
            'visibility' => $this->visibility->value,
            'difficulty' => $this->difficulty->value,
            'language' => $this->language,
            'is_free' => $this->is_free,
            'price' => $this->price,
            'currency' => $this->currency,
            'enrollments_count' => $this->whenCounted('enrollments'),
            'instructor' => $this->whenLoaded('instructor', fn () => $this->instructor ? [
                'id' => $this->instructor->uuid,
                'name' => $this->instructor->full_name,
                'email' => $this->instructor->email,
            ] : null),
            'categories' => $this->whenLoaded('categories', fn () => $this->categories->map(fn ($category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
            ])->values()),
            'published_at' => $this->published_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
