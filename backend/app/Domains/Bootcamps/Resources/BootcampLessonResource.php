<?php

namespace App\Domains\Bootcamps\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class BootcampLessonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'classroom_count' => $this->classroom_count,
            'duration_minutes' => $this->duration_minutes,
            'position' => $this->position,
        ];
    }
}
