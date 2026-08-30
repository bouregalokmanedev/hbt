<?php

namespace App\Domains\Instructor\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class InstructorDashboardResource extends JsonResource
{
    public function toArray(
        Request $request
    ): array {
        return [
            // Keep the course statistics grouped at the top-level for a
            // stable, dashboard-friendly API contract.
            'statistics' => $this->resource['courses'],

            'overview' => $this->resource['overview'],

            'courses' => $this->resource['courses'],

            'students' => [
                ...$this->resource['students'],
                'active' => $this->resource['students']['active'],
            ],

            'progress' => $this->resource['progress'],

            'learning' => $this->resource['learning'],

            'recent_courses' => $this->resource['recent_courses'],

            'top_courses' => $this->resource['top_courses'],

            'recent_activity' => $this->resource['recent_activity'],
        ];
    }
}
