<?php

namespace App\Domains\Courses\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class InstructorDashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'courses' => CourseResource::collection(
                $this->resource['courses']
            ),

            'statistics' => [
                'total' => $this->resource['statistics']['total'],
                'draft' => $this->resource['statistics']['draft'],
                'review' => $this->resource['statistics']['review'],
                'published' => $this->resource['statistics']['published'],
                'archived' => $this->resource['statistics']['archived'],
            ],
        ];
    }
}
