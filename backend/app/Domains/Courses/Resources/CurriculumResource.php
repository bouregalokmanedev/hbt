<?php

namespace App\Domains\Courses\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CurriculumResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'course' => [
                'id' => $this->id,
                'title' => $this->title,
                'slug' => $this->slug,
                'status' => $this->status->value,
            ],

            'sections' => SectionResource::collection(
                $this->whenLoaded('sections')
            ),
        ];
    }
}