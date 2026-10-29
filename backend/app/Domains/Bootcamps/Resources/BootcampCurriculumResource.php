<?php

namespace App\Domains\Bootcamps\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class BootcampCurriculumResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'bootcamp' => [
                'id' => $this->id,
                'title' => $this->title,
                'slug' => $this->slug,
                'status' => $this->status->value,
            ],
            'sections' => BootcampSectionResource::collection(
                $this->whenLoaded('sections', fn () => $this->sections, [])
            ),
        ];
    }
}
