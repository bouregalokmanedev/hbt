<?php

namespace App\Domains\Courses\Resources;

use App\Domains\Lessons\Resources\LessonResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'position' => $this->position,
            'status' => $this->status->value,

            'lessons' => LessonResource::collection(
                $this->whenLoaded('lessons')
            ),
        ];
    }
}