<?php

namespace App\Domains\DiagnosticScenarios\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class DiagnosticScenarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'version' => $this->version ?? 1,
            'description' => $this->description,
            'passing_score' => $this->passing_score,
            'time_limit' => $this->time_limit,
            'status' => $this->status->value,
            'is_required' => $this->is_required,
            'course' => $this->whenLoaded('course', fn () => $this->course
                ? ['id' => $this->course->id, 'title' => $this->course->title]
                : null),
            'steps_count' => $this->whenCounted('steps'),
            'published_at' => $this->published_at,
        ];
    }
}
